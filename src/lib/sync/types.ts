export interface SyncRow {
  ean: string
  name: string
  brand: string
  category: string
  subcategory?: string
  description?: string
  imageUrl?: string
  tags?: string[]
  featured?: boolean
  amazonPrice?: number
  amazonUrl?: string
  amazonShipping?: number
  amazonStock?: string
  decathlonPrice?: number
  decathlonUrl?: string
  decathlonShipping?: number
  decathlonStock?: string
  aliexpressPrice?: number
  aliexpressUrl?: string
  aliexpressShipping?: number
  aliexpressStock?: string

}

export interface SyncResult {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

export interface StoreAdapter {
  name: string
  id: string
  lookup(ean: string): Promise<StoreLookupResult | null>
}

export interface StoreLookupResult {
  price: number
  url: string
  shipping: number
  stock: 'in_stock' | 'limited' | 'out_of_stock'
  name?: string
  imageUrl?: string
}
