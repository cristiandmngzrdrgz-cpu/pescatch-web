import type { Deal, DealFilters, Store } from '@/types'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'
import type { InValue } from '@libsql/client'

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

async function loadPriceHistory(dealId: string): Promise<{ date: string; price: number }[]> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT date, price FROM price_history WHERE dealId = ? ORDER BY date ASC',
    args: [dealId],
  })
  return result.rows as unknown as { date: string; price: number }[]
}

async function loadDeals(sql: string, params: InValue[] = []): Promise<Deal[]> {
  const db = getDb()
  await seedDatabase()

  const result = await db.execute({ sql, args: params })
  const deals = result.rows.map(r => mapRowToDeal(r as Record<string, unknown>))

  for (const deal of deals) {
    deal.priceHistory = await loadPriceHistory(deal.id)
  }

  return deals
}

async function loadDeal(sql: string, params: InValue[]): Promise<Deal | undefined> {
  const db = getDb()
  await seedDatabase()

  const result = await db.execute({ sql, args: params })
  if (result.rows.length === 0) return undefined

  const deal = mapRowToDeal(result.rows[0] as Record<string, unknown>)
  deal.priceHistory = await loadPriceHistory(deal.id)
  return deal
}

export async function getDeals(filters?: DealFilters): Promise<Deal[]> {
  let sql = 'SELECT * FROM deals WHERE 1=1'
  const params: InValue[] = []

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

  return loadDeals(sql, params)
}

export async function getDealBySlug(slug: string): Promise<Deal | undefined> {
  return loadDeal('SELECT * FROM deals WHERE slug = ?', [slug])
}

export async function getDealById(id: string): Promise<Deal | undefined> {
  return loadDeal('SELECT * FROM deals WHERE id = ?', [id])
}

export async function getFeaturedDeals(): Promise<Deal[]> {
  return loadDeals('SELECT * FROM deals WHERE featured = 1 ORDER BY publishedAt DESC')
}

export async function getCategories(): Promise<string[]> {
  const db = getDb()
  await seedDatabase()

  const result = await db.execute('SELECT DISTINCT category FROM deals ORDER BY category')
  return result.rows.map(r => r.category as string)
}

export async function getSubcategories(category: string): Promise<string[]> {
  const db = getDb()
  await seedDatabase()

  const result = await db.execute({
    sql: "SELECT DISTINCT subcategory FROM deals WHERE category = ? AND subcategory != '' ORDER BY subcategory",
    args: [category],
  })
  return result.rows.map(r => r.subcategory as string)
}

export async function getRelatedDeals(deal: Deal, limit = 4): Promise<Deal[]> {
  return loadDeals(
    `SELECT * FROM deals
     WHERE id != ? AND (category = ? OR tags LIKE ?)
     ORDER BY discountPercent DESC
     LIMIT ?`,
    [deal.id, deal.category, `%${deal.tags[0] || ''}%`, limit],
  )
}

export async function searchDeals(query: string): Promise<Deal[]> {
  return getDeals({ search: query })
}

export async function createDeal(data: Record<string, unknown>): Promise<Deal> {
  const db = getDb()
  await seedDatabase()

  const id = `deal_${Date.now()}`
  const now = new Date().toISOString()

  const originalPrice = Number(data.originalPrice) || 0
  const salePrice = Number(data.salePrice) || 0
  const discountPercent = Math.round(((originalPrice - salePrice) / (originalPrice || 1)) * 100)

  const str = (v: unknown, fallback = ''): string => (v as string) || fallback
  const num = (v: unknown, fallback = 0): number => Number(v) || fallback
  const json = (v: unknown): string => JSON.stringify(v || [])

  const insertArgs: InValue[] = [
    id,
    str(data.title), str(data.slug), str(data.description),
    originalPrice, salePrice, num(data.shippingCost),
    discountPercent, '€', str(data.imageUrl),
    json(data.images),
    str(data.storeId), str(data.storeName), str(data.storeUrl),
    str(data.storeReputation, 'good'), num(data.storeCommissionRate),
    str(data.affiliateUrl), str(data.category), str(data.subcategory),
    json(data.tags),
    str(data.stockStatus, 'in_stock'), num(data.stockCount),
    num(data.rating), num(data.reviewCount),
    JSON.stringify(data.technicalSpecs || {}), str(data.review),
    json(data.pros), json(data.cons),
    0, 0, data.featured ? 1 : 0, num(data.commission),
    now, now, now,
  ]

  await db.execute({
    sql: `INSERT INTO deals (
      id, title, slug, description, originalPrice, salePrice, shippingCost,
      discountPercent, currency, imageUrl, images,
      storeId, storeName, storeUrl, storeReputation, storeCommissionRate,
      affiliateUrl, category, subcategory, tags,
      stockStatus, stockCount, rating, reviewCount,
      technicalSpecs, review, pros, cons,
      votesUp, votesDown, featured, commission,
      publishedAt, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: insertArgs,
  })

  await db.execute({
    sql: 'INSERT INTO price_history (dealId, date, price) VALUES (?, ?, ?)',
    args: [id, now.split('T')[0], salePrice] as InValue[],
  })

  return (await getDealById(id))!
}

export async function updateDeal(id: string, data: Record<string, unknown>): Promise<Deal | undefined> {
  const db = getDb()

  const check = await db.execute({ sql: 'SELECT id FROM deals WHERE id = ?', args: [id] })
  if (check.rows.length === 0) return undefined

  const originalPrice = Number(data.originalPrice) || 0
  const salePrice = Number(data.salePrice) || 0
  const discountPercent = Math.round(((originalPrice - salePrice) / (originalPrice || 1)) * 100)
  const now = new Date().toISOString()

  const str = (v: unknown, fallback = ''): string => (v as string) || fallback
  const num = (v: unknown, fallback = 0): number => Number(v) || fallback

  const updateArgs: InValue[] = [
    str(data.title), str(data.slug), str(data.description), originalPrice, salePrice,
    num(data.shippingCost), discountPercent, str(data.imageUrl),
    JSON.stringify(data.images || []),
    str(data.storeId), str(data.storeName), str(data.storeUrl), str(data.storeReputation, 'good'),
    num(data.storeCommissionRate),
    str(data.affiliateUrl), str(data.category), str(data.subcategory),
    JSON.stringify(data.tags || []),
    str(data.stockStatus, 'in_stock'), num(data.stockCount),
    num(data.rating), num(data.reviewCount),
    JSON.stringify(data.technicalSpecs || {}), str(data.review),
    JSON.stringify(data.pros || []), JSON.stringify(data.cons || []),
    data.featured ? 1 : 0, num(data.commission),
    now, id,
  ]

  await db.execute({
    sql: `UPDATE deals SET
      title = ?, slug = ?, description = ?, originalPrice = ?, salePrice = ?,
      shippingCost = ?, discountPercent = ?, imageUrl = ?, images = ?,
      storeId = ?, storeName = ?, storeUrl = ?, storeReputation = ?, storeCommissionRate = ?,
      affiliateUrl = ?, category = ?, subcategory = ?, tags = ?,
      stockStatus = ?, stockCount = ?, rating = ?, reviewCount = ?,
      technicalSpecs = ?, review = ?, pros = ?, cons = ?,
      featured = ?, commission = ?, updatedAt = ?
    WHERE id = ?`,
    args: updateArgs,
  })

  return getDealById(id)
}

export async function deleteDeal(id: string): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({ sql: 'DELETE FROM deals WHERE id = ?', args: [id] })
  return result.rowsAffected > 0
}

export async function getComments(dealId: string) {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM comments WHERE dealId = ? ORDER BY createdAt DESC',
    args: [dealId],
  })
  return result.rows
}

export async function addComment(dealId: string, author: string, content: string) {
  const db = getDb()
  await db.execute({
    sql: "INSERT INTO comments (dealId, author, content, createdAt) VALUES (?, ?, ?, datetime('now'))",
    args: [dealId, author, content],
  })
  return getComments(dealId)
}
