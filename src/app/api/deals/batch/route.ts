import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'
import type { Deal, Store } from '@/types'

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
    status: row.status as 'draft' | 'published',
    commission: row.commission as number,
    ean: row.ean as string,
    asin: row.asin as string,
    brand: row.brand as string,
    metaTitle: row.metaTitle as string,
    metaDescription: row.metaDescription as string,
    canonicalUrl: row.canonicalUrl as string,
    focusKeyword: row.focusKeyword as string,
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { ids } = body as { ids: string[] }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json([])
  }

  await seedDatabase()
  const db = getDb()

  const placeholders = ids.map(() => '?').join(',')
  const result = await db.execute({
    sql: `SELECT * FROM deals WHERE id IN (${placeholders}) AND status = 'published'`,
    args: ids,
  })

  const deals = result.rows.map(row => mapRowToDeal(row as Record<string, unknown>))

  return NextResponse.json(deals)
}
