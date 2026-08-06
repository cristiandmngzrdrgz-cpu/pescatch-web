import { searchProducts } from '../../src/lib/aliexpress-api'
import { CATEGORIES } from './keywords'
import { extractBrand, categorizeProduct } from '../../src/lib/scraping-utils'

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

/**
 * Busca chollos de pesca en AliExpress vía la API oficial
 * (aliexpress.affiliate.product.query). Sustituye al scraper de navegador.
 */
export async function scrapeAliExpressAll(options?: {
  onProgress?: (keyword: string, count: number) => void
}): Promise<AliExpressProduct[]> {
  const onProgress = options?.onProgress

  const allProducts: AliExpressProduct[] = []
  const seenUrls = new Set<string>()
  const keywords = Object.entries(CATEGORIES).flatMap(([cat, terms]) =>
    terms.map(t => ({ keyword: t, category: cat }))
  )

  for (const { keyword, category } of keywords) {
    process.stdout.write(`  🔍 "${keyword}"... `)
    let results: AliExpressProduct[] = []
    try {
      const found = await searchProducts(keyword, { pageSize: 40 })
      results = found.map(p => ({
        title: p.title,
        price: p.price,
        originalPrice: p.originalPrice,
        rating: p.rating ?? 0,
        reviews: p.orders ?? 0,
        url: p.productUrl,
        brand: extractBrand(p.title),
        category: categorizeProduct(p.title),
        store: 'aliexpress' as const,
        discount: p.discount,
        imageUrl: p.imageUrl,
      }))
    } catch {
      // La API falló para esta keyword: seguir con las siguientes
    }

    let newCount = 0
    for (const p of results) {
      if (seenUrls.has(p.url)) continue
      seenUrls.add(p.url)
      const finalCategory = p.category === 'Equipo' && category !== 'Equipo' ? category : p.category
      allProducts.push({ ...p, category: finalCategory })
      newCount++
    }
    console.log(`${newCount}`)
    onProgress?.(keyword, newCount)
  }

  return allProducts
}
