// @ts-nocheck
import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { bravePage, braveAvailable, closeBrave } from '../../src/lib/price-scraper/brave'

interface DecathlonDeal {
  title: string
  brand: string | null
  price: number | null
  originalPrice: number | null
  discountPercent: number | null
  url: string | null
  rating: number | null
  reviewsCount: number | null
  imageUrl: string | null
  badges: string[]
  hasColors: boolean
  inStock: boolean
}

const DEALS_URL = 'https://www.decathlon.es/es/deals/f-sport_fishing_pesca-a-la-bolonesa_pesca-a-la-inglesa_pesca-a-la-tenya_pesca-al-coup-con-cana-enchufable_pesca-al-coup-con-cana-telescopica_pesca-al-quiver-feeder_pesca-al-surfcasting_pesca-al-toque_pesca-bajo-hielo_pesca-con-bombeta_pesca-con-flotador_pesca-con-gobio-manejado_pesca-con-jibionera_pesca-con-jig_pesca-con-mosca_pesca-con-pez-muerto-manejado_pesca-con-senuelos_pesca-de-arrastre_pesca-de-cangrejo-de-rio_pesca-de-la-lucioperca-con-senuelo_pesca-de-la-perca-con-senuelo_pesca-de-la-trucha-con-senuelo_pesca-de-sepia-y-calamar_pesca-de-sostener_pesca-de-truchas-en-embalse_pesca-del-black-bass-con-senuelo_pesca-del-lucio-con-senuelo_pesca-del-siluro_pesca-en-barco_pesca-en-kayak_pesca-exotica_pesca-fija_pesca-fija-1_pesca-submarina'

const POPULAR_BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'shakespeare', 'okuma', 'rapala', 'savage gear', 'caperlan',
  'ryobi', 'yuki', 'lineaeffe', 'beuchat', 'garbolino',
  'national geographic', 'storm', 'ragot', 'yo-zuri',
]

function extractBrand(title: string): string | null {
  const lower = title.toLowerCase()
  for (const brand of POPULAR_BRANDS) {
    if (lower.startsWith(brand)) {
      return brand.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
  }
  const firstWord = title.split(/\s+/)[0]
  if (firstWord && firstWord.length >= 2 && firstWord === firstWord.toUpperCase()) {
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase()
  }
  return null
}

function parsePrice(text: string): number | null {
  const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseDiscount(text: string): number | null {
  const match = text.match(/(\d+)\s*%/i)
  if (match) return parseInt(match[1], 10)
  const euroMatch = text.match(/(\d+[.,]?\d*)\s*€\s*de\s*descuento/i)
  if (euroMatch) return null
  return null
}

async function scrapePage(page: any, url: string, pageNum: number): Promise<DecathlonDeal[]> {
  console.log(`  📄 Página ${pageNum}: cargando...`)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(8000)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(2000)

  const debugInfo = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('/p/'))
    const allImgs = document.querySelectorAll('img').length
    const bodyText = document.body?.textContent?.substring(0, 500) || ''
    return { linkCount: allLinks.length, firstFewLinks: allLinks.slice(0, 5), imgCount: allImgs, bodyPreview: bodyText.replace(/\s+/g, ' ').trim().slice(0, 300) }
  })
  console.log(`     Debug: ${debugInfo.linkCount} links /p/, ${debugInfo.imgCount} imágenes`)
  if (debugInfo.linkCount === 0) {
    console.log(`     Body preview: ${debugInfo.bodyPreview}`)
  }

  const products = await page.evaluate(() => {
    const items = document.querySelectorAll<HTMLElement>(
      'a[href*="/p/"]'
    )
    const links = new Set<string>()
    const results: Array<{
      title: string
      price: string
      originalPrice: string
      discount: string
      rating: string
      reviews: string
      url: string
      image: string
      badges: string[]
      hasColors: boolean
      inStock: boolean
    }> = []

    for (const item of items) {
      let url = ''
      const anchor = item.tagName === 'A' ? item : item.querySelector<HTMLAnchorElement>('a[href*="/p/"]')
      if (anchor) {
        url = (anchor as HTMLAnchorElement).href || anchor.getAttribute('href') || ''
        if (url && !url.startsWith('http')) url = `https://www.decathlon.es${url}`
      }
      if (!url || !url.includes('/p/')) continue
      if (links.has(url)) continue
      links.add(url)

      const title = item.textContent?.trim().split('\n')[0]?.trim()
        || anchor?.getAttribute('title')
        || item.querySelector('h2, h3, [class*="title"], [class*="Title"]')?.textContent?.trim()
        || ''

      const priceEl = item.querySelector('[class*="price"], [class*="Price"], .price')
      const price = priceEl?.textContent?.trim() || ''

      const originalEl = item.querySelector('[class*="original"], [class*="Original"], [class*="old"], [class*="Old"], [class*="before"], s, del, [class*="strikethrough"]')
      const originalPrice = originalEl?.textContent?.trim() || ''

      const discountEl = item.querySelector('[class*="discount"], [class*="Discount"], [class*="badge"], [class*="Badge"], [class*="percent"]')
      const discount = discountEl?.textContent?.trim() || ''

      const ratingEl = item.querySelector('[class*="rating"], [class*="Rating"], [aria-label*="estrella"], [aria-label*="star"], [itemprop="ratingValue"]')
      const rating = ratingEl?.getAttribute('aria-label') || ratingEl?.textContent?.trim() || ''

      const reviewsEl = item.querySelector('[class*="review"], [class*="Review"], [itemprop="reviewCount"]')
      const reviews = reviewsEl?.textContent?.trim() || ''

      const img = item.querySelector<HTMLImageElement>('img[src*="media"]')
      const image = img?.getAttribute('src') || img?.getAttribute('data-src') || ''

      const badges: string[] = []
      const badgeEls = item.querySelectorAll('[class*="badge"], [class*="Badge"], [class*="tag"], [class*="Tag"]')
      badgeEls.forEach(el => {
        const t = el.textContent?.trim()
        if (t) badges.push(t)
      })

      const hasColors = !!item.querySelector('[class*="color"], [class*="Color"]')

      const isOutOfStock = item.textContent?.toLowerCase().includes('agotado')
        || item.textContent?.toLowerCase().includes('sin stock')

      if (title && price) {
        results.push({
          title: title.slice(0, 150),
          price,
          originalPrice,
          discount,
          rating,
          reviews,
          url,
          image,
          badges,
          hasColors,
          inStock: !isOutOfStock,
        })
      }
    }
    return results
  })

  console.log(`     Encontrados ${products.length} productos en página ${pageNum}`)
  return products.map((p: any) => {
    const price = parsePrice(p.price ?? '')
    const originalPrice = p.originalPrice ? parsePrice(p.originalPrice) : null
    let discountPercent = parseDiscount(p.discount)
    if (!discountPercent && originalPrice && price) {
      discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100)
    }
    const ratingMatch = p.rating?.match(/[\d.,]+/)
    const rating = ratingMatch ? parseFloat(ratingMatch[0].replace(',', '.')) : null
    const reviewsMatch = (p.reviews ?? '').match(/\d+/)
    const reviewsCount = reviewsMatch ? parseInt(reviewsMatch[0], 10) : null

    return {
      title: p.title,
      brand: extractBrand(p.title ?? ''),
      price,
      originalPrice: originalPrice || price ? Math.round((price || 0) * 1.3 * 100) / 100 : null,
      discountPercent,
      url: p.url,
      rating,
      reviewsCount,
      imageUrl: p.image || null,
      badges: p.badges,
      hasColors: p.hasColors,
      inStock: p.inStock,
    }
  })
}

async function hasNextPage(page: any): Promise<boolean> {
  const nextBtn = await page.evaluate(() => {
    const next = document.querySelector('[class*="pagination"] a[rel="next"], [class*="Pagination"] a[rel="next"], a[aria-label="Siguiente"], [class*="next"] a, button[aria-label="Siguiente"]')
    return next ? true : false
  })
  if (!nextBtn) return false

  const disabled = await page.evaluate(() => {
    const next = document.querySelector('[class*="pagination"] a[rel="next"], [class*="Pagination"] a[rel="next"], a[aria-label="Siguiente"], [class*="next"] a, button[aria-label="Siguiente"]')
    if (!next) return true
    return next.hasAttribute('disabled') || next.classList.contains('disabled') || next.getAttribute('aria-disabled') === 'true'
  })
  return !disabled
}

async function clickNextPage(page: any): Promise<string | null> {
  const nextUrl = await page.evaluate(() => {
    const next = document.querySelector<HTMLAnchorElement>('[class*="pagination"] a[rel="next"], [class*="Pagination"] a[rel="next"], a[aria-label="Siguiente"], [class*="next"] a')
    if (next && next.href) return next.href
    const btn = document.querySelector<HTMLButtonElement>('button[aria-label="Siguiente"]')
    if (btn && !btn.disabled) {
      btn.click()
      return 'clicked'
    }
    return null
  })
  return nextUrl
}

async function main() {
  if (!braveAvailable()) {
    console.error('Brave no está disponible')
    process.exit(1)
  }

  console.log('')
  console.log('=== Scrapeo de ofertas Decathlon (Pesca) ===')
  console.log(`URL: ${DEALS_URL}`)
  console.log('')

  const allProducts: DecathlonDeal[] = []
  const seenUrls = new Set<string>()
  const page = await bravePage(false)

  try {
    let pageUrl = DEALS_URL
    let pageNum = 1
    let maxPages = 12

    while (pageNum <= maxPages) {
      const products = await scrapePage(page, pageUrl, pageNum)
      let newCount = 0
      for (const p of products) {
        if (p.url && seenUrls.has(p.url)) continue
        if (p.url) seenUrls.add(p.url)
        allProducts.push(p)
        newCount++
      }
      console.log(`     ${newCount} nuevos (total: ${allProducts.length})`)
      console.log('')

      if (pageNum >= maxPages) break

      const hasNext = await hasNextPage(page)
      if (!hasNext) {
        console.log('  → No hay más páginas')
        break
      }

      const next = await clickNextPage(page)
      if (next && next !== 'clicked') {
        pageUrl = next
      } else if (next === 'clicked') {
        await page.waitForTimeout(4000)
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
      } else {
        console.log('  → No se pudo navegar a siguiente página')
        break
      }
      pageNum++
    }

    console.log(`\n✅ Extraídos ${allProducts.length} productos de Decathlon`)
    console.log('')

    const withDiscount = allProducts.filter(p => p.discountPercent !== null && p.discountPercent >= 15)
    const goodBrands = withDiscount.filter(p =>
      p.brand && POPULAR_BRANDS.some(b => p.brand!.toLowerCase().includes(b))
    )

    console.log(`  Con descuento ≥15%: ${withDiscount.length}`)
    console.log(`  Marcas conocidas con descuento: ${goodBrands.length}`)
    console.log('')

    const scored = goodBrands.sort((a, b) => {
      let scoreA = 0
      if (a.discountPercent) scoreA += a.discountPercent * 2
      if (a.rating) scoreA += a.rating * 5
      if (a.reviewsCount && a.reviewsCount > 10) scoreA += 10
      if (a.brand?.toLowerCase() === 'shimano' || a.brand?.toLowerCase() === 'daiwa') scoreA += 20
      if (a.inStock) scoreA += 5

      let scoreB = 0
      if (b.discountPercent) scoreB += b.discountPercent * 2
      if (b.rating) scoreB += b.rating * 5
      if (b.reviewsCount && b.reviewsCount > 10) scoreB += 10
      if (b.brand?.toLowerCase() === 'shimano' || b.brand?.toLowerCase() === 'daiwa') scoreB += 20
      if (b.inStock) scoreB += 5
      return scoreB - scoreA
    })

    const top20 = scored.slice(0, 20)

    console.log('  TOP 20 chollos Decathlon:')
    console.log('  ' + '─'.repeat(80))
    top20.forEach((p, i) => {
      const discountStr = p.discountPercent ? `${p.discountPercent}%` : '?%'
      const ratingStr = p.rating ? `★${p.rating.toFixed(1)}` : '★?'
      const reviewsStr = p.reviewsCount ? `(${p.reviewsCount})` : ''
      const stockStr = p.inStock ? '' : ' 🔴AGOTADO'
      console.log(`  ${(i + 1).toString().padStart(2)}. ${discountStr.padStart(4)} │ ${(p.brand || '?').padEnd(14)} │ ${p.price?.toFixed(2).padStart(7)}€ │ ${ratingStr}${reviewsStr.padEnd(8)} │ ${p.title.slice(0, 55)}${stockStr}`)
    })
    console.log('  ' + '─'.repeat(80))
    console.log('')

    const outFile = path.resolve('scripts', 'discover', `decathlon-deals-${Date.now()}.json`)
    fs.writeFileSync(outFile, JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalProducts: allProducts.length,
      withDiscount: withDiscount.length,
      goodBrands: goodBrands.length,
      url: DEALS_URL,
      allProducts,
      top20,
    }, null, 2))
    console.log(`📁 Datos guardados en: ${outFile}`)

  } finally {
    await page.close().catch(() => {})
    await closeBrave()
  }
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
