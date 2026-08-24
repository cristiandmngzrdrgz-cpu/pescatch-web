import type { ScrapedPrice } from './types'
import { getNextUserAgent } from './user-agents'
import { parseSpanishPrice, braveAvailable, getBravePath } from '@/lib/scraping-utils'
import * as path from 'path'
import * as fs from 'fs'
import { unavailablePrice, isDecathlonNotFoundPage } from './not-available'

// playwright se importa dinámicamente dentro de tryBrave: es un fallback solo
// disponible en local (Brave instalado). Un import estático rompería el bundle
// serverless de Vercel, donde este scraper nunca llega a usarse (el refresh
// excluye Decathlon y no hay Brave en el runtime).
const USER_DATA_DIR = path.resolve('temp', 'brave-decathlon-refresh')

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
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      if (res.status === 404) return unavailablePrice(url)
      return null
    }

    const html = await res.text()

    const finalUrl = res.url || url
    if (isDecathlonNotFoundPage(html, url, finalUrl)) {
      return unavailablePrice(url)
    }

    const parsed = parseDecathlonHtml(html, url)
    if (parsed) return parsed

    // Fallback: extract price using regex on raw HTML (Decathlon often has price in meta/JSON-LD)
    const priceMatch = html.match(/"price"\s*:\s*"?(\d+[.,]\d{2})"?/)
    if (priceMatch) {
      const price = parseSpanishPrice(priceMatch[1])
      if (price > 0 && price < 5000) {
        return { price, stock: 'in_stock', url, shipping: price >= 30 ? 0 : 3.99 }
      }
    }

    const metaPrice = html.match(/<meta[^>]+property="product:price:amount"[^>]+content="(\d+[.,]\d{2})"/)
    if (metaPrice) {
      const price = parseSpanishPrice(metaPrice[1])
      if (price > 0 && price < 5000) {
        return { price, stock: 'in_stock', url, shipping: price >= 30 ? 0 : 3.99 }
      }
    }

    return null
  } catch {
    return null
  }
}

async function tryBrave(url: string): Promise<ScrapedPrice | null> {
  let context
  try {
    const { chromium } = await import('playwright')
    if (!fs.existsSync(USER_DATA_DIR)) {
      fs.mkdirSync(USER_DATA_DIR, { recursive: true })
    }

    context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      executablePath: getBravePath(),
      headless: false,
      locale: 'es-ES',
      timezoneId: 'Europe/Madrid',
      viewport: { width: 1920, height: 1080 },
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    })

    const page = context.pages()[0] || await context.newPage()

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(4000)

    const finalUrl = page.url() || url
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '').catch(() => '')
    if (isDecathlonNotFoundPage(bodyText, url, finalUrl)) {
      return unavailablePrice(url)
    }

    const price = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      for (const s of scripts) {
        try {
          const d = JSON.parse(s.textContent || '')
          if (d['@type'] === 'Product' && d.offers) {
            const o = Array.isArray(d.offers) ? d.offers[0] : d.offers
            if (o.price) return String(o.price)
          }
        } catch {}
      }
      const sel = [
        'meta[property="product:price:amount"]',
        '[data-testid="product-price"]',
        '[class*="price"]',
        '#product-price',
        '[itemprop="price"]',
        '.price-tag',
      ]
      for (const s of sel) {
        const el = document.querySelector(s)
        if (el) {
          const raw = el.getAttribute('content') || (el as HTMLElement).textContent || ''
          const m = raw.match(/(\d+[.,]\d{2})/)
          if (m) return m[1]
        }
      }
      return null
    })

    if (!price) return null
    const parsed = parseSpanishPrice(price)
    if (parsed <= 0 || parsed > 5000) return null
    return { price: parsed, stock: 'in_stock', url, shipping: parsed >= 30 ? 0 : 3.99 }
  } catch {
    return null
  } finally {
    if (context) await context.close().catch(() => {})
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
