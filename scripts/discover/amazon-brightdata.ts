import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { parseSpanishPrice, isFishingProduct, extractBrand, categorizeProduct } from '../../src/lib/scraping-utils'
import { getDb, initSchema, migrateSchema } from '../../src/lib/db'
import { savePendingCandidates } from '../../src/lib/pending-candidates'
import { readAllRows } from '../../src/lib/sync/google-sheets-client'

interface RawAmazonProduct {
  asin: string
  title: string
  price: number
  originalPrice: number | null
  rating: number
  reviews: number
  url: string
  source: string
}

interface ScoredCandidate extends RawAmazonProduct {
  brand: string | null
  category: string
  ean: null
  score: number
}

const CACHE_DIR = path.resolve(__dirname, 'brightdata-amazon')
const OUT_JSON = path.resolve(__dirname, 'amazon-brightdata-candidates.json')

const POPULAR_BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'shakespeare', 'okuma', 'rapala', 'savage gear', 'caperlan',
  'ryobi', 'yuki', 'lineaeffe', 'grauvell',
]

function scoreCandidate(c: RawAmazonProduct, brand: string | null): number {
  let score = 0
  score += Math.round(c.rating * 6)
  score += Math.min(25, Math.round(Math.log10(c.reviews + 1) * 8))

  if (c.originalPrice && c.originalPrice > c.price) {
    const discount = ((c.originalPrice - c.price) / c.originalPrice) * 100
    score += Math.min(30, Math.round(discount * 1.5))
  }

  if (brand) {
    if (POPULAR_BRANDS.some(b => brand!.toLowerCase().includes(b))) score += 30
  } else {
    score -= 10
  }

  return score
}

function extractAsinFromUrl(url: string): string | null {
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i)
  return m ? m[1].toUpperCase() : null
}

interface MdLink { text: string; asin: string; index: number }

function parseMarkdownProducts(md: string, source: string): RawAmazonProduct[] {
  const products: RawAmazonProduct[] = []
  const seen = new Set<string>()

  // Collect real /dp/ links (skip sponsored /sspa/ and aax-eu-zaz redirects)
  const linkRe = /\[([^\]]{4,})\]\(([^)]*?\/dp\/([A-Z0-9]{10})(?:\/|\))[^)]*)\)/g
  const links: MdLink[] = []
  let m: RegExpExecArray | null
  while ((m = linkRe.exec(md)) !== null) {
    const url = m[2]
    if (url.includes('/sspa/') || url.includes('aax-eu-zaz')) continue
    if (url.includes('customerReviews')) continue
    links.push({ text: m[1].trim(), asin: m[3], index: m.index })
  }
  if (links.length === 0) return products

  // Build blocks: group consecutive links by ASIN (a product has title + price links to the same ASIN)
  interface Block { asin: string; start: number; end: number; title: string }
  const blocks: Block[] = []
  for (const l of links) {
    const last = blocks[blocks.length - 1]
    if (last && last.asin === l.asin) {
      if (l.text.length > last.title.length && !l.text.endsWith('...')) last.title = l.text
      last.end = l.index
    } else {
      blocks.push({ asin: l.asin, start: Math.max(0, l.index - 300), end: l.index, title: l.text })
    }
  }

  for (const block of blocks) {
    if (seen.has(block.asin)) continue
    const window = md.slice(block.start, block.end + 8000)

    const title = block.title.replace(/^Anuncio patrocinado:\s*/i, '').replace(/\s+/g, ' ').trim()
    if (!title || title.length < 8) continue
    if (title.endsWith('...')) continue
    if (!isFishingProduct(title, source)) continue

    const priceM = window.match(/Precio, página del producto\[?\s*([\d.,]+)\s*€/)
    if (!priceM) continue
    const price = parseSpanishPrice(priceM[1])
    if (price <= 0 || price > 2000) continue

    const recM = window.match(/Recomendado:\s*([\d.,]+)\s*€/)
    const originalPrice = recM ? parseSpanishPrice(recM[1]) : null

    const ratingM = window.match(/([\d,]+)\s*\[[\d,]+\s*de 5 estrellas\]/)
    const rating = ratingM ? parseFloat(ratingM[1].replace(',', '.')) || 0 : 0

    const reviewsM = window.match(/\[\(\s*([\d.,]+)\s*(mil)?\s*\)\]/)
    let reviews = 0
    if (reviewsM) {
      const n = parseFloat(reviewsM[1].replace(/\./g, '').replace(',', '.'))
      reviews = reviewsM[2] ? Math.round(n * 1000) : Math.round(n)
    }

    seen.add(block.asin)
    products.push({
      asin: block.asin,
      title,
      price: Math.round(price * 100) / 100,
      originalPrice: originalPrice !== null ? Math.round(originalPrice * 100) / 100 : null,
      rating,
      reviews,
      url: `https://www.amazon.es/dp/${block.asin}`,
      source,
    })
  }

  return products
}

function readCacheFiles(): RawAmazonProduct[] {
  const all: RawAmazonProduct[] = []
  if (!fs.existsSync(CACHE_DIR)) return all

  const jsonFiles = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.json')).sort()
  for (const file of jsonFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8'))
      const source = file.replace(/\.json$/, '').replace(/-/g, ' ')
      const list = Array.isArray(data) ? data : (data.products || [])
      for (const item of list) {
        all.push({
          asin: String(item.asin || ''),
          title: String(item.title || ''),
          price: Number(item.price) || 0,
          originalPrice: item.originalPrice != null ? Number(item.originalPrice) : null,
          rating: Number(item.rating) || 0,
          reviews: Number(item.reviews) || 0,
          url: String(item.url || ''),
          source,
        })
      }
      console.log(`  📦 ${file}: ${list.length} productos (json)`)
    } catch (err) {
      console.log(`  ⚠️ ${file}: ${(err as Error).message}`)
    }
  }

  const mdFiles = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.md')).sort()
  for (const file of mdFiles) {
    const md = fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8')
    const source = file.replace(/\.md$/, '').replace(/-/g, ' ')
    const found = parseMarkdownProducts(md, source)
    all.push(...found)
    console.log(`  📄 ${file}: ${found.length} productos parseados`)
  }
  return all
}

async function loadKnownAsins(): Promise<Set<string>> {
  const known = new Set<string>()
  const db = getDb()

  // Local DB: existing amazon deals
  try {
    const result = await db.execute({
      sql: `SELECT storeUrl, affiliateUrl FROM deals WHERE storeId = 'amazon'`,
    })
    for (const row of result.rows) {
      const asin = extractAsinFromUrl(String(row.storeUrl || '')) || extractAsinFromUrl(String(row.affiliateUrl || ''))
      if (asin) known.add(asin)
    }
  } catch {}

  // Sheet: amazonUrl column
  try {
    const { headers, rows } = await readAllRows()
    const col = headers.findIndex(h => h.toLowerCase().includes('amazonurl'))
    if (col > -1) {
      for (const row of rows) {
        const asin = extractAsinFromUrl(String(row[col] || ''))
        if (asin) known.add(asin)
      }
    }
  } catch (err) {
    console.log(`  ⚠️ No se pudo leer el Sheet: ${(err as Error).message}`)
  }

  return known
}

async function main() {
  await initSchema()
  await migrateSchema()

  console.log('\n=== PESCatch — Discovery Amazon BrightData (solo precio real) ===\n')
  console.log(`Leyendo cache de: ${CACHE_DIR}`)

  const raw = readCacheFiles()
  console.log(`\n  ${raw.length} productos brutos encontrados`)

  if (raw.length === 0) {
    console.log('\n❌ Cache vacío. Pide al asistente: "refresca el cache de BrightData de Amazon"')
    return
  }

  console.log('\n  Dedupe contra DB + Sheet + pending_candidates...')
  const knownAsins = await loadKnownAsins()

  // Only real price deals (user requirement)
  const realPrice = raw.filter(c =>
    c.originalPrice !== null &&
    c.originalPrice > c.price &&
    !knownAsins.has(c.asin)
  )
  console.log(`  ${realPrice.length} con precio real (Recomendado > precio) y nuevos`)

  // Price sanity range
  const priced = realPrice.filter(c => c.price >= 5 && c.price <= 400)
  console.log(`  ${priced.length} dentro de rango 5-400€`)

  if (priced.length === 0) {
    console.log('\n❌ No hay candidatos con precio real. Refresca el cache.')
    return
  }

  const ranked: ScoredCandidate[] = priced.map(c => {
    const brand = extractBrand(c.title)
    return {
      ...c,
      brand,
      category: categorizeProduct(c.title),
      ean: null,
      score: scoreCandidate(c, brand),
    }
  }).sort((a, b) => b.score - a.score).slice(0, 40)

  console.log('\n── TOP CANDIDATOS (con precio real) ──\n')
  ranked.forEach((c, i) => {
    const discount = c.originalPrice ? Math.round(((c.originalPrice - c.price) / c.originalPrice) * 100) : 0
    console.log(
      `${String(i + 1).padStart(2)}. ${c.title.slice(0, 60)}`
    )
    console.log(
      `    💶 ${c.price.toFixed(2)}€ (antes ${c.originalPrice!.toFixed(2)}€, -${discount}%) | ⭐ ${c.rating} (${c.reviews}) | ${c.brand || 'sin marca'} | score ${c.score}`
    )
  })

  // Save to pending_candidates
  const candidates = ranked.map(c => ({
    asin: c.asin,
    title: c.title,
    price: c.price,
    originalPrice: c.originalPrice,
    rating: c.rating,
    reviews: c.reviews,
    url: c.url,
    keyword: 'amazon-brightdata',
    category: c.category,
    imageUrl: null,
    brand: c.brand,
    ean: null,
    score: c.score,
    source: 'Amazon BrightData',
  }))

  const saved = await savePendingCandidates(candidates)
  console.log(`\n✅ ${saved} candidatos nuevos guardados en pending_candidates (${ranked.length - saved} duplicados)`)

  fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), ranked: candidates }, null, 2))
  console.log(`💾 Ranking guardado en ${path.basename(OUT_JSON)}`)

  console.log('\n📋 Revisa y aprueba en /admin/candidates o dime qué índices apruebo.')
  console.log()
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err)
  process.exit(1)
})
