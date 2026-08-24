// PROPÓSITO: aplicar las decisiones de revisión del backlog (grupos numerados de
//            prep-backlog-review.ts): marca estados en Turso + espejo local y añade
//            filas al Sheet para los aprobados, igual que el botón Aprobar del admin.
// FECHA: 2026-08-23
// USO: npx tsx scripts/discover/apply-backlog-decisiones.ts [--apply]
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@libsql/client'
import { appendRow, readAllRows } from '../../src/lib/sync/google-sheets-client'

const APPLY = process.argv.includes('--apply')

const APROBAR = [1, 2, 3, 4, 6, 7, 10, 12, 13, 15, 16, 17, 21, 22, 23, 27, 28, 29, 31, 32, 33, 34, 35, 36, 37]
const RECHAZAR = [5, 8, 9, 11, 14, 18, 19, 20, 24, 25, 26, 30]

interface Grupo { n: number; ids: number[]; urls: string[]; titulo: string; precio: number }

function guessCategory(title: string): string {
  const t = title.toLowerCase()
  if (/ca[ñn]a/.test(t)) return 'canas'
  if (/se[ñn]uelo|vinilo|cucharilla|spinner|vib\b|crank|popper|jig\b/.test(t)) return 'senuelos'
  if (/bolsa|estuche|caja\b|funda|maleta|perilla|rodamiento|\babec\b|asiento|correa|clip|lanzamiento|soporte/.test(t)) return 'accesorios'
  if (/carrete|\breel\b/.test(t)) return 'carretes'
  if (/anzuelo|hilo|sedal|l[íi]nea|trenzado|plomo|plomada|montaje/.test(t)) return 'senuelos'
  return 'accesorios'
}

const OVERRIDES: Record<number, string> = { 3: 'carretes', 23: 'carretes', 27: 'accesorios' }

async function main() {
  if (!process.env.GOOGLE_SHEETS_CREDENTIALS) {
    process.env.GOOGLE_SHEETS_CREDENTIALS = readFileSync('.env.google-sheets.json', 'utf-8')
  }
  const env: Record<string, string> = {}
  for (const l of readFileSync('.env.vercel', 'utf-8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  const turso = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })
  const local = createClient({ url: 'file:data/pescatch.db' })

  const grupos: Grupo[] = JSON.parse(readFileSync(resolve('scripts/discover/backlog-decisiones.json'), 'utf-8'))
  const byN = new Map(grupos.map((g) => [g.n, g]))

  const allIds = [...APROBAR, ...RECHAZAR].flatMap((n) => byN.get(n)!.ids)
  const ph = allIds.map(() => '?').join(',')
  const rowsRes = await turso.execute({
    sql: `SELECT * FROM pending_candidates WHERE id IN (${ph})`,
    args: allIds,
  })
  const candById = new Map<number, any>()
  for (const r of rowsRes.rows) candById.set(Number(r.id), r)

  const mirror = async (url: string, status: string) => {
    if (!url) return
    await local.execute({
      sql: `UPDATE pending_candidates SET status=?, updated_at=datetime('now') WHERE url=? AND status='pending'`,
      args: [status, url],
    })
  }

  console.log(`Modo: ${APPLY ? 'APPLY' : 'DRY-RUN'} · Aprobar ${APROBAR.length} grupos · Rechazar ${RECHAZAR.length} grupos`)

  // Rechazos
  let rej = 0
  for (const n of RECHAZAR) {
    const g = byN.get(n)!
    for (let i = 0; i < g.ids.length; i++) {
      if (APPLY) {
        await turso.execute({ sql: `UPDATE pending_candidates SET status='rejected', updated_at=datetime('now') WHERE id=?`, args: [g.ids[i]] })
        await mirror(g.urls[i], 'rejected')
      }
      rej++
    }
  }
  console.log(`Rechazados: ${rej} candidatos`)

  // Aprobaciones + Sheet
  const { headers } = await readAllRows()
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  let appended = 0
  for (const n of APROBAR) {
    const g = byN.get(n)!
    const c = candById.get(g.ids[0])
    if (!c) { console.log(`#${n} ⚠️ candidato no encontrado (${g.titulo.slice(0, 40)})`); continue }
    const cat = OVERRIDES[n] ?? guessCategory(String(c.title ?? ''))
    const url = String(c.url ?? '')
    const store = url.includes('decathlon') ? 'decathlon' : url.includes('aliexpress') ? 'aliexpress' : 'amazon'

    if (APPLY) {
      for (const id of g.ids) {
        await turso.execute({ sql: `UPDATE pending_candidates SET status='approved', updated_at=datetime('now') WHERE id=?`, args: [id] })
      }
      await mirror(url, 'approved')
      try {
        const rowData: Record<string, string | number | boolean> = {
          ean: store === 'amazon' ? String(c.ean ?? '').replace(/[^\d]/g, '') : String(c.ean ?? ''),
          name: String(c.title ?? ''),
          brand: String(c.brand ?? ''),
          category: cat,
          imageUrl: String(c.imageUrl ?? ''),
          [`${store}Price`]: Number(c.price),
          [`${store}Url`]: url,
          [`${store}Stock`]: 'in_stock',
        }
        if (store === 'amazon' && c.asin) rowData.amazonVariantAsin = String(c.asin)
        if (c.originalPrice !== null && c.originalPrice !== undefined && c.originalPrice !== '') {
          rowData[`${store}OriginalPrice`] = Number(c.originalPrice)
        }
        await appendRow(headers.map((h) => rowData[h] ?? ''))
        appended++
        await sleep(1300)
      } catch (e) {
        console.log(`#${n} ERROR Sheet: ${e instanceof Error ? e.message.slice(0, 120) : e}`)
      }
    }
    console.log(`#${n} ${store.padEnd(10)} ${Number(c.price).toFixed(2).padStart(6)}€ [${cat}] ${String(c.title).slice(0, 55)}`)
  }

  console.log(`\n${APPLY ? `✅ ${appended} filas añadidas al Sheet` : 'Dry-run: nada escrito.'}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
