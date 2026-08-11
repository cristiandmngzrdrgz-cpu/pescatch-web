import 'dotenv/config'
import { CATEGORIES } from './keywords'
import { type AmazonCandidate } from './amazon'
import { braveAvailable } from './decathlon-scraper'
import { searchAmazonAll, scrapeBestsellersStealth, scrapeNewReleasesStealth } from './amazon-scraper'
import { savePendingCandidates } from '../../src/lib/pending-candidates'
import { initSchema, migrateSchema } from '../../src/lib/db'

// PROPÓSITO: descubrir SOLO candidatos de Amazon (keywords + bestsellers + novedades).
// No ejecuta AliExpress ni Decathlon. Guarda en pending_candidates (local).
// FECHA: 2026-08-10

interface ScoredCandidate extends AmazonCandidate {
  score: number
  source: string
}

const POPULAR_BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'shakespeare', 'okuma', 'rapala', 'savage gear', 'caperlan',
  'ryobi', 'yuki', 'lineaeffe',
]

function scoreCandidate(c: AmazonCandidate): number {
  let score = 0
  score += Math.round(c.rating * 6)
  const reviewScore = Math.min(25, Math.round(Math.log10(c.reviews + 1) * 8))
  score += reviewScore
  if (c.originalPrice && c.originalPrice > c.price) {
    const discount = ((c.originalPrice - c.price) / c.originalPrice) * 100
    score += Math.min(25, Math.round(discount * 1.5))
  }
  if (c.brand) {
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

  console.log('── FASE 1/3: Amazon keywords (stealth) ──')
  const amazonResults = await searchAmazonAll(CATEGORIES)
  for (const r of amazonResults) {
    if (seenAsins.has(r.asin)) continue
    seenAsins.add(r.asin)
    allCandidates.push({ ...r, score: scoreCandidate(r), source: `Amazon: ${r.keyword || 'keywords'}` })
  }
  console.log(`  ${amazonResults.length} productos encontrados`)

  console.log('\n── FASE 2/3: Amazon Bestsellers ──')
  const bestsellers = await scrapeBestsellersStealth('Pesca General')
  for (const r of bestsellers) {
    if (seenAsins.has(r.asin)) continue
    seenAsins.add(r.asin)
    allCandidates.push({ ...r, score: scoreCandidate(r), source: 'Amazon Bestsellers' })
  }
  console.log(`  ${bestsellers.length} bestsellers`)

  console.log('\n── FASE 3/3: Amazon Novedades ──')
  const newReleases = await scrapeNewReleasesStealth('Pesca General')
  for (const r of newReleases) {
    if (seenAsins.has(r.asin)) continue
    seenAsins.add(r.asin)
    allCandidates.push({ ...r, score: scoreCandidate(r), source: 'Amazon Novedades' })
  }
  console.log(`  ${newReleases.length} novedades`)

  if (allCandidates.length === 0) {
    console.log('\n❌ No se encontraron candidatos Amazon.')
    return
  }

  const ranked = allCandidates.sort((a, b) => b.score - a.score).slice(0, 50)

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

  console.log(`✅ ${saved} nuevos candidatos guardados (${ranked.length - saved} duplicados)`)

  console.log('\n📋 Siguiente paso: npm run push-candidates:prod -- --apply')
  console.log('   Luego revisa y aprueba en: /admin/candidates')
  console.log()
}

discoverAmazonOnly().catch(err => {
  console.error('\n❌ Error fatal:', err)
  process.exit(1)
})