// PROPÓSITO: Eliminar deals AliExpress fantasma (13.25€) creados por el bug de searchProducts('')
// que asignaba un producto aleatorio a cada producto Amazon/Decathlon sin datos AliExpress en el Sheet.
// FECHA: 2026-08-06
import { getDb, initSchema } from '../src/lib/db'
import { readGoogleSheets } from '../src/lib/sync/reader-sheets'

function slugify(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function main() {
  await initSchema()
  const db = getDb()

  const deals = await db.execute(
    "SELECT d.id, d.productId, d.title FROM deals d WHERE d.storeId='aliexpress' AND d.status='published'"
  )

  const sheetRows = (await readGoogleSheets()).filter(
    (r) => r.aliexpressUrl && String(r.aliexpressUrl).trim() !== '',
  )
  const eanSet = new Set<string>()
  const slugSet = new Set<string>()
  for (const r of sheetRows) {
    if (r.ean) eanSet.add(String(r.ean).trim())
    if (r.name) slugSet.add(slugify(String(r.name)))
  }

  const products = await db.execute('SELECT id, ean FROM products')
  const eanByProd: Record<string, string> = {}
  for (const p of products.rows) eanByProd[String(p.id)] = String(p.ean || '')

  const toDelete: string[] = []
  for (const d of deals.rows) {
    const prodId = String(d.productId)
    const ean = eanByProd[prodId] || ''
    const title = String(d.title)
    const legit =
      (ean !== '' && eanSet.has(ean)) || slugSet.has(slugify(title))
    if (!legit) toDelete.push(String(d.id))
  }

  console.log(`Deals aliexpress publicados: ${deals.rows.length}`)
  console.log(`A eliminar (fantasma): ${toDelete.length}`)
  console.log(`A conservar: ${deals.rows.length - toDelete.length}`)

  if (toDelete.length === 0) return

  for (const id of toDelete) {
    await db.execute({ sql: 'DELETE FROM price_history WHERE dealId = ?', args: [id] })
    await db.execute({ sql: 'DELETE FROM comments WHERE dealId = ?', args: [id] })
    await db.execute({ sql: 'DELETE FROM deals WHERE id = ?', args: [id] })
  }

  const check = await db.execute(
    "SELECT COUNT(*) AS c FROM deals WHERE storeId='aliexpress' AND status='published'",
  )
  console.log(`Quedan ${Number(check.rows[0].c)} deals aliexpress publicados`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})