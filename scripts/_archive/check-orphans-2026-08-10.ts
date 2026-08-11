// PROPÓSITO: revisar en Turso si hay products/contenido huérfano con prefijo prod_deal_
// FECHA: 2026-08-10
import { config } from 'dotenv'

async function main() {
  const env = config({ path: '.env.vercel' }).parsed || {}
  for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v
  const { createClient } = await import('@libsql/client')
  const prod = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! })

  console.log('=== Products con id prefijo prod_deal_ ===')
  const prods = await prod.execute({ sql: "SELECT id, name, slug FROM products WHERE id LIKE 'prod\\_deal\\_%' ESCAPE '\\'" })
  for (const r of prods.rows) console.log(JSON.stringify(r))

  console.log('\n=== Deals cuyo productId es prod_deal_ ===')
  const deals = await prod.execute({ sql: "SELECT id, productId, slug, title, status FROM deals WHERE productId LIKE 'prod\\_deal\\_%' ESCAPE '\\'" })
  for (const r of deals.rows) console.log(JSON.stringify(r))

  console.log('\n=== Price history / comments de esos deals ===')
  for (const r of deals.rows) {
    const dealId = r.id as string
    const ph = await prod.execute({ sql: 'SELECT COUNT(*) AS n FROM price_history WHERE dealId = ?', args: [dealId] })
    const cm = await prod.execute({ sql: 'SELECT COUNT(*) AS n FROM comments WHERE dealId = ?', args: [dealId] })
    console.log(dealId, 'price_history:', ph.rows[0].n, 'comments:', cm.rows[0].n)
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})