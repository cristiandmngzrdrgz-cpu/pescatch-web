import type { Deal, DealFilters } from '@/types'
import { sampleDeals } from './deals'

export function getDeals(filters?: DealFilters): Deal[] {
  let deals = [...sampleDeals]

  if (filters) {
    if (filters.category) {
      deals = deals.filter(d => d.category === filters.category)
    }
    if (filters.subcategory) {
      deals = deals.filter(d => d.subcategory === filters.subcategory)
    }
    if (filters.store) {
      deals = deals.filter(d => d.store.slug === filters.store)
    }
    if (filters.minDiscount) {
      deals = deals.filter(d => d.discountPercent >= filters.minDiscount!)
    }
    if (filters.maxPrice) {
      deals = deals.filter(d => d.salePrice <= filters.maxPrice!)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      deals = deals.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    if (filters.sortBy) {
      deals.sort((a, b) => {
        switch (filters.sortBy) {
          case 'discount': return b.discountPercent - a.discountPercent
          case 'price_asc': return a.salePrice - b.salePrice
          case 'price_desc': return b.salePrice - a.salePrice
          case 'newest': return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
          case 'popular': return b.votesUp - a.votesUp
          default: return 0
        }
      })
    }
  }

  return deals
}

export function getDealBySlug(slug: string): Deal | undefined {
  return sampleDeals.find(d => d.slug === slug)
}

export function getDealById(id: string): Deal | undefined {
  return sampleDeals.find(d => d.id === id)
}

export function getFeaturedDeals(): Deal[] {
  return sampleDeals.filter(d => d.featured)
}

export function getCategories(): string[] {
  const cats = new Set(sampleDeals.map(d => d.category))
  return Array.from(cats)
}

export function getSubcategories(category: string): string[] {
  const subs = new Set(
    sampleDeals
      .filter(d => d.category === category && d.subcategory)
      .map(d => d.subcategory)
  )
  return Array.from(subs)
}

export function getRelatedDeals(deal: Deal, limit = 4): Deal[] {
  return sampleDeals
    .filter(d =>
      d.id !== deal.id &&
      (d.category === deal.category || d.tags.some(t => deal.tags.includes(t)))
    )
    .slice(0, limit)
}

export function searchDeals(query: string): Deal[] {
  return getDeals({ search: query })
}
