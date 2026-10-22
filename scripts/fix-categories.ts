// PROPÓSITO: Reclasificar deals y productos con el categorizador corregido.
//            Antes, cualquier caña con "Spinning" en el título caía en carretes
//            (57 en carretes, ~27 no eran carretes). Actualiza DB local, Google Sheet
//            y Turso para que el siguiente sync no revierta el cambio.
//            Idempotente: compara con el valor actual de cada destino, no con el local.
// FECHA: 2026-10-22
// USO: npx tsx scripts/fix-categories.ts [--apply]
import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@libsql/client'
import { getDb } from '../src/lib/db'
import { categorizeProduct } from '../src/lib/scraping-utils/categorizer'
import { readAllRows, updateCell } from '../src/lib/sync/google-sheets-client'

const APPLY = process.argv.includes('--apply')
const SHEET_DELAY_MS = 1100

type Desired = { id: string; slug: string; productId: string; title: string; category: string; subcategory: string }

function validSubcategory(_category: string, subcategory: string): string {
  // Se conserva tal cual: hay subcategorías de negocio (carpfishing, mar) que no
  // están en el catálogo canónico y no queremos borrarlas al mover la categoría.
  return subcategory
}

function loadProdEnv() {
  const prod = config({ path: '.env.vercel' }).parsed || {}
  for (const [key, value] of Object.entries(prod)) {
    if (value !== '' && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function writeCellWithRetry(rowIndex: number, colIndex: number, value: string) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await updateCell(rowIndex, colIndex, value)
      return
    } catch (err) {
      const status = (err as { status?: number }).status
      if (status !== 429 || attempt === 4) throw err
      console.log(`  ⏳ cuota Sheets, esperando 65s (intento ${attempt}/4)`)
      await sleep(65000)
    }
  }
}

async function main() {
  const db = await getDb()
  const deals = await db.execute('SELECT id, slug, productId, title, category, subcategory FROM deals')
  const desired: Desired[] = []
  const desiredById = new Map<string, Desired>()

  for (const raw of deals.rows) {
    const row = raw as unknown as Record<string, unknown>
    const title = String(row.title || '')
    const category = categorizeProduct(title)
    const d: Desired = {
      id: String(row.id),
      slug: String(row.slug || ''),
      productId: String(row.productId || ''),
      title,
      category,
      subcategory: validSubcategory(category, String(row.subcategory || '')),
    }
    desired.push(d)
    desiredById.set(d.id, d)
  }

  // ── Resumen de cambios respecto al local ───────────────────────────────────
  const localChanges = desired.filter(d => {
    const row = deals.rows.find(r => String((r as Record<string, unknown>).id) === d.id) as unknown as Record<string, unknown>
    return String(row.category || '') !== d.category
  })
  const groups: Record<string, number> = {}
  for (const c of localChanges) {
    const row = deals.rows.find(r => String((r as Record<string, unknown>).id) === c.id) as unknown as Record<string, unknown>
    const k = `${row.category} → ${c.category}`
    groups[k] = (groups[k] || 0) + 1
  }
  console.log(`Cambios pendientes en local: ${localChanges.length}`)
  for (const [k, v] of Object.entries(groups).sort()) console.log(`  ${k}: ${v}`)

  if (!APPLY) {
    console.log('\nDry-run. Ejecuta con --apply para escribir en local, Sheet y Turso.')
    return
  }

  // ── DB local ────────────────────────────────────────────────────────────────
  let localDeals = 0
  for (const d of desired) {
    const r = await db.execute({
      sql: 'UPDATE deals SET category = ?, subcategory = ? WHERE id = ? AND (category != ? OR subcategory != ?)',
      args: [d.category, d.subcategory, d.id, d.category, d.subcategory],
    })
    localDeals += r.rowsAffected
    if (d.productId) {
      await db.execute({
        sql: 'UPDATE products SET category = ?, subcategory = ? WHERE id = ? AND (category != ? OR subcategory != ?)',
        args: [d.category, d.subcategory, d.productId, d.category, d.subcategory],
      })
    }
  }
  console.log(`Local: ${localDeals} deals actualizados.`)

  // ── Google Sheet ────────────────────────────────────────────────────────────
  // Se normaliza toda la hoja por nombre de producto, no solo las filas que ya
  // tienen deal local: la hoja tiene categorías sueltas ("Feeder", "Carretes",
  // "Cañas") que el sync convertiría en accesorios.
  const { headers, rows } = await readAllRows()
  const col = (name: string) => headers.indexOf(name)
  const iName = col('name')
  const iCategory = col('category')

  let sheetUpdated = 0
  let sheetOk = 0
  if (iCategory === -1 || iName === -1) {
    console.log('Sheet: faltan columnas name/category, se omite.')
  } else {
    for (let i = 0; i < rows.length; i++) {
      const name = (rows[i][iName] || '').trim()
      if (!name) continue
      const want = categorizeProduct(name)
      const current = (rows[i][iCategory] || '').trim()
      if (current === want) {
        sheetOk++
        continue
      }
      await writeCellWithRetry(i + 1, iCategory, want)
      await sleep(SHEET_DELAY_MS)
      sheetUpdated++
      if (sheetUpdated % 25 === 0) console.log(`  … ${sheetUpdated} filas`)
    }
    console.log(`Sheet: ${sheetUpdated} filas actualizadas, ${sheetOk} ya correctas.`)
  }

  // ── Turso ───────────────────────────────────────────────────────────────────
  loadProdEnv()
  if (!process.env.TURSO_DATABASE_URL) {
    console.log('Turso: TURSO_DATABASE_URL no definido, se omite.')
    return
  }
  const prod = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })

  let tursoDeals = 0
  for (const d of desired) {
    if (!d.slug) continue
    const r = await prod.execute({
      sql: 'UPDATE deals SET category = ?, subcategory = ? WHERE slug = ? AND (category != ? OR subcategory != ?)',
      args: [d.category, d.subcategory, d.slug, d.category, d.subcategory],
    })
    tursoDeals += r.rowsAffected
    await prod.execute({
      sql: 'UPDATE products SET category = ?, subcategory = ? WHERE id IN (SELECT productId FROM deals WHERE slug = ?) AND (category != ? OR subcategory != ?)',
      args: [d.category, d.subcategory, d.slug, d.category, d.subcategory],
    })
  }
  console.log(`Turso: ${tursoDeals} deals actualizados.`)
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
