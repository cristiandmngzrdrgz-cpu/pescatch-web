import type { ScrapedPrice } from './types'
import { getNextUserAgent } from './user-agents'

export function extractAsin(url: string): string | null {
  const match = url.match(/\/dp\/([A-Z0-9]{10})/)
  return match?.[1] ?? null
}

export async function scrapeAmazon(
  asin: string,
  productTitle?: string,
): Promise<ScrapedPrice | null> {
  const url = `https://www.amazon.es/dp/${asin}`

  const res = await fetch(url, {
    headers: {
      'User-Agent': getNextUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    },
    redirect: 'follow',
  })

  if (!res.ok) return null

  const html = await res.text()

  // Extract page title for validation
  const pageTitle = html.match(/<title[^>]*>([^<]+)</i)?.[1] || ''

  // Check if this is a parent product page with price range
  const hasPriceRange = html.includes('a-price-range')
  const hasVariants = html.includes('twister') || html.includes('variationValues')

  const price = parsePriceFromHtml(html) ?? parseJsonLd(html)
  if (!price) return null

  // If parent page with variants AND we have a product title to match:
  // do a sanity check - the scraped price should be somewhat close to expected
  if (hasPriceRange && hasVariants && productTitle) {
    const titleWords = productTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)

    const titleMatch = titleWords.some(w => pageTitle.toLowerCase().includes(w))
    if (!titleMatch) {
      return null
    }
  }

  return { ...price, url }
}

function parseJsonLd(html: string): ScrapedPrice | null {
  const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let match

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1].trim())

      if (data['@type'] === 'Product' && data.offers) {
        const offers = Array.isArray(data.offers) ? data.offers : [data.offers]
        const offer = offers[0]
        if (!offer) continue

        const priceStr = String(offer.price ?? '')
        const price = parseSpanishPrice(priceStr)
        if (price <= 0 || price > 5000) continue

        const availability = String(offer.availability ?? '')
        const stock = availability.includes('InStock') || availability.includes('instock')
          ? 'in_stock' as const
          : availability.includes('Limited')
            ? 'limited' as const
            : 'out_of_stock' as const

        return { price, stock, url: '', shipping: 0 }
      }
    } catch {
      continue
    }
  }

  return null
}

function parsePriceFromHtml(html: string): ScrapedPrice | null {
  const priceSelectors = [
    /"a-price-whole">(\d[\d.]*)</,
    /"a-offscreen">([\d.,]+)\s*€</,
    /class="a-price"[^>]*>[\s\S]*?"a-price-whole">(\d[\d.]*)</,
  ]

  for (const regex of priceSelectors) {
    const m = html.match(regex)
    if (m) {
      const price = parseSpanishPrice(m[1])
      if (price > 0 && price < 5000) {
        return { price, stock: 'in_stock', url: '', shipping: 0 }
      }
    }
  }

  const priceMatch = html.match(/['"]price['"]\s*:\s*['"]?(\d+[.,]\d{2})/)
  if (priceMatch) {
    const price = parseSpanishPrice(priceMatch[1])
    if (price > 0 && price < 5000) {
      return { price, stock: 'in_stock', url: '', shipping: 0 }
    }
  }

  return null
}

export function parseSpanishPrice(text: string): number {
  const clean = text
    .replace(/[^0-9.,]/g, '')
    .replace(/\.(?=\d{3}(?:\.|$)|(?:\s|,|$))/g, '')
    .replace(',', '.')

  const num = parseFloat(clean)
  return isNaN(num) ? 0 : Math.round(num * 100) / 100
}
