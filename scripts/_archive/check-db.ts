import 'dotenv/config'
import { createClient } from '@libsql/client'

const db = createClient({ url: 'file:data/pescatch.db' })

async function main() {
  const result = await db.execute(
    `SELECT title, salePrice, originalPrice, discountPercent, storeName, category
     FROM deals WHERE hidden = 0 AND storeName = 'Decathlon'
     ORDER BY discountPercent DESC`
  )

  console.log('=== Decathlon productos visibles en DB ===')
  for (const row of result.rows) {
    const disc = row.discountPercent?.toString() || '0'
    const sp = Number(row.salePrice).toFixed(2) + '€'
    const op = Number(row.originalPrice).toFixed(2) + '€'
    const opDisplay = Number(row.originalPrice) === Number(row.salePrice) ? '    -    ' : op.padStart(9)
    console.log(`${disc.padStart(4)}% ${sp.padStart(8)} ${opDisplay} ${row.title?.toString().slice(0, 55)}`)
  }
  console.log(`\nTotal: ${result.rows.length} productos`)

  const totalDecathlon = await db.execute(
    `SELECT COUNT(*) as cnt FROM deals WHERE storeName = 'Decathlon'`
  )
  console.log(`Total Decathlon en DB (incl. hidden): ${totalDecathlon.rows[0].cnt}`)
}

main().catch(console.error)
