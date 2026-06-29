import type { StoreAdapter, StoreLookupResult } from './types'

const ALIEXPRESS_API_KEY = process.env.ALIEXPRESS_API_KEY || ''

export const aliexpressAdapter: StoreAdapter = {
  name: 'AliExpress',
  id: 'aliexpress',

  async lookup(ean: string): Promise<StoreLookupResult | null> {
    if (!ALIEXPRESS_API_KEY) return null

    try {
      const res = await fetch(
        `https://api.aliexpress.com/rest/affiliate/productdetail?app_key=${ALIEXPRESS_API_KEY}&ean=${encodeURIComponent(ean)}&target_currency=EUR&target_language=ES`,
        { headers: { 'Content-Type': 'application/json' } },
      )

      if (!res.ok) return null

      const data = await res.json()
      const product = data?.resp_result?.result?.products?.[0]
      if (!product) return null

      return {
        price: Number(product.target_app_sale_price) || 0,
        url: product.promotion_link || `https://www.aliexpress.com/item/${product.product_id}.html`,
        shipping: Number(product.target_app_sale_price) > 10 ? 0 : 2.99,
        stock: product.available_quantity > 0 ? 'in_stock' : 'out_of_stock',
        name: product.product_title || undefined,
        imageUrl: product.product_main_image_url || undefined,
      }
    } catch {
      return null
    }
  },
}

export async function lookupAliExpress(ean: string): Promise<StoreLookupResult | null> {
  return aliexpressAdapter.lookup(ean)
}
