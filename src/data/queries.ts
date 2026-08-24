import type { Deal, DealFilters, PaginatedResult, Product, Store } from '@/types'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'
import { normalizeCategory, normalizeSubcategory } from '@/lib/normalize-category'
import type { InValue } from '@libsql/client'
import { cache } from 'react'

// ─── Tiendas deshabilitadas ──────────────────────────────────────────────────
// Decathlon fuera del proyecto: sin afiliado, no monetiza. Purga completa de
// datos aplicada (24 Ago 2026, backups en data/archive-decathlon-*.json).
// El filtro es defensa pasiva: si una fila Decathlon volviera a colarse en la
// BD (sync/import), no se mostraría en ninguna query pública.
export const DISABLED_STORES: string[] = ['decathlon']

export function storeFilterClause(includeHidden: boolean): string {
  if (includeHidden || DISABLED_STORES.length === 0) return ''
  const placeholders = DISABLED_STORES.map(() => '?').join(',')
  return ` AND storeId NOT IN (${placeholders})`
}

// ─── Shared filter builder ────────────────────────────────────────────────────
// Centralises WHERE construction so getDeals and getDealsPaginated stay in sync.
function buildWhereClause(
  filters?: DealFilters,
  includeHidden = false,
): { where: string; params: InValue[] } {
  let where = '1=1'
  const params: InValue[] = []

  if (!includeHidden) {
    where += " AND status = 'published' AND (expiresAt IS NULL OR expiresAt > datetime('now'))"
    where += storeFilterClause(false)
    params.push(...DISABLED_STORES)
  }

  if (!filters) return { where, params }

  if (filters.category) {
    where += ' AND LOWER(category) = LOWER(?)'
    params.push(normalizeCategory(filters.category))
  }
  if (filters.subcategory) {
    where += ' AND LOWER(subcategory) = LOWER(?)'
    params.push(normalizeSubcategory(filters.category || '', filters.subcategory))
  }
  if (filters.brand) {
    where += ' AND LOWER(brand) = LOWER(?)'
    params.push(filters.brand)
  }
  if (filters.store) {
    where += ' AND storeId = ?'
    params.push(filters.store)
  }
  if (filters.search) {
    const q = `%${filters.search.toLowerCase()}%`
    where += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ? OR LOWER(storeName) LIKE ?)'
    params.push(q, q, q, q)
  }
  if (filters.minDiscount) {
    where += ' AND discountPercent >= ?'
    params.push(filters.minDiscount)
  }
  if (filters.minPrice) {
    where += ' AND salePrice >= ?'
    params.push(filters.minPrice)
  }
  if (filters.maxPrice) {
    where += ' AND salePrice <= ?'
    params.push(filters.maxPrice)
  }
  if (filters.publishedSince) {
    where += ' AND publishedAt >= ?'
    params.push(filters.publishedSince)
  }

  return { where, params }
}

function buildOrderBy(sortBy?: DealFilters['sortBy']): string {
  switch (sortBy) {
    case 'discount':   return 'ORDER BY discountPercent DESC'
    case 'price_asc':  return 'ORDER BY salePrice ASC'
    case 'price_desc': return 'ORDER BY salePrice DESC'
    case 'newest':     return 'ORDER BY publishedAt DESC'
    case 'popular':    return 'ORDER BY votesUp DESC'
    default:           return 'ORDER BY publishedAt DESC'
  }
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw) as T } catch { return fallback }
}

function mapRowToDeal(row: Record<string, unknown>): Deal {
  const store: Store = {
    id: row.storeId as string,
    name: row.storeName as string,
    slug: (row.storeId as string) || '',
    reputation: (row.storeReputation as Store['reputation']) || 'good',
  }

  return {
    id: row.id as string,
    productId: (row.productId as string) || '',
    title: row.title as string,
    slug: row.slug as string,
    description: row.description as string,
    originalPrice: row.originalPrice as number,
    salePrice: row.salePrice as number,
    shippingCost: row.shippingCost as number,
    discountPercent: row.discountPercent as number,
    currency: row.currency as string,
    imageUrl: row.imageUrl as string,
    images: safeJsonParse((row.images as string) || '[]', [] as string[]),
    store,
    affiliateUrl: row.affiliateUrl as string,
    category: row.category as string,
    subcategory: row.subcategory as string,
    tags: safeJsonParse((row.tags as string) || '[]', [] as string[]),
    stockStatus: row.stockStatus as Deal['stockStatus'],
    stockCount: row.stockCount as number,
    rating: row.rating as number,
    reviewCount: row.reviewCount as number,
    technicalSpecs: safeJsonParse((row.technicalSpecs as string) || '{}', {} as Record<string, string>),
    review: row.review as string,
    pros: safeJsonParse((row.pros as string) || '[]', [] as string[]),
    cons: safeJsonParse((row.cons as string) || '[]', [] as string[]),
    votesUp: row.votesUp as number,
    votesDown: row.votesDown as number,
    priceHistory: [],
    publishedAt: row.publishedAt as string,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
    featured: Boolean(row.featured),
    status: (row.status as Deal['status']) || 'published',
    commission: row.commission as number,
    ean: (row.ean as string) || '',
    asin: (row.asin as string) || '',
    brand: (row.brand as string) || '',
    expiresAt: (row.expiresAt as string) || undefined,
    metaTitle: (row.metaTitle as string) || undefined,
    metaDescription: (row.metaDescription as string) || undefined,
    canonicalUrl: (row.canonicalUrl as string) || undefined,
    focusKeyword: (row.focusKeyword as string) || undefined,
  }
}

function mapRowToProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    ean: (row.ean as string) || undefined,
    asin: (row.asin as string) || undefined,
    brand: (row.brand as string) || '',
    imageUrl: (row.imageUrl as string) || '',
    images: safeJsonParse((row.images as string) || '[]', [] as string[]),
    category: (row.category as string) || '',
    subcategory: (row.subcategory as string) || '',
    description: (row.description as string) || '',
    specs: safeJsonParse((row.specs as string) || '{}', {} as Record<string, string>),
    tags: safeJsonParse((row.tags as string) || '[]', [] as string[]),
    rating: (row.rating as number) || undefined,
    reviewCount: (row.reviewCount as number) || undefined,
    review: (row.review as string) || '',
    pros: safeJsonParse((row.pros as string) || '[]', [] as string[]),
    cons: safeJsonParse((row.cons as string) || '[]', [] as string[]),
    createdAt: (row.createdAt as string) || '',
    updatedAt: (row.updatedAt as string) || '',
  }
}

async function enrichWithProducts(deals: Deal[]): Promise<void> {
  const db = getDb()
  const productIds = [...new Set(deals.map(d => d.productId).filter(Boolean))]
  if (productIds.length === 0) return

  const placeholders = productIds.map(() => '?').join(',')
  const result = await db.execute({
    sql: `SELECT * FROM products WHERE id IN (${placeholders})`,
    args: productIds,
  })

  const productMap = new Map<string, Product>()
  for (const row of result.rows) {
    const p = mapRowToProduct(row as Record<string, unknown>)
    productMap.set(p.id, p)
  }

  for (const deal of deals) {
    const product = productMap.get(deal.productId)
    if (!product) continue
    if (!deal.imageUrl && product.imageUrl) deal.imageUrl = product.imageUrl
    if (!deal.images.length && product.images.length) deal.images = product.images
    if (!deal.category && product.category) deal.category = product.category
    if (!deal.subcategory && product.subcategory) deal.subcategory = product.subcategory
    if (!deal.tags.length && product.tags.length) deal.tags = product.tags
    if (!deal.rating && product.rating) deal.rating = product.rating
    if (!deal.reviewCount && product.reviewCount) deal.reviewCount = product.reviewCount
    if (!Object.keys(deal.technicalSpecs).length && Object.keys(product.specs).length) deal.technicalSpecs = product.specs
    if (!deal.review && product.review) deal.review = product.review
    if (!deal.pros.length && product.pros.length) deal.pros = product.pros
    if (!deal.cons.length && product.cons.length) deal.cons = product.cons
    if (!deal.ean && product.ean) deal.ean = product.ean
    if (!deal.asin && product.asin) deal.asin = product.asin
    if (!deal.brand && product.brand) deal.brand = product.brand
  }
}

async function loadPriceHistory(dealId: string): Promise<{ date: string; price: number }[]> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT date, price FROM price_history WHERE dealId = ? ORDER BY date ASC',
    args: [dealId],
  })
  return result.rows.map((row: Record<string, unknown>) => ({
    date: String(row.date ?? ''),
    price: Number(row.price) || 0,
  }))
}

async function loadPriceHistories(dealIds: string[]): Promise<Map<string, { date: string; price: number }[]>> {
  const map = new Map<string, { date: string; price: number }[]>()
  if (dealIds.length === 0) return map
  for (const id of dealIds) map.set(id, [])

  const db = getDb()
  const placeholders = dealIds.map(() => '?').join(',')
  const result = await db.execute({
    sql: `SELECT dealId, date, price FROM price_history WHERE dealId IN (${placeholders}) ORDER BY dealId, date ASC`,
    args: dealIds,
  })

  for (const row of result.rows) {
    const r = row as Record<string, unknown>
    const id = r.dealId as string
    const entry = { date: String(r.date ?? ''), price: Number(r.price) || 0 }
    const list = map.get(id)
    if (list) list.push(entry)
  }

  return map
}

async function loadDeals(sql: string, params: InValue[] = []): Promise<Deal[]> {
  const db = getDb()
  await seedDatabase()

  const result = await db.execute({ sql, args: params })
  const deals = result.rows.map(r => mapRowToDeal(r as Record<string, unknown>))

  await enrichWithProducts(deals)

  const historyMap = await loadPriceHistories(deals.map(d => d.id))
  for (const deal of deals) {
    deal.priceHistory = historyMap.get(deal.id) ?? []
  }

  return deals
}

async function loadDeal(sql: string, params: InValue[]): Promise<Deal | undefined> {
  const db = getDb()
  await seedDatabase()

  const result = await db.execute({ sql, args: params })
  if (result.rows.length === 0) return undefined

  const deal = mapRowToDeal(result.rows[0] as Record<string, unknown>)
  await enrichWithProducts([deal])
  deal.priceHistory = await loadPriceHistory(deal.id)
  return deal
}

export async function getDeals(filters?: DealFilters, includeHidden = false): Promise<Deal[]> {
  const { where, params } = buildWhereClause(filters, includeHidden)
  const order = buildOrderBy(filters?.sortBy)
  return loadDeals(`SELECT * FROM deals WHERE ${where} ${order}`, params)
}

export async function getDealsPaginated(
  filters?: DealFilters,
  page = 1,
  limit = 12,
  includeHidden = false
): Promise<PaginatedResult<Deal>> {
  const db = getDb()
  await seedDatabase()

  const { where, params } = buildWhereClause(filters, includeHidden)
  const order = buildOrderBy(filters?.sortBy)

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as total FROM deals WHERE ${where}`,
    args: params,
  })
  const total = Number(countResult.rows[0]?.total ?? 0)
  const totalPages = Math.ceil(total / limit)

  const offset = (page - 1) * limit
  const sql = `SELECT * FROM deals WHERE ${where} ${order} LIMIT ${limit} OFFSET ${offset}`
  const deals = await loadDeals(sql, params)

  return { items: deals, total, page, totalPages }
}

export async function getDealBySlug(slug: string, includeHidden = false): Promise<Deal | undefined> {
  const sql = includeHidden
    ? 'SELECT * FROM deals WHERE slug = ?'
    : `SELECT * FROM deals WHERE slug = ? AND status = 'published'${storeFilterClause(false)}`
  const params: InValue[] = [slug, ...(includeHidden ? [] : DISABLED_STORES)]
  return loadDeal(sql, params)
}

export async function getDealById(id: string): Promise<Deal | undefined> {
  return loadDeal('SELECT * FROM deals WHERE id = ?', [id])
}

export async function getFeaturedDeals(includeHidden = false): Promise<Deal[]> {
  const hiddenClause = includeHidden ? '' : ` AND status = 'published'${storeFilterClause(false)}`
  const sql = `SELECT * FROM deals WHERE featured = 1${hiddenClause} ORDER BY publishedAt DESC`
  return loadDeals(sql, includeHidden ? [] : (DISABLED_STORES as InValue[]))
}

export async function getDealCountsByCategory(): Promise<Record<string, number>> {
  const db = getDb()
  await seedDatabase()

  const result = await db.execute(
    { sql: `SELECT category, COUNT(*) as count FROM deals WHERE status = 'published' AND (expiresAt IS NULL OR expiresAt > datetime('now'))${storeFilterClause(false)} GROUP BY category`, args: DISABLED_STORES as InValue[] }
  )
  const map: Record<string, number> = {}
  for (const row of result.rows) {
    map[row.category as string] = Number(row.count)
  }
  return map
}

export async function getDealCountsByStore(category?: string): Promise<Record<string, number>> {
  const db = getDb()
  await seedDatabase()

  let sql = `SELECT storeId, COUNT(*) as count FROM deals WHERE status = 'published' AND (expiresAt IS NULL OR expiresAt > datetime('now'))${storeFilterClause(false)}`
  const params: InValue[] = [...DISABLED_STORES]

  if (category) {
    sql += ' AND LOWER(category) = LOWER(?)'
    params.push(normalizeCategory(category))
  }

  sql += ' GROUP BY storeId'

  const result = await db.execute({ sql, args: params })
  const map: Record<string, number> = {}
  for (const row of result.rows) {
    map[row.storeId as string] = Number(row.count)
  }
  return map
}

export async function getBrands(): Promise<Array<{ brand: string; count: number; minPrice: number; maxDiscount: number }>> {
  const db = getDb()
  await seedDatabase()

  const result = await db.execute(
    { sql: `SELECT brand, COUNT(*) as count, MIN(salePrice) as minPrice,
            MAX(discountPercent) as maxDiscount
     FROM deals
     WHERE status = 'published' AND brand != ''
       AND (expiresAt IS NULL OR expiresAt > datetime('now'))${storeFilterClause(false)}
     GROUP BY LOWER(brand)
     ORDER BY count DESC, brand ASC`, args: DISABLED_STORES as InValue[] }
  )

  return result.rows.map(r => ({
    brand: r.brand as string,
    count: Number(r.count),
    minPrice: Number(r.minPrice),
    maxDiscount: Number(r.maxDiscount),
  }))
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
    sql: "SELECT DISTINCT subcategory FROM deals WHERE LOWER(category) = LOWER(?) AND subcategory != '' ORDER BY subcategory",
    args: [normalizeCategory(category)],
  })
  return result.rows.map(r => r.subcategory as string)
}

export async function getRelatedDeals(deal: Deal, limit = 4, includeHidden = false): Promise<Deal[]> {
  const hiddenClause = includeHidden ? '' : ` AND status = 'published' AND (expiresAt IS NULL OR expiresAt > datetime('now'))${storeFilterClause(false)}`
  return loadDeals(
    `SELECT * FROM deals
     WHERE id != ?${hiddenClause} AND (LOWER(category) = LOWER(?) OR tags LIKE ?)
     ORDER BY discountPercent DESC
     LIMIT ?`,
    [deal.id, ...(includeHidden ? [] : DISABLED_STORES), normalizeCategory(deal.category), `%${deal.tags[0] || ''}%`, limit],
  )
}

export async function searchDeals(query: string): Promise<Deal[]> {
  return getDeals({ search: query })
}

export async function createProduct(data: Record<string, unknown>): Promise<Product> {
  const db = getDb()
  await seedDatabase()

  const id = (data.id as string) || `product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()

  const str = (v: unknown, fallback = ''): string => (v as string) || fallback
  const num = (v: unknown, fallback = 0): number => Number(v) || fallback
  const json = (v: unknown): string => JSON.stringify(v || [])

  await db.execute({
    sql: `INSERT OR IGNORE INTO products (
      id, name, slug, ean, asin, brand, imageUrl, images,
      category, subcategory, description, specs, tags,
      rating, reviewCount, review, pros, cons,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      str(data.name), str(data.slug),
      str(data.ean), str(data.asin), str(data.brand),
      str(data.imageUrl), json(data.images),
      str(data.category), str(data.subcategory),
      str(data.description), JSON.stringify(data.specs || {}), json(data.tags),
      num(data.rating), num(data.reviewCount),
      str(data.review), json(data.pros), json(data.cons),
      now, now,
    ] as InValue[],
  })

  return (await getProductById(id))!
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const db = getDb()
  await seedDatabase()
  const result = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] })
  if (result.rows.length === 0) return undefined
  return mapRowToProduct(result.rows[0] as Record<string, unknown>)
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const db = getDb()
  await seedDatabase()
  const result = await db.execute({ sql: 'SELECT * FROM products WHERE slug = ?', args: [slug] })
  if (result.rows.length === 0) return undefined
  return mapRowToProduct(result.rows[0] as Record<string, unknown>)
}

export async function getProductByEan(ean: string): Promise<Product | undefined> {
  const db = getDb()
  await seedDatabase()
  const result = await db.execute({ sql: 'SELECT * FROM products WHERE ean = ?', args: [ean] })
  if (result.rows.length === 0) return undefined
  return mapRowToProduct(result.rows[0] as Record<string, unknown>)
}

export async function getDealsByProduct(productId: string, includeHidden = false): Promise<Deal[]> {
  const sql = includeHidden
    ? 'SELECT * FROM deals WHERE productId = ? ORDER BY salePrice ASC'
    : `SELECT * FROM deals WHERE productId = ? AND status = 'published' AND (expiresAt IS NULL OR expiresAt > datetime('now'))${storeFilterClause(false)} ORDER BY salePrice ASC`
  return loadDeals(sql, [productId, ...(includeHidden ? [] : DISABLED_STORES)])
}

export async function migrateExistingDealsToProducts() {
  const db = getDb()

  const unmigrated = await db.execute("SELECT * FROM deals WHERE productId = ''")
  if (unmigrated.rows.length === 0) return

  for (const row of unmigrated.rows) {
    const r = row as Record<string, unknown>
    const dealId = r.id as string
    const productId = `prod_${dealId}`
    const now = new Date().toISOString()

    const title = (r.title as string) || ''
    const slug = (r.slug as string) || ''
    const description = (r.description as string) || ''
    const imageUrl = (r.imageUrl as string) || ''
    const images = (r.images as string) || '[]'
    const category = (r.category as string) || ''
    const subcategory = (r.subcategory as string) || ''
    const technicalSpecs = (r.technicalSpecs as string) || '{}'
    const tags = (r.tags as string) || '[]'
    const rating = Number(r.rating) || 0
    const reviewCount = Number(r.reviewCount) || 0
    const review = (r.review as string) || ''
    const pros = (r.pros as string) || '[]'
    const cons = (r.cons as string) || '[]'

    await db.execute({
      sql: `INSERT OR IGNORE INTO products (
        id, name, slug, ean, asin, brand, imageUrl, images,
        category, subcategory, description, specs, tags,
        rating, reviewCount, review, pros, cons,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        productId, title, slug, '', '', '',
        imageUrl, images, category, subcategory,
        description, technicalSpecs, tags,
        rating, reviewCount, review, pros, cons,
        now, now,
      ] as InValue[],
    })

    await db.execute({
      sql: 'UPDATE deals SET productId = ? WHERE id = ?',
      args: [productId, dealId],
    })
  }
}

export async function createDeal(data: Record<string, unknown>): Promise<Deal> {
  const db = getDb()
  await seedDatabase()

  const id = `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()

  const originalPrice = Number(data.originalPrice) || 0
  const salePrice = Number(data.salePrice) || 0
  const discountPercent = Math.round(((originalPrice - salePrice) / (originalPrice || 1)) * 100)

  const str = (v: unknown, fallback = ''): string => (v as string) || fallback
  const num = (v: unknown, fallback = 0): number => Number(v) || fallback
  const json = (v: unknown): string => JSON.stringify(v || [])

  const statusVal = data.status || 'draft'
  const insertArgs: InValue[] = ([
    id,
    str(data.productId),
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
     0, 0, data.featured ? 1 : 0, statusVal, num(data.commission),
    str(data.ean), str(data.asin), str(data.brand),
    str(data.expiresAt),
    str(data.metaTitle), str(data.metaDescription), str(data.canonicalUrl), str(data.focusKeyword),
    now, now, now,
  ]) as InValue[]

  await db.execute({
    sql: `INSERT INTO deals (
      id, productId, title, slug, description, originalPrice, salePrice, shippingCost,
      discountPercent, currency, imageUrl, images,
      storeId, storeName, storeUrl, storeReputation, storeCommissionRate,
      affiliateUrl, category, subcategory, tags,
      stockStatus, stockCount, rating, reviewCount,
      technicalSpecs, review, pros, cons,
      votesUp, votesDown, featured, status, commission,
      ean, asin, brand, expiresAt,
      metaTitle, metaDescription, canonicalUrl, focusKeyword,
      publishedAt, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

  const statusVal = data.status || 'published'
  const updateArgs: InValue[] = ([
    str(data.productId), str(data.title), str(data.slug), str(data.description), originalPrice, salePrice,
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
    str(data.ean), str(data.asin), str(data.brand),
    str(data.expiresAt),
    str(data.metaTitle), str(data.metaDescription), str(data.canonicalUrl), str(data.focusKeyword),
    data.featured ? 1 : 0, statusVal, num(data.commission),
    now, id,
  ]) as InValue[]

  await db.execute({
    sql: `UPDATE deals SET
      productId = ?, title = ?, slug = ?, description = ?, originalPrice = ?, salePrice = ?,
      shippingCost = ?, discountPercent = ?, imageUrl = ?, images = ?,
      storeId = ?, storeName = ?, storeUrl = ?, storeReputation = ?, storeCommissionRate = ?,
      affiliateUrl = ?, category = ?, subcategory = ?, tags = ?,
      stockStatus = ?, stockCount = ?, rating = ?, reviewCount = ?,
      technicalSpecs = ?, review = ?, pros = ?, cons = ?,
      ean = ?, asin = ?, brand = ?, expiresAt = ?,
      metaTitle = ?, metaDescription = ?, canonicalUrl = ?, focusKeyword = ?,
      featured = ?, status = ?, commission = ?, updatedAt = ?
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

export async function voteDeal(id: string, vote: 'up' | 'down'): Promise<{ votesUp: number; votesDown: number } | null> {
  const db = getDb()
  const column = vote === 'up' ? 'votesUp' : 'votesDown'
  await db.execute({ sql: `UPDATE deals SET ${column} = ${column} + 1 WHERE id = ?`, args: [id] })
  const result = await db.execute({ sql: 'SELECT votesUp, votesDown FROM deals WHERE id = ?', args: [id] })
  if (result.rows.length === 0) return null
  return {
    votesUp: result.rows[0].votesUp as number,
    votesDown: result.rows[0].votesDown as number,
  }
}

export async function getComments(dealId: string) {
  const db = getDb()
  const result = await db.execute({
    sql: "SELECT * FROM comments WHERE dealId = ? AND status = 'published' ORDER BY createdAt DESC",
    args: [dealId],
  })
  return result.rows
}

export async function addComment(dealId: string, author: string, content: string) {
  const db = getDb()
  await db.execute({
    sql: "INSERT INTO comments (dealId, author, content, status, createdAt) VALUES (?, ?, ?, 'published', datetime('now'))",
    args: [dealId, author, content],
  })
  return getComments(dealId)
}

export async function getAllComments() {
  const db = getDb()
  const result = await db.execute(`
    SELECT c.*, d.title as dealTitle, d.slug as dealSlug
    FROM comments c
    LEFT JOIN deals d ON c.dealId = d.id
    ORDER BY c.createdAt DESC
  `)
  return result.rows.map(r => r as Record<string, unknown>)
}

export async function approveComment(id: number): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({
    sql: "UPDATE comments SET status = 'published' WHERE id = ?",
    args: [id],
  })
  return result.rowsAffected > 0
}

export async function rejectComment(id: number): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({
    sql: "UPDATE comments SET status = 'hidden' WHERE id = ?",
    args: [id],
  })
  return result.rowsAffected > 0
}

export async function deleteComment(id: number): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({
    sql: 'DELETE FROM comments WHERE id = ?',
    args: [id],
  })
  return result.rowsAffected > 0
}

export const getDealsCached = cache(async (filters?: DealFilters): Promise<Deal[]> => {
  return getDeals(filters)
})

export const getFeaturedDealsCached = cache(async (): Promise<Deal[]> => {
  return getFeaturedDeals()
})

export const getDealBySlugCached = cache(async (slug: string): Promise<Deal | undefined> => {
  return getDealBySlug(slug)
})

export const getRelatedDealsCached = cache(async (deal: Deal, limit = 4): Promise<Deal[]> => {
  return getRelatedDeals(deal, limit)
})
