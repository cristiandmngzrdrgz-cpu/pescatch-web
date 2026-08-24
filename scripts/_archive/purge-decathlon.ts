// PROPÓSITO: exportar a JSON y purgar todos los datos de Decathlon (sin afiliado,
//            fuera del proyecto). Exporta deals/products/price_history/comments/
//            click_tracking de Decathlon a data/archive-decathlon-<db>.json y con
//            --apply borra las filas en la DB objetivo.
// FECHA: 2026-08-24
// USO: npx tsx scripts/_archive/purge-decathlon.ts <turso|local> [--apply] [--no-export]
import 'dotenv/config'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createClient, type Client } from '@libsql/client'

const target = process.argv[2]
const APPLY = process.argv.includes('--apply')
const NO_EXPORT = process.argv.includes('--no-export')

async function getClient(): Promise<Client> {
  if (target === 'local') return createClient({ url: 'file:data/pescatch.db' })
  const env: Record<string, string> = {}
  for (const l of readFileSync('.env.vercel', 'utf-8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })
}

function rowsToObjects(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((r) => {
    const o: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(r)) o[k] = v
    return o
  })
}

async function main() {
  if (!target || !['turso', 'local'].includes(target)) {
    console.error('Uso: npx tsx scripts/_archive/purge-decathlon.ts <turso|local> [--apply] [--no-export]')
    process.exit(1)
  }
  const db = await getClient()

  const dealsRes = await db.execute(`SELECT * FROM deals WHERE storeid = 'decathlon'`)
  const deals = rowsToObjects(dealsRes.rows as unknown as Record<string, unknown>[])
  const dealIds = deals.map((d) => String(d.id))

  // productos cuyos deals son TODOS de decathlon (huérfanos tras la purga)
  const prodRes = await db.execute(`
    SELECT p.* FROM products p
    WHERE EXISTS (SELECT 1 FROM deals d WHERE d.productid = p.id AND d.storeid = 'decathlon')
      AND NOT EXISTS (SELECT 1 FROM deals d WHERE d.productid = p.id AND d.storeid != 'decathlon')`)
  const products = rowsToObjects(prodRes.rows as unknown as Record<string, unknown>[])
  const productIds = products.map((p) => String(p.id))

  let priceHistory: Record<string, unknown>[] = []
  let comments: Record<string, unknown>[] = []
  let clicks: Record<string, unknown>[] = []
  const chunk = <T>(arr: T[], size: number): T[][] => {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
  }

  for (const ids of chunk(dealIds, 100)) {
    if (!ids.length) break
    const ph = ids.map(() => '?').join(',')
    const hist = await db.execute(`SELECT * FROM price_history WHERE dealid IN (${ph})`, ids)
    priceHistory.push(...rowsToObjects(hist.rows as unknown as Record<string, unknown>[]))
    const com = await db.execute(`SELECT * FROM comments WHERE dealid IN (${ph})`, ids)
    comments.push(...rowsToObjects(com.rows as unknown as Record<string, unknown>[]))
    const clk = await db.execute(`SELECT * FROM click_tracking WHERE dealid IN (${ph})`, ids)
    clicks.push(...rowsToObjects(clk.rows as unknown as Record<string, unknown>[]))
  }

  console.log(`[${target}] Deals Decathlon: ${deals.length} · Productos solo-Decathlon: ${products.length}`)
  console.log(`        price_history: ${priceHistory.length} · comments: ${comments.length} · clicks: ${clicks.length}`)

  if (!NO_EXPORT && deals.length > 0) {
    const outFile = `data/archive-decathlon-${target}.json`
    writeFileSync(outFile, JSON.stringify({ exportedAt: new Date().toISOString(), db: target, deals, products, priceHistory, comments, clickTracking: clicks }, null, 1))
    console.log(`[${target}] Exportado a ${outFile}`)
  }

  if (!APPLY) {
    console.log(`[${target}] Dry-run: nada borrado. Usa --apply para purgar.`)
    return
  }

  for (const ids of chunk(dealIds, 100)) {
    if (!ids.length) break
    const ph = ids.map(() => '?').join(',')
    await db.execute(`DELETE FROM click_tracking WHERE dealid IN (${ph})`, ids)
    await db.execute(`DELETE FROM price_history WHERE dealid IN (${ph})`, ids)
    await db.execute(`DELETE FROM comments WHERE dealid IN (${ph})`, ids)
    await db.execute(`DELETE FROM deals WHERE id IN (${ph})`, ids)
  }
  for (const ids of chunk(productIds, 100)) {
    if (!ids.length) break
    const ph = ids.map(() => '?').join(',')
    await db.execute(`DELETE FROM products WHERE id IN (${ph})`, ids)
  }

  const check = await db.execute(`SELECT COUNT(*) as n FROM deals WHERE storeid = 'decathlon'`)
  console.log(`[${target}] ✅ Purga aplicada. Deals Decathlon restantes: ${check.rows[0].n}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
