import 'dotenv/config'
import { CATEGORIES } from './keywords'
import { readAllRows } from '../../src/lib/sync/google-sheets-client'
import { scrapeAliExpressAll } from './aliexpress-scraper'
import brightdataCache from './brightdata-cache.json'
import { scrapeDecathlonDeals, braveAvailable } from './decathlon-scraper'
import { searchAmazonAll, scrapeBestsellersStealth, scrapeNewReleasesStealth } from './amazon-scraper'
import * as fs from 'fs'
import * as path from 'path'

interface Candidate {
  asin: string
  title: string
  price: number
  rating: number
  reviews: number
  url: string
  store: string
  category: string
  brand: string | null
  originalPrice: number | null
  imageUrl: string | null
  description: string
  features: string[]
  score: number
  source: string
}

const POPULAR_BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'shakespeare', 'okuma', 'rapala', 'savage gear', 'caperlan',
  'ryobi', 'yuki', 'lineaeffe',
]

function scoreCandidate(c: Candidate): number {
  let s = 0
  s += Math.round(c.rating * 6)
  s += Math.min(25, Math.round(Math.log10(c.reviews + 1) * 8))
  if (c.originalPrice && c.originalPrice > c.price) {
    const discount = ((c.originalPrice - c.price) / c.originalPrice) * 100
    s += Math.min(25, Math.round(discount * 1.5))
  }
  if (c.brand) {
    if (POPULAR_BRANDS.some(b => c.brand!.toLowerCase().includes(b))) s += 30
  } else {
    s -= 10
  }
  return s
}

async function getExistingUrls(): Promise<Set<string>> {
  try {
    const { headers, rows } = await readAllRows()
    const indices = ['amazonUrl', 'decathlonUrl', 'aliexpressUrl'].map(h => headers.indexOf(h))
    const urls = new Set<string>()
    for (const row of rows) {
      for (const idx of indices) {
        if (idx !== -1 && row[idx]) urls.add(row[idx].toLowerCase().trim())
      }
    }
    return urls
  } catch { return new Set() }
}

async function main() {
  console.log()
  console.log('=== PESCatch.es — Discover Pipeline (auto) ===')
  console.log()

  const existingUrls = await getExistingUrls()
  console.log(`📋 ${existingUrls.size} productos en el Sheet`)
  console.log()

  const allCandidates: Candidate[] = []
  const seenAsins = new Set<string>()

  // Fase 1: Amazon keywords (stealth browser)
  console.log('── FASE 1/4: Amazon keywords (stealth) ──')
  if (braveAvailable()) {
    console.log('  Lanzando navegador Brave...')
    const amazonResults = await searchAmazonAll(CATEGORIES)
    for (const r of amazonResults) {
      if (seenAsins.has(r.asin)) continue
      seenAsins.add(r.asin)
      if (existingUrls.has(r.url.toLowerCase())) continue
      const c: Candidate = {
        asin: r.asin, title: r.title, price: r.price, rating: r.rating,
        reviews: r.reviews, url: r.url, store: 'amazon', category: r.category,
        brand: r.brand, originalPrice: r.originalPrice, imageUrl: r.imageUrl,
        description: '', features: [], score: 0, source: `Amazon: ${r.keyword || 'keywords'}`,
      }
      c.score = scoreCandidate(c)
      allCandidates.push(c)
    }
    console.log(`       Total: ${amazonResults.length} nuevos`)
  } else {
    console.log('  ❌ Brave no disponible. Saltando.')
  }

  // Fase 2: Amazon bestsellers + new releases (stealth)
  console.log('\n── FASE 2/4: Amazon Bestsellers + Novedades ──')
  if (braveAvailable()) {
    process.stdout.write('  🔥 Más vendidos pesca... ')
    const bs = await scrapeBestsellersStealth('Pesca General')
    let bsCount = 0
    for (const r of bs) {
      if (seenAsins.has(r.asin)) continue
      seenAsins.add(r.asin)
      if (existingUrls.has(r.url.toLowerCase())) continue
      const c: Candidate = {
        asin: r.asin, title: r.title, price: r.price, rating: r.rating,
        reviews: r.reviews, url: r.url, store: 'amazon', category: r.category,
        brand: r.brand, originalPrice: r.originalPrice, imageUrl: r.imageUrl,
        description: '', features: [], score: 0, source: 'Amazon Bestsellers',
      }
      c.score = scoreCandidate(c)
      allCandidates.push(c)
      bsCount++
    }
    console.log(`${bsCount}`)

    process.stdout.write('  🆕 Novedades pesca... ')
    const nr = await scrapeNewReleasesStealth('Pesca General')
    let nrCount = 0
    for (const r of nr) {
      if (seenAsins.has(r.asin)) continue
      seenAsins.add(r.asin)
      if (existingUrls.has(r.url.toLowerCase())) continue
      const c: Candidate = {
        asin: r.asin, title: r.title, price: r.price, rating: r.rating,
        reviews: r.reviews, url: r.url, store: 'amazon', category: r.category,
        brand: r.brand, originalPrice: r.originalPrice, imageUrl: r.imageUrl,
        description: '', features: [], score: 0, source: 'Amazon Novedades',
      }
      c.score = scoreCandidate(c)
      allCandidates.push(c)
      nrCount++
    }
    console.log(`${nrCount}`)
  } else {
    console.log('  ❌ Brave no disponible. Saltando.')
  }

  // Fase 3: AliExpress directo + fallback BrightData
  console.log('\n── FASE 3/4: AliExpress directo ──')
  let aeCount = 0
  let aeFallback = false
  try {
    console.log('  Lanzando scraper AliExpress (Chromium)...')
    console.log('  (buscando con términos de pesca, ~2 min)...')
    const aliexpressProducts = await scrapeAliExpressAll({
      onProgress: (keyword, count) => {
        console.log(`    "${keyword}": +${count}`)
      },
    })
    for (const p of aliexpressProducts) {
      if (existingUrls.has(p.url.toLowerCase())) continue
      const c: Candidate = {
        asin: '', title: p.title, price: p.price,
        rating: p.rating, reviews: p.reviews, url: p.url,
        store: 'aliexpress', category: p.category, brand: p.brand,
        originalPrice: p.originalPrice, imageUrl: null,
        description: '', features: [], score: 0,
        source: 'AliExpress directo',
      }
      c.score = scoreCandidate(c)
      allCandidates.push(c)
      aeCount++
    }
    console.log(`  ${aeCount} productos desde AliExpress directo`)
  } catch (err) {
    console.log(`  ⚠️ AliExpress scraper falló: ${err instanceof Error ? err.message : err}`)
    aeFallback = true
  }

  if (aeFallback || aeCount === 0) {
    if (aeFallback) console.log('  🔄 Fallback: BrightData cache')
    else console.log('  ⚠️ AliExpress no encontró productos. Fallback: BrightData cache')
    let bdCount = 0
    for (const item of brightdataCache as Array<Record<string, string | number | null>>) {
      const url = String(item.url || '').toLowerCase()
      if (existingUrls.has(url)) continue
      const c: Candidate = {
        asin: '', title: String(item.title || ''), price: Number(item.price) || 0,
        rating: Number(item.rating) || 0, reviews: Number(item.reviews) || 0,
        url: String(item.url || ''), store: String(item.store || ''),
        category: String(item.category || ''), brand: String(item.brand || '') || null,
        originalPrice: Number(item.originalPrice || null) || null, imageUrl: null,
        description: '', features: [], score: 0,
        source: `BrightData: ${item.store}`,
      }
      c.score = scoreCandidate(c)
      allCandidates.push(c)
      bdCount++
    }
    console.log(`  ${bdCount} productos desde cache`)
  }

  // Fase 4: Decathlon direct scraper
  console.log('\n── FASE 4/4: Decathlon directo ──')
  if (braveAvailable()) {
    console.log('  Lanzando scraper Decathlon...')
    console.log('  (12 páginas, ~5 min)...')
    const decathlonProducts = await scrapeDecathlonDeals({
      onProgress: (page, added, total) => {
        console.log(`    Página ${page}: +${added} nuevos (total: ${total})`)
      },
    })
    let dcCount = 0
    for (const p of decathlonProducts) {
      if (existingUrls.has(p.url.toLowerCase())) continue
      const c: Candidate = {
        asin: '',
        title: p.title,
        price: p.salePrice || 0,
        rating: p.rating || 0,
        reviews: p.reviewsCount || 0,
        url: p.url,
        store: 'decathlon',
        category: p.category,
        brand: p.brand,
        originalPrice: p.originalPrice,
        imageUrl: p.imageUrl,
        description: '',
        features: [],
        score: 0,
        source: 'Decathlon directo',
      }
      c.score = scoreCandidate(c)
      allCandidates.push(c)
      dcCount++
    }
    console.log(`  ${dcCount} productos desde scraper directo`)
  } else {
    console.log('  ❌ Brave no disponible. Saltando.')
  }

  // Sort + top 30
  const ranked = allCandidates.sort((a, b) => b.score - a.score).slice(0, 30)

  // Write JSON
  const outFile = path.resolve('scripts', 'discover', `candidatos-${Date.now()}.json`)
  fs.writeFileSync(outFile, JSON.stringify({
    generatedAt: new Date().toISOString(),
    total: allCandidates.length,
    ranked,
  }, null, 2))

  console.log(`\n✅ ${ranked.length} candidatos top (de ${allCandidates.length} totales)`)
  console.log(`📁 ${outFile}\n`)
}

main().catch(err => { console.error(err); process.exit(1) })
