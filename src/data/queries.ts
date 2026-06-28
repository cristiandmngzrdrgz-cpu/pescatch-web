import type { Deal, DealFilters, Store } from '@/types'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'
import { sampleDeals } from './deals'

function mapRowToDeal(row: Record<string, unknown>): Deal {
  const store: Store = {
    id: row.storeId as string,
    name: row.storeName as string,
    slug: (row.storeId as string) || '',
    reputation: (row.storeReputation as Store['reputation']) || 'good',
  }

  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    description: row.description as string,
    originalPrice: row.originalPrice as number,
    salePrice: row.salePrice as number,
    shippingCost: row.shippingCost as number,
    discountPercent: row.discountPercent as number,
    currency: row.currency as string,
    imageUrl: row.imageUrl as string,
    images: JSON.parse((row.images as string) || '[]'),
    store,
    affiliateUrl: row.affiliateUrl as string,
    category: row.category as string,
    subcategory: row.subcategory as string,
    tags: JSON.parse((row.tags as string) || '[]'),
    stockStatus: row.stockStatus as Deal['stockStatus'],
    stockCount: row.stockCount as number,
    rating: row.rating as number,
    reviewCount: row.reviewCount as number,
    technicalSpecs: JSON.parse((row.technicalSpecs as string) || '{}'),
    review: row.review as string,
    pros: JSON.parse((row.pros as string) || '[]'),
    cons: JSON.parse((row.cons as string) || '[]'),
    votesUp: row.votesUp as number,
    votesDown: row.votesDown as number,
    priceHistory: [],
    publishedAt: row.publishedAt as string,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
    featured: Boolean(row.featured),
    commission: row.commission as number,
  }
}

function loadPriceHistory(dealId: string) {
  const db = getDb()
  return db.prepare('SELECT date, price FROM price_history WHERE dealId = ? ORDER BY date ASC').all(dealId) as { date: string; price: number }[]
}

export function getDeals(filters?: DealFilters): Deal[] {
  const db = getDb()
  seedDatabase()

  let sql = 'SELECT * FROM deals WHERE 1=1'
  const params: unknown[] = []

  if (filters) {
    if (filters.category) {
      sql += ' AND category = ?'
      params.push(filters.category)
    }
    if (filters.subcategory) {
      sql += ' AND subcategory = ?'
      params.push(filters.subcategory)
    }
    if (filters.search) {
      const q = `%${filters.search.toLowerCase()}%`
      sql += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ?)'
      params.push(q, q, q)
    }
    if (filters.minDiscount) {
      sql += ' AND discountPercent >= ?'
      params.push(filters.minDiscount)
    }
    if (filters.maxPrice) {
      sql += ' AND salePrice <= ?'
      params.push(filters.maxPrice)
    }

    switch (filters.sortBy) {
      case 'discount': sql += ' ORDER BY discountPercent DESC'; break
      case 'price_asc': sql += ' ORDER BY salePrice ASC'; break
      case 'price_desc': sql += ' ORDER BY salePrice DESC'; break
      case 'newest': sql += ' ORDER BY publishedAt DESC'; break
      case 'popular': sql += ' ORDER BY votesUp DESC'; break
      default: sql += ' ORDER BY publishedAt DESC'; break
    }
  } else {
    sql += ' ORDER BY publishedAt DESC'
  }

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
  const deals = rows.map(mapRowToDeal)

  for (const deal of deals) {
    deal.priceHistory = loadPriceHistory(deal.id)
  }

  return deals
}

export function getDealBySlug(slug: string): Deal | undefined {
  const db = getDb()
  seedDatabase()

  const row = db.prepare('SELECT * FROM deals WHERE slug = ?').get(slug) as Record<string, unknown> | undefined
  if (!row) return undefined

  const deal = mapRowToDeal(row)
  deal.priceHistory = loadPriceHistory(deal.id)
  return deal
}

export function getDealById(id: string): Deal | undefined {
  const db = getDb()
  seedDatabase()

  const row = db.prepare('SELECT * FROM deals WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return undefined

  const deal = mapRowToDeal(row)
  deal.priceHistory = loadPriceHistory(deal.id)
  return deal
}

export function getFeaturedDeals(): Deal[] {
  const db = getDb()
  seedDatabase()

  const rows = db.prepare('SELECT * FROM deals WHERE featured = 1 ORDER BY publishedAt DESC').all() as Record<string, unknown>[]
  const deals = rows.map(mapRowToDeal)

  for (const deal of deals) {
    deal.priceHistory = loadPriceHistory(deal.id)
  }

  return deals
}

export function getCategories(): string[] {
  const db = getDb()
  seedDatabase()

  const rows = db.prepare('SELECT DISTINCT category FROM deals ORDER BY category').all() as { category: string }[]
  return rows.map(r => r.category)
}

export function getSubcategories(category: string): string[] {
  const db = getDb()
  seedDatabase()

  const rows = db.prepare('SELECT DISTINCT subcategory FROM deals WHERE category = ? AND subcategory != \'\' ORDER BY subcategory').all(category) as { subcategory: string }[]
  return rows.map(r => r.subcategory)
}

export function getRelatedDeals(deal: Deal, limit = 4): Deal[] {
  const db = getDb()
  seedDatabase()

  const rows = db.prepare(`
    SELECT * FROM deals
    WHERE id != ? AND (category = ? OR tags LIKE ?)
    ORDER BY discountPercent DESC
    LIMIT ?
  `).all(deal.id, deal.category, `%${deal.tags[0] || ''}%`, limit) as Record<string, unknown>[]

  const deals = rows.map(mapRowToDeal)
  for (const d of deals) {
    d.priceHistory = loadPriceHistory(d.id)
  }

  return deals
}

export function searchDeals(query: string): Deal[] {
  return getDeals({ search: query })
}

export function createDeal(data: Record<string, unknown>): Deal {
  const db = getDb()
  seedDatabase()

  const id = `deal_${Date.now()}`
  const now = new Date().toISOString()

  const originalPrice = Number(data.originalPrice) || 0
  const salePrice = Number(data.salePrice) || 0
  const discountPercent = Math.round(((originalPrice - salePrice) / (originalPrice || 1)) * 100)

  db.prepare(`
    INSERT INTO deals (
      id, title, slug, description, originalPrice, salePrice, shippingCost,
      discountPercent, currency, imageUrl, images,
      storeId, storeName, storeUrl, storeReputation, storeCommissionRate,
      affiliateUrl, category, subcategory, tags,
      stockStatus, stockCount, rating, reviewCount,
      technicalSpecs, review, pros, cons,
      votesUp, votesDown, featured, commission,
      publishedAt, createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?
    )
  `).run(
    id,
    data.title || '',
    data.slug || '',
    data.description || '',
    originalPrice,
    salePrice,
    Number(data.shippingCost) || 0,
    discountPercent,
    '€',
    data.imageUrl || '',
    JSON.stringify(data.images || []),
    data.storeId || '',
    data.storeName || '',
    data.storeUrl || '',
    data.storeReputation || 'good',
    Number(data.storeCommissionRate) || 0,
    data.affiliateUrl || '',
    data.category || '',
    data.subcategory || '',
    JSON.stringify(data.tags || []),
    data.stockStatus || 'in_stock',
    Number(data.stockCount) || 0,
    Number(data.rating) || 0,
    Number(data.reviewCount) || 0,
    JSON.stringify(data.technicalSpecs || {}),
    data.review || '',
    JSON.stringify(data.pros || []),
    JSON.stringify(data.cons || []),
    0, 0,
    data.featured ? 1 : 0,
    Number(data.commission) || 0,
    now, now, now,
  )

  // Add initial price history
  db.prepare('INSERT INTO price_history (dealId, date, price) VALUES (?, ?, ?)').run(id, now.split('T')[0], salePrice)

  return getDealById(id)!
}

export function updateDeal(id: string, data: Record<string, unknown>): Deal | undefined {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM deals WHERE id = ?').get(id)
  if (!existing) return undefined

  const originalPrice = Number(data.originalPrice) || 0
  const salePrice = Number(data.salePrice) || 0
  const discountPercent = Math.round(((originalPrice - salePrice) / (originalPrice || 1)) * 100)
  const now = new Date().toISOString()

  db.prepare(`
    UPDATE deals SET
      title = ?, slug = ?, description = ?, originalPrice = ?, salePrice = ?,
      shippingCost = ?, discountPercent = ?, imageUrl = ?, images = ?,
      storeId = ?, storeName = ?, storeUrl = ?, storeReputation = ?, storeCommissionRate = ?,
      affiliateUrl = ?, category = ?, subcategory = ?, tags = ?,
      stockStatus = ?, stockCount = ?, rating = ?, reviewCount = ?,
      technicalSpecs = ?, review = ?, pros = ?, cons = ?,
      featured = ?, commission = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    data.title, data.slug, data.description, originalPrice, salePrice,
    Number(data.shippingCost) || 0, discountPercent, data.imageUrl,
    JSON.stringify(data.images || []),
    data.storeId, data.storeName, data.storeUrl, data.storeReputation,
    Number(data.storeCommissionRate) || 0,
    data.affiliateUrl, data.category, data.subcategory,
    JSON.stringify(data.tags || []),
    data.stockStatus, Number(data.stockCount) || 0,
    Number(data.rating) || 0, Number(data.reviewCount) || 0,
    JSON.stringify(data.technicalSpecs || {}), data.review,
    JSON.stringify(data.pros || []), JSON.stringify(data.cons || []),
    data.featured ? 1 : 0, Number(data.commission) || 0,
    now, id,
  )

  return getDealById(id)
}

export function deleteDeal(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM deals WHERE id = ?').run(id)
  return result.changes > 0
}

export function getComments(dealId: string) {
  const db = getDb()
  return db.prepare('SELECT * FROM comments WHERE dealId = ? ORDER BY createdAt DESC').all(dealId)
}

export function addComment(dealId: string, author: string, content: string) {
  const db = getDb()
  db.prepare('INSERT INTO comments (dealId, author, content, createdAt) VALUES (?, ?, ?, datetime(\'now\'))').run(dealId, author, content)
  return getComments(dealId)
}
