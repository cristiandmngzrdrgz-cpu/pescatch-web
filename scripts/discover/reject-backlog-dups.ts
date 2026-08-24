// PROPÓSITO: depurar el backlog de pending_candidates de Turso.
//            Paso 1 (este script): rechazar en bloque los que son duplicados (>= umbral
//            dealMatchSimilarity) de deals ya publicados, espejando el estado en local.
// FECHA: 2026-08-23
// USO: npx tsx scripts/discover/reject-backlog-dups.ts [--umbral 0.85] [--apply]
import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@libsql/client'
import { dealMatchSimilarity } from '../../src/lib/sync/fuzzy-matcher'

const args = process.argv.slice(2)
const umbralArg = args.indexOf('--umbral')
const UMBRAL = umbralArg >= 0 ? parseFloat(args[umbralArg + 1]) : 0.85
const APPLY = args.includes('--apply')

async function main() {
  const env: Record<string, string> = {}
  for (const l of readFileSync('.env.vercel', 'utf-8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  const turso = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })
  const local = createClient({ url: 'file:data/pescatch.db' })

  const pend = await turso.execute(`SELECT id, title, price, source, url FROM pending_candidates WHERE status='pending' ORDER BY score DESC`)
  const deals = await turso.execute(`SELECT title, brand FROM deals WHERE status='published'`)
  console.log(`Pendientes: ${pend.rows.length} · Deals: ${deals.rows.length} · Umbral: ${UMBRAL} · Modo: ${APPLY ? 'APPLY' : 'DRY-RUN'}`)

  const dupIdsT: number[] = []
  const urls: string[] = []
  const resto: { id: number; t: string; p: number; src: string; url: string }[] = []

  for (const p of pend.rows) {
    let best = 0
    for (const d of deals.rows) {
      const s = dealMatchSimilarity(String(p.title), '', String(d.title), String(d.brand ?? ''))
      if (s > best) best = s
    }
    if (best >= UMBRAL) {
      dupIdsT.push(Number(p.id))
      urls.push(String(p.url))
    } else {
      resto.push({ id: Number(p.id), t: `${String(p.title).slice(0, 70)} [${Number(p.price).toFixed(2)}€]`, p: Number(p.price), src: String(p.source), url: String(p.url) })
    }
  }
  console.log(`Duplicados a rechazar: ${dupIdsT.length} · Restan para revisión: ${resto.length}`)

  if (APPLY && dupIdsT.length > 0) {
    // Turso por id; local espejo por url
    for (let i = 0; i < dupIdsT.length; i++) {
      await turso.execute({ sql: `UPDATE pending_candidates SET status='rejected', updated_at=datetime('now') WHERE id=?`, args: [dupIdsT[i]] })
      if (urls[i]) {
        await local.execute({ sql: `UPDATE pending_candidates SET status='rejected', updated_at=datetime('now') WHERE url=? AND status='pending'`, args: [urls[i]] })
      }
    }
    console.log(`✅ ${dupIdsT.length} duplicados marcados rejected (Turso + espejo local)`)
  } else {
    console.log('Ejecuta con --apply para aplicar.')
  }

  writeFileSync(resolve('scripts/discover/backlog-revision.json'), JSON.stringify(resto, null, 1))
  console.log(`Lista de revisión escrita: scripts/discover/backlog-revision.json (${resto.length})`)
}

main().catch((e) => { console.error(e); process.exit(1) })
