import { parseSpanishPrice, isFishingProduct } from '../../src/lib/scraping-utils'
import { RateLimiter } from '../../src/lib/price-scraper/rate-limiter'

const searchLimiter = new RateLimiter(3000)

export interface AmazonCandidate {
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
}

const AMAZON_FISHING_NODE = '2928514031'

function fetchHeaders(): Record<string, string> {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html',
    'Accept-Language': 'es-ES,es;q=0.9',
  }
}

const FETCH_TIMEOUT_MS = 15000

async function fetchWithTimeout(url: string, headers: Record<string, string>): Promise<Response> {
  return fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
}

export async function searchAmazon(
  keyword: string,
  category: string,
): Promise<AmazonCandidate[]> {
  await searchLimiter.wait()

  const url = `https://www.amazon.es/s?k=${encodeURIComponent(keyword)}&s=review-count-rank`

  const res = await fetchWithTimeout(url, fetchHeaders())
  if (!res.ok) return []
  const html = await res.text()

  return extractProducts(html, keyword, category).map(c => ({
    ...c,
    keyword,
    category,
    originalPrice: Math.round(c.price * 1.3 * 100) / 100,
  }))
}

export async function scrapeAmazonBestsellers(category: string, node: string = AMAZON_FISHING_NODE): Promise<AmazonCandidate[]> {
  await searchLimiter.wait()

  const url = `https://www.amazon.es/gp/bestsellers/sports/${node}`
  const res = await fetchWithTimeout(url, fetchHeaders())
  if (!res.ok) return []
  const html = await res.text()

  // originalPrice null: el listado no trae precio tachado fiable. Inventarlo
  // (price*1.3) inflaría el score con un descuento falso en scoreCandidate.
  return extractProducts(html, '__bestsellers__', category).map(c => ({
    ...c,
    originalPrice: null,
  }))
}

export async function scrapeAmazonNewReleases(category: string, node: string = AMAZON_FISHING_NODE): Promise<AmazonCandidate[]> {
  await searchLimiter.wait()

  const url = `https://www.amazon.es/gp/new-releases/sports/${node}`
  const res = await fetchWithTimeout(url, fetchHeaders())
  if (!res.ok) return []
  const html = await res.text()

  return extractProducts(html, '__new_releases__', category).map(c => ({
    ...c,
    originalPrice: null,
  }))
}

function extractProducts(
  html: string,
  keyword: string,
  category: string,
): AmazonCandidate[] {
  const products: AmazonCandidate[] = []
  const seen = new Set<string>()

  const isBestsellers = html.includes('zg-item') || html.includes('p13n')

  if (isBestsellers) {
    return extractBestsellerProducts(html, keyword, category)
  }

  const cardRegex = /<div[^>]+role="listitem"[^>]+data-asin="(B0[A-Z0-9]{8})"[^>]+data-component-type="s-search-result"[^>]*>/g
  let cardMatch

  while ((cardMatch = cardRegex.exec(html)) !== null) {
    const asin = cardMatch[1]
    if (seen.has(asin)) continue
    seen.add(asin)

    const nextCard = html.indexOf('<div role="listitem"', cardMatch.index + 100)
    const cardHtml = nextCard > 0
      ? html.slice(cardMatch.index, nextCard)
      : html.slice(cardMatch.index, cardMatch.index + 15000)

    const title = extractTitle(cardHtml)
    if (!title || !isFishingProduct(title, keyword)) continue

    const price = extractPrice(cardHtml)
    if (price <= 0 || price > 2000) continue

    products.push({
      asin,
      title: cleanTitle(title),
      price: Math.round(price * 100) / 100,
      originalPrice: null,
      rating: extractRating(cardHtml),
      reviews: extractReviews(cardHtml),
      url: `https://www.amazon.es/dp/${asin}`,
      keyword,
      category,
      imageUrl: extractImage(cardHtml),
      brand: null,
      ean: null,
    })

    if (products.length >= 15) break
  }

  return products
}

function extractBestsellerProducts(
  html: string,
  keyword: string,
  category: string,
): AmazonCandidate[] {
  const products: AmazonCandidate[] = []
  const seen = new Set<string>()

  // Cada card va marcada por data-asin; el segmento hasta el siguiente data-asin
  // es exactamente una card (layout actual: _cDEzb_p13n-sc-*).
  const asinMatches = [...html.matchAll(/data-asin="(B0[A-Z0-9]{8})"/g)]

  for (let i = 0; i < asinMatches.length && products.length < 20; i++) {
    const asin = asinMatches[i][1]
    if (seen.has(asin)) continue
    seen.add(asin)

    const start = asinMatches[i].index ?? 0
    const nextStart = i + 1 < asinMatches.length ? (asinMatches[i + 1].index ?? html.length) : html.length
    const end = nextStart - start > 500 ? nextStart : Math.min(html.length, start + 6000)
    const fragment = html.slice(start, end)

    const title = extractBestsellerTitle(fragment)
    if (!title) continue

    const price = extractBestsellerPrice(fragment)
    if (price <= 0 || price > 2000) continue

    products.push({
      asin,
      title: cleanTitle(title),
      price: Math.round(price * 100) / 100,
      originalPrice: null,
      rating: extractRating(fragment),
      reviews: extractReviews(fragment),
      url: `https://www.amazon.es/dp/${asin}`,
      keyword,
      category,
      imageUrl: extractImage(fragment),
      brand: null,
      ean: null,
    })
  }

  return products
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
}

function extractBestsellerTitle(fragment: string): string | null {
  // Layout actual (2026): div con clase p13n-sc-css-line-clamp-*
  const clamp = fragment.match(/class="[^"]*p13n-sc-css-line-clamp[^"]*"[^>]*>([^<]{5,300})</i)
  if (clamp) return decodeEntities(clamp[1])

  // Layout anterior: p13n-sc-truncate
  const truncate = fragment.match(/class="[^"]*p13n-sc-truncate[^"]*"[^>]*>([^<]{5,300})</i)
  if (truncate) return decodeEntities(truncate[1])

  const fallback = extractTitle(fragment)
  return fallback ? decodeEntities(fallback) : null
}

function extractBestsellerPrice(fragment: string): number {
  const patterns = [
    /class="[^"]*p13n-sc-price[^"]*"[^>]*>\s*([\d.,]+)\s*(?:&nbsp;)?€/i,
    /class="[^"]*a-color-price[^"]*"[^>]*>\s*([\d.,]+)\s*(?:&nbsp;)?€/i,
  ]
  for (const pattern of patterns) {
    const m = fragment.match(pattern)
    if (m) {
      const price = parseSpanishPrice(m[1])
      if (price > 0) return price
    }
  }
  return extractPrice(fragment)
}

function cleanTitle(t: string): string {
  return t.replace(/\s+/g, ' ').trim()
}

function extractTitle(html: string): string | null {
  // Method 1: From h2 aria-label (most reliable)
  const h2m = html.match(/<h2[^>]+aria-label="([^"]+)"/i)
  if (h2m) {
    const title = h2m[1].replace(/^Anuncio patrocinado:\s*/i, '').trim()
    if (title.length > 5) return title
  }

  // Method 2: From h2 > span
  const spanM = html.match(/<h2[^>]*>[\s\S]*?<span[^>]*>([^<]{5,})<\/span>/i)
  if (spanM) return spanM[1].trim()

  // Method 3: img alt attribute (for bestseller pages)
  const altM = html.match(/alt="([^"]{10,120})"/)
  if (altM && !altM[1].includes('star') && !altM[1].includes('product')) {
    return altM[1].trim()
  }

  return null
}

function extractPrice(html: string): number {
  const m = html.match(/a-price-whole[^>]*>(\d[\d.]*)</)
  if (m) {
    const price = parseSpanishPrice(m[1])
    if (price > 0) return price
  }
  const m2 = html.match(/a-price[^>]*>[\s\S]*?a-offscreen[^>]*>([\d.,]+)\s*€/)
  if (m2) {
    const price = parseSpanishPrice(m2[1])
    if (price > 0) return price
  }
  return 0
}

function extractRating(html: string): number {
  const m = html.match(/a-icon-alt[^>]*>([\d,]+)\s*de\s*5/i)
  if (m) return parseFloat(m[1].replace(',', '.')) || 0
  return 0
}

function extractReviews(html: string): number {
  // Try multiple patterns for review counts
  const patterns = [
    /class="[^"]*a-size-base[^"]*"[^>]*>(\d[\d.]*)</,
    /(\d[\d.]*)\s*valoraciones?/,
    /(\d[\d.]*)\s*calificaciones/,
    /<span[^>]+class="[^"]*a-size-base[^"]*s-underline-text[^"]*"[^>]*>(\d[\d.]*)</,
    /cel_widget_id="[^"]*">[\s\S]{0,300}?(\d[\d.]*)\s*<\/span>/,
  ]
  for (const pattern of patterns) {
    const m = html.match(pattern)
    if (m) {
      const num = parseInt(m[1].replace(/\./g, ''))
      if (num > 0) return num
    }
  }
  return 0
}

function extractImage(html: string): string | null {
  const m = html.match(/src="(https?:[^"]+\.jpg[^"]*?)"/i)
  return m?.[1] ?? null
}

export interface AmazonDetails {
  ean: string | null
  brand: string | null
  imageUrl: string | null
  images: string[]
  description: string
  features: string[]
  rating: number
  reviewCount: number
}

export async function scrapeAmazonDetails(
  asin: string,
): Promise<AmazonDetails> {
  await searchLimiter.wait()

  const empty: AmazonDetails = { ean: null, brand: null, imageUrl: null, images: [], description: '', features: [], rating: 0, reviewCount: 0 }
  const url = `https://www.amazon.es/dp/${asin}`
  const res = await fetchWithTimeout(url, fetchHeaders())
  if (!res.ok) return empty
  const html = await res.text()

  let ean: string | null = null
  let brand: string | null = null
  let imageUrl: string | null = null
  const images: string[] = []
  let description = ''

  // JSON-LD
  const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1].trim())
      if (data['@type'] === 'Product') {
        ean = data.gtin13 || data.gtin || ean
        brand = data.brand?.name || data.brand || brand
        if (!imageUrl && data.image) imageUrl = Array.isArray(data.image) ? data.image[0] : data.image
        if (!description && data.description) description = data.description
      }
    } catch {}
  }

  if (!brand) {
    const bm = html.match(/"brand"[^:]*:\s*"([^"]+)"/i)
    if (bm) brand = bm[1]
  }

  if (!imageUrl) {
    const imgM = html.match(/id="landingImage"[^>]+src="([^"]+)"/i)
    if (imgM) imageUrl = imgM[1]
  }
  if (!imageUrl) {
    const imgM = html.match(/id="imgTagWrapperId"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/i)
    if (imgM) imageUrl = imgM[1]
  }

  // Alt images
  const altImgRegex = /<img[^>]+src="(https:[^"]+\.jpg[^"]*?)"[^>]*alt="[^"]*"/gi
  let imgMatch
  while ((imgMatch = altImgRegex.exec(html)) !== null) {
    const src = imgMatch[1]
    if (src.includes('data:') || src.includes('spacer')) continue
    if (!images.includes(src)) images.push(src)
  }

  // Feature bullets (specs)
  const features: string[] = []
  const featureRegex = /<li[^>]*class="[^"]*a-carousel-card[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*a-list-item[^"]*"[^>]*>([\s\S]*?)<\/span>/gi
  let featMatch
  while ((featMatch = featureRegex.exec(html)) !== null) {
    const text = featMatch[1].replace(/<[^>]+>/g, '').trim()
    if (text) features.push(text)
  }

  // Fallback: #feature-bullets
  if (features.length === 0) {
    const fbM = html.match(/<ul[^>]*class="[^"]*a-unordered-list[^"]*a-vertical[^"]*a-spacing-mini[^"]*"[^>]*>([\s\S]*?)<\/ul>/i)
    if (fbM) {
      const items = fbM[1].match(/<span[^>]*class="[^"]*a-list-item[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)
      if (items) {
        for (const item of items) {
          const text = item.replace(/<[^>]+>/g, '').trim()
          if (text) features.push(text)
        }
      }
    }
  }

  return { ean, brand, imageUrl, images, description, features, rating: 0, reviewCount: 0 }
}
