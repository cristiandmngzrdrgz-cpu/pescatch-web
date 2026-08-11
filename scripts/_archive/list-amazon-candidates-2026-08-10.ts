// PROPÓSITO: listar candidatos pendientes de Amazon en Turso (con el flujo por URL)
// para que el admin pueda aprobarlos aunque no aparezcan en el top-50 del panel.
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

async function main() {
  loadProdEnv()
  if (!process.env.TURSO_DATABASE_URL) {
    console.error('TURSO_DATABASE_URL no definido')
    process.exit(1)
  }
  const prod = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  const res = await prod.execute({
    sql: `SELECT id, score, price, rating, reviews, source, substr(title,1,80) AS title
          FROM pending_candidates
          WHERE status = 'pending' AND url LIKE '%amazon%'
          ORDER BY score DESC`,
  })
  for (const r of res.rows as any[]) {
    console.log(`${String(r.id).padStart(3)} | ${String(r.score).padStart(4)} | ${r.price}€ | ${r.rating}⭐ | ${r.reviews} | ${r.source} | ${r.title}`)
  }
  console.log(`\nTotal Amazon pendientes: ${res.rows.length}`)
}

main().catch(e => { console.error(e); process.exit(1) })