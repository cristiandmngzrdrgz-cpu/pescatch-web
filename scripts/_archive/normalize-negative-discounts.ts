// PROPÓSITO: normalizar descuentos negativos (originalPrice < salePrice) a 0% en deals published
//            Cuando el precio sube, updateDealInDb conserva un originalPrice desactualizado
//            que produce descuentos negativos (ej. -48%). Se fija originalPrice = salePrice.
// FECHA: 2026-08-15
// USO: npx tsx scripts/normalize-negative-discounts.ts [--apply]  (sin flag = dry-run)
import { getDb } from '../src/lib/db'

async function main() {
  const apply = process.argv.includes('--apply')
  const db = getDb()
  const r = await db.execute(
    `SELECT id, title, storeId, salePrice, originalPrice, discountPercent
     FROM deals
     WHERE status = 'published' AND originalPrice > 0 AND originalPrice < salePrice
     ORDER BY storeId, title`
  )
  const deals = r.rows as { id: string; title: string; storeId: string; salePrice: number; originalPrice: number; discountPercent: number }[]
  console.log(`Deals con descuento negativo (${deals.length}):`)

  const byStore = new Map<string, number>()
  for (const d of deals) {
    byStore.set(d.storeId, (byStore.get(d.storeId) || 0) + 1)
    console.log(`[${d.storeId.padEnd(9)}] ${String(d.salePrice).padStart(7)}€ orig ${String(d.originalPrice).padStart(7)}€ (${String(d.discountPercent).padStart(3)}%) ${d.title.slice(0, 45)}`)
  }

  console.log('\nPor tienda:', [...byStore.entries()].map(([k, v]) => `${k}=${v}`).join(', '))

  if (!apply) {
    console.log('\nDRY-RUN. Pasa --apply para escribir.')
    return
  }

  let n = 0
  for (const d of deals) {
    await db.execute({
      sql: 'UPDATE deals SET originalPrice = salePrice, discountPercent = 0, updatedAt = ? WHERE id = ?',
      args: [new Date().toISOString(), d.id],
    })
    n++
  }
  console.log(`\n✅ ${n} deals normalizados a 0% de descuento.`)
}

main().catch((e) => { console.error(e); process.exit(1) })