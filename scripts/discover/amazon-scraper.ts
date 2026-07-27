import { type Page } from 'playwright'
import * as path from 'path'
import type { AmazonCandidate } from './amazon'
import { isFishingProduct, braveAvailable, launchBraveContext, setupStealthPage } from '../../src/lib/scraping-utils'

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function launchContext() {
  return launchBraveContext('brave-amazon-profile')
}

async function setupPage(page: Page) {
  await setupStealthPage(page)
}

async function waitForCaptcha(page: Page): Promise<boolean> {
  for (let i = 0; i < 120; i++) {
    const text = await page.evaluate(() => document.body?.textContent?.slice(0, 1000) || '')
    const lower = text.toLowerCase()
    if (lower.includes('captcha') || lower.includes('verificación') || lower.includes('verify') || lower.includes('robot')) {
      console.log(`\n   ⚠️ Captcha detectado. Resuélvelo (${120 - i}s restantes)...`)
      await sleep(1000)
      continue
    }
    // Check if search results are visible
    const hasResults = await page.evaluate(() => {
      return !!document.querySelector('[data-component-type="s-search-result"]')
    })
    if (hasResults) return true
    await sleep(1000)
  }
  return false
}

async function extractProductsFromPage(page: Page, keyword: string, category: string): Promise<AmazonCandidate[]> {
  const raw = await page.evaluate(() => {
    type RawCard = { asin: string; title: string; price: number; rating: number; reviews: number; imageUrl: string | null; brand: string | null }
    const results: RawCard[] = []
    const seen = new Set<string>()

    const cards = Array.from(document.querySelectorAll('[data-component-type="s-search-result"]'))
    for (const card of cards) {
      const asin = card.getAttribute('data-asin') || ''
      if (!asin || !asin.startsWith('B0') || seen.has(asin)) continue
      seen.add(asin)

      const h2 = card.querySelector('h2')
      if (!h2) continue
      const title = (h2.getAttribute('aria-label') || h2.textContent || '').replace(/^Anuncio patrocinado:\s*/i, '').trim()
      if (!title || title.length < 5) continue

      const wholeEl = card.querySelector('[class*="a-price-whole"]')
      const fractionEl = card.querySelector('[class*="a-price-fraction"]')
      let price = 0
      if (wholeEl) {
        const whole = (wholeEl.textContent || '').replace(/[^0-9]/g, '') || '0'
        const fraction = (fractionEl?.textContent || '').replace(/[^0-9]/g, '') || '0'
        price = parseFloat(whole + '.' + fraction)
      }
      if (price <= 0) {
        const priceText = card.querySelector('[class*="a-price"]')?.textContent || ''
        const m = priceText.match(/[\d.,]+/)
        if (m) price = parseFloat(m[0].replace(',', '.')) || 0
      }

      const ratingEl = card.querySelector('[class*="a-icon-alt"]')
      const ratingText = ratingEl?.textContent || ''
      const ratingMatch = ratingText.match(/[\d.,]+/)
      const rating = ratingMatch ? parseFloat(ratingMatch[0].replace(',', '.')) : 0

      let reviews = 0
      const reviewSpans = Array.from(card.querySelectorAll('[class*="a-size-base"], [class*="a-link-normal"]'))
      for (const span of reviewSpans) {
        const t = span.textContent?.trim() || ''
        const n = parseInt(t.replace(/\./g, ''), 10)
        if (n > 0 && !t.includes('€') && !t.includes('$')) {
          reviews = n
          break
        }
      }

      const img = card.querySelector('img.s-image, img[data-image-latency="s-product-image"]')
      const imageUrl = img?.getAttribute('src') || null

      let brand: string | null = null
      const brandEl = card.querySelector('[class*="a-row"] [class*="a-size-base"]')
      if (brandEl) {
        const t = brandEl.textContent?.trim() || ''
        if (t && t.length < 30 && !t.includes(' ')) brand = t
      }

      results.push({ asin, title, price: Math.round(price * 100) / 100, rating, reviews, imageUrl, brand })
    }

    return results.slice(0, 20)
  })

  const filtered = raw.filter(r => isFishingProduct(r.title, keyword))

  return filtered.map(r => ({
    asin: r.asin,
    title: r.title,
    price: r.price,
    originalPrice: null,
    rating: r.rating,
    reviews: r.reviews,
    url: 'https://www.amazon.es/dp/' + r.asin,
    keyword,
    category,
    imageUrl: r.imageUrl,
    brand: r.brand,
    ean: null as string | null,
  }))
}

const AMAZON_FISHING_NODE = '2928514031'

export async function searchAmazonStealth(keyword: string, category: string): Promise<AmazonCandidate[]> {
  const context = await launchContext()
  try {
    const page = context.pages()[0] || await context.newPage()
    await setupPage(page)

    const url = `https://www.amazon.es/s?k=${encodeURIComponent(keyword)}&s=review-count-rank`
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await sleep(2000)

    const ok = await waitForCaptcha(page)
    if (!ok) return []

    // Scroll to trigger lazy load
    await page.evaluate(() => window.scrollTo(0, 1000))
    await sleep(1000)

    const results = await extractProductsFromPage(page, keyword, category)
    return results
  } finally {
    await context.close()
  }
}

export async function searchAmazonAll(keywords: Record<string, string[]>): Promise<AmazonCandidate[]> {
  const context = await launchContext()
  const allResults: AmazonCandidate[] = []
  const seenAsins = new Set<string>()

  try {
    const page = context.pages()[0] || await context.newPage()
    await setupPage(page)

    for (const [category, kwList] of Object.entries(keywords)) {
      for (const kw of kwList) {
        process.stdout.write(`  🔍 "${kw}"... `)

        const url = `https://www.amazon.es/s?k=${encodeURIComponent(kw)}&s=review-count-rank`
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
          await sleep(2000)
        } catch {
          console.log('timeout')
          continue
        }

        const ok = await waitForCaptcha(page)
        if (!ok) {
          console.log('captcha')
          continue
        }

        await page.evaluate(() => window.scrollTo(0, 1000))
        await sleep(1000)

        const results = await extractProductsFromPage(page, kw, category)
        let newCount = 0
        for (const r of results) {
          if (seenAsins.has(r.asin)) continue
          seenAsins.add(r.asin)
          allResults.push(r)
          newCount++
        }
        console.log(`${newCount}`)
      }
    }
  } finally {
    await context.close()
  }

  return allResults
}

export async function scrapeBestsellersStealth(category: string): Promise<AmazonCandidate[]> {
  const context = await launchContext()
  try {
    const page = context.pages()[0] || await context.newPage()
    await setupPage(page)

    const url = `https://www.amazon.es/gp/bestsellers/sports/${AMAZON_FISHING_NODE}`
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await sleep(2000)

    const ok = await waitForCaptcha(page)
    if (!ok) return []

    const results = await page.evaluate(() => {
      const r: Array<{ asin: string; title: string; price: number; rating: number; reviews: number; imageUrl: string | null }> = []
      const seen = new Set<string>()
      const cards = Array.from(document.querySelectorAll('[data-asin^="B0"]'))
      for (const card of cards) {
        const asin = card.getAttribute('data-asin') || ''
        if (!asin || seen.has(asin)) continue
        seen.add(asin)
        const titleEl = card.querySelector('[class*="p13n-sc-truncate"], h2, [class*="title"]')
        const title = titleEl?.textContent?.trim() || ''
        if (!title) continue
        const priceEl = card.querySelector('[class*="a-price-whole"]')
        let price = 0
        if (priceEl) price = parseFloat((priceEl.textContent || '').replace(/[^0-9]/g, '') || '0')
        const ratingMatch = (card.querySelector('[class*="a-icon-alt"]')?.textContent || '').match(/[\d.,]+/)
        const rating = ratingMatch ? parseFloat(ratingMatch[0].replace(',', '.')) : 0
        let reviews = 0
        const reviewEl = card.querySelector('[class*="a-size-small"]')
        if (reviewEl) { const n = parseInt((reviewEl.textContent || '').replace(/\./g, ''), 10); if (n > 0) reviews = n }
        const img = card.querySelector('img[src*=".jpg"]')
        const imageUrl = img?.getAttribute('src') || null
        r.push({ asin, title, price: Math.round(price * 100) / 100, rating, reviews, imageUrl })
      }
      return r.slice(0, 25)
    })

    return results.map(r => ({
      asin: r.asin,
      title: r.title,
      price: r.price,
      originalPrice: null,
      rating: r.rating,
      reviews: r.reviews,
      url: `https://www.amazon.es/dp/${r.asin}`,
      keyword: '__bestsellers__',
      category,
      imageUrl: r.imageUrl,
      brand: null,
      ean: null,
    }))
  } finally {
    await context.close()
  }
}

export async function scrapeNewReleasesStealth(category: string): Promise<AmazonCandidate[]> {
  const context = await launchContext()
  try {
    const page = context.pages()[0] || await context.newPage()
    await setupPage(page)

    const url = `https://www.amazon.es/gp/new-releases/sports/${AMAZON_FISHING_NODE}`
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await sleep(2000)

    const ok = await waitForCaptcha(page)
    if (!ok) return []

    const results = await page.evaluate(() => {
      const r: Array<{ asin: string; title: string; price: number; rating: number; reviews: number; imageUrl: string | null }> = []
      const seen = new Set<string>()
      const cards = Array.from(document.querySelectorAll('[data-asin^="B0"]'))
      for (const card of cards) {
        const asin = card.getAttribute('data-asin') || ''
        if (!asin || seen.has(asin)) continue
        seen.add(asin)
        const titleEl = card.querySelector('[class*="p13n-sc-truncate"], h2, [class*="title"]')
        const title = titleEl?.textContent?.trim() || ''
        if (!title) continue
        const priceEl = card.querySelector('[class*="a-price-whole"]')
        let price = 0
        if (priceEl) price = parseFloat((priceEl.textContent || '').replace(/[^0-9]/g, '') || '0')
        const ratingMatch = (card.querySelector('[class*="a-icon-alt"]')?.textContent || '').match(/[\d.,]+/)
        const rating = ratingMatch ? parseFloat(ratingMatch[0].replace(',', '.')) : 0
        let reviews = 0
        const reviewEl = card.querySelector('[class*="a-size-small"]')
        if (reviewEl) { const n = parseInt((reviewEl.textContent || '').replace(/\./g, ''), 10); if (n > 0) reviews = n }
        const img = card.querySelector('img[src*=".jpg"]')
        const imageUrl = img?.getAttribute('src') || null
        r.push({ asin, title, price: Math.round(price * 100) / 100, rating, reviews, imageUrl })
      }
      return r.slice(0, 25)
    })

    return results.map(r => ({
      asin: r.asin,
      title: r.title,
      price: r.price,
      originalPrice: null,
      rating: r.rating,
      reviews: r.reviews,
      url: `https://www.amazon.es/dp/${r.asin}`,
      keyword: '__new_releases__',
      category,
      imageUrl: r.imageUrl,
      brand: null,
      ean: null,
    }))
  } finally {
    await context.close()
  }
}
