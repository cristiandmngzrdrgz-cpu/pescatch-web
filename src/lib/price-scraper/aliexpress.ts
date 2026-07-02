import type { ScrapedPrice } from './types'
import type { Page } from 'playwright'
import { bravePage, braveAvailable } from './brave'
import { parseSpanishPrice } from './amazon'

export async function scrapeAliExpress(
  url: string,
  existingPage?: Page,
): Promise<ScrapedPrice | null> {
  if (!braveAvailable()) return null
  const owned = !existingPage

  try {
    const page = existingPage || await bravePage(false)

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    const price = await page.evaluate(() => {
      const selectors = [
        '.product-price-value',
        '[class*="Price"]',
        '[class*="price"]',
        '.sku-price',
        '.es--price--',
        'span[data-pl="product-price"]',
      ]
      for (const sel of selectors) {
        const el = document.querySelector(sel)
        if (el) return el.textContent?.trim() ?? null
      }
      return null
    })

    if (owned) await page.close()

    if (!price) return null
    const parsed = parseSpanishPrice(price)
    if (parsed <= 0 || parsed > 5000) return null
    return { price: parsed, stock: 'in_stock', url, shipping: 0 }
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
