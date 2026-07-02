export interface ScrapedPrice {
  price: number
  shipping?: number
  stock: 'in_stock' | 'limited' | 'out_of_stock'
  name?: string
  url: string
}

export interface PriceScrapeResult {
  success: boolean
  storeId: string
  price?: ScrapedPrice
  error?: string
}

export interface ProductToScrape {
  dealId: string
  productId: string
  title: string
  storeId: string
  storeName: string
  url: string
  ean: string
  asin: string
  currentPrice: number
}
