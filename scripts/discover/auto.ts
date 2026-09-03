import 'dotenv/config'
import { CATEGORIES } from './keywords'
import { scrapeAmazonDetails, type AmazonCandidate } from './amazon'
import { scrapeAliExpressAll } from './aliexpress-scraper'
import { braveAvailable } from './decathlon-scraper'
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

const PREMIUM_BRANDS = ['shimano', 'daiwa', 'okuma']

function isCuratedStrict(c: AmazonCandidate): boolean {
  const b = c.brand?.toLowerCase() ?? ''
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

function scoreCandidate(c: AmazonCandidate): number {
  let score = 0

  const ratingNorm = c.rating > 5 ? c.rating / 20 : c.rating
  score += Math.round(ratingNorm * 6)

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
  } else {
    console.log('  ❌ Brave no disponible. Saltando scrapers de navegador.')
  }

  console.log('\n── FASE 3: AliExpress directo ──')
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
        imageUrl: p.imageUrl ?? null,
        brand: p.brand,
        ean: null,
        score: scoreCandidate({
          asin: '', title: p.title, price: p.price, originalPrice: p.originalPrice,
          rating: p.rating, reviews: p.reviews, url: p.url, keyword: 'aliexpress',
          category: p.category, imageUrl: p.imageUrl ?? null, brand: p.brand, ean: null,
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

  const curated = allCandidates.filter(isCuratedStrict)
  const pool = curated.length >= 3 ? curated : allCandidates
  if (curated.length >= 3) console.log(`\n✓ Filtro estricto premium: ${curated.length} candidatos (Shimano/Daiwa/Okuma)`)
  else console.log(`\n⚠️ Filtro estricto solo ${curated.length} (<3), usando pool completo (${allCandidates.length})`)

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
          <a href="https://www.pescatch.es/admin/candidates" class="btn">Revisar candidatos</a>
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
