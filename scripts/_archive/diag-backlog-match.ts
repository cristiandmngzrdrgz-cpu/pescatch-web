// PROPÓSITO: analizar el backlog de pending_candidates en Turso cruzándolos con los
//            deals existentes (dealMatchSimilarity) para separar duplicados de nuevos.
// FECHA: 2026-08-23
// USO: npx tsx scripts/discover/diag-backlog-match.ts [--umbral 0.85]
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { createClient } from '@libsql/client'
import { dealMatchSimilarity } from '../../src/lib/sync/fuzzy-matcher'

const args = process.argv.slice(2)
const umbralArg = args.indexOf('--umbral')
const UMBRAL = umbralArg >= 0 ? parseFloat(args[umbralArg + 1]) : 0.85
const UMBAJO = 0.6

async function main() {
  const env: Record<string, string> = {}
  for (const l of readFileSync('.env.vercel', 'utf-8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  const t = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })

  const pend = await t.execute(`SELECT id, title, price, source, created_at FROM pending_candidates WHERE status='pending' ORDER BY source, score DESC`)
  const deals = await t.execute(`SELECT title, brand FROM deals WHERE status='published'`)

  console.log(`Pendientes: ${pend.rows.length} · Deals publicados: ${deals.rows.length} · Umbral DUP: ${UMBRAL}`)

  const dup: { title: string; price: unknown; src: string; best: number; match: string }[] = []
  const maybe: typeof dup = []
  const fresh: typeof dup = []

  for (const p of pend.rows) {
    let best = 0, bestTitle = ''
    for (const d of deals.rows) {
      const s = dealMatchSimilarity(String(p.title), '', String(d.title), String(d.brand ?? ''))
      if (s > best) { best = s; bestTitle = String(d.title) }
    }
    const entry = {
      title: `${String(p.title).slice(0, 60)} [${Number(p.price).toFixed(2)}€]`,
      price: p.price,
      src: String(p.source),
      best,
      match: bestTitle.slice(0, 50),
    }
    if (best >= UMBRAL) dup.push(entry)
    else if (best >= UMBAJO) maybe.push(entry)
    else fresh.push(entry)
  }

  console.log(`\n=== RESULTADO ===`)
  console.log(`Duplicados (>=${UMBRAL}): ${dup.length}`)
  console.log(`Dudosos (${UMBAJO}-${UMBRAL}): ${maybe.length}`)
  console.log(`Nuevos (<${UMBAJO}): ${fresh.length}`)

  const show = (label: string, list: typeof dup, withMatch: boolean) => {
    console.log(`\n--- ${label} ---`)
    for (const e of list.sort((a, b) => b.best - a.best)) {
      console.log(`  ${(e.best * 100).toFixed(0)}% | ${e.src.replace(' directo', '').padEnd(10)} | ${e.title}${withMatch && e.match ? ` ⇐ YA HAY: ${e.match}` : ''}`)
    }
  }
  show('DUPLICADOS (rechazables)', dup, true)
  show('DUDOSOS', maybe, true)
  show('NUEVOS (candidatos reales)', fresh, false)

  // guardar para acciones posteriores
  const { writeFileSync } = await import('node:fs')
  writeFileSync('scripts/discover/backlog-clasificado.json', JSON.stringify({
    generado: new Date().toISOString(),
    umbral: UMBRAL,
    dupIds: [], maybeIds: [], freshIds: [],
    nota: 'IDs no incluidos; regenerar si hace falta',
    resumen: { dup: dup.length, maybe: maybe.length, fresh: fresh.length },
  }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
