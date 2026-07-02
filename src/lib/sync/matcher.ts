import { getDb } from '../db'
import type { InValue } from '@libsql/client'

export interface MatchedProduct {
  id: string
  exists: boolean
}

export async function matchByEan(ean: string): Promise<MatchedProduct | null> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT id FROM products WHERE ean = ?',
    args: [ean],
  })

  if (result.rows.length > 0) {
    return { id: result.rows[0].id as string, exists: true }
  }

  return null
}

export async function matchBySlug(slug: string): Promise<MatchedProduct | null> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT id FROM products WHERE slug = ?',
    args: [slug],
  })

  if (result.rows.length > 0) {
    return { id: result.rows[0].id as string, exists: true }
  }

  return null
}

export async function insertProduct(
  id: string,
  name: string,
  slug: string,
  ean: string,
  brand: string,
  category: string,
  subcategory: string,
  imageUrl: string,
  description: string,
  now: string,
): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `INSERT OR IGNORE INTO products (
      id, name, slug, ean, asin, brand, imageUrl, images,
      category, subcategory, description, specs, tags,
      rating, reviewCount, review, pros, cons,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, name, slug, ean, '', brand,
      imageUrl, '[]', category, subcategory,
      description, '{}', '[]',
      0, 0, '', '[]', '[]',
      now, now,
    ] as InValue[],
  })
}

export async function updateProduct(
  id: string,
  name: string,
  slug: string,
  brand: string,
  category: string,
  subcategory: string,
  imageUrl: string,
  description: string,
  now: string,
): Promise<void> {
  const db = getDb()
  const fields = ["name = ?", "slug = ?", "brand = ?", "category = ?", "subcategory = ?", "description = ?", "updatedAt = ?"]
  const args: InValue[] = [name, slug, brand, category, subcategory, description, now]

  if (imageUrl) {
    fields.push("imageUrl = ?")
    args.push(imageUrl)
  }

  args.push(id)
  await db.execute({
    sql: `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
    args: args,
  })
}

export async function upsertDeal(
  productId: string,
  storeId: string,
  storeName: string,
  slug: string,
  title: string,
  originalPrice: number,
  salePrice: number,
  shippingCost: number,
  stockStatus: string,
  affiliateUrl: string,
  now: string,
): Promise<string> {
  const db = getDb()

  const discountPercent = Math.round(((originalPrice - salePrice) / (originalPrice || 1)) * 100)
  const store = getStoreInfo(storeId)

  // Check if a deal for this product+store already exists (for returning the id)
  const existing = await db.execute({
    sql: 'SELECT id FROM deals WHERE productId = ? AND storeId = ?',
    args: [productId, storeId],
  })

  if (existing.rows.length > 0) {
    const dealId = existing.rows[0].id as string

    await db.execute({
      sql: `UPDATE deals SET
        title = ?, slug = ?, originalPrice = ?, salePrice = ?, shippingCost = ?, discountPercent = ?,
        stockStatus = ?, affiliateUrl = ?, storeName = ?, storeUrl = ?,
        storeReputation = ?, storeCommissionRate = ?, updatedAt = ?
      WHERE id = ?`,
      args: [title, slug, originalPrice, salePrice, shippingCost, discountPercent, stockStatus, affiliateUrl, storeName, store.url || '', store.reputation, store.commissionRate || 0, now, dealId],
    })

    return dealId
  }

  // Create new deal
  const dealId = `deal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

  await db.execute({
    sql: `INSERT INTO deals (
      id, productId, title, slug, description, originalPrice, salePrice, shippingCost,
      discountPercent, currency, imageUrl, images,
      storeId, storeName, storeUrl, storeReputation, storeCommissionRate,
      affiliateUrl, category, subcategory, tags,
      stockStatus, stockCount, rating, reviewCount,
      technicalSpecs, review, pros, cons,
      votesUp, votesDown, featured, commission,
      ean, asin, publishedAt, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      dealId, productId, title, slug, '',
      originalPrice, salePrice, shippingCost,
      discountPercent, '€', '', '[]',
      store.id, store.name, store.url || '',
      store.reputation, store.commissionRate || 0,
      affiliateUrl, '', '', '[]',
      stockStatus, 0, 0, 0,
      '{}', '', '[]', '[]',
      0, 0, 0, 0,
      '', '', now, now, now,
    ] as InValue[],
  })

  return dealId
}

export async function recordPricePoint(dealId: string, price: number, date: string): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: 'INSERT OR IGNORE INTO price_history (dealId, date, price) VALUES (?, ?, ?)',
    args: [dealId, date, price],
  })
}

export function getStoreInfo(storeId: string): { id: string; name: string; url?: string; reputation: string; commissionRate?: number } {
  const stores: Record<string, { id: string; name: string; url: string; reputation: string; commissionRate: number }> = {
    amazon: { id: 'amazon', name: 'Amazon', url: 'https://amazon.es', reputation: 'good', commissionRate: 0.05 },
    decathlon: { id: 'decathlon', name: 'Decathlon', url: 'https://decathlon.es', reputation: 'good', commissionRate: 0.03 },
    aliexpress: { id: 'aliexpress', name: 'AliExpress', url: 'https://aliexpress.com', reputation: 'neutral', commissionRate: 0.08 },
    'fishing-tackle-bait': { id: 'fishing-tackle-bait', name: 'Fishing Tackle & Bait', url: 'https://fishingtackleandbait.co.uk', reputation: 'good', commissionRate: 0.05 },
    'total-fishing-tackle': { id: 'total-fishing-tackle', name: 'Total Fishing Tackle', url: 'https://total-fishing-tackle.com', reputation: 'good', commissionRate: 0.05 },
    'pure-fishing': { id: 'pure-fishing', name: 'Pure Fishing', url: 'https://purefishing.com', reputation: 'good', commissionRate: 0.10 },
  }
  return stores[storeId] || { id: storeId, name: storeId, url: '', reputation: 'neutral', commissionRate: 0 }
}
