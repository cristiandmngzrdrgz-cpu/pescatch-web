import type { StoreAdapter, StoreLookupResult } from './types'

const DECATHLON_API_URL = 'https://api.decathlon.net/products/v2'
const DECATHLON_API_KEY = process.env.DECATHLON_API_KEY || ''

export const decathlonAdapter: StoreAdapter = {
  name: 'Decathlon',
  id: 'decathlon',

  async lookup(ean: string): Promise<StoreLookupResult | null> {
    if (!DECATHLON_API_KEY) return null

    try {
      const searchUrl = `${DECATHLON_API_URL}/search?ean=${encodeURIComponent(ean)}`
      const res = await fetch(searchUrl, {
        headers: { 'x-api-key': DECATHLON_API_KEY },
      })

      if (!res.ok) return null

      const data = await res.json()
      const product = data?._embedded?.products?.[0]
      if (!product) return null

      return {
        price: product.price?.current || 0,
        url: `https://www.decathlon.es${product.url || ''}`,
        shipping: product.shipping?.cost || 0,
        stock: product.stock?.quantity > 0 ? 'in_stock' : 'out_of_stock',
        name: product.name || undefined,
        imageUrl: product.images?.[0]?.url || undefined,
      }
    } catch {
      return null
    }
  },
}

export async function lookupDecathlon(ean: string): Promise<StoreLookupResult | null> {
  return decathlonAdapter.lookup(ean)
}
