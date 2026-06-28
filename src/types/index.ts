export interface Deal {
  id: string
  slug: string
  title: string
  description: string
  originalPrice: number
  salePrice: number
  shippingCost: number
  discountPercent: number
  currency: string
  imageUrl: string
  images: string[]
  store: Store
  affiliateUrl: string
  category: string
  subcategory: string
  tags: string[]
  stockStatus: 'in_stock' | 'limited' | 'out_of_stock'
  stockCount?: number
  rating?: number
  reviewCount?: number
  technicalSpecs: Record<string, string>
  review: string
  pros: string[]
  cons: string[]
  votesUp: number
  votesDown: number
  priceHistory: PricePoint[]
  publishedAt: string
  createdAt: string
  updatedAt: string
  featured: boolean
  commission: number
}

export interface PricePoint {
  date: string
  price: number
  store?: string
}

export interface Store {
  id: string
  name: string
  slug: string
  logo?: string
  reputation: 'good' | 'neutral' | 'poor'
}

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  image?: string
  subcategories: Subcategory[]
}

export interface Subcategory {
  id: string
  slug: string
  name: string
}

export interface Comment {
  id: string
  dealId: string
  author: string
  content: string
  createdAt: string
  avatar?: string
}

export interface Vote {
  dealId: string
  type: 'up' | 'down'
  sessionId: string
}

export interface Favorite {
  dealId: string
  sessionId: string
  createdAt: string
}

export interface DealFilters {
  category?: string
  subcategory?: string
  store?: string
  minDiscount?: number
  maxPrice?: number
  sortBy?: 'discount' | 'price_asc' | 'price_desc' | 'newest' | 'popular'
  search?: string
}

export const CATEGORIES: Category[] = [
  {
    id: 'carretes',
    slug: 'carretes',
    name: 'Carretes',
    description: 'Carretes de pesca para todas las modalidades',
    subcategories: [
      { id: 'carretes-spinning', slug: 'spinning', name: 'Spinning' },
      { id: 'carretes-surfcasting', slug: 'surfcasting', name: 'Surfcasting' },
      { id: 'carretes-jigging', slug: 'jigging', name: 'Jigging' },
      { id: 'carretes-eging', slug: 'eging', name: 'Eging' },
      { id: 'carretes-embarcacion', slug: 'embarcacion', name: 'Embarcación' },
    ],
  },
  {
    id: 'canas',
    slug: 'canas',
    name: 'Cañas',
    description: 'Cañas de pesca profesionales y de iniciación',
    subcategories: [
      { id: 'canas-spinning', slug: 'spinning', name: 'Spinning' },
      { id: 'canas-surfcasting', slug: 'surfcasting', name: 'Surfcasting' },
      { id: 'canas-jigging', slug: 'jigging', name: 'Jigging' },
      { id: 'canas-eging', slug: 'eging', name: 'Eging' },
      { id: 'canas-embarcacion', slug: 'embarcacion', name: 'Embarcación' },
    ],
  },
  {
    id: 'senuelos',
    slug: 'senuelos',
    name: 'Señuelos',
    description: 'Señuelos artificiales para todo tipo de pesca',
    subcategories: [
      { id: 'senuelos-spinning', slug: 'spinning', name: 'Spinning' },
      { id: 'senuelos-jigging', slug: 'jigging', name: 'Jigging' },
      { id: 'senuelos-currican', slug: 'currican', name: 'Curricán' },
      { id: 'senuelos-eging', slug: 'eging', name: 'Eging' },
    ],
  },
  {
    id: 'accesorios',
    slug: 'accesorios',
    name: 'Accesorios',
    description: 'Todo tipo de accesorios para la pesca deportiva',
    subcategories: [],
  },
  {
    id: 'ropa',
    slug: 'ropa',
    name: 'Ropa',
    description: 'Ropa técnica para pescadores',
    subcategories: [],
  },
  {
    id: 'nautica',
    slug: 'nautica',
    name: 'Náutica',
    description: 'Equipamiento náutico y embarcaciones',
    subcategories: [],
  },
]

export const STORES: Store[] = [
  { id: 'amazon', slug: 'amazon', name: 'Amazon', reputation: 'good' },
  { id: 'aliexpress', slug: 'aliexpress', name: 'AliExpress', reputation: 'neutral' },
  { id: 'decathlon', slug: 'decathlon', name: 'Decathlon', reputation: 'good' },
]
