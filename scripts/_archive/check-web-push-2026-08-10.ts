// PROPÓSITO: verificar en Turso que ciertos deals publicados existen tras el push a prod
// FECHA: 2026-08-10
import { config } from 'dotenv'

async function main() {
  const env = config({ path: '.env.vercel' }).parsed || {}
  for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v
  const { createClient } = await import('@libsql/client')
  const prod = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! })

  for (const t of ['50pcs Kit de anzuelos triples', '10 Piezas Señuelos Spinning', '5 Piezas Cucharillas Pesca Trucha', 'MATEIN Mochila Pesca', '50 Piezas Anzuelos de Pesca Agua Salada']) {
    const res = await prod.execute({
      sql: `SELECT d.slug, d.status, d.salePrice, d.storeId, d.publishedAt, d.createdAt, p.name AS pname
            FROM deals d JOIN products p ON p.id = d.productId WHERE p.name LIKE ?`,
      args: [`%${t}%`],
    })
    console.log('\n###', t)
    if (!res.rows.length) { console.log('   SIN DEAL'); continue }
    for (const r of res.rows) console.log('   ', r.storeId, '|', r.status, '|', r.salePrice + '€', '| creado:', (r.createdAt as string).slice(0, 16))
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})