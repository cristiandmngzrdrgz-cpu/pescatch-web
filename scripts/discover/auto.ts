import 'dotenv/config'
import { CATEGORIES } from './keywords'
import { scrapeAmazonDetails, type AmazonCandidate } from './amazon'
import { scrapeAliExpressAll } from './aliexpress-scraper'
import { scrapeDecathlonDeals, braveAvailable } from './decathlon-scraper'
import { searchAmazonAll, scrapeBestsellersStealth, scrapeNewReleasesStealth } from './amazon-scraper'
import { savePendingCandidates } from '../../src/lib/pending-candidates'
import { initSchema, migrateSchema } from '../../src/lib/db'
import { sendAdminNotification, isEmailConfigured, buildAdminNotificationHtml } from '../../src/lib/email'

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

async function discoverAuto() {
  console.log()
  console.log('=== PESCatch.es — Descubrimiento Automático ===')
  console.log()

  await initSchema()
  await migrateSchema()

  const allCandidates: ScoredCandidate[] = []
  const seenAsins = new Set<string>()
  const seenUrls = new Set<string>()

  if (braveAvailable()) {
    console.log('── FASE 1: Amazon keywords (stealth) ──')
    const amazonResults = await searchAmazonAll(CATEGORIES)
    for (const r of amazonResults) {
      if (seenAsins.has(r.asin)) continue
      seenAsins.add(r.asin)
      allCandidates.push({ ...r, score: scoreCandidate(r), source: `Amazon: ${r.keyword || 'keywords'}` })
    }
    console.log(`  ${amazonResults.length} productos encontrados`)

    console.log('\n── FASE 2: Amazon Bestsellers + Novedades ──')
    const bestsellers = await scrapeBestsellersStealth('Pesca General')
    for (const r of bestsellers) {
      if (seenAsins.has(r.asin)) continue
      seenAsins.add(r.asin)
      allCandidates.push({ ...r, score: scoreCandidate(r), source: 'Amazon Bestsellers' })
    }
    console.log(`  ${bestsellers.length} bestsellers`)

    const newReleases = await scrapeNewReleasesStealth('Pesca General')
    for (const r of newReleases) {
      if (seenAsins.has(r.asin)) continue
      seenAsins.add(r.asin)
      allCandidates.push({ ...r, score: scoreCandidate(r), source: 'Amazon Novedades' })
    }
    console.log(`  ${newReleases.length} novedades`)

    console.log('\n── FASE 3: Decathlon directo ──')
    const decathlonProducts = await scrapeDecathlonDeals({ maxPages: 5 })
    for (const p of decathlonProducts) {
      const url = p.url.toLowerCase()
      if (seenUrls.has(url)) continue
      seenUrls.add(url)
      const discount = p.discountPercent || (p.originalPrice && p.salePrice && p.originalPrice > p.salePrice
        ? Math.round(((p.originalPrice - p.salePrice) / p.originalPrice) * 100)
        : 0)
      const score = Math.round((p.rating || 0) * 6) +
        Math.min(25, Math.round(Math.log10((p.reviewsCount || 1)) * 8)) +
        (discount >= 10 ? Math.min(25, Math.round(discount * 1.5)) : 0) +
        (p.brand && POPULAR_BRANDS.some(b => p.brand!.toLowerCase().includes(b)) ? 30 : (p.brand ? 0 : -10))
      allCandidates.push({
        asin: '',
        title: p.title,
        price: p.salePrice || 0,
        originalPrice: p.originalPrice,
        rating: p.rating || 0,
        reviews: p.reviewsCount || 0,
        url: p.url,
        keyword: 'decathlon',
        category: p.category,
        imageUrl: p.imageUrl,
        brand: p.brand,
        ean: null,
        score,
        source: 'Decathlon directo',
      })
    }
    console.log(`  ${decathlonProducts.length} productos Decathlon`)
  } else {
    console.log('  ❌ Brave no disponible. Saltando scrapers de navegador.')
  }

  console.log('\n── FASE 4: AliExpress directo ──')
  try {
    const aliexpressProducts = await scrapeAliExpressAll()
    for (const p of aliexpressProducts) {
      const url = p.url.toLowerCase()
      if (seenUrls.has(url)) continue
      seenUrls.add(url)
      allCandidates.push({
        asin: '',
        title: p.title,
        price: p.price,
        originalPrice: p.originalPrice,
        rating: p.rating,
        reviews: p.reviews,
        url: p.url,
        keyword: 'aliexpress',
        category: p.category,
        imageUrl: null,
        brand: p.brand,
        ean: null,
        score: scoreCandidate({
          asin: '', title: p.title, price: p.price, originalPrice: p.originalPrice,
          rating: p.rating, reviews: p.reviews, url: p.url, keyword: 'aliexpress',
          category: p.category, imageUrl: null, brand: p.brand, ean: null,
        }),
        source: 'AliExpress directo',
      })
    }
    console.log(`  ${aliexpressProducts.length} productos AliExpress`)
  } catch (err) {
    console.log(`  ⚠️ AliExpress falló: ${err instanceof Error ? err.message : err}`)
  }

  if (allCandidates.length === 0) {
    console.log('\n❌ No se encontraron candidatos.')
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

  if (saved > 0 && isEmailConfigured()) {
    const topCandidates = ranked.slice(0, 5)
    const body = topCandidates.map((c: ScoredCandidate) => `
      <div class="deal-card">
        <p class="deal-title">${c.title}</p>
        <p style="color: #FFB800;">${c.price.toFixed(2)}€ ${c.originalPrice ? `<span style="color: #4A6080; text-decoration: line-through;">${c.originalPrice.toFixed(2)}€</span>` : ''}</p>
        <p style="color: #8BA3C7;">${c.source} · Score: ${c.score}</p>
      </div>
    `).join('')

    await sendAdminNotification(
      `${saved} nuevos candidatos`,
      buildAdminNotificationHtml('Nuevos candidatos', `
        <p>Se encontraron ${saved} nuevos productos candidatos:</p>
        ${body}
        <div style="text-align: center; margin-top: 24px;">
          <a href="https://pescatch.es/admin/candidates" class="btn">Revisar candidatos</a>
        </div>
      `),
    )
  }

  console.log('\n📋 Revisa y aprueba candidatos en: /admin/candidates')
  console.log()
}

discoverAuto().catch(err => {
  console.error('\n❌ Error fatal:', err)
  process.exit(1)
})
