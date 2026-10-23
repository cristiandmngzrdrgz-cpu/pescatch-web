// PROPÓSITO: Corregir precio verificado de la línea Leydun (3,29 → 3,39€) y guardar
//            ratings reales de las dos fichas AliExpress del roundup semana 44.
//            Ficha verificada con navegador el 24 oct 2026 (BrightData 401).
// FECHA: 2026-10-24
// Uso: npx tsx scripts/fix-ae-prices-2026-10-24.ts           (dry-run)
//      npx tsx scripts/fix-ae-prices-2026-10-24.ts --apply

import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@libsql/client'
import { readAllRows, updateRowByIndex } from '../../src/lib/sync/google-sheets-client'

const ITEMS = [
  {
    pid: '1005013255639260',
    slug: 'leydun-micro-hilo-de-pescar-ms-fino-100m-150m-4-hebras-trenzadas-de-pe-monofilam_aliexpress',
    label: 'Leydun trenzado PE',
    nameMatch: 'Leydun Micro hilo de pescar',
    price: 3.39,
    originalPrice: 3.39,
    rating: 4.9,
    reviews: 2416,
  },
  {
    pid: '1005006966447319',
    slug: 'caja-de-aparejos-de-pesca-de-gran-capacidad-accesorios-impermeables-almacenamien_aliexpress',
    label: 'Caja de aparejos',
    nameMatch: 'Caja de aparejos de pesca de gran capacidad',
    price: 6.19,
    originalPrice: 6.19,
    rating: 4.9,
    reviews: 1016,
  },
]

function tursoClient() {
  const prod = config({ path: '.env.vercel' }).parsed || {}
  const url = prod.TURSO_DATABASE_URL
  const authToken = prod.TURSO_AUTH_TOKEN
  if (!url) throw new Error('TURSO_DATABASE_URL no definido en .env.vercel')
  return createClient({ url, authToken })
}

async function main() {
  const apply = process.argv.includes('--apply')
  const local = createClient({ url: `file:///${process.cwd().replace(/\\/g, '/')}/data/pescatch.db` })

  for (const item of ITEMS) {
    console.log(`\n${item.label} (${item.pid}) → ${item.price.toFixed(2)}€ · ${item.rating}★/${item.reviews}`)
    for (const [name, db] of [['local', local], ['turso', tursoClient()]] as const) {
      const r = await db.execute({
        sql: 'SELECT salePrice, originalPrice, rating, reviewCount FROM deals WHERE slug = ?',
        args: [item.slug],
      })
      if (r.rows.length === 0) {
        console.log(`  ${name}: ⚠️ deal no encontrado`)
        continue
      }
      const before = r.rows[0]
      if (!apply) {
        console.log(`  ${name}: ${before.salePrice}€ · ${before.rating}★/${before.reviewCount} (sin cambios)`)
        continue
      }
      const commission = Math.round(item.price * 0.08 * 100) / 100
      await db.execute({
        sql: `UPDATE deals SET salePrice = ?, originalPrice = ?, discountPercent = 0, rating = ?, reviewCount = ?,
              commission = ?, updatedAt = ? WHERE slug = ?`,
        args: [item.price, item.originalPrice, item.rating, item.reviews, commission, new Date().toISOString(), item.slug],
      })
      await db.execute({
        sql: 'UPDATE products SET rating = ?, reviewCount = ? WHERE id = (SELECT productId FROM deals WHERE slug = ?)',
        args: [item.rating, item.reviews, item.slug],
      })
      console.log(`  ${name}: ✅ ${before.salePrice}€ → ${item.price}€ · ${before.rating}★ → ${item.rating}★`)
    }

    // Sheet: corregir aliexpressPrice para que el próximo sync no revierta.
    // Los enlaces del Sheet son s.click (sin PID), así que se empareja por nombre.
    const { headers, rows } = await readAllRows()
    const nameIdx = headers.indexOf('name')
    const rowIdx = rows.findIndex(row => String(row[nameIdx] || '').includes(item.nameMatch))
    if (rowIdx < 0) {
      console.log('  sheet: ⚠️ fila no encontrada')
      continue
    }
    if (!apply) {
      console.log(`  sheet: fila ${rowIdx + 2} → aliexpressPrice ${item.price}`)
      continue
    }
    await updateRowByIndex(rowIdx, 'aliexpressPrice', item.price.toFixed(2).replace('.', ','))
    console.log(`  sheet: ✅ fila ${rowIdx + 2} → ${item.price.toFixed(2).replace('.', ',')}€`)
  }

  if (!apply) console.log('\nDRY-RUN. Ejecuta con --apply para escribir en local + Turso + Sheet.')
}

main().catch(e => { console.error(e); process.exit(1) })
