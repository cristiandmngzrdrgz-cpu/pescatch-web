// PROPÓSITO: Auto-aprobar candidatos curados (score≥75, Shimano/Daiwa/Okuma, reviews≥30) → Sheet
// FECHA: 2026-09-19 — Parte de spec monetización B+C P0.2 (automatización C)
// Uso: npx tsx scripts/auto-approve-curated.ts [--apply] [--dry-run]
//
// Pre-check anti-dup (2026-10-17): antes de aprobar descarta lo que ya es deal
// (ASIN/PID/URL en la DB local), lo que ya está en el Sheet (sync pendiente) o
// clones (dealMatchSimilarity ≥ 0.85). Los duplicados/clones se marcan rejected;
// los que ya están en el Sheet se marcan approved sin volver a añadirlos.
import 'dotenv/config'
import { getDb, initSchema, migrateSchema } from '../src/lib/db'
import { readAllRows, appendRow, ensureHeaders } from '../src/lib/sync/google-sheets-client'
import { dealMatchSimilarity } from '../src/lib/sync/fuzzy-matcher'

const PREMIUM_BRANDS = ['shimano', 'daiwa', 'okuma', 'penn', 'abu garcia']
const CURATED_MIN_SCORE = 75
const DUP_THRESHOLD = 0.85

function isFakeBrand(brand: string | null | undefined): boolean {
  if (!brand) return true
  const b = brand.trim()
  if (b.length < 2) return true
  if (b.includes('€')) return true
  if (b.includes('kg') && b.includes('€')) return true
  if (b.endsWith(':')) return true
  if (/^\d/.test(b)) return true
  if (b.toLowerCase() === 'recomendado:') return true
  return false
}

interface CandidateRow {
  id: number
  asin: string
  title: string
  price: number
  originalPrice: number | null
  rating: number
  reviews: number
  url: string
  keyword: string
  category: string
  imageUrl: string | null
  brand: string | null
  ean: string | null
  score: number
  source: string
}

function isCurated(c: CandidateRow): boolean {
  if (isFakeBrand(c.brand)) return false
  const b = c.brand!.toLowerCase()
  if (!PREMIUM_BRANDS.some(p => b.includes(p))) return false
  const ratingNorm = c.rating > 5 ? c.rating / 20 : c.rating
  if (ratingNorm < 4.2) return false
  if (c.reviews < 30) return false
  if (c.price < 12 || c.price > 450) return false
  if (c.score < CURATED_MIN_SCORE) return false
  if (c.originalPrice != null) {
    const discount = ((c.originalPrice - c.price) / c.originalPrice) * 100
    if (discount < 8) return false
  }
  return true
}

const AMAZON_ASIN_RE = /\/dp\/(B0[A-Z0-9]{8})/i
const AE_ITEM_RE = /\/item\/(\d+)(?:\.html)?/i

/** Clave estable de producto derivada de una URL (Amazon dp / AliExpress item / URL limpia). */
function productKey(url: string): string {
  const s = String(url || '').trim()
  if (!s) return ''
  const asin = s.match(AMAZON_ASIN_RE)?.[1]
  if (asin) return `amz:${asin.toUpperCase()}`
  const ae = s.match(AE_ITEM_RE)?.[1]
  if (ae) return `ae:${ae}`
  return `url:${s.split('?')[0].replace(/\/+$/, '').toLowerCase()}`
}

interface DealIndex {
  keys: Set<string>
  titles: { title: string; brand: string }[]
}

async function loadDealIndex(): Promise<DealIndex> {
  const db = getDb()
  const res = await db.execute('SELECT title, brand, asin, affiliateUrl, storeUrl FROM deals')
  const keys = new Set<string>()
  const titles: DealIndex['titles'] = []

  for (const row of res.rows) {
    const asin = String(row.asin || '').toUpperCase()
    if (asin) keys.add(`amz:${asin}`)
    for (const u of [row.affiliateUrl, row.storeUrl]) {
      const k = productKey(String(u || ''))
      if (k) keys.add(k)
    }
    titles.push({ title: String(row.title || ''), brand: String(row.brand ?? '') })
  }

  return { keys, titles }
}

type DupReason =
  | { type: 'sheet' }
  | { type: 'duplicate' }
  | { type: 'clone'; similarity: number }

function findDuplicate(c: CandidateRow, index: DealIndex, sheetKeys?: Set<string>): DupReason | null {
  const keys = [productKey(c.url)]
  if (c.asin && c.asin.length === 10) keys.push(`amz:${c.asin.toUpperCase()}`)

  for (const key of keys) {
    if (key && index.keys.has(key)) return { type: 'duplicate' }
  }
  if (sheetKeys) {
    for (const key of keys) {
      if (key && sheetKeys.has(key)) return { type: 'sheet' }
    }
  }

  let best = 0
  for (const d of index.titles) {
    const s = dealMatchSimilarity(c.title, c.brand || '', d.title, d.brand)
    if (s > best) best = s
  }
  if (best >= DUP_THRESHOLD) return { type: 'clone', similarity: best }

  return null
}

function describeReason(reason: DupReason): string {
  switch (reason.type) {
    case 'sheet': return 'ya está en el Sheet (sync pendiente)'
    case 'duplicate': return 'ya es un deal'
    case 'clone': return `clon de un deal (similitud ${(reason.similarity * 100).toFixed(0)}%)`
  }
}

async function main() {
  const apply = process.argv.includes('--apply')
  const dryRun = !apply

  await initSchema()
  await migrateSchema()
  const db = getDb()

  const res = await db.execute("SELECT * FROM pending_candidates WHERE status='pending' ORDER BY score DESC")
  const all = res.rows as unknown as CandidateRow[]
  const curated = all.filter(isCurated)
  const nonCurated = all.filter(c => !isCurated(c))

  console.log(`\n=== Auto-approve curados (score≥${CURATED_MIN_SCORE}, premium, reviews≥30, 12-450€) ===`)
  console.log(`Total pending: ${all.length} | Curados: ${curated.length} | No-curados: ${nonCurated.length}\n`)

  if (curated.length === 0) {
    console.log('No hay curados para auto-aprobar. Revisa manualmente en /admin/candidates.')
    if (nonCurated.length > 0) {
      console.log('\nTop no-curados (quedan pending):')
      for (const c of nonCurated.slice(0, 5)) {
        console.log(`  - ${c.title.slice(0,60)} | ${c.brand} | ${c.reviews} rev ${c.rating}★ | ${c.price}€ | score ${c.score} | ${c.source}`)
      }
    }
    return
  }

  // Pre-check anti-dup contra deals existentes (y contra el Sheet en modo apply)
  const dealIndex = await loadDealIndex()

  let sheetKeys: Set<string> | undefined
  let headers: string[] | undefined

  if (apply) {
    await ensureHeaders(['amazonOriginalPrice', 'aliexpressOriginalPrice', 'technicalSpecs', 'review', 'pros', 'cons'])
    const sheet = await readAllRows()
    headers = sheet.headers

    sheetKeys = new Set<string>()
    const urlColumns = ['amazonUrl', 'aliexpressUrl']
      .map(h => headers!.indexOf(h))
      .filter(i => i >= 0)
    for (const row of sheet.rows) {
      for (const idx of urlColumns) {
        const key = productKey(row[idx] ?? '')
        if (key) sheetKeys.add(key)
      }
    }
  }

  const toApprove: CandidateRow[] = []
  const dupes: { c: CandidateRow; reason: DupReason }[] = []

  for (const c of curated) {
    const reason = findDuplicate(c, dealIndex, sheetKeys)
    if (reason) dupes.push({ c, reason })
    else toApprove.push(c)
  }

  console.log('Curados encontrados:')
  for (const c of toApprove) {
    console.log(`  ✓ ${c.asin || '(AE)'} | ${c.title.slice(0,65)} | ${c.brand} | ${c.reviews} rev ${c.rating}★ | ${c.price}€ | score ${c.score}`)
  }

  if (dupes.length > 0) {
    console.log(`\nDescartados por anti-dup (${dupes.length}):`)
    for (const { c, reason } of dupes) {
      console.log(`  ✗ ${c.title.slice(0,60)} | ${c.price}€ | ${describeReason(reason)}`)
    }
  }

  if (dryRun) {
    console.log(`\n[DRY-RUN] ${toApprove.length} curados NO se han aprobado (${dupes.length} descartados por anti-dup).`)
    console.log('Ejecuta con --apply para escribir en Sheet y marcar approved.')
    console.log(`Quedarán ${nonCurated.length} pending para revisión manual.`)
    return
  }

  // 1) Duplicados ya presentes en el Sheet → approved (sin re-añadir)
  for (const { c, reason } of dupes) {
    if (reason.type === 'sheet') {
      await db.execute({ sql: "UPDATE pending_candidates SET status='approved', updated_at=datetime('now') WHERE id=?", args: [c.id] })
      console.log(`  📄 Ya en Sheet, marcado approved: ${c.title.slice(0,55)}`)
    } else {
      await db.execute({ sql: "UPDATE pending_candidates SET status='rejected', updated_at=datetime('now') WHERE id=?", args: [c.id] })
      console.log(`  ⤵️ Rechazado (${describeReason(reason)}): ${c.title.slice(0,55)}`)
    }
  }

  // 2) Aprobar el resto
  let approved = 0
  for (const c of toApprove) {
    const isAmazon = c.asin && c.asin.length === 10
    const row = headers!.map(h => {
      switch (h) {
        case 'ean': return c.ean || ''
        case 'name': return c.title
        case 'brand': return c.brand || ''
        case 'category': return c.category || ''
        case 'imageUrl': return c.imageUrl || ''
        case 'description': return ''
        case 'amazonPrice': return isAmazon ? c.price : ''
        case 'amazonUrl': return isAmazon ? c.url : ''
        case 'amazonStock': return isAmazon ? 'in_stock' : ''
        case 'amazonOriginalPrice': return isAmazon && c.originalPrice ? c.originalPrice : ''
        case 'aliexpressPrice': return !isAmazon ? c.price : ''
        case 'aliexpressUrl': return !isAmazon ? c.url : ''
        case 'aliexpressStock': return !isAmazon ? 'in_stock' : ''
        case 'aliexpressOriginalPrice': return !isAmazon && c.originalPrice ? c.originalPrice : ''
        default: return ''
      }
    })
    try {
      await appendRow(row)
      await db.execute({ sql: "UPDATE pending_candidates SET status='approved', updated_at=datetime('now') WHERE id=?", args: [c.id] })
      console.log(`  ✅ Aprobado y añadido al Sheet: ${c.title.slice(0,55)} — €${c.price}`)
      approved++
    } catch (err) {
      console.log(`  ❌ Error ${c.asin}: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log(`\n✅ ${approved}/${toApprove.length} curados auto-aprobados → Sheet (${dupes.length} descartados por anti-dup)`)
  console.log(`Quedan ${nonCurated.length} pending para revisión manual en /admin/candidates`)
  console.log('Siguiente: npm run sync -- --no-enrich (local) → npm run sync:prod → publish:prod --apply')
}

main().catch(e => { console.error(e); process.exit(1) })
