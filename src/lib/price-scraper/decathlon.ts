import type { ScrapedPrice } from './types'
import { getNextUserAgent } from './user-agents'
import { parseSpanishPrice } from './amazon'
import { bravePage, braveAvailable } from './brave'

export async function scrapeDecathlon(url: string): Promise<ScrapedPrice | null> {
  const fetchResult = await tryFetch(url)
  if (fetchResult) return fetchResult

  if (!braveAvailable()) return null

  return tryBrave(url)
}

async function tryFetch(url: string): Promise<ScrapedPrice | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': getNextUserAgent(),
        Accept: 'text/html',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return null

    const html = await res.text()
    return parseDecathlonHtml(html, url)
  } catch {
    return null
  }
}

async function tryBrave(url: string): Promise<ScrapedPrice | null> {
  try {
    const page = await bravePage(true)

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    const data = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      for (const s of scripts) {
        try {
          const d = JSON.parse(s.textContent || '')
          if (d['@type'] === 'Product' && d.offers) return d
        } catch {}
      }
      return null
    })

    if (data && data.offers) {
      const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers
      const price = parseSpanishPrice(String(offer.price ?? ''))
      if (price > 0) {
        const stock = String(offer.availability ?? '').includes('InStock')
          ? 'in_stock' as const
          : 'out_of_stock' as const
        await page.close()
        return { price, stock, url, shipping: price >= 30 ? 0 : 3.99 }
      }
    }

    const html = await page.content()
    await page.close()
    return parseDecathlonHtml(html, url)
  } catch {
    return null
  }
}

function parseDecathlonHtml(html: string, url: string): ScrapedPrice | null {
  const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1].trim())
      if (data['@type'] === 'Product' && data.offers) {
        const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers
        const price = parseSpanishPrice(String(offer.price ?? ''))
        if (price > 0) {
          const stock = String(offer.availability ?? '').includes('InStock')
            ? 'in_stock' as const
            : 'out_of_stock' as const
          return { price, stock, url, shipping: price >= 30 ? 0 : 3.99 }
        }
      }
    } catch { continue }
  }

  const priceMatch = html.match(/['"]price['"]\s*:\s*['"]?(\d+[.,]\d{2})/)
  if (priceMatch) {
    const price = parseSpanishPrice(priceMatch[1])
    if (price > 0) return { price, stock: 'in_stock', url, shipping: price >= 30 ? 0 : 3.99 }
  }

  return null
}
