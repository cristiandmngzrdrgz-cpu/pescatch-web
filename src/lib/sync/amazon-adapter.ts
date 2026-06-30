import type { StoreAdapter, StoreLookupResult } from './types'
import { buildAmazonUrl } from '@/lib/amazon-affiliate'

const AMAZON_PA_API_KEY = process.env.AMAZON_PA_API_KEY || ''
const AMAZON_PA_SECRET = process.env.AMAZON_PA_SECRET || ''
const AMAZON_PA_TAG = process.env.AMAZON_PA_TAG || 'pescatch-21'

export const amazonAdapter: StoreAdapter = {
  name: 'Amazon',
  id: 'amazon',

  async lookup(ean: string): Promise<StoreLookupResult | null> {
    // Priority 1: Amazon PA API (if credentials are set)
    if (AMAZON_PA_API_KEY && AMAZON_PA_SECRET) {
      try {
        const result = await lookupViaPaApi(ean)
        if (result) return result
      } catch {
        // Fall through to next method
      }
    }

    // Priority 2: BrightData (if API key is set)
    const brightDataKey = process.env.BRIGHTDATA_API_KEY || ''
    if (brightDataKey) {
      try {
        const result = await lookupViaBrightData(ean, brightDataKey)
        if (result) return result
      } catch {
        // Fall through
      }
    }

    // No credentials configured — return null (manual entry only)
    return null
  },
}

async function lookupViaPaApi(ean: string): Promise<StoreLookupResult | null> {
  const url = `https://webservices.amazon.es/paapi5/searchitems`
  const payload = {
    Keywords: ean,
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'Offers.Listings.Price',
      'Offers.Listings.Availability',
      'Offers.Listings.DeliveryInfo.IsAmazonFulfilled',
    ],
    PartnerTag: AMAZON_PA_TAG,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.es',
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AWS-Access-Key-ID': AMAZON_PA_API_KEY,
      'X-AWS-Secret-Key': AMAZON_PA_SECRET,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) return null

  const data = await res.json()
  const item = data?.ItemsResult?.Items?.[0]
  if (!item) return null

  const offer = item.Offers?.Listings?.[0]
  const price = offer?.Price?.Amount || 0

  return {
    price,
    url: item.DetailPageURL || buildAmazonUrl(`https://www.amazon.es/dp/${ean}`),
    shipping: offer?.DeliveryInfo?.IsAmazonFulfilled ? 0 : 3.99,
    stock: offer?.Availability?.Type === 'now' ? 'in_stock' : 'limited',
    name: item.ItemInfo?.Title || undefined,
    imageUrl: item.Images?.Primary?.Large?.URL || undefined,
  }
}

async function lookupViaBrightData(ean: string, apiKey: string): Promise<StoreLookupResult | null> {
  const res = await fetch('https://api.brightdata.com/datasets/v3/trigger', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dataset_id: 'gd_l1v1l1v2_amazon_product',
      data: [{ ean }],
    }),
  })

  if (!res.ok) return null

  const data = await res.json()
  const product = data?.[0]

  if (!product) return null

  return {
    price: Number(product.price) || 0,
    url: product.url || buildAmazonUrl(`https://www.amazon.es/dp/${ean}`),
    shipping: product.is_prime ? 0 : Number(product.shipping) || 3.99,
    stock: product.in_stock ? 'in_stock' : 'out_of_stock',
    name: product.title || undefined,
    imageUrl: product.main_image || undefined,
  }
}

export async function lookupAmazon(ean: string): Promise<StoreLookupResult | null> {
  return amazonAdapter.lookup(ean)
}
