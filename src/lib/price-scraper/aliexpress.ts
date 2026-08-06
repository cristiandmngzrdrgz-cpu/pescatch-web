import type { ScrapedPrice } from './types'
import type { Page } from 'playwright'
import { braveAvailable, parseSpanishPrice } from '@/lib/scraping-utils'
import { bravePage } from './brave'
import { unavailablePrice, isAliExpressNotFoundPage } from './not-available'

const AGENT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36'

async function resolveAliExpressUrl(url: string): Promise<string> {
  if (!url.includes('s.click.aliexpress.com')) return url
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': AGENT_UA } })
    return r.url || url
  } catch {
    return url
  }
}

export async function scrapeAliExpress(
  url: string,
  existingPage?: Page,
): Promise<ScrapedPrice | null> {
  if (!braveAvailable()) return null
  const owned = !existingPage

  try {
    const target = await resolveAliExpressUrl(url)
    const page = existingPage || await bravePage(false)

    await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 })

    const bodyText = await page.evaluate(() => document.body?.innerText ?? '').catch(() => '')
    if (isAliExpressNotFoundPage(bodyText)) {
      if (owned) await page.close()
      return unavailablePrice(url)
    }

    // El precio de venta real es el que aparece junto al bloque "Termina :" (precio
    // registrado para la variante por defecto, con IVA). No usar la API, que da un
    // precio "desde" distinto del que paga el cliente.
    const price = await page.evaluate(() => {
      const selectors = [
        '.product-price-value',
        '[class*="product-price"]',
        '[class*="Price--"]',
        '.sku-price',
        '.es--price--primary',
        'span[data-pl="product-price"]',
      ]
      for (const sel of selectors) {
        const el = document.querySelector(sel)
        const t = el?.textContent?.trim()
        if (t && /[\d.]/.test(t)) return t
      }

      const text = document.body?.innerText ?? ''
      const termina = text.match(/Termina\s*:?\s*\n?\s*(\d[\d.,]*)\s*€/i)
      if (termina) return termina[1]

      const first = text.match(/(?:^|[\n.])\s*(\d[\d.,]*)\s*€/m)
      if (first) return first[1]

      return null
    })

    if (owned) await page.close()

    if (!price) return null
    const parsed = parseSpanishPrice(price)
    if (parsed <= 0 || parsed > 5000) return null
    return { price: parsed, stock: 'in_stock', url: target, shipping: 0 }
  } catch {
    return null
  }
}

export async function searchAliExpress(
  query: string,
  existingPage?: Page,
): Promise<{ title: string; price: number; url: string; rating: number }[]> {
  if (!braveAvailable()) return []
  const owned = !existingPage

  try {
    const page = existingPage || await bravePage(false)
    const searchUrl = `https://es.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}&sortType=total_tranpro_desc`

    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 })

    const results = await page.evaluate(() => {
      const items = document.querySelectorAll('[class*="product"],[class*="Product"],[class*="item"],[class*="Item"]')
      const found: { title: string; price: number; url: string; rating: number }[] = []

      for (const item of items) {
        const link = item.querySelector('a')
        if (!link) continue

        const url = link.getAttribute('href') || ''
        if (!url.includes('/item/')) continue

        const title = link.getAttribute('title') || item.textContent?.slice(0, 100) || ''
        const priceText = item.querySelector('[class*="price"],[class*="Price"]')?.textContent || ''
        const price = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0

        const ratingText = item.querySelector('[class*="rating"],[class*="Rating"]')?.textContent || ''
        const rating = parseFloat(ratingText.replace(',', '.')) || 0

        if (title && price > 0) {
          found.push({ title: title.trim().slice(0, 120), price, url: url.startsWith('http') ? url : `https:${url}`, rating })
        }
      }
      return found
    })

    if (owned) await page.close()
    return results
  } catch {
    return []
  }
}
