// PROPÓSITO: Deshacer el cruce de identidad Daiwa en el catálogo:
//   - Exceler 762L (B0CSDR4MPC): nombre/slug/imagen/precio reales (67,00€, 0%, 4,6★/37).
//   - Ninja X Spin: separar las dos variantes (2,10 m B01MFH2JAH y 2,70 m B01MQD5MGO)
//     renombrándolas en el Sheet para que el sync no las fusione.
//   - Post borrador "lubina desde costa": reapuntar el slug viejo al Ninja X 2,70 m.
// FECHA: 2026-10-24
// Uso: npx tsx scripts/fix-ninja-exceler-2026-10-24.ts [--apply]

import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@libsql/client'
import { readAllRows, updateRowByIndex } from '../../src/lib/sync/google-sheets-client'

const EXCELER = {
  productId: 'prod_daiwa-caa-de-pescar-exceler-spinning',
  name: 'DAIWA Caña de pescar Exceler Spinning',
  slug: 'daiwa-caa-de-pescar-exceler-spinning',
  image: 'https://m.media-amazon.com/images/I/41N3TUQwCcL._AC_UL320_.jpg',
  price: 67,
  rating: 4.6,
  reviews: 37,
}

const NINJA = [
  { asin: 'B01MFH2JAH', name: 'Daiwa Ninja X Spin 2,10 m 10-30 g' },
  { asin: 'B01MQD5MGO', name: 'Daiwa Ninja X Spin 2,70 m 15-50 g' },
]

const OLD_SLUG = 'daiwa-caa-de-pescar-spinning-ninja-x-spin'
const NEW_SLUG = 'daiwa-ninja-x-spin-270-m-15-50-g'
const DRAFT_POST = 'lubina-desde-costa-otono-equipo-senuelos-2026'

function tursoClient() {
  const prod = config({ path: '.env.vercel' }).parsed || {}
  if (!prod.TURSO_DATABASE_URL) throw new Error('Sin TURSO_DATABASE_URL')
  return createClient({ url: prod.TURSO_DATABASE_URL, authToken: prod.TURSO_AUTH_TOKEN })
}

async function fixDb(label: string, db: ReturnType<typeof createClient>, apply: boolean) {
  console.log(`\n--- ${label}`)
  const now = new Date().toISOString()

  const prod = await db.execute({
    sql: 'SELECT id, name, slug FROM products WHERE id = ?',
    args: [EXCELER.productId],
  })
  if (prod.rows.length === 0) {
    console.log('  ⚠️ producto Exceler no encontrado; se omite')
  } else {
    console.log(`  producto: "${prod.rows[0].name}" (${prod.rows[0].slug}) → "${EXCELER.name}" (${EXCELER.slug})`)
    if (apply) {
      await db.execute({
        sql: `UPDATE products SET name = ?, slug = ?, category = 'canas', brand = 'Daiwa',
              rating = ?, reviewCount = ?, updatedAt = ? WHERE id = ?`,
        args: [EXCELER.name, EXCELER.slug, EXCELER.rating, EXCELER.reviews, now, EXCELER.productId],
      })
    }
  }

  const deal = await db.execute({
    sql: `SELECT id, title, slug, salePrice, imageUrl FROM deals
          WHERE productId = ? AND storeId = 'amazon'`,
    args: [EXCELER.productId],
  })
  if (deal.rows.length === 0) {
    console.log('  ⚠️ deal Exceler no encontrado; se omite')
  } else {
    const d = deal.rows[0]
    console.log(`  deal: "${d.title}" (${d.slug}) ${d.salePrice}€ → "${EXCELER.name}" (${EXCELER.slug}) ${EXCELER.price}€`)
    console.log(`  imagen: ${d.imageUrl} → ${EXCELER.image}`)
    if (apply) {
      await db.execute({
        sql: `UPDATE deals SET title = ?, slug = ?, imageUrl = ?, salePrice = ?, originalPrice = ?,
              discountPercent = 0, rating = ?, reviewCount = ?, commission = ?,
              metaTitle = '', metaDescription = '', updatedAt = ? WHERE id = ?`,
        args: [
          EXCELER.name, EXCELER.slug, EXCELER.image, EXCELER.price, EXCELER.price,
          EXCELER.rating, EXCELER.reviews, Math.round(EXCELER.price * 0.05 * 100) / 100, now, String(d.id),
        ],
      })
    }
  }

  const post = await db.execute({
    sql: 'SELECT id, content FROM posts WHERE slug = ?',
    args: [DRAFT_POST],
  })
  if (post.rows.length === 0) {
    console.log('  ⚠️ post borrador no encontrado')
  } else {
    const content = String(post.rows[0].content)
    const count = (content.match(new RegExp(OLD_SLUG, 'g')) || []).length
    console.log(`  post borrador: ${count} referencia(s) a ${OLD_SLUG} → ${NEW_SLUG}`)
    if (apply && count > 0) {
      await db.execute({
        sql: 'UPDATE posts SET content = ?, updatedAt = ? WHERE id = ?',
        args: [content.split(OLD_SLUG).join(NEW_SLUG), now, String(post.rows[0].id)],
      })
    }
  }
}

async function main() {
  const apply = process.argv.includes('--apply')

  // 1. Sheet: separar las variantes Ninja X (todas las filas de cada ASIN)
  const { headers, rows } = await readAllRows()
  const iUrl = headers.indexOf('amazonUrl')
  const iName = headers.indexOf('name')
  console.log(`=== Sheet (${apply ? 'APPLY' : 'DRY-RUN'})`)
  const writes: { idx: number; name: string }[] = []
  for (const variant of NINJA) {
    rows.forEach((row, idx) => {
      if (!String(row[iUrl] || '').includes(variant.asin)) return
      if (row[iName] === variant.name) return
      console.log(`  fila ${idx + 2}: "${row[iName]}" → "${variant.name}"`)
      writes.push({ idx, name: variant.name })
    })
  }
  if (apply) {
    // Secuencial: updateRowByIndex relee la hoja en cada llamada
    for (const w of writes) {
      await updateRowByIndex(w.idx, 'name', w.name)
    }
  }

  // 2. Bases de datos
  const local = createClient({ url: `file:///${process.cwd().replace(/\\/g, '/')}/data/pescatch.db` })
  await fixDb('LOCAL', local, apply)
  await fixDb('TURSO', tursoClient(), apply)

  console.log(apply ? '\n✅ Aplicado. Siguiente: npm run sync y sync:prod.' : '\nDRY-RUN. Ejecuta con --apply.')
}

main().catch(e => { console.error(e); process.exit(1) })
