import type { StoreAdapter, StoreLookupResult } from './types'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || ''
const GOOGLE_CX = process.env.GOOGLE_CX || ''

export const googleShoppingAdapter: StoreAdapter = {
  name: 'Google Shopping',
  id: 'google-shopping',

  async lookup(ean: string): Promise<StoreLookupResult | null> {
    if (!GOOGLE_API_KEY || !GOOGLE_CX) return null

    try {
      const result = await lookupViaCustomSearch(ean)
      if (result) return result
    } catch {
      // Fall through
    }

    return null
  },
}

interface GoogleShoppingItem {
  title?: string
  link?: string
  pagemap?: {
    product?: Array<{
      price?: string
      availability?: string
      name?: string
      image?: string
    }>
    offers?: Array<{
      price?: string
      availability?: string
      url?: string
    }>
    cse_image?: Array<{ src?: string }>
    cse_thumbnail?: Array<{ src?: string }>
  }
}

interface GoogleCustomSearchResponse {
  items?: GoogleShoppingItem[]
  error?: { message: string }
}

async function lookupViaCustomSearch(ean: string): Promise<StoreLookupResult | null> {
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(ean)}`

  const res = await fetch(url)

  if (!res.ok) return null

  const data: GoogleCustomSearchResponse = await res.json()
  if (data.error) return null

  const item = data.items?.[0]
  if (!item) return null

  const product = item.pagemap?.product?.[0]
  const offer = item.pagemap?.offers?.[0]
  const cseImage = item.pagemap?.cse_image?.[0]
  const priceStr = product?.price ?? offer?.price ?? ''
  const price = parseFloat(priceStr.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0
  const availability = product?.availability ?? offer?.availability ?? ''
  const stock: StoreLookupResult['stock'] =
    availability.includes('InStock') || availability.includes('in stock')
      ? 'in_stock'
      : availability.includes('LimitedAvailability') || availability.includes('limited')
        ? 'limited'
        : 'out_of_stock'

  return {
    price,
    url: offer?.url ?? item.link ?? '',
    shipping: 0,
    stock,
    name: product?.name ?? item.title ?? undefined,
    imageUrl: product?.image ?? cseImage?.src ?? undefined,
  }
}

export async function lookupGoogleShopping(ean: string): Promise<StoreLookupResult | null> {
  return googleShoppingAdapter.lookup(ean)
}
