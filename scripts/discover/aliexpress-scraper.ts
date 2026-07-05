import { chromium, type Page } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'
import { CATEGORIES } from './keywords'

const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
const USER_DATA_DIR_CHROMIUM = path.resolve('temp', 'chromium-aliexpress-profile')
const USER_DATA_DIR_BRAVE = path.resolve('temp', 'brave-aliexpress-profile')

const NAV_TIMEOUT = 90000

export interface AliExpressProduct {
  title: string
  price: number
  originalPrice: number | null
  rating: number
  reviews: number
  url: string
  brand: string | null
  category: string
  store: 'aliexpress'
  discount: string
  imageUrl: string | null
}

const POPULAR_BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'shakespeare', 'okuma', 'rapala', 'savage gear', 'caperlan',
  'ryobi', 'yuki', 'lineaeffe', 'garbolino', 'ragot',
]

function extractBrand(title: string): string | null {
  const lower = title.toLowerCase()
  for (const b of POPULAR_BRANDS) {
    if (lower.includes(b)) return b.charAt(0).toUpperCase() + b.slice(1)
  }
  return null
}

function categorizeProduct(title: string): string {
  const lower = title.toLowerCase()
  if (/carrete/.test(lower)) return 'Carretes'
  if (/caña|ca.a|cana/.test(lower)) return 'Cañas'
  if (/señuelo|senuelo|artificial|vinilo|cucharill|peces?\s+artificiales/.test(lower)) return 'Señuelos'
  if (/combo|kit\s*(pesca|completo)/.test(lower)) return 'Kits'
  if (/caja|anzuelo|sedal|plomo|cuchillo|alicate|li.n?a|bajo\s*de\s*li.n?a/.test(lower)) return 'Accesorios'
  if (/traje|bota|gafa|sombrero|guante|gorra|polarizada/.test(lower)) return 'Ropa'
  return 'Equipo'
}

function parsePrice(text: string): number | null {
  const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function detectCaptcha(text: string): boolean {
  const lower = text.toLowerCase()
  return lower.includes('captcha') ||
    lower.includes('verify') ||
    lower.includes('robot') ||
    lower.includes('automated') ||
    lower.includes('please confirm')
}

async function waitForCaptcha(page: Page): Promise<boolean> {
  for (let i = 60; i > 0; i--) {
    const text = await page.evaluate(() => document.body?.textContent?.slice(0, 1000) || '').catch(() => '')
    if (!detectCaptcha(text)) return true
    if (i % 10 === 0) process.stdout.write(`\r   ⚠️ Captcha. Resuélvelo (${i}s)... `)
    await page.waitForTimeout(1000)
  }
  return false
}

async function extractProducts(page: Page): Promise<AliExpressProduct[]> {
  await page.waitForTimeout(3000)

  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(300)
  }
  await page.waitForTimeout(2000)

  const products = await page.evaluate(() => {
    const results: Array<{
      title: string; priceText: string; url: string; rating: string
      reviews: string; badge: string; imageUrl: string
    }> = []
    const seen = new Set<string>()

    const links = document.querySelectorAll<HTMLAnchorElement>('a[href*="/item/"]')
    for (const link of links) {
      const url = link.href.split('?')[0]
      if (seen.has(url)) continue
      seen.add(url)

      let container: HTMLElement | null = link
      for (let i = 0; i < 6; i++) {
        if (container.parentElement) container = container.parentElement
        else break
        if (container.querySelector('[class*="price"]') || container.querySelector('[class*="Price"]')) break
      }

      const titleEl = container.querySelector<HTMLElement>('h3, h2, [class*="title"], [class*="name"]')
      const title = titleEl?.textContent?.trim() || link.textContent?.trim() || ''

      const priceEl = container.querySelector<HTMLElement>('[class*="price"], [class*="Price"], [class*="currency"]')
      const priceText = priceEl?.textContent?.trim().replace(/\s+/g, '') || ''

      const ratingEl = container.querySelector<HTMLElement>('[class*="rating"], [class*="Rating"], [class*="star"],[class*="Star"]')
      const rating = ratingEl?.textContent?.trim().match(/[\d.]+/)?.[0] || ''

      const reviewEl = container.querySelector<HTMLElement>('[class*="review"],[class*="Review"],[class*="sale"],[class*="Sale"]')
      const reviews = reviewEl?.textContent?.trim().match(/[\d,.]+/)?.[0] || '0'

      const badgeEl = container.querySelector('[class*="discount"],[class*="Discount"],[class*="tag"],[class*="Tag"]')
      const badge = badgeEl?.textContent?.trim() || ''

      const imgEl = container.querySelector<HTMLImageElement>('img')
      const imageUrl = imgEl?.src?.startsWith('http') ? imgEl.src : ''

      results.push({ title, priceText, url, rating, reviews, badge, imageUrl })
    }
    return results
  })

  return products.map(p => {
    const prices = p.priceText.match(/(\d+[.,]\d{2,})/g)
    const salePrice = prices ? parsePrice(prices[0]) : null
    const origPrice = prices && prices.length >= 2 ? parsePrice(prices[prices.length - 1]) : null

    let discountPercent: number | null = null
    const discMatch = p.badge.match(/(\d+)\s*%/)
    if (discMatch) discountPercent = parseInt(discMatch[1], 10)
    else if (origPrice && salePrice && origPrice > salePrice)
      discountPercent = Math.round(((origPrice - salePrice) / origPrice) * 100)

    const slug = p.url.split('/item/')[1]?.split('.')[0] || ''

    return {
      title: p.title,
      price: salePrice || 0,
      originalPrice: origPrice || null,
      rating: parseFloat(p.rating) || 0,
      reviews: parseInt(p.reviews.replace(/[.,]/g, ''), 10) || 0,
      url: `https://es.aliexpress.com/item/${slug}.html`,
      brand: extractBrand(p.title),
      category: categorizeProduct(p.title),
      store: 'aliexpress' as const,
      discount: discountPercent ? `${discountPercent}%` : '',
      imageUrl: p.imageUrl || null,
    }
  })
}

async function launchContext(browserType: 'brave' | 'chromium') {
  if (browserType === 'brave') {
    if (!fs.existsSync(USER_DATA_DIR_BRAVE)) {
      fs.mkdirSync(USER_DATA_DIR_BRAVE, { recursive: true })
    }
    return chromium.launchPersistentContext(USER_DATA_DIR_BRAVE, {
      executablePath: BRAVE_PATH,
      headless: false,
      locale: 'es-ES',
      timezoneId: 'Europe/Madrid',
      viewport: { width: 1920, height: 1080 },
    })
  }

  if (!fs.existsSync(USER_DATA_DIR_CHROMIUM)) {
    fs.mkdirSync(USER_DATA_DIR_CHROMIUM, { recursive: true })
  }
  return chromium.launchPersistentContext(USER_DATA_DIR_CHROMIUM, {
    headless: false,
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    viewport: { width: 1920, height: 1080 },
  })
}

async function waitForProducts(page: Page): Promise<boolean> {
  for (let i = 0; i < 20; i++) {
    const hasLinks = await page.evaluate(() => {
      return document.querySelector('a[href*="/item/"]') !== null
    })
    if (hasLinks) return true
    await page.waitForTimeout(1000)
  }
  return false
}

async function searchKeyword(
  page: Page,
  keyword: string,
  category: string
): Promise<AliExpressProduct[]> {
  const searchUrl = `https://es.aliexpress.com/wholesale?SearchText=${encodeURIComponent(keyword)}`

  try {
    await page.goto(searchUrl, { waitUntil: 'load', timeout: NAV_TIMEOUT })
    await page.waitForTimeout(3000)

    const bodyText = await page.evaluate(() => document.body?.textContent?.slice(0, 1000) || '')
    if (detectCaptcha(bodyText)) {
      const resolved = await waitForCaptcha(page)
      if (!resolved) return []
    }

    const found = await waitForProducts(page)
    if (!found) return []

    const products = await extractProducts(page)
    return products.map(p => ({
      ...p,
      category: p.category === 'Equipo' && category !== 'Equipo' ? category : p.category,
    }))
  } catch (err) {
    if (err instanceof Error && err.message.includes('Timeout')) {
      console.log(`⏱️`)
    }
    return []
  }
}

export async function scrapeAliExpressAll(options?: {
  onProgress?: (keyword: string, count: number) => void
}): Promise<AliExpressProduct[]> {
  const onProgress = options?.onProgress

  const braveExists = fs.existsSync(BRAVE_PATH)
  if (braveExists) {
    console.log('  Usando Brave')
  } else {
    console.log('  Brave no encontrado, usando Chromium')
  }

  const context = await launchContext(braveExists ? 'brave' : 'chromium')
  const page = context.pages()[0] || await context.newPage()

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })

  const allProducts: AliExpressProduct[] = []
  const seenUrls = new Set<string>()
  const keywords = Object.entries(CATEGORIES).flatMap(([cat, terms]) =>
    terms.map(t => ({ keyword: t, category: cat }))
  )

  try {
    console.log('  Conectando con es.aliexpress.com...')
    try {
      await page.goto('https://es.aliexpress.com/', {
        waitUntil: 'load',
        timeout: NAV_TIMEOUT,
      })
      await page.waitForTimeout(3000)

      const bodyText = await page.evaluate(() => document.body?.textContent?.slice(0, 1000) || '')
      if (detectCaptcha(bodyText)) {
        console.log('  ⚠️ Captcha. Resuélvelo (60s)...')
        const resolved = await waitForCaptcha(page)
        if (!resolved) {
          console.log('  ❌ Captcha no resuelto.')
          return allProducts
        }
      }
      console.log('  ✅ Conectado')
    } catch {
      console.log('  ⚠️ Homepage no cargó, continuando...')
    }

    for (const { keyword, category } of keywords) {
      process.stdout.write(`  🔍 "${keyword}"... `)
      const products = await searchKeyword(page, keyword, category)
      let newCount = 0
      for (const p of products) {
        if (seenUrls.has(p.url)) continue
        seenUrls.add(p.url)
        allProducts.push(p)
        newCount++
      }
      console.log(`${newCount}`)
      onProgress?.(keyword, newCount)
      await page.waitForTimeout(2000)
    }
  } finally {
    await context.close()
  }

  return allProducts
}
