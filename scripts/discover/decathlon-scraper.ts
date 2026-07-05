import { chromium, type Page } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'

const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
const USER_DATA_DIR = path.resolve('temp', 'brave-decathlon-profile')
const DEALS_URL = 'https://www.decathlon.es/es/deals/f-sport_fishing_pesca-a-la-bolonesa_pesca-a-la-inglesa_pesca-a-la-tenya_pesca-al-coup-con-cana-enchufable_pesca-al-coup-con-cana-telescopica_pesca-al-quiver-feeder_pesca-al-surfcasting_pesca-al-toque_pesca-bajo-hielo_pesca-con-bombeta_pesca-con-flotador_pesca-con-gobio-manejado_pesca-con-jibionera_pesca-con-jig_pesca-con-mosca_pesca-con-pez-muerto-manejado_pesca-con-senuelos_pesca-de-arrastre_pesca-de-cangrejo-de-rio_pesca-de-la-lucioperca-con-senuelo_pesca-de-la-perca-con-senuelo_pesca-de-la-trucha-con-senuelo_pesca-de-sepia-y-calamar_pesca-de-sostener_pesca-de-truchas-en-embalse_pesca-del-black-bass-con-senuelo_pesca-del-lucio-con-senuelo_pesca-del-siluro_pesca-en-barco_pesca-en-kayak_pesca-exotica_pesca-fija_pesca-fija-1_pesca-submarina'

const POPULAR_BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'shakespeare', 'okuma', 'rapala', 'savage gear', 'caperlan',
  'ryobi', 'yuki', 'lineaeffe', 'beuchat', 'garbolino',
  'storm', 'williamson', 'suissex', 'ragot', 'yo-zuri',
]

export interface DecathlonProduct {
  title: string
  salePrice: number | null
  originalPrice: number | null
  discountPercent: number | null
  url: string
  imageUrl: string | null
  rating: number | null
  reviewsCount: number | null
  brand: string | null
  category: string
  badges: string[]
}

interface RawCard {
  title: string
  salePrice: number | null
  originalPrice: number | null
  discountPercent: number | null
  url: string
  imageUrl: string | null
  rating: number | null
  reviewsCount: number | null
  badges: string[]
}

// Detect canonical category + discover subcategory from title
function categorizeProduct(title: string): string {
  const lower = title.toLowerCase()

  const categoryRules: Array<[string, RegExp[]]> = [
    ['Carretes', [/carrete/, /spin/i, /\.?fg\b/, /\.?hg\b/, /\.?lt\b/, /\.?xh\b/]],
    ['Cañas', [/caña/, /cana/, /telescópica/, /telescopica/, /blank/, /casting weight/]],
    ['Señuelos', [/señuelo/, /senuelo/, /vinilo/, /peces? artificiales/, /kit.*[Ss]eñuelos?/, /cucharill/, /rapala/]],
    ['Kits', [/combo/, /conjunto/, /kit .*(pesca|carp|cana|carrete)/]],
    ['Accesorios', [/caja/, /anzuelo/, /sedal/, /plomo/, /cuchillo/, /alicate/, /línea/, /linea/, /bajo de línea/]],
    ['Ropa', [/traje/, /bota/, /gafas/, /sombrero/, /guante/, /gorra/, /polarizada/]],
    ['Submarina', [/submarina/, /submarino/, /escarpín/, /escarpin/, /espadon/, /fusil/, /mascara/]],
  ]

  for (const [cat, patterns] of categoryRules) {
    if (patterns.some(p => p.test(lower))) return cat
  }

  // Heuristic: if title has no clear category but has brand → Accesorios
  if (POPULAR_BRANDS.some(b => lower.startsWith(b))) return 'Accesorios'

  return 'Equipo'
}

function extractBrand(title: string): string | null {
  const lower = title.toLowerCase()
  for (const b of POPULAR_BRANDS) {
    if (lower.startsWith(b)) return b.charAt(0).toUpperCase() + b.slice(1)
  }
  return null
}

function parseSpanishPrice(text: string): number | null {
  const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

async function scrapePage(page: Page, pageNum: number): Promise<RawCard[]> {
  await new Promise(r => setTimeout(r, 2000))
  await page.evaluate(() => window.scrollTo(0, 0))
  await new Promise(r => setTimeout(r, 1000))

  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollBy(0, 500))
    await new Promise(r => setTimeout(r, 800))
  }
  await new Promise(r => setTimeout(r, 2000))

  const data = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(
      '[class*="product-card"], [class*="ProductCard"], [class*="product-tile"], [class*="ProductTile"]'
    ))

    const results: Array<{
      title: string; priceText: string; url: string; imageUrl: string | null
      badges: string[]; rating: string; reviews: string
    }> = []
    const seen = new Set<string>()

    for (const card of cards) {
      const link = card.querySelector<HTMLAnchorElement>('a[href*="/p/"]')
      if (!link) continue
      const url = link.href
      if (seen.has(url)) continue
      seen.add(url)

      const titleEl = card.querySelector(
        '[class*="title"], [class*="Title"], h2, h3, [class*="name"], [class*="Name"], [class*="product-label"]'
      )
      const title = titleEl?.textContent?.trim() || ''

      const priceEl = card.querySelector('[class*="price"], [class*="Price"]')
      const priceText = priceEl?.textContent?.trim().replace(/\s+/g, '') || ''

      const img = card.querySelector<HTMLImageElement>('img[src*="media"]')
      const imageUrl = img?.getAttribute('src') || img?.getAttribute('data-src') || null

      const badges: string[] = []
      card.querySelectorAll('[class*="badge"], [class*="Badge"]').forEach(el => {
        const t = el.textContent?.trim()
        if (t) badges.push(t)
      })

      const ratingEl = card.querySelector('[class*="rating"], [class*="Rating"], [class*="star"], [class*="Star"]')
      const rating = ratingEl?.textContent?.trim() || ''
      const reviewsEl = card.querySelector('[class*="review-count"], [class*="nb-review"]')
      const reviews = reviewsEl?.textContent?.trim() || ''

      if (title || priceText) {
        results.push({ title: title.slice(0, 150), priceText, url, imageUrl, badges, rating, reviews })
      }
    }
    return { products: results, totalCards: cards.length }
  }, pageNum)

  const products: RawCard[] = data.products.map(p => {
    const prices = { salePrice: null as number | null, originalPrice: null as number | null, discountPercent: null as number | null }
    const priceMatch = p.priceText.match(/(\d+[.,]\d{2})/)
    if (priceMatch) prices.salePrice = parseSpanishPrice(priceMatch[1])

    const priceParts = p.priceText.match(/(\d+[.,]\d{2})/g)
    if (priceParts && priceParts.length >= 2) {
      prices.originalPrice = parseSpanishPrice(priceParts[priceParts.length - 1])
    }

    const discMatch = p.priceText.match(/(\d+)%/)
    if (discMatch) {
      prices.discountPercent = parseInt(discMatch[1], 10)
    }

    if (!prices.originalPrice && prices.salePrice && prices.discountPercent) {
      prices.originalPrice = Math.round(prices.salePrice / (1 - prices.discountPercent / 100) * 100) / 100
    }
    if (prices.originalPrice && prices.salePrice && !prices.discountPercent && prices.originalPrice > prices.salePrice) {
      prices.discountPercent = Math.round(((prices.originalPrice - prices.salePrice) / prices.originalPrice) * 100)
    }

    let rating: number | null = null
    if (p.rating) {
      const r = p.rating.match(/[\d.,]+/)
      if (r) rating = parseFloat(r[0].replace(',', '.'))
    }

    let reviewsCount: number | null = null
    if (p.reviews) {
      const r = p.reviews.match(/\d+/)
      if (r) reviewsCount = parseInt(r[0], 10)
    }

    return {
      title: p.title,
      salePrice: prices.salePrice || null,
      originalPrice: prices.originalPrice || null,
      discountPercent: prices.discountPercent || null,
      url: p.url,
      imageUrl: p.imageUrl,
      rating,
      reviewsCount,
      badges: p.badges,
    }
  })

  return products
}

async function hasNextPage(page: Page): Promise<boolean> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await new Promise(r => setTimeout(r, 2000))

  return page.evaluate(() => {
    const all = Array.from(document.querySelectorAll<HTMLElement>('button, a, [role="button"]'))
    for (const el of all) {
      const aria = el.getAttribute('aria-label') || ''
      if (aria.includes('siguiente') || aria.includes('Siguiente')) {
        const isDisabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
        return !isDisabled
      }
    }
    return false
  }) as Promise<boolean>
}

async function clickNextPage(page: Page): Promise<boolean> {
  const clicked = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll<HTMLElement>('button, a, [role="button"]'))
    for (const el of all) {
      const aria = el.getAttribute('aria-label') || ''
      if (aria.includes('siguiente') || aria.includes('Siguiente')) {
        const isDisabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
        if (!isDisabled) {
          el.click()
          return true
        }
      }
    }
    return false
  })

  if (clicked) {
    await new Promise(r => setTimeout(r, 5000))
    try { await page.waitForLoadState('networkidle', { timeout: 20000 }) } catch {}
    return true
  }
  return false
}

async function waitForCaptcha(page: Page): Promise<void> {
  let captchaText = await page.evaluate(() => document.body?.textContent?.slice(0, 200) || '')
  if (captchaText.toLowerCase().includes('verificación') || captchaText.toLowerCase().includes('verify')) {
    console.log('   ⚠️ Captcha detectado. Resuélvelo en la ventana de Brave.')
    console.log('   Esperando hasta 180s...')
    for (let i = 180; i > 0; i--) {
      process.stdout.write(`\r   ${i}s... `)
      await new Promise(r => setTimeout(r, 1000))
      captchaText = await page.evaluate(() => document.body?.textContent?.slice(0, 200) || '')
      if (!captchaText.toLowerCase().includes('verificación') && !captchaText.toLowerCase().includes('verify')) {
        console.log('\n   ✅ Captcha resuelto!')
        break
      }
    }
    await new Promise(r => setTimeout(r, 5000))
  }
}

export interface ScrapeOptions {
  maxPages?: number
  minDiscount?: number
  headless?: boolean
  onProgress?: (pageNum: number, newCount: number, total: number) => void
}

export async function scrapeDecathlonDeals(options?: ScrapeOptions): Promise<DecathlonProduct[]> {
  const maxPages = options?.maxPages ?? 12
  const headless = options?.headless ?? false
  const onProgress = options?.onProgress

  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true })
  }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath: BRAVE_PATH,
    headless,
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

  try {
    await page.goto(DEALS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await waitForCaptcha(page)

    const allProducts: DecathlonProduct[] = []
    const seenUrls = new Set<string>()

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const cards = await scrapePage(page, pageNum)

      let newCount = 0
      for (const c of cards) {
        if (seenUrls.has(c.url)) continue
        seenUrls.add(c.url)

        const brand = extractBrand(c.title)
        const category = categorizeProduct(c.title)

        allProducts.push({
          title: c.title,
          salePrice: c.salePrice,
          originalPrice: c.originalPrice,
          discountPercent: c.discountPercent,
          url: c.url,
          imageUrl: c.imageUrl,
          rating: c.rating,
          reviewsCount: c.reviewsCount,
          brand,
          category,
          badges: c.badges,
        })
        newCount++
      }

      onProgress?.(pageNum, newCount, allProducts.length)

      if (pageNum >= maxPages) break

      const hasNext = await hasNextPage(page)
      if (!hasNext) break

      const ok = await clickNextPage(page)
      if (!ok) break
    }

    return allProducts

  } catch (err) {
    console.error('Error scraping Decathlon:', err)
    return []
  } finally {
    await context.close()
  }
}

export interface DecathlonDetails {
  ean: string | null
  description: string | null
  specs: Record<string, string>
  images: string[]
  brand: string | null
}

export async function scrapeDecathlonDetails(url: string): Promise<DecathlonDetails> {
  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true })
  }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath: BRAVE_PATH,
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

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })

    const data = await page.evaluate(() => {
      const result: { ean: string | null; description: string | null; specs: Record<string, string>; images: string[]; brand: string | null } = {
        ean: null, description: null, specs: {}, images: [], brand: null,
      }

      // JSON-LD
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      for (const s of scripts) {
        try {
          const d = JSON.parse(s.textContent || '')
          if (d['@type'] === 'Product') {
            result.ean = d.gtin13 || d.gtin || null
            result.brand = d.brand?.name || d.brand || null
            result.description = d.description || null
          }
        } catch {}
      }

      // Images from gallery
      const imgs = document.querySelectorAll<HTMLImageElement>('img[src*="media"]')
      const seen = new Set<string>()
      imgs.forEach(img => {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || ''
        if (src && !seen.has(src)) {
          seen.add(src)
          result.images.push(src)
        }
      })

      // Specs table
      const specRows = document.querySelectorAll('[class*="spec"] tr, [class*="caracteristica"] tr, [class*="caract"] tr')
      specRows.forEach(row => {
        const cells = row.querySelectorAll('td, th')
        if (cells.length >= 2) {
          const key = cells[0]?.textContent?.trim() || ''
          const val = cells[1]?.textContent?.trim() || ''
          if (key && val) result.specs[key] = val
        }
      })

      return result
    })

    return data

  } catch {
    return { ean: null, description: null, specs: {}, images: [], brand: null }
  } finally {
    await context.close()
  }
}

export async function downloadDecathlonImages(products: DecathlonProduct[], outputDir: string): Promise<string[]> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const saved: string[] = []

  for (const p of products) {
    if (!p.imageUrl) continue

    const urlObj = new URL(p.imageUrl)
    const filename = urlObj.pathname.split('/').pop() || `${Date.now()}.jpg`
    const outputPath = path.join(outputDir, filename)

    if (fs.existsSync(outputPath)) {
      saved.push(outputPath)
      continue
    }

    try {
      const response = await fetch(p.imageUrl)
      if (!response.ok) continue
      const buffer = Buffer.from(await response.arrayBuffer())
      fs.writeFileSync(outputPath, buffer)
      saved.push(outputPath)
    } catch {}
  }

  return saved
}

// Browser availability check
export function braveAvailable(): boolean {
  try {
    return fs.existsSync(BRAVE_PATH)
  } catch {
    return false
  }
}
