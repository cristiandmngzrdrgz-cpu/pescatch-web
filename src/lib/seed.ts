import { getDb } from './db'
import { sampleDeals } from '@/data/deals'

export function seedDatabase() {
  const db = getDb()

  const existing = db.prepare('SELECT COUNT(*) as count FROM deals').get() as { count: number }
  if (existing.count > 0) return

  const insertDeal = db.prepare(`
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
      @id, @title, @slug, @description, @originalPrice, @salePrice, @shippingCost,
      @discountPercent, @currency, @imageUrl, @images,
      @storeId, @storeName, @storeUrl, @storeReputation, @storeCommissionRate,
      @affiliateUrl, @category, @subcategory, @tags,
      @stockStatus, @stockCount, @rating, @reviewCount,
      @technicalSpecs, @review, @pros, @cons,
      @votesUp, @votesDown, @featured, @commission,
      @publishedAt, @createdAt, @updatedAt
    )
  `)

  const insertPrice = db.prepare('INSERT OR IGNORE INTO price_history (dealId, date, price) VALUES (?, ?, ?)')

  const insertComment = db.prepare('INSERT OR IGNORE INTO comments (dealId, author, content, createdAt) VALUES (?, ?, ?, ?)')

  const transaction = db.transaction(() => {
    for (const deal of sampleDeals) {
      insertDeal.run({
        id: deal.id,
        title: deal.title,
        slug: deal.slug,
        description: deal.description,
        originalPrice: deal.originalPrice,
        salePrice: deal.salePrice,
        shippingCost: deal.shippingCost,
        discountPercent: deal.discountPercent,
        currency: deal.currency,
        imageUrl: deal.imageUrl,
        images: JSON.stringify(deal.images || []),
        storeId: deal.store?.id || '',
        storeName: deal.store?.name || '',
        storeUrl: deal.store?.url || '',
        storeReputation: deal.store?.reputation || 'good',
        storeCommissionRate: deal.store?.commissionRate || 0,
        affiliateUrl: deal.affiliateUrl || '',
        category: deal.category,
        subcategory: deal.subcategory || '',
        tags: JSON.stringify(deal.tags || []),
        stockStatus: deal.stockStatus,
        stockCount: deal.stockCount || 0,
        rating: deal.rating || 0,
        reviewCount: deal.reviewCount || 0,
        technicalSpecs: JSON.stringify(deal.technicalSpecs || {}),
        review: deal.review || '',
        pros: JSON.stringify(deal.pros || []),
        cons: JSON.stringify(deal.cons || []),
        votesUp: deal.votesUp || 0,
        votesDown: deal.votesDown || 0,
        featured: deal.featured ? 1 : 0,
        commission: deal.commission || 0,
        publishedAt: deal.publishedAt,
        createdAt: deal.createdAt || deal.publishedAt,
        updatedAt: deal.updatedAt || deal.publishedAt,
      })

      if (deal.priceHistory) {
        for (const point of deal.priceHistory) {
          try { insertPrice.run(deal.id, point.date, point.price) } catch {}
        }
      }
    }

    // Seed sample comments on first deal
    try {
      insertComment.run(sampleDeals[0].id, 'Carlos', 'Buen chollo, lo compré la semana pasada y llegó en 2 días.', '2026-06-25')
      insertComment.run(sampleDeals[0].id, 'Miguel', 'Alguien sabe si este carrete trae rodamientos de serie?', '2026-06-26')
      insertComment.run(sampleDeals[1].id, 'Ana', 'La caña es una pasada, la uso para surfcasting y aguanta perfecta.', '2026-06-24')
    } catch {}
  })

  transaction()
  console.log('✅ Database seeded successfully')
}
