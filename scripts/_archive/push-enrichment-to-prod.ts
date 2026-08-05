import 'dotenv/config'
import { config } from 'dotenv'
import path from 'path'
import { createClient } from '@libsql/client'
import type { Client, InValue } from '@libsql/client'
import { getDb } from '../src/lib/db'

const ENRICH_FIELDS = [
  'description', 'imageUrl', 'images', 'brand', 'ean', 'asin',
  'rating', 'reviewCount', 'technicalSpecs', 'review', 'pros', 'cons',
  'tags', 'metaTitle', 'metaDescription',
] as const

function loadProdEnv() {
  const prod = config({ path: '.env.vercel' }).parsed || {}
  for (const [key, value] of Object.entries(prod)) {
    if (value !== '' && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function localDb(): Client {
  const dbPath = path.resolve(process.cwd(), 'data', 'pescatch.db')
  const fileUrl = dbPath.startsWith('/') ? `file:${dbPath}` : `file:///${dbPath.replace(/\\/g, '/')}`
  return createClient({ url: fileUrl })
}

async function main() {
  loadProdEnv()
  const apply = process.argv.includes('--apply')

  const prod = getDb()
  if (!process.env.TURSO_DATABASE_URL) {
    console.error('TURSO_DATABASE_URL no definido. Revisa .env.vercel')
    process.exit(1)
  }
  console.log(`Destino: TURSO (${process.env.TURSO_DATABASE_URL.split('?')[0]})`)
  console.log(`Modo: ${apply ? 'APLICADO' : 'DRY-RUN (usar --apply)'}`)

  const local = localDb()
  const rows = await local.execute({
    sql: `SELECT id, productId, title, storeId, slug, ${ENRICH_FIELDS.join(', ')} FROM deals WHERE status = ?`,
    args: ['published'],
  })

  let withChanges = 0
  let notFound = 0
  const detail: string[] = []

  for (const raw of rows.rows) {
    const localRow = raw as unknown as Record<string, any>
    const id = String(localRow.id)
    const slug = String(localRow.slug || '')
    const title = String(localRow.title || '')

    const prodRes = await prod.execute({ sql: 'SELECT id FROM deals WHERE id = ?', args: [id] })
    let prodId = prodRes.rows[0]?.id
    if (!prodId && slug) {
      const bySlug = await prod.execute({ sql: 'SELECT id FROM deals WHERE slug = ?', args: [slug] })
      prodId = bySlug.rows[0]?.id
    }
    if (!prodId) {
      notFound++
      continue
    }

    const prodRowRes = await prod.execute({
      sql: `SELECT ${ENRICH_FIELDS.join(', ')} FROM deals WHERE id = ?`,
      args: [String(prodId)],
    })
    if (prodRowRes.rows.length === 0) { notFound++; continue }
    const prodRow = prodRowRes.rows[0] as unknown as Record<string, any>

    const sets: string[] = []
    const args: InValue[] = []
    const changed: string[] = []
    for (const f of ENRICH_FIELDS) {
      const lv = localRow[f]
      const pv = prodRow[f]
      const lEmpty = lv === null || lv === undefined || lv === '' || lv === '[]' || lv === '{}' || lv === 0
      if (lEmpty) continue
      const same = String(lv) === String(pv)
      if (same) continue
      sets.push(`${f} = ?`)
      args.push(lv as InValue)
      changed.push(f)
    }

    if (changed.length === 0) continue
    withChanges++

    if (apply) {
      sets.push("updatedAt = datetime('now')")
      args.push(String(prodId))
      await prod.execute({ sql: `UPDATE deals SET ${sets.join(', ')} WHERE id = ?`, args })
    }

    detail.push(`- ${id} (${title.slice(0, 40)}) -> ${changed.join(', ')}`)

    const productId = String(localRow.productId || '')
    if (productId) {
      const pSets: string[] = []
      const pArgs: InValue[] = []
      const map = {
        description: 'description', imageUrl: 'imageUrl', images: 'images', brand: 'brand',
        ean: 'ean', asin: 'asin', rating: 'rating', reviewCount: 'reviewCount',
        review: 'review', technicalSpecs: 'specs', pros: 'pros', cons: 'cons', tags: 'tags',
      } as const
      for (const [lf, pf] of Object.entries(map)) {
        if (!changed.includes(lf)) continue
        const lv = localRow[lf]
        if (lv === null || lv === undefined || lv === '') continue
        pSets.push(`${pf} = ?`)
        pArgs.push(lv as InValue)
      }
      if (pSets.length > 0 && apply) {
        pSets.push("updatedAt = datetime('now')")
        pArgs.push(productId)
        await prod.execute({ sql: `UPDATE products SET ${pSets.join(', ')} WHERE id = ?`, args: pArgs })
      }
    }
  }

  console.log(`\nDeals a actualizar en producción: ${withChanges}`)
  console.log(`Deals no encontrados en Turso: ${notFound}`)
  if (detail.length > 0) console.log('\n' + detail.join('\n'))
  if (!apply) console.log('\nEjecuta con --apply para escribir en Turso.')
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
