import type { StoreAdapter, StoreLookupResult } from './types'
import {
  getProductDetails,
  parseProductIdFromUrl,
  searchProducts,
} from '@/lib/aliexpress-api'

export const aliexpressAdapter: StoreAdapter = {
  name: 'AliExpress',
  id: 'aliexpress',

  async lookup(ean: string, opts?: { url?: string }): Promise<StoreLookupResult | null> {
    const productId = opts?.url ? parseProductIdFromUrl(opts.url) : null

    if (productId) {
      const details = await getProductDetails([productId])
      const product = details[0]
      if (product) {
        return {
          price: product.price,
          url: product.productUrl,
          shipping: product.price > 10 ? 0 : 2.99,
          stock:
            product.availableQuantity === 0 ? 'out_of_stock' : 'in_stock',
          name: product.title || undefined,
          imageUrl: product.imageUrl || undefined,
        }
      }
    }

    // Sin productId en la URL y sin EAN no hay nada con lo que buscar:
    // devolver null para que run-sync use los datos manuales del Sheet.
    const keyword = ean?.trim()
    if (!keyword) return null

    const results = await searchProducts(keyword, { pageSize: 5 })
    const match = results[0]
    if (!match || match.price <= 0) return null

    return {
      price: match.price,
      url: match.productUrl,
      shipping: match.price > 10 ? 0 : 2.99,
      stock: 'in_stock',
      name: match.title || undefined,
      imageUrl: match.imageUrl || undefined,
    }
  },
}

export async function lookupAliExpress(
  ean: string,
  opts?: { url?: string },
): Promise<StoreLookupResult | null> {
  return aliexpressAdapter.lookup(ean, opts)
}
