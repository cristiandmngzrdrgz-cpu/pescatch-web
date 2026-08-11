// PROPÓSITO: auditar en Turso los deals/urls de Phishger publicados en la web
// FECHA: 2026-08-10
import 'dotenv/config'
import { config } from 'dotenv'
import path from 'path'
import { createClient } from '@libsql/client'

function loadProdEnv() {
  const prod = config({ path: '.env.vercel' }).parsed || {}
  for (const [key, value] of Object.entries(prod)) {
    if (value !== '' && process.env[key] === undefined) process.env[key] = value
  }
}

function localDb() {
  const dbPath = path.resolve(process.cwd(), 'data', 'pescatch.db')
  const fileUrl = dbPath.startsWith('/') ? `file:${dbPath}` : `file:///${dbPath.replace(/\\/g, '/')}`
  return createClient({ url: fileUrl })
}

async function show(db: any, label: string) {
  console.log(`\n=== ${label} ===`)
  const products = await db.execute({
    sql: "SELECT id, name, slug FROM products WHERE slug LIKE '%phishger%' OR name LIKE '%Phishger%'",
  })
  for (const r of products.rows) console.log('PRODUCT', JSON.stringify(r))
  const deals = await db.execute({
    sql: "SELECT id, productId, slug, title, status FROM deals WHERE slug LIKE '%phishger%' OR title LIKE '%Phishger%'",
  })
  for (const r of deals.rows) console.log('DEAL', JSON.stringify(r))
}

async function main() {
  const local = localDb()
  await show(local, 'LOCAL')

  loadProdEnv()
  const prod = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! })
  await show(prod, 'TURSO')
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})