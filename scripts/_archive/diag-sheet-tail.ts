// PROPÓSITO: diagnóstico tras apply-decisiones-hoy — compara IDs local vs Turso
//            y comprueba si las filas añadidas al Sheet tienen aliexpressUrl.
// FECHA: 2026-08-23
// USO: npx tsx scripts/discover/diag-sheet-tail.ts
import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@libsql/client'
import { readAllRows } from '../../src/lib/sync/google-sheets-client'
import { readFileSync } from 'node:fs'

async function main() {
  if (!process.env.GOOGLE_SHEETS_CREDENTIALS) {
    process.env.GOOGLE_SHEETS_CREDENTIALS = readFileSync('.env.google-sheets.json', 'utf-8')
  }
  const prod = config({ path: '.env.vercel' }).parsed || {}
  for (const [k, v] of Object.entries(prod)) {
    if (v !== '' && process.env[k] === undefined) process.env[k] = v
  }
  // AHORA crear cliente Turso (con env cargado)
  const turso = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN })

  // 1. IDs en cada DB para los candidatos de hoy
  const local = createClient({ url: 'file:data/pescatch.db' })
  const q = (db: any) => db.execute(
    `SELECT id, title, price, url FROM pending_candidates WHERE source='AliExpress directo' AND created_at > '2026-08-22' ORDER BY score DESC, id ASC`
  )
  const lr = await q(local)
  const tr = await q(turso)
  console.log(`local hoy: ${lr.rows.length} | turso hoy: ${tr.rows.length}`)
  console.log('primeros 5 local :', lr.rows.slice(0, 5).map(r => r.id).join(','))
  console.log('primeros 5 turso :', tr.rows.slice(0, 5).map(r => r.id).join(','))

  // 2. Cola del Sheet
  const { headers, rows } = await readAllRows()
  const iName = headers.indexOf('name')
  const iPri = headers.indexOf('aliexpressPrice')
  const iUrl = headers.indexOf('aliexpressUrl')
  console.log(`\nSheet: ${rows.length} filas de datos. Últimas 28:`)
  for (let i = rows.length - 28; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue
    console.log(`${String(i + 2).padStart(4)} | ${String(r[iName] || '').slice(0, 45).padEnd(45)} | ${(r[iPri] || '').padStart(7)} | url=${(r[iUrl] || '').slice(0, 40)}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
