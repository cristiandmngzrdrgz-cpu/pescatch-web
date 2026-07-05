import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'

const DEALS_URL = 'https://www.decathlon.es/es/deals/f-sport_fishing_pesca-a-la-bolonesa_pesca-a-la-inglesa_pesca-a-la-tenya_pesca-al-coup-con-cana-enchufable_pesca-al-coup-con-cana-telescopica_pesca-al-quiver-feeder_pesca-al-surfcasting_pesca-al-toque_pesca-bajo-hielo_pesca-con-bombeta_pesca-con-flotador_pesca-con-gobio-manejado_pesca-con-jibionera_pesca-con-jig_pesca-con-mosca_pesca-con-pez-muerto-manejado_pesca-con-senuelos_pesca-de-arrastre_pesca-de-cangrejo-de-rio_pesca-de-la-lucioperca-con-senuelo_pesca-de-la-perca-con-senuelo_pesca-de-la-trucha-con-senuelo_pesca-de-sepia-y-calamar_pesca-de-sostener_pesca-de-truchas-en-embalse_pesca-del-black-bass-con-senuelo_pesca-del-lucio-con-senuelo_pesca-del-siluro_pesca-en-barco_pesca-en-kayak_pesca-exotica_pesca-fija_pesca-fija-1_pesca-submarina'

const POPULAR_BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'shakespeare', 'okuma', 'rapala', 'savage gear', 'caperlan',
  'ryobi', 'yuki', 'lineaeffe', 'beuchat', 'garbolino',
  'national geographic', 'storm', 'williamson', 'suissex',
]

interface RawProduct {
  title: string
  url: string
  price: string
  originalPrice: string
  discount: string
  reviews: string
  image: string
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(30000),
  })
  return res.text()
}

function extractProducts(html: string): RawProduct[] {
  const products: RawProduct[] = []
  const seen = new Set<string>()

  const urlPattern = /href="(https:\/\/www\.decathlon\.es\/es\/p\/[^"]+)"/gi
  let match: RegExpExecArray | null

  while ((match = urlPattern.exec(html)) !== null) {
    const url = match[1].split('?')[0]
    if (seen.has(url)) continue
    seen.add(url)
  }

  for (const url of seen) {
    const productId = url.split('/').filter(s => /^\d/.test(s) || s.startsWith('m')).join('/')
    const nameMatch = html.match(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^>]*>([^<]+)', 'i'))
    let title = ''
    if (nameMatch) {
      title = nameMatch[1].trim()
    } else {
      const altMatch = html.match(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^>]*title="([^"]+)"', 'i'))
      if (altMatch) title = altMatch[1].trim()
    }

    const priceRegex = new RegExp(
      url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      `[^€]*?(\\d+[.,]\\d{2})\\s*€`,
      'i'
    )
    const priceMatch = html.match(priceRegex)
    const price = priceMatch ? priceMatch[1] : ''

    const originalRegex = new RegExp(
      url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      `.*?PVPR\\s*(\\d+[.,]\\d{2})`,
      'is'
    )
    const origMatch = html.match(originalRegex)
    const originalPrice = origMatch ? origMatch[1] : ''

    const discountRegex = new RegExp(
      url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      `.*?(\\d+%\\s*de\\s*descuento|\\d+[.,]?\\d*\\s*€\\s*de\\s*descuento)`,
      'is'
    )
    const discMatch = html.match(discountRegex)
    const discount = discMatch ? discMatch[1] : ''

    const reviewsRegex = new RegExp(
      url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      `[^()]*\\((\\d+)\\)`,
      'i'
    )
    const revMatch = html.match(reviewsRegex)
    const reviews = revMatch ? revMatch[1] : ''

    const imgRegex = new RegExp(
      `<img[^>]*src="([^"]*media\\.decathlon\\.com[^"]*)"[^>]*>`,
      'gi'
    )
    let imgMatch
    let image = ''
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const imgUrl = imgMatch[1]
      if (html.indexOf(imgUrl) < html.indexOf(url) + 100 && html.indexOf(imgUrl) > html.indexOf(url) - 500) {
        image = imgUrl
      }
    }

    if (title || price) {
      products.push({ title, url, price, originalPrice, discount, reviews, image })
    }
  }

  return products
}

function extractBrand(title: string): string | null {
  const lower = title.toLowerCase()
  for (const brand of POPULAR_BRANDS) {
    if (lower.startsWith(brand)) return brand.charAt(0).toUpperCase() + brand.slice(1)
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

async function fetchDetail(url: string) {
  try {
    const html = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(15000),
    }).then(r => r.text())

    const jsonLd = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
    if (!jsonLd) return null

    for (const block of jsonLd) {
      try {
        const data = JSON.parse(block.replace(/<script[^>]*>|<\/script>/gi, '').trim())
        if (data['@type'] === 'Product') {
          const specs: Record<string, string> = {}
          const specRows = html.match(/<th[^>]*>(.+?)<\/th>\s*<td[^>]*>(.+?)<\/td>/gi)
          if (specRows) {
            for (const row of specRows) {
              const th = row.match(/<th[^>]*>(.+?)<\/th>/)
              const td = row.match(/<td[^>]*>(.+?)<\/td>/)
              if (th && td) {
                const key = th[1].replace(/<[^>]*>/g, '').trim()
                const val = td[1].replace(/<[^>]*>/g, '').trim()
                if (key && val) specs[key] = val
              }
            }
          }

          return {
            description: data.description || null,
            brand: data.brand?.name || data.brand || null,
            gtin: data.gtin13 || data.gtin || null,
            sku: data.sku || null,
            image: data.image || (Array.isArray(data.image) ? data.image[0] : null) || null,
            specs,
          }
        }
      } catch {}
    }
    return null
  } catch {
    return null
  }
}

async function main() {
  console.log('')
  console.log('=== Decathlon Deals Scraper (fetch) ===')
  console.log('')

  console.log('Descargando listing...')
  const html = await fetchHtml(DEALS_URL)

  const rawProducts = extractProducts(html)
  console.log(`Encontrados ${rawProducts.length} productos en el HTML\n`)

  const products = rawProducts.map(p => ({
    title: p.title,
    brand: extractBrand(p.title),
    price: parsePrice(p.price),
    originalPrice: parsePrice(p.originalPrice) || (parsePrice(p.price) ? Math.round(parsePrice(p.price)! * 1.3 * 100) / 100 : null),
    discountPercent: (() => {
      const price = parsePrice(p.price)
      const orig = parsePrice(p.originalPrice)
      if (price && orig && orig > price) return Math.round(((orig - price) / orig) * 100)
      const discMatch = p.discount.match(/(\d+)%\s*de\s*descuento/i)
      return discMatch ? parseInt(discMatch[1], 10) : null
    })(),
    url: p.url,
    reviews: p.reviews ? parseInt(p.reviews, 10) : null,
    imageUrl: p.image || null,
  }))

  const withDiscount = products.filter(p => p.discountPercent !== null && p.discountPercent >= 15)
  const goodBrand = withDiscount.filter(p => p.brand && POPULAR_BRANDS.some(b => p.brand!.toLowerCase().includes(b)))

  console.log(`Productos totales: ${products.length}`)
  console.log(`Con descuento ≥15%: ${withDiscount.length}`)
  console.log(`Marcas conocidas con descuento: ${goodBrand.length}\n`)

  const topCandidates = goodBrand
    .sort((a, b) => {
      const scoreA = (a.discountPercent || 0) * 2 +
        (a.brand?.toLowerCase() === 'shimano' || a.brand?.toLowerCase() === 'daiwa' ? 20 : 0) +
        (a.reviews && a.reviews > 10 ? 10 : 0)
      const scoreB = (b.discountPercent || 0) * 2 +
        (b.brand?.toLowerCase() === 'shimano' || b.brand?.toLowerCase() === 'daiwa' ? 20 : 0) +
        (b.reviews && b.reviews > 10 ? 10 : 0)
      return scoreB - scoreA
    })
    .slice(0, 20)

  console.log('── TOP 20 chollos Decathlon (fetch) ──')
  console.log('  ' + '─'.repeat(90))
  topCandidates.forEach((p, i) => {
    const disc = p.discountPercent ? `${p.discountPercent}%` : '?%'
    const rev = p.reviews ? `(${p.reviews})` : ''
    const brand = (p.brand || '?').padEnd(14)
    const priceStr = p.price ? `${p.price.toFixed(2)}€` : '?€'
    const origStr = parsePrice('') // skip original price display
    console.log(`  ${(i + 1).toString().padStart(2)}. ${disc.padStart(4)} │ ${brand} │ ${priceStr.padStart(8)} │ ★${rev.padEnd(6)} │ ${p.title.slice(0, 55)}`)
  })
  console.log('  ' + '─'.repeat(90))
  console.log('')

  const existingCache = JSON.parse(fs.readFileSync(
    path.resolve('scripts', 'discover', 'brightdata-cache.json'), 'utf-8'
  ))
  const existingUrls = new Set(existingCache.map((e: any) => e.url?.toLowerCase()))

  const newCandidates = topCandidates.filter(c => !existingUrls.has(c.url?.toLowerCase()))
  console.log(`Candidatos nuevos (no en cache): ${newCandidates.length}\n`)

  if (newCandidates.length > 0) {
    console.log('── Obteniendo detalles de productos nuevos... ──\n')
    for (const c of newCandidates.slice(0, 10)) {
      process.stdout.write(`  ${c.title.slice(0, 50).padEnd(52)}... `)
      const detail = await fetchDetail(c.url!)
      if (detail) {
        console.log(`✅ ${detail.brand || '?'} | EAN: ${detail.gtin || '?'} | ${Object.keys(detail.specs).length} specs`)
        Object.assign(c, { detail })
      } else {
        console.log('❌ sin datos')
      }
    }
    console.log('')
  }

  const outFile = path.resolve('scripts', 'discover', `decathlon-fetch-${Date.now()}.json`)
  fs.writeFileSync(outFile, JSON.stringify({
    generatedAt: new Date().toISOString(),
    total: products.length,
    withDiscount: withDiscount.length,
    goodBrand: goodBrand.length,
    topCandidates,
    allProducts: products,
  }, null, 2))
  console.log(`📁 Guardado en: ${outFile}\n`)

  if (newCandidates.length > 0) {
    console.log('🎯 Candidatos para añadir al Sheet:')
    newCandidates.forEach((c, i) => {
      const detailStr = (c as any).detail ? ' [detalles obtenidos]' : ''
      console.log(`  ${i + 1}. ${(c.discountPercent + '%' || '?%').padStart(4)} | ${(c.brand || '?').padEnd(12)} | ${c.title.slice(0, 55)}${detailStr}`)
    })
    console.log('')
  }
}

main().catch(err => { console.error('Error:', err); process.exit(1) })
