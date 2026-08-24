// PROPÓSITO: diagnóstico de limpieza — (1) backlog de pending_candidates en Turso por
//            antigüedad; (2) clasificación de filas basura en el Google Sheet.
// FECHA: 2026-08-23
// USO: npx tsx scripts/discover/diag-limpieza.ts [--sheet-only] [--backlog-only]
import { createClient } from '@libsql/client'
import { readFileSync } from 'node:fs'
import { readAllRows } from '../../src/lib/sync/google-sheets-client'

const args = process.argv.slice(2)
const sheetOnly = args.includes('--sheet-only')
const backlogOnly = args.includes('--backlog-only')

async function backlog() {
  const env: Record<string, string> = {}
  for (const l of readFileSync('.env.vercel', 'utf-8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  const t = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })
  const r = await t.execute(`
    SELECT source,
      CASE
        WHEN created_at >= datetime('now','-7 days') THEN 'a.<7 dias'
        WHEN created_at >= datetime('now','-14 days') THEN 'b.7-14 dias'
        WHEN created_at >= datetime('now','-21 days') THEN 'c.14-21 dias'
        ELSE 'd.MAS de 21 dias'
      END AS bucket,
      COUNT(*) n
    FROM pending_candidates WHERE status='pending'
    GROUP BY source, bucket ORDER BY bucket, source`)
  console.log('=== BACKLOG pending_candidates (TURSO) ===')
  let old21 = 0, recent = 0
  for (const row of r.rows) {
    console.log(`  ${row.bucket} | ${String(row.source).padEnd(20)} | ${row.n}`)
    if (String(row.bucket).startsWith('d.')) old21 += Number(row.n)
    else recent += Number(row.n)
  }
  const tot = await t.execute(`SELECT COUNT(*) n FROM pending_candidates WHERE status='pending'`)
  console.log(`TOTAL pendientes: ${tot.rows[0].n} (rechazables >21d: ${old21}, recientes: ${recent})`)
}

function classifyRow(r: unknown[], headers: string[]): string | null {
  const idx = (h: string) => headers.indexOf(h)
  const get = (h: string) => String(r[idx(h)] ?? '').trim()
  const name = get('name')
  const ean = get('ean')
  const stores = ['aliexpressPrice', 'amazonPrice', 'decathlonPrice']
  const urls = ['aliexpressUrl', 'amazonUrl', 'decathlonUrl', 'aliexpressOriginalPrice', 'amazonVariantAsin']
  const hasStoreData = [...stores, ...urls].some((h) => idx(h) >= 0 && String(r[idx(h)] ?? '').trim() !== '')
  if (name === '' && !hasStoreData && ean === '') return null // vacía del todo -> ni cuenta
  // válida: nombre razonable + datos de tienda
  const looksLikeProduct =
    name.length >= 8 &&
    name.length <= 300 &&
    !/^https?:\/\//i.test(name) &&
    !/[.;:]\s$/.test(name) &&
    !/\*\*/.test(name)
  if (looksLikeProduct && hasStoreData) return null
  if (!name && hasStoreData) return 'SIN-NOMBRE'
  if (/^https?:\/\//i.test(name)) return 'URL-COMO-NOMBRE'
  if (/\*\*/.test(name) || name.length > 300) return 'TEXTO-PROSA'
  if (!hasStoreData) return 'SIN-DATOS-TIENDA'
  return 'SOSPECHOSA'
}

async function sheetJunk() {
  const { headers, rows } = await readAllRows()
  console.log(`\n=== SHEET: ${rows.length} filas de datos ===`)
  const junk: { n: number; reason: string; preview: string }[] = []
  let empty = 0
  for (let i = 0; i < rows.length; i++) {
    const reason = classifyRow(rows[i] as unknown[], headers)
    if (reason === null) { empty++; continue }
    const nameCell = String(rows[i][headers.indexOf('name')] ?? '')
    junk.push({ n: i + 2, reason, preview: nameCell.slice(0, 60) || '(sin name)' })
  }
  console.log(`Vacías totales (se ignoran): ${empty} · Válidas: ${rows.length - junk.length - empty} · Sospechosas/basura: ${junk.length}`)
  const byReason: Record<string, number> = {}
  for (const j of junk) byReason[j.reason] = (byReason[j.reason] ?? 0) + 1
  console.log('Por motivo:', JSON.stringify(byReason))
  console.log('\nDetalle:')
  for (const j of junk) console.log(`  fila ${String(j.n).padStart(4)} [${j.reason}] ${j.preview}`)
}

async function main() {
  if (!backlogOnly) await sheetJunk()
  if (!sheetOnly) await backlog()
}

main().catch((e) => { console.error(e); process.exit(1) })
