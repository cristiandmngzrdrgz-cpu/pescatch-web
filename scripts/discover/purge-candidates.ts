// PROPÓSITO: limpiar el backlog de pending_candidates: rechaza knockoffs de AliExpress,
//            duplicados internos, accesorios sueltos, off-topic (jardín) y clones de
//            deals ya publicados. Deja una lista corta para revisión manual.
// FECHA: 2026-11-07 (generalizado desde el purge one-shot del 6-nov)
// USO: npx tsx scripts/discover/purge-candidates.ts [--apply] [--umbral 0.85]
import 'dotenv/config'
import { config } from 'dotenv'
import { createClient, type Client } from '@libsql/client'
import { dealMatchSimilarity } from '../../src/lib/sync/fuzzy-matcher'
import { isOffTopic } from '../../src/lib/scraping-utils'

const APPLY = process.argv.includes('--apply')
const AE_SOURCE = 'AliExpress directo'
const umbralArg = process.argv.indexOf('--umbral')
const UMBRAL_DUP = umbralArg >= 0 ? parseFloat(process.argv[umbralArg + 1]) : 0.85
const AE_FINALISTS = 8

interface Row {
  id: number
  title: string
  price: number
  rating: number
  reviews: number
  brand: string | null
  score: number
  source: string
  url: string
}

interface Decision {
  row: Row
  reason: string | null // null = se queda
  bestDeal?: { score: number; title: string }
}

const norm = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

const PREMIUM = ['shimano', 'daiwa', 'abu garcia', 'penn', 'mitchell', 'okuma']
const AE_ACCESSORY_RE = /(rodillo|gu[ií]a|roller).{0,20}(l[ií]nea|line)|line roller/i
const AE_KNOCKOFF_MODEL_RE = /hagane|stella|vanford|twin power|exist|saltiga/i

// Lista curada a mano tras revisar el backlog del 6-nov: clones/variantes de deals
// ya publicados, fichas sin modelo, kits juveniles y accesorios sueltos.
// Se empareja por URL porque los IDs de local y Turso no coinciden.
const MANUAL_REJECT: Record<string, string> = {
  'https://www.amazon.es/dp/B09DGQL2R5': 'clon de Mitchell MX1 publicado',
  'https://www.amazon.es/dp/B081GCN2Q9': 'clon de Daiwa Ninja X Spin publicado',
  'https://www.amazon.es/dp/B07CXKCTCW': 'clon de Shimano Sienna publicado',
  'https://www.amazon.es/dp/B07KWBWFV7': 'variante de Daiwa Ninja LT publicada',
  'https://www.amazon.es/dp/B07JMQMJW8': 'variante de Daiwa Ninja LT publicada',
  'https://www.amazon.es/dp/B00P0W00G2': 'clon de Abu Cardinal publicado',
  'https://www.amazon.es/dp/B0789NMPRN': 'clon de Mitchell Avocet publicado',
  'https://www.amazon.es/dp/B08SNJQCH7': 'clon de Mitchell MX1 publicado',
  'https://www.amazon.es/dp/B08K3J12Q5': 'clon de Shimano Vengeance publicado',
  'https://www.amazon.es/dp/B0DVZGRHKQ': 'ficha sin modelo (Abu Garcia)',
  'https://www.amazon.es/dp/B001RDKVW6': 'ficha sin modelo (Penn)',
  'https://www.amazon.es/dp/B095J391W8': 'ficha sin modelo (Savage Gear)',
  'https://www.amazon.es/dp/B0BRT9Y36Q': 'kit juvenil, no chollo',
  'https://www.amazon.es/dp/B07KWYJRG8': 'accesorio suelto (tijeras)',
  // Familias ya publicadas: 3 Mitchell MX1 y 2 Abu Cardinal activos; una variante
  // más no aporta chollo nuevo.
  'https://www.amazon.es/dp/B09DGQYYDJ': 'variante de familia Mitchell MX1 ya publicada',
  'https://www.amazon.es/dp/B08SNN6NCW': 'variante de familia Mitchell MX1 ya publicada',
  'https://www.amazon.es/dp/B00P0WX73U': 'variante de familia Abu Cardinal ya publicada',
}

function isKnockoff(r: Row): boolean {
  if (r.source !== AE_SOURCE) return false
  const brand = (r.brand || '').toLowerCase()
  const premium = PREMIUM.some(b => brand.includes(b))
  if (!premium) return false
  // Un carrete Shimano/Daiwa "de verdad" no se vende nuevo a 20-30 € en AliExpress.
  if (r.price < 45) return true
  return AE_KNOCKOFF_MODEL_RE.test(r.title)
}

function classify(rows: Row[], dealTitles: { title: string; brand: string }[]): Decision[] {
  const decisions: Decision[] = []

  // 1. Basura objetiva + lista curada manual
  for (const r of rows) {
    let reason: string | null = null
    if (MANUAL_REJECT[r.url]) reason = `manual: ${MANUAL_REJECT[r.url]}`
    else if (isOffTopic(r.title)) reason = 'off-topic'
    else if (r.price < 5 || r.price > 600) reason = 'precio fuera de rango'
    else if (r.reviews < 10) reason = 'sin reviews'
    else if (isKnockoff(r)) reason = 'knockoff de marca'
    else if (r.source === AE_SOURCE && AE_ACCESSORY_RE.test(r.title)) reason = 'accesorio suelto'
    else if (r.source !== AE_SOURCE && r.score < 50) reason = 'score bajo'
    decisions.push({ row: r, reason })
  }

  // 2. Duplicados internos: se queda el de más reviews (y a igualdad, más barato)
  const alive = decisions.filter(d => d.reason === null).map(d => d.row)
  const groups: Row[][] = []
  for (const r of alive) {
    const group = groups.find(g => dealMatchSimilarity(r.title, r.brand || '', g[0].title, g[0].brand || '') >= UMBRAL_DUP)
    if (group) group.push(r)
    else groups.push([r])
  }
  for (const g of groups) {
    if (g.length < 2) continue
    const sorted = [...g].sort((a, b) => b.reviews - a.reviews || a.price - b.price)
    for (const r of sorted.slice(1)) {
      const d = decisions.find(x => x.row === r)!
      d.reason = `duplicado interno de #${sorted[0].id}`
    }
  }

  // 3. Clones de deals ya publicados (solo Amazon: los AE no se pueden comparar por precio)
  for (const d of decisions) {
    if (d.reason !== null || d.row.source === AE_SOURCE) continue
    let best = 0
    let bestTitle = ''
    for (const deal of dealTitles) {
      const s = dealMatchSimilarity(d.row.title, d.row.brand || '', deal.title, deal.brand || '')
      if (s > best) { best = s; bestTitle = deal.title }
    }
    d.bestDeal = { score: best, title: bestTitle }
    if (best >= UMBRAL_DUP) d.reason = `duplicado de deal (${best.toFixed(2)})`
  }

  // 4. AliExpress: dejar solo los finalistas con mejor score para verificar a mano
  const aeAlive = decisions.filter(d => d.reason === null && d.row.source === AE_SOURCE)
    .sort((a, b) => b.row.score - a.row.score)
  for (const d of aeAlive.slice(AE_FINALISTS)) d.reason = 'AE fuera del top de finalistas'

  return decisions
}

async function loadRows(db: Client, onlyPending: boolean): Promise<Row[]> {
  const res = await db.execute(
    `SELECT id, title, price, rating, reviews, brand, score, source, url
     FROM pending_candidates ${onlyPending ? "WHERE status='pending'" : ''}`,
  )
  return res.rows.map((r: any) => ({
    id: Number(r.id),
    title: String(r.title),
    price: Number(r.price),
    rating: Number(r.rating),
    reviews: Number(r.reviews),
    brand: r.brand == null ? null : String(r.brand),
    score: Number(r.score),
    source: String(r.source),
    url: String(r.url),
  }))
}

async function applyRejections(db: Client, ids: number[], urls: string[]) {
  for (let i = 0; i < ids.length; i++) {
    await db.execute({
      sql: `UPDATE pending_candidates SET status='rejected', updated_at=datetime('now')
            WHERE (id = ? OR url = ?) AND status='pending'`,
      args: [ids[i], urls[i]],
    })
  }
}

function summarize(label: string, decisions: Decision[]) {
  const rejected = decisions.filter(d => d.reason !== null)
  const kept = decisions.filter(d => d.reason === null)
  const byReason = new Map<string, number>()
  for (const d of rejected) byReason.set(d.reason!, (byReason.get(d.reason!) || 0) + 1)

  console.log(`\n=== ${label} ===`)
  console.log(`Pendientes: ${decisions.length} · Rechazar: ${rejected.length} · Revisar: ${kept.length}`)
  for (const [reason, n] of [...byReason.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${reason}: ${n}`)
  }
  const dealDups = rejected.filter(d => d.reason?.startsWith('duplicado de deal') && d.bestDeal)
  if (dealDups.length > 0) {
    console.log('\n  Duplicados de deal detectados:')
    for (const d of dealDups) {
      console.log(`   #${d.row.id} ${d.row.price.toFixed(2)} EUR | ${d.row.title.slice(0, 58)}`)
      console.log(`        ≈ ${d.bestDeal!.score.toFixed(2)} · ${d.bestDeal!.title.slice(0, 68)}`)
    }
  }
  console.log('\n  Candidatos que quedan para revisar:')
  for (const d of kept.sort((a, b) => b.row.score - a.row.score)) {
    const r = d.row
    const src = r.source === AE_SOURCE ? 'AE ' : 'AMZ'
    const sim = d.bestDeal ? ` sim ${d.bestDeal.score.toFixed(2)}` : ''
    console.log(`   #${String(r.id).padEnd(5)} ${src} ${r.price.toFixed(2).padStart(7)} EUR ${String(r.reviews).padStart(4)} rev ${String(r.score).padStart(3)} pts${sim} | ${r.title.slice(0, 68)}`)
  }
  return { rejected, kept }
}

async function main() {
  const prodEnv = config({ path: '.env.vercel' }).parsed || {}
  for (const [k, v] of Object.entries(prodEnv)) {
    if (v && process.env[k] === undefined) process.env[k] = v
  }
  if (!process.env.TURSO_DATABASE_URL) {
    console.error('TURSO_DATABASE_URL no definido')
    process.exit(1)
  }

  const local = createClient({ url: 'file:data/pescatch.db' })
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  const dealsRes = await local.execute(`SELECT title, brand FROM deals WHERE status='published'`)
  const dealTitles = dealsRes.rows.map((d: any) => ({ title: String(d.title), brand: String(d.brand || '') }))

  const localDecisions = classify(await loadRows(local, true), dealTitles)
  const localSum = summarize('LOCAL', localDecisions)

  const tursoDecisions = classify(await loadRows(turso, true), dealTitles)
  const tursoSum = summarize('TURSO', tursoDecisions)

  if (!APPLY) {
    console.log('\n(DRY-RUN: usa --apply para rechazar en local y Turso)')
    return
  }

  await applyRejections(local, localSum.rejected.map(d => d.row.id), localSum.rejected.map(d => d.row.url))
  await applyRejections(turso, tursoSum.rejected.map(d => d.row.id), tursoSum.rejected.map(d => d.row.url))
  console.log(`\n✅ Rechazados: ${localSum.rejected.length} local · ${tursoSum.rejected.length} Turso`)
}

main().catch(e => { console.error(e); process.exit(1) })
