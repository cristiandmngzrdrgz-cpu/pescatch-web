import { getDb, initSchema } from './db'
import { sampleDeals } from '@/data/deals'

let seeded = false

export async function seedDatabase() {
  if (seeded) return

  const db = getDb()
  await initSchema()

  const result = await db.execute('SELECT COUNT(*) as count FROM deals')
  if (Number(result.rows[0]?.count) > 0) {
    seeded = true
    return
  }

  for (const deal of sampleDeals) {
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
      args: [
        deal.id, deal.title, deal.slug, deal.description,
        deal.originalPrice, deal.salePrice, deal.shippingCost,
        deal.discountPercent, '€', deal.imageUrl,
        JSON.stringify(deal.images || []),
        deal.store?.id || '', deal.store?.name || '', deal.store?.url || '',
        deal.store?.reputation || 'good', deal.store?.commissionRate || 0,
        deal.affiliateUrl || '', deal.category, deal.subcategory || '',
        JSON.stringify(deal.tags || []),
        deal.stockStatus, deal.stockCount || 0, deal.rating || 0,
        deal.reviewCount || 0,
        JSON.stringify(deal.technicalSpecs || {}), deal.review || '',
        JSON.stringify(deal.pros || []), JSON.stringify(deal.cons || []),
        deal.votesUp || 0, deal.votesDown || 0,
        deal.featured ? 1 : 0, deal.commission || 0,
        deal.publishedAt, deal.createdAt || deal.publishedAt,
        deal.updatedAt || deal.publishedAt,
      ],
    })

    if (deal.priceHistory) {
      for (const point of deal.priceHistory) {
        try {
          await db.execute({
            sql: 'INSERT OR IGNORE INTO price_history (dealId, date, price) VALUES (?, ?, ?)',
            args: [deal.id, point.date, point.price],
          })
        } catch {}
      }
    }
  }

  // Seed sample comments
  const comments = [
    { dealId: sampleDeals[0].id, author: 'Carlos', content: 'Buen chollo, lo compré la semana pasada y llegó en 2 días.', createdAt: '2026-06-25' },
    { dealId: sampleDeals[0].id, author: 'Miguel', content: 'Alguien sabe si este carrete trae rodamientos de serie?', createdAt: '2026-06-26' },
    { dealId: sampleDeals[1].id, author: 'Ana', content: 'La caña es una pasada, la uso para surfcasting y aguanta perfecta.', createdAt: '2026-06-24' },
  ]

  for (const c of comments) {
    try {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO comments (dealId, author, content, createdAt) VALUES (?, ?, ?, ?)',
        args: [c.dealId, c.author, c.content, c.createdAt],
      })
    } catch {}
  }

  seeded = true
  console.log('✅ Database seeded successfully')
}
