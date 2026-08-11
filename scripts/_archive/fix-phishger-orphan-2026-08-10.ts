import { config } from 'dotenv'

// PROPÓSITO: Borrar el huérfano prod_deal_1782991966338_y6bq + su deal draft en Turso
// (bloquea sync:prod con UNIQUE constraint failed: deals.slug para Phishger).
// FECHA: 2026-08-10

async function main() {
  const env = config({ path: '.env.vercel' }).parsed || {}
  for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v
  const { createClient } = await import('@libsql/client')
  const prod = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! })

  const orphanProduct = 'prod_deal_1782991966338_y6bq'
  const orphanDeal = 'deal_1782991966338_y6bq'

  const refs = await prod.execute({ sql: 'SELECT COUNT(*) AS n FROM deals WHERE productId = ?', args: [orphanProduct] })
  console.log('Deals que referencian el product huérfano:', refs.rows[0].n)

  const ex = await prod.execute({ sql: 'SELECT status, slug FROM deals WHERE id = ?', args: [orphanDeal] })
  console.log('Deal huérfano estado actual:', JSON.stringify(ex.rows[0]))

  await prod.execute({ sql: 'DELETE FROM comments WHERE dealId = ?', args: [orphanDeal] })
  const ph = await prod.execute({ sql: 'DELETE FROM price_history WHERE dealId = ?', args: [orphanDeal] })
  console.log('price_history borradas:', ph.rowsAffected)
  const dl = await prod.execute({ sql: 'DELETE FROM deals WHERE id = ?', args: [orphanDeal] })
  console.log('deals borrado:', dl.rowsAffected)
  const pp = await prod.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [orphanProduct] })
  console.log('products borrado:', pp.rowsAffected)

  const check = await prod.execute({ sql: "SELECT id, slug FROM deals WHERE slug LIKE '%phishger%' OR title LIKE '%Phishger%'" })
  console.log('\nQuedan en Turso (phishger):')
  for (const r of check.rows) console.log(' ', JSON.stringify(r))
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})