import type { ScrapedPrice } from './types'
import { getNextUserAgent } from './user-agents'
import { parseSpanishPrice, braveAvailable, getBravePath } from '@/lib/scraping-utils'
import { chromium } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'

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
  let context
  try {
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
