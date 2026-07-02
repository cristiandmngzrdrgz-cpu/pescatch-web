import 'dotenv/config'
import { CATEGORIES } from './keywords'
import { searchAmazon, scrapeAmazonBestsellers, scrapeAmazonNewReleases } from './amazon'
import { readAllRows } from '../../src/lib/sync/google-sheets-client'
import brightdataCache from './brightdata-cache.json'
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
    if (POPULAR_BRANDS.some(b => c.brand!.toLowerCase().includes(b))) s += 20
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
  let total = 0

  // Fase 1: Amazon keywords
  console.log('── FASE 1/3: Amazon keywords ──')
  for (const [category, kwList] of Object.entries(CATEGORIES)) {
    for (const kw of kwList) {
      process.stdout.write(`  🔍 "${kw}"... `)
      const results = await searchAmazon(kw, category)
      let newCount = 0
      for (const r of results) {
        if (seenAsins.has(r.asin)) continue
        seenAsins.add(r.asin)
        if (existingUrls.has(r.url.toLowerCase())) continue
        const c: Candidate = {
          asin: r.asin, title: r.title, price: r.price, rating: r.rating,
          reviews: r.reviews, url: r.url, store: 'amazon', category: r.category,
          brand: r.brand, originalPrice: r.originalPrice, imageUrl: r.imageUrl,
          description: '', features: [], score: 0, source: `Amazon: ${kw}`,
        }
        c.score = scoreCandidate(c)
        allCandidates.push(c)
        newCount++
      }
      console.log(`${newCount}`)
      total += newCount
    }
  }
  console.log(`       Total: ${total} nuevos`)

  // Fase 2: Amazon bestsellers
  console.log('\n── FASE 2/3: Amazon Bestsellers ──')
  let bsCount = 0
  process.stdout.write('  🔥 Más vendidos pesca... ')
  const bs = await scrapeAmazonBestsellers('Pesca General')
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
  let nrCount = 0
  const nr = await scrapeAmazonNewReleases('Pesca General')
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

  // Fase 3: BrightData cache
  console.log('\n── FASE 3/3: BrightData cache ──')
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
