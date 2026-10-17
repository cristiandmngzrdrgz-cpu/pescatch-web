import 'dotenv/config'
import { AMAZON_BRAND_KEYWORDS, BESTSELLER_NODES, CATEGORIES, flattenKeywords, groupKeywords, pickBatch, type KeywordEntry } from './keywords'
import { scrapeAmazonBestsellers, scrapeAmazonNewReleases, type AmazonCandidate } from './amazon'
import { braveAvailable } from './decathlon-scraper'
import { searchAmazonAll } from './amazon-scraper'
import { savePendingCandidates } from '../../src/lib/pending-candidates'
import { initSchema, migrateSchema } from '../../src/lib/db'
import { getCronState, setCronState } from '../../src/lib/cron-state'

// PROPÓSITO: descubrir SOLO candidatos de Amazon (keywords + bestsellers + novedades).
// No ejecuta AliExpress ni Decathlon. Guarda en pending_candidates (local).
// FECHA: 2026-08-10
//
// Rotación: cada ejecución escanea un lote y avanza el cursor (cron_state).
// El ciclo completo del catálogo se cubre en varios días. `--all` escanea todo.
const KEYWORD_BATCH_SIZE = 25
const NODE_BATCH_SIZE = 3
const KEYWORD_CURSOR_KEY = 'discover_keyword_cursor'
const NODE_CURSOR_KEY = 'discover_node_cursor'

interface ScoredCandidate extends AmazonCandidate {
  score: number
  source: string
}

const POPULAR_BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'shakespeare', 'okuma', 'rapala', 'savage gear', 'caperlan',
  'ryobi', 'yuki', 'lineaeffe',
]

const PREMIUM_BRANDS = ['shimano', 'daiwa', 'okuma']

function isFakeBrand(brand: string | null | undefined): boolean {
  if (!brand) return true
  const b = brand.trim()
  if (b.length < 2) return true
  if (b.includes('€')) return true
  if (b.endsWith(':')) return true
  if (/^\d/.test(b)) return true
  if (b.toLowerCase() === 'recomendado:') return true
  return false
}

function isCuratedStrict(c: AmazonCandidate): boolean {
  if (isFakeBrand(c.brand)) return false
  const b = c.brand!.toLowerCase()
  const hasPremium = PREMIUM_BRANDS.some(p => b.includes(p))
  if (!hasPremium) return false
  const ratingNorm = c.rating > 5 ? c.rating / 20 : c.rating
  if (ratingNorm < 4.2) return false
  if (c.reviews < 30) return false
  if (c.price < 12 || c.price > 450) return false
  if (c.originalPrice != null) {
    const discount = ((c.originalPrice - c.price) / c.originalPrice) * 100
    if (discount < 8) return false
  }
  return true
}

function isValidForSave(c: ScoredCandidate): boolean {
  if (isFakeBrand(c.brand)) return false
  if (c.reviews < 10) return false
  if (c.score < 50) return false
  if (c.price < 5 || c.price > 600) return false
  return true
}

function scoreCandidate(c: AmazonCandidate): number {
  let score = 0
  const ratingNorm = c.rating > 5 ? c.rating / 20 : c.rating
  if (c.reviews === 0) {
    // sin reviews el rating es ruido
  } else if (c.reviews < 10) {
    score += Math.round(ratingNorm * 3)
  } else {
    score += Math.round(ratingNorm * 6)
  }
  const reviewScore = Math.min(25, Math.round(Math.log10(c.reviews + 1) * 8))
  score += reviewScore
  if (c.originalPrice && c.originalPrice > c.price) {
    const discount = ((c.originalPrice - c.price) / c.originalPrice) * 100
    if (discount > 80) score += 10
    else score += Math.min(25, Math.round(discount * 1.5))
  }
  if (isFakeBrand(c.brand)) {
    score -= 20
  } else if (c.brand) {
    const isPopular = POPULAR_BRANDS.some(b => c.brand!.toLowerCase().includes(b))
    if (isPopular) score += 30
  } else {
    score -= 10
  }
  return score
}

async function discoverAmazonOnly() {
  console.log()
  console.log('=== PESCatch.es — Discover Amazon Only ===')
  console.log()

  await initSchema()
  await migrateSchema()

  if (!braveAvailable()) {
    console.log('❌ Brave no disponible. No se puede ejecutar el scraper de Amazon.')
    return
  }

  const allCandidates: ScoredCandidate[] = []
  const seenAsins = new Set<string>()
  const scanAll = process.argv.includes('--all')
  const batchArg = process.argv.find(a => a.startsWith('--batch='))
  const keywordBatchSize = batchArg ? Math.max(1, parseInt(batchArg.split('=')[1], 10) || KEYWORD_BATCH_SIZE) : KEYWORD_BATCH_SIZE

  console.log('── FASE 1/2: Amazon keywords (stealth) ──')
  const keywordPool: KeywordEntry[] = [...flattenKeywords(CATEGORIES), ...AMAZON_BRAND_KEYWORDS]
  let keywordBatch = keywordPool
  let nextKeywordCursor: number | null = null

  if (scanAll) {
    console.log(`   Catálogo completo (${keywordPool.length} keywords)`)
  } else {
    const cursor = parseInt(await getCronState(KEYWORD_CURSOR_KEY), 10) || 0
    const picked = pickBatch(keywordPool, cursor, keywordBatchSize)
    keywordBatch = picked.batch
    nextKeywordCursor = picked.nextCursor
    console.log(`   Lote ${keywordBatch.length}/${keywordPool.length} · cursor ${cursor} → ${nextKeywordCursor} · ciclo completo en ~${Math.ceil(keywordPool.length / keywordBatchSize)} días (--all para todo)`)
  }

  const amazonResults = await searchAmazonAll(groupKeywords(keywordBatch))
  for (const r of amazonResults) {
    if (seenAsins.has(r.asin)) continue
    seenAsins.add(r.asin)
    allCandidates.push({ ...r, score: scoreCandidate(r), source: `Amazon: ${r.keyword || 'keywords'}` })
  }
  console.log(`  ${amazonResults.length} productos encontrados`)

  if (nextKeywordCursor !== null) await setCronState(KEYWORD_CURSOR_KEY, String(nextKeywordCursor))

  console.log('\n── FASE 2/2: Amazon Bestsellers + Novedades (fetch directo) ──')
  let nodes = BESTSELLER_NODES
  let nextNodeCursor: number | null = null

  if (!scanAll) {
    const cursor = parseInt(await getCronState(NODE_CURSOR_KEY), 10) || 0
    const picked = pickBatch(BESTSELLER_NODES, cursor, NODE_BATCH_SIZE)
    nodes = picked.batch
    nextNodeCursor = picked.nextCursor
    console.log(`   Nodos: ${nodes.map(n => n.label).join(', ')} (cursor ${cursor} → ${nextNodeCursor})`)
  }

  for (const { label, node } of nodes) {
    try {
      const bestsellers = await scrapeAmazonBestsellers(label, node)
      let added = 0
      for (const r of bestsellers) {
        if (seenAsins.has(r.asin)) continue
        seenAsins.add(r.asin)
        allCandidates.push({ ...r, score: scoreCandidate(r), source: `Amazon Bestsellers: ${label}` })
        added++
      }
      console.log(`   ${label}: ${bestsellers.length} bestsellers (${added} nuevos)`)
    } catch (err) {
      console.log(`   ⚠️ Bestsellers ${label} falló: ${err instanceof Error ? err.message : err}`)
    }

    try {
      const newReleases = await scrapeAmazonNewReleases(label, node)
      let added = 0
      for (const r of newReleases) {
        if (seenAsins.has(r.asin)) continue
        seenAsins.add(r.asin)
        allCandidates.push({ ...r, score: scoreCandidate(r), source: `Amazon Novedades: ${label}` })
        added++
      }
      console.log(`   ${label}: ${newReleases.length} novedades (${added} nuevos)`)
    } catch (err) {
      console.log(`   ⚠️ Novedades ${label} falló: ${err instanceof Error ? err.message : err}`)
    }
  }

  if (nextNodeCursor !== null) await setCronState(NODE_CURSOR_KEY, String(nextNodeCursor))

  if (allCandidates.length === 0) {
    console.log('\n❌ No se encontraron candidatos Amazon.')
    return
  }

  const curated = allCandidates.filter(isCuratedStrict)
  const valid = allCandidates.filter(isValidForSave)
  let pool: ScoredCandidate[]
  if (curated.length >= 3) {
    pool = curated
    console.log(`\n✓ Filtro estricto premium: ${curated.length} candidatos (Shimano/Daiwa/Okuma)`)
  } else if (valid.length >= 5) {
    pool = valid
    console.log(`\n✓ Filtro válido: ${valid.length} candidatos (score>=50, reviews>=10, brand ok) — curated solo ${curated.length}`)
  } else if (valid.length > 0) {
    pool = valid
    console.log(`\n⚠️ Solo ${valid.length} candidatos válidos (<5), guardando solo válidos (evita junk)`)
  } else {
    console.log(`\n❌ 0 candidatos válidos (score>=50, reviews>=10, brand ok). No se guarda junk. Total escaneado: ${allCandidates.length}`)
    console.log(`   Curated premium: ${curated.length} | Válidos: ${valid.length}`)
    return
  }

  const ranked = pool.sort((a, b) => b.score - a.score).slice(0, 50)

  console.log(`\n📦 Guardando ${ranked.length} candidatos en pending_candidates...`)

  const saved = await savePendingCandidates(
    ranked.map(c => ({
      asin: c.asin,
      title: c.title,
      price: c.price,
      originalPrice: c.originalPrice,
      rating: c.rating,
      reviews: c.reviews,
      url: c.url,
      keyword: c.keyword,
      category: c.category,
      imageUrl: c.imageUrl,
      brand: c.brand,
      ean: c.ean,
      score: c.score,
      source: c.source,
    }))
  )

  console.log(`✅ ${saved} nuevos candidatos guardados (${ranked.length - saved} descartados: ya vistos, duplicados o ya publicados)`)

  console.log('\n📋 Siguiente paso: npm run push-candidates:prod -- --apply')
  console.log('   Luego revisa y aprueba en: /admin/candidates')
  console.log()
}

discoverAmazonOnly().catch(err => {
  console.error('\n❌ Error fatal:', err)
  process.exit(1)
})