import { parseSpanishPrice } from '../../src/lib/price-scraper/amazon'
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

export async function searchAmazon(
  keyword: string,
  category: string,
): Promise<AmazonCandidate[]> {
  await searchLimiter.wait()

  const url = `https://www.amazon.es/s?k=${encodeURIComponent(keyword)}&s=review-count-rank`

  const res = await fetch(url, { headers: fetchHeaders(), redirect: 'follow' })
  if (!res.ok) return []
  const html = await res.text()

  return extractProducts(html, keyword, category).map(c => ({
    ...c,
    keyword,
    category,
    originalPrice: Math.round(c.price * 1.3 * 100) / 100,
  }))
}

export async function scrapeAmazonBestsellers(category: string): Promise<AmazonCandidate[]> {
  await searchLimiter.wait()

  const url = `https://www.amazon.es/gp/bestsellers/sports/${AMAZON_FISHING_NODE}`
  const res = await fetch(url, { headers: fetchHeaders(), redirect: 'follow' })
  if (!res.ok) return []
  const html = await res.text()

  return extractProducts(html, '__bestsellers__', category).map(c => ({
    ...c,
    originalPrice: Math.round(c.price * 1.3 * 100) / 100,
  }))
}

export async function scrapeAmazonNewReleases(category: string): Promise<AmazonCandidate[]> {
  await searchLimiter.wait()

  const url = `https://www.amazon.es/gp/new-releases/sports/${AMAZON_FISHING_NODE}`
  const res = await fetch(url, { headers: fetchHeaders(), redirect: 'follow' })
  if (!res.ok) return []
  const html = await res.text()

  return extractProducts(html, '__new_releases__', category).map(c => ({
    ...c,
    originalPrice: Math.round(c.price * 1.3 * 100) / 100,
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

const FISHING_WORDS = [
  'pesca', 'fishing', 'carrete', 'caña', 'anzuelo', 'señuelo',
  'sedal', 'hilo pesca', 'spinning', 'spinnrute', 'angelrolle',
  'surfcasting', 'carpfishing', 'baitcast', 'jigging', 'feeder',
  'lubina', 'trucha', 'black bass', 'lucio', 'surf casting',
  'bajo línea', 'bajo de línea', 'fluorocarbono', 'trenza',
  'vinilo', 'cucharilla', 'popper', 'stickbait', 'señuelos',
  'vadeador', 'wading', 'guantes pesca',
  'polarizadas', 'aparejos', 'bolsa pesca', 'mochila pesca',
  'señuelos pesca', 'anzuelos pesca', 'kit pesca',
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'savage gear', 'berkley', 'okuma', 'grauvell',
  'caperlan', 'ryobi', 'lineaeffe', 'yuki', 'ugly stik',
  'sougayilang', 'truscend', 'bassdash', 'hellbender',
  'mora', 'shakespeare', 'rapala', 'kunnan', 'vercelli',
  'caña pescar', 'cañas pescar', 'caña spinning', 'caña surf',
  'carrete spinning', 'carrete surf', 'carrete pesca',
  'giratorio', 'spinnrolle', 'angelrute',
]

const NON_FISHING_WORDS = [
  'perro', 'perros', 'gato', 'gatos', 'mascota', 'pet ',
  'cocina', 'kitchen', 'jardín', 'garden', 'herramienta',
  'tool', 'herramientas', 'tools', 'bricolaje', 'diy',
  'comedero perro', 'comedero gato', 'dog bowl', 'cat bowl',
  'dog food', 'cat food', 'alimentador gato', 'alimentador perro',
  'dispensador comida', 'food dispenser',
  'caja herramientas', 'tool box', 'toolbox',
  'cuchillo cocina', 'kitchen knife', 'chef knife',
  'costura', 'sewing', 'maquillaje', 'makeup',
]

function isFishingProduct(title: string, keyword: string): boolean {
  const lowerTitle = title.toLowerCase()
  const kwLower = keyword.toLowerCase()

  const specificKeywords = [
    'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
    'savage gear', 'berkley', 'okuma', 'caperlan',
    'bassdash', 'sougayilang', 'truscend', 'hellbender',
  ]
  if (specificKeywords.some(b => kwLower.includes(b) || lowerTitle.includes(b))) {
    return true
  }

  // Must have at least one fishing word
  const hasFishingWord = FISHING_WORDS.some(w => lowerTitle.includes(w.toLowerCase()))
  if (!hasFishingWord) return false

  // Must NOT have non-fishing indicators
  if (NON_FISHING_WORDS.some(w => lowerTitle.includes(w))) return false

  return true
}

function extractBestsellerProducts(
  html: string,
  keyword: string,
  category: string,
): AmazonCandidate[] {
  const products: AmazonCandidate[] = []
  const seen = new Set<string>()

  // Bestseller pages use p13n grid with data-asin
  const asinRegex = /data-asin="(B0[A-Z0-9]{8})"/g
  let asinMatch
  while ((asinMatch = asinRegex.exec(html)) !== null) {
    if (products.length >= 20) break
    const asin = asinMatch[1]
    if (seen.has(asin)) continue
    seen.add(asin)

    const startIdx = Math.max(0, asinMatch.index - 800)
    const endIdx = Math.min(html.length, asinMatch.index + 12000)
    const fragment = html.slice(startIdx, endIdx)

    let title = extractTitle(fragment)

    // Fallback: p13n titles
    if (!title) {
      const pTitle = fragment.match(/<div[^>]+class="[^"]*p13n-sc-truncate[^"]*"[^>]*>([^<]+)</i)
      if (pTitle) title = pTitle[1]
    }
    if (!title) {
      const imgM = fragment.match(/<img[^>]+alt="([^"]{10,})"[^>]*>/i)
      if (imgM) title = imgM[1]
    }
    if (!title) continue

    const price = extractPrice(fragment)
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
  const res = await fetch(url, { headers: fetchHeaders(), redirect: 'follow' })
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
