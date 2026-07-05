import { chromium } from 'playwright'
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

interface ProductEntry {
  title: string
  brand: string | null
  salePrice: number | null
  originalPrice: number | null
  discountPercent: number | null
  url: string
  imageUrl: string | null
  rating: number | null
  reviewsCount: number | null
  category: string | null
  badges: string[]
  page: number
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

function parseSpanishPrice(text: string): number | null {
  const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}



async function scrapePage(page: any, pageNum: number): Promise<{ products: ProductEntry[]; totalPages: number }> {
  console.log(`\n📄 Página ${pageNum}:`)

  await sleep(2000)
  await page.evaluate(() => window.scrollTo(0, 0))
  await sleep(1000)

  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollBy(0, 500))
    await sleep(800)
  }
  await sleep(2000)

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
  })

  console.log(`   ${data.products.length} productos encontrados`)

  const products: ProductEntry[] = (data.products as Array<any>).map((p: any) => {
    const priceMatch = p.priceText.match(/(\d+[.,]\d{2})/)
    const salePrice = priceMatch ? parseSpanishPrice(priceMatch[1]) : null

    let originalPrice: number | null = null
    let discountPercent: number | null = null

    const priceParts = p.priceText.match(/(\d+[.,]\d{2})/g)
    if (priceParts && priceParts.length >= 2) {
      originalPrice = parseSpanishPrice(priceParts[1])
    }

    const discMatch = p.priceText.match(/(\d+)%/)
    if (discMatch) {
      discountPercent = parseInt(discMatch[1], 10)
    } else if (originalPrice && salePrice && originalPrice > salePrice) {
      discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    }

    let rating: number | null = null
    if (p.rating) {
      const r = p.rating.match(/[\d.,]+/)
      if (r) rating = parseFloat(r[0].replace(',', '.'))
    }
    if (rating === null) {
      const textMatch = p.title.match(/★([\d.]+)/)
      if (textMatch) rating = parseFloat(textMatch[1])
    }

    let reviewsCount: number | null = null
    if (p.reviews) {
      const r = p.reviews.match(/\d+/)
      if (r) reviewsCount = parseInt(r[0], 10)
    }

    const brand = (() => {
      const lower = p.title.toLowerCase()
      for (const b of POPULAR_BRANDS) {
        if (lower.startsWith(b)) return b.charAt(0).toUpperCase() + b.slice(1)
      }
      return null
    })()

    return {
      title: p.title,
      brand,
      salePrice: salePrice || (originalPrice ? Math.round(originalPrice / 1.3 * 100) / 100 : null),
      originalPrice,
      discountPercent,
      url: p.url,
      imageUrl: p.imageUrl,
      rating,
      reviewsCount,
      category: null,
      badges: p.badges,
      page: pageNum,
    }
  })

  return { products, totalPages: 0 }
}

async function hasNextPage(page: any): Promise<boolean> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await sleep(2000)

  const result = await page.evaluate(() => {
    const all = document.querySelectorAll<HTMLElement>('button, a, [role="button"]')
    for (const el of all) {
      const aria = el.getAttribute('aria-label') || ''
      if (aria.includes('siguiente') || aria.includes('Siguiente')) {
        const isDisabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
        return !isDisabled
      }
    }
    return false
  })
  return result
}

async function clickNextPage(page: any): Promise<boolean> {
  const clicked = await page.evaluate(() => {
    const all = document.querySelectorAll<HTMLElement>('button, a, [role="button"]')
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
    await sleep(5000)
    try { await page.waitForLoadState('networkidle', { timeout: 20000 }) } catch {}
    return true
  }
  return false
}

async function main() {
  console.log('')
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   Decathlon Fishing Deals Full Scraper   ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log('')
  console.log(`Perfil persistente: ${USER_DATA_DIR}`)

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
      '--no-sandbox',
    ],
  })

  const page = context.pages()[0] || await context.newPage()

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })

  try {
    console.log('\n1. Cargando página inicial...')
    await page.goto(DEALS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })

    let captchaText = await page.evaluate(() => document.body?.textContent?.slice(0, 200) || '')
    if (captchaText.toLowerCase().includes('verificación') || captchaText.toLowerCase().includes('verify')) {
      console.log('   ⚠️ Captcha detectado. Resuélvelo en la ventana de Brave.')
      console.log('   Esperando hasta 180s...')
      for (let i = 180; i > 0; i--) {
        process.stdout.write(`\r   ${i}s... `)
        await sleep(1000)
        captchaText = await page.evaluate(() => document.body?.textContent?.slice(0, 200) || '')
        if (!captchaText.toLowerCase().includes('verificación') && !captchaText.toLowerCase().includes('verify')) {
          console.log('\n   ✅ Captcha resuelto!')
          break
        }
      }
      await sleep(5000)
    }

    const allProducts: ProductEntry[] = []
    const seenUrls = new Set<string>()
    const maxPages = 12

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const { products } = await scrapePage(page, pageNum)

      let newCount = 0
      for (const p of products) {
        if (seenUrls.has(p.url)) continue
        seenUrls.add(p.url)
        allProducts.push(p)
        newCount++
      }
      console.log(`   → ${newCount} nuevos (total: ${allProducts.length})`)

      if (pageNum >= maxPages) break

      const hasNext = await hasNextPage(page)
      if (!hasNext) {
        console.log('\n   → No se detectó paginación')
        break
      }

      console.log('   → Pasando a siguiente página...')
      const ok = await clickNextPage(page)
      if (!ok) {
        console.log('   → No se pudo navegar')
        break
      }
    }

    console.log(`\n✅ Total: ${allProducts.length} productos extraídos`)

    const withGoodDiscount = allProducts
      .filter(p => p.discountPercent !== null && p.discountPercent >= 15)
      .sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0))

    const topBrands = withGoodDiscount.filter(p =>
      p.brand && ['Shimano', 'Daiwa', 'Mitchell', 'Rapala', 'Abu Garcia', 'Penn', 'Beuchat', 'Garbolino']
        .some(b => p.brand?.toLowerCase() === b.toLowerCase())
    )

    console.log(`\n📊 Resumen:`)
    console.log(`   Total productos: ${allProducts.length}`)
    console.log(`   Con descuento ≥15%: ${withGoodDiscount.length}`)
    console.log(`   Marcas top con descuento: ${topBrands.length}`)

    if (topBrands.length > 0) {
      console.log(`\n🏆 Top ofertas por marca:`)
      topBrands.slice(0, 15).forEach((p, i) => {
        const disc = p.discountPercent ? `${p.discountPercent}%` : '?'
        const price = p.salePrice ? `${p.salePrice.toFixed(2)}€` : '?€'
        console.log(`   ${(i+1).toString().padStart(2)}. ${disc.padStart(4)} ${price.padStart(9)} ${(p.brand || '?').padEnd(12)} ${p.title.slice(0, 55)}`)
      })
    }

    const outFile = path.resolve('scripts', 'discover', `decathlon-full-${Date.now()}.json`)
    fs.writeFileSync(outFile, JSON.stringify({
      generatedAt: new Date().toISOString(),
      url: DEALS_URL,
      totalProducts: allProducts.length,
      topDeals: topBrands.slice(0, 30),
      allProducts,
    }, null, 2))
    console.log(`\n📁 Guardado: ${outFile}`)

  } catch (err) {
    console.error('Error:', err)
  } finally {
    console.log('\nCerrando navegador...')
    await context.close()
    console.log('✅ Perfil guardado (próxima ejecución sin captcha)')
  }
}

main()
