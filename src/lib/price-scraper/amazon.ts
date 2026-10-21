import type { ScrapedPrice } from './types'
import { getNextUserAgent } from './user-agents'
import { parseSpanishPrice } from '@/lib/scraping-utils'
import { unavailablePrice, isAmazonNotFoundPage } from './not-available'

const AMAZON_BASE = 'https://www.amazon.es/dp/'
const MAX_PRICE = 5000

export interface ParsedAmazonPage {
  price: number
  originalPrice: number | null
  stock: 'in_stock' | 'limited' | 'out_of_stock'
}

export async function scrapeAmazon(
  asin: string,
  productTitle?: string,
  sourceUrl?: string,
): Promise<ScrapedPrice | null> {
  const urls = buildScrapeUrls(asin, sourceUrl)
  let sawNotFound = false

  for (const url of urls) {
    const res = await fetch(url, {
      headers: {
        'User-Agent': getNextUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      // Sin timeout, un fetch colgado bloquea el refresh entero (el bucle es
      // secuencial y el limiter no ayuda si la conexión no responde).
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      if (res.status === 404) sawNotFound = true
      continue
    }

    const html = await res.text()
    const pageTitle = html.match(/<title[^>]*>([^<]+)</i)?.[1] || ''

    if (isAmazonNotFoundPage(html, pageTitle, res.status)) {
      sawNotFound = true
      continue
    }

    const parsed = parseAmazonPage(html)
    if (!parsed) continue

    // En páginas de padre con rango de precio, comprobar que el título
    // corresponde al producto esperado antes de aceptar el precio.
    if (productTitle && /a-price-range/i.test(html) && pageTitle) {
      const titleWords = productTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2)
      const matches = titleWords.some(w => pageTitle.toLowerCase().includes(w))
      if (!matches) continue
    }

    return {
      price: parsed.price,
      originalPrice: parsed.originalPrice,
      stock: parsed.stock,
      url,
      shipping: 0,
    }
  }

  if (sawNotFound) return unavailablePrice(urls[0] || `${AMAZON_BASE}${asin}`)
  return null
}

/**
 * Extrae precio actual y precio original (tachado) del bloque de precio
 * principal de Amazon. Nunca usa el primer precio de la página entera:
 * en el layout nuevo los primeros `a-offscreen` suelen ser anuncios.
 */
export function parseAmazonPage(html: string): ParsedAmazonPage | null {
  const decoded = decodeHtmlEntities(html)
  const jsonLd = parseJsonLd(decoded)
  const core = extractPriceCore(decoded)

  const current = (core ? parseCurrentFromCore(core) : null) ?? jsonLd?.price ?? null
  if (!current || current <= 0 || current > MAX_PRICE) return null

  const original = core ? parseOriginalFromCore(core, current) : null
  const stock = parseStockFromHtml(decoded) ?? jsonLd?.stock ?? 'in_stock'

  return {
    price: current,
    originalPrice: original && original > current ? original : null,
    stock,
  }
}

function buildScrapeUrls(asin: string, sourceUrl?: string): string[] {
  const urls: string[] = []
  const add = (raw: string) => {
    try {
      const parsed = new URL(raw)
      parsed.searchParams.delete('tag')
      // Conservar solo parámetros que afectan a la variante. El resto son
      // tracking o redirects que pueden llevar a otra ficha.
      const keep = new Set(['th', 'psc', 'color', 'size'])
      for (const key of [...parsed.searchParams.keys()]) {
        if (!keep.has(key)) parsed.searchParams.delete(key)
      }
      const clean = parsed.toString()
      if (!urls.includes(clean)) urls.push(clean)
    } catch {
      // URL inválida: se ignora y se usan las URLs estándar por ASIN
    }
  }

  if (sourceUrl) {
    // El enlace que ve el usuario debe ser el mismo que se scrapea. Si la URL
    // del deal no fija variante, se fija psc=1 (igual que buildAmazonUrl)
    // antes que la URL padre sin seleccionar.
    try {
      const parsed = new URL(sourceUrl)
      if (!parsed.searchParams.has('psc')) {
        parsed.searchParams.set('th', '1')
        parsed.searchParams.set('psc', '1')
      }
      add(parsed.toString())
    } catch {
      add(sourceUrl)
    }
  }

  add(`${AMAZON_BASE}${asin}?th=1&psc=1`)
  add(`${AMAZON_BASE}${asin}`)
  return urls
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&euro;/g, '€')
    .replace(/&amp;/g, '&')
    .replace(/\\"/g, '"')
}

function extractPriceCore(html: string): string {
  const ids = [
    'corePriceDisplay_desktop_feature_div',
    'corePrice_feature_div',
    'tp_price_block_total_price_ww',
    'priceblock_ourprice',
    'priceblock_dealprice',
  ]

  for (const id of ids) {
    const index = html.indexOf(`id="${id}"`)
    if (index >= 0) return html.slice(index, index + 18000)
  }
  return ''
}

function parseCurrentFromCore(core: string): number | null {
  // El precio actual aparece en el texto accesible `aok-offscreen`:
  // "22,49 € con un ahorro del 50 %" o "58,99 €".
  for (const match of core.matchAll(/class="aok-offscreen">\s*([\d.,]+)\s*€/gi)) {
    const price = parseSpanishPrice(match[1])
    if (price > 0 && price <= MAX_PRICE) return price
  }

  // Bloque de precio clásico del buybox.
  const tpBlock = core.match(
    /id="tp_price_block_total_price_ww"[\s\S]{0,1200}?class="a-offscreen">\s*([\d.,]+)\s*€/i,
  )
  if (tpBlock) {
    const price = parseSpanishPrice(tpBlock[1])
    if (price > 0 && price <= MAX_PRICE) return price
  }

  // `.a-price` que no sea el tachado (`a-text-price`).
  const priceEl = core.match(
    /class="a-price(?![^"]*a-text-price)[^"]*"[\s\S]{0,900}?class="a-offscreen">\s*([\d.,]+)\s*€/i,
  )
  if (priceEl) {
    const price = parseSpanishPrice(priceEl[1])
    if (price > 0 && price <= MAX_PRICE) return price
  }

  // Fallback para layouts antiguos (#priceblock_ourprice / #priceblock_dealprice).
  const generic = core.match(/([\d.,]+)\s*€/)
  if (generic) {
    const price = parseSpanishPrice(generic[1])
    if (price > 0 && price <= MAX_PRICE) return price
  }

  return null
}

function parseOriginalFromCore(core: string, current: number): number | null {
  const labelled = core.match(/Precio (?:recomendado|mediano):\s*([\d.,]+)\s*€/i)
  if (labelled) {
    const price = parseSpanishPrice(labelled[1])
    if (price > current && price <= MAX_PRICE) return price
  }

  const strike = core.match(
    /class="a-price a-text-price[^"]*"[\s\S]{0,900}?class="a-offscreen">\s*([\d.,]+)\s*€/i,
  )
  if (strike) {
    const price = parseSpanishPrice(strike[1])
    if (price > current && price <= MAX_PRICE) return price
  }

  return null
}

function parseStockFromHtml(html: string): ParsedAmazonPage['stock'] | null {
  const availability = sliceById(html, 'availability', 3000)
  const buybox = sliceById(html, 'buybox', 20000)
  const scope = availability || buybox || html
  const text = scope.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

  if (/no (?:est[aá]|se encuentra) disponible|no disponible|no hay stock|agotado/i.test(text)) {
    return 'out_of_stock'
  }
  if (/en stock/i.test(text)) return 'in_stock'
  if (/env[ií]o en|res[eé]rvalo|reservalo|backorder/i.test(text)) return 'limited'
  if (/disponible/i.test(text)) return 'in_stock'
  return null
}

function sliceById(html: string, id: string, maxLength: number): string {
  const index = html.indexOf(`id="${id}"`)
  return index >= 0 ? html.slice(index, index + maxLength) : ''
}

function parseJsonLd(html: string): { price: number; stock: ParsedAmazonPage['stock'] | null } | null {
  const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let match

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1].trim())
      const products = Array.isArray(data) ? data : [data]

      for (const product of products) {
        if (product['@type'] !== 'Product' || !product.offers) continue
        const offers = Array.isArray(product.offers) ? product.offers : [product.offers]
        const offer = offers[0]
        if (!offer) continue

        const price = parseSpanishPrice(String(offer.price ?? ''))
        if (price <= 0 || price > MAX_PRICE) continue

        const availability = String(offer.availability ?? '')
        const stock = availability.includes('InStock') || availability.includes('instock')
          ? 'in_stock' as const
          : availability.includes('Limited') || availability.includes('PreOrder')
            ? 'limited' as const
            : availability.includes('OutOfStock') || availability.includes('SoldOut')
              ? 'out_of_stock' as const
              : null

        return { price, stock }
      }
    } catch {
      continue
    }
  }

  return null
}
