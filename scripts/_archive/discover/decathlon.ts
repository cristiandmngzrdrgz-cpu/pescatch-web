import type { Page } from 'playwright'
import { braveAvailable, bravePage } from '../../src/lib/price-scraper/brave'

export interface DecathlonCandidate {
  title: string
  price: number
  originalPrice: number | null
  rating: number
  reviews: number
  url: string
  keyword: string
  category: string
  imageUrl: string | null
}

export async function searchDecathlon(
  query: string,
  category: string,
  existingPage?: Page,
): Promise<DecathlonCandidate[]> {
  if (!braveAvailable()) return []
  const owned = !existingPage

  try {
    const page = existingPage || await bravePage(false)
    const searchUrl = `https://www.decathlon.es/es/search?q=${encodeURIComponent(query)}`

    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    const results = await page.evaluate(() => {
      const items = document.querySelectorAll(
        '[class*="product"], [class*="Product"], [data-product], article'
      )
      const found: { title: string; price: number; url: string; rating: number; reviews: number; image: string }[] = []

      for (const item of items) {
        const link = item.querySelector('a[href*="/p/"]') || item.querySelector('a[href*="/es/p/"]')
        if (!link) continue

        const url = (link as HTMLAnchorElement).href || link.getAttribute('href') || ''
        if (!url.includes('/p/')) continue

        const title = link.getAttribute('title')
          || item.querySelector('[class*="title"], [class*="Title"], h2, h3')?.textContent
          || ''

        const priceEl = item.querySelector('[class*="price"], [class*="Price"], .price')
        let price = 0
        if (priceEl) {
          const text = priceEl.textContent?.replace(/[^0-9.,]/g, '').replace(',', '.') || '0'
          price = parseFloat(text) || 0
        }

        const ratingEl = item.querySelector('[class*="rating"], [class*="Rating"], [aria-label*="star"]')
        const ratingText = ratingEl?.getAttribute('aria-label') || ratingEl?.textContent || ''
        const firstNum = ratingText.match(/[\d.,]+/)
        const rating = firstNum ? parseFloat(firstNum[0].replace(',', '.')) : 0

        const img = item.querySelector('img[src*="media"]')
        const image = img?.getAttribute('src') || null

        if (title && price > 0) {
          found.push({ title: title.trim().slice(0, 120), price, url: url.startsWith('http') ? url : `https://www.decathlon.es${url}`, rating, reviews: 0, image: image || '' })
        }
      }
      return found
    })

    if (owned) await page.close()

    return results.map(r => ({
      title: r.title,
      price: Math.round(r.price * 100) / 100,
      originalPrice: Math.round(r.price * 1.3 * 100) / 100,
      rating: r.rating,
      reviews: 0,
      url: r.url,
      keyword: query,
      category,
      imageUrl: r.image,
    }))
  } catch {
    return []
  }
}

export async function scrapeDecathlonDetails(
  url: string,
  existingPage?: Page,
): Promise<{ ean: string | null; brand: string | null }> {
  if (!braveAvailable()) return { ean: null, brand: null }
  const owned = !existingPage

  try {
    const page = existingPage || await bravePage(false)
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    const data = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      for (const s of scripts) {
        try {
          const d = JSON.parse(s.textContent || '')
          if (d['@type'] === 'Product') {
            return { ean: d.gtin13 || d.gtin || null, brand: d.brand?.name || d.brand || null }
          }
        } catch {}
      }
      return null
    })

    if (owned) await page.close()
    return data ?? { ean: null, brand: null }
  } catch {
    return { ean: null, brand: null }
  }
}
