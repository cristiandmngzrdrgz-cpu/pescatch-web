import { describe, it, expect, beforeAll } from 'vitest'
import { initSchema } from '@/lib/db'

beforeAll(async () => {
  await initSchema()
})

describe('pending-candidates', () => {
  it('savePendingCandidates returns count and dedupes by URL', async () => {
    const { savePendingCandidates, getPendingCandidates, getCandidateCount } = await import('@/lib/pending-candidates')
    const url = 'https://example.com/item/12345.html'

    const saved = await savePendingCandidates([
      { asin: 'B0TEST01', title: 'Caña 1', price: 50, originalPrice: 70, rating: 4.5, reviews: 10, url, keyword: 'caña', category: 'canas', imageUrl: null, brand: 'Shimano', ean: null, score: 95, source: 'amazon' },
      { asin: 'B0TEST02', title: 'Caña 2', price: 60, originalPrice: 80, rating: 4.5, reviews: 10, url, keyword: 'caña', category: 'canas', imageUrl: null, brand: 'Shimano', ean: null, score: 90, source: 'amazon' },
    ])

    expect(saved).toBe(1)

    const pending = await getPendingCandidates(10)
    expect(pending).toHaveLength(1)
    expect(pending[0].title).toBe('Caña 1')

    const counts = await getCandidateCount()
    expect(counts.pending).toBe(1)
    expect(counts.approved).toBe(0)
    expect(counts.rejected).toBe(0)
  })

  it('approve and reject candidate update status', async () => {
    const { savePendingCandidates, getPendingCandidates, approveCandidate, rejectCandidate, getCandidateById, getCandidateCount } = await import('@/lib/pending-candidates')

    await savePendingCandidates([
      { asin: 'B0APPR1', title: 'Aprobar', price: 30, originalPrice: null, rating: 4, reviews: 3, url: 'https://a.example/1', keyword: 'x', category: 'accesorios', imageUrl: null, brand: null, ean: null, score: 80, source: 'amazon' },
      { asin: 'B0REJ1', title: 'Rechazar', price: 30, originalPrice: null, rating: 4, reviews: 3, url: 'https://a.example/2', keyword: 'x', category: 'accesorios', imageUrl: null, brand: null, ean: null, score: 70, source: 'amazon' },
    ])

    const pending = await getPendingCandidates(10)
    const toApprove = pending.find(p => p.asin === 'B0APPR1')!
    const toReject = pending.find(p => p.asin === 'B0REJ1')!

    expect(await approveCandidate(toApprove.id)).toBe(true)
    expect(await rejectCandidate(toReject.id)).toBe(true)

    const approved = await getCandidateById(toApprove.id)
    expect(approved!.status).toBe('approved')
    const rejected = await getCandidateById(toReject.id)
    expect(rejected!.status).toBe('rejected')

    const counts = await getCandidateCount()
    expect(counts.pending).toBe(0)
    expect(counts.approved).toBe(1)
    expect(counts.rejected).toBe(1)
  })

  it('approveCandidate returns false for non-existent id', async () => {
    const { approveCandidate } = await import('@/lib/pending-candidates')
    expect(await approveCandidate(999999)).toBe(false)
  })

  it('getCandidateById returns null for non-existent id', async () => {
    const { getCandidateById } = await import('@/lib/pending-candidates')
    expect(await getCandidateById(999999)).toBeNull()
  })
})

describe('pending-candidates anti-duplicados', () => {
  const base = {
    title: 'Producto test', originalPrice: 70, rating: 4.5, reviews: 50,
    keyword: 'caña', category: 'canas', imageUrl: null, brand: 'Shimano', ean: null, score: 90, source: 'test',
  }

  it('no re-guarda un candidato rechazado si el precio no baja ≥10%', async () => {
    const { savePendingCandidates, getPendingCandidates, rejectCandidate } = await import('@/lib/pending-candidates')
    const url = 'https://www.amazon.es/dp/B0DUPTEST1'

    await savePendingCandidates([{ ...base, asin: 'B0DUPTEST1', price: 50, url }])
    const [first] = await getPendingCandidates(10)
    await rejectCandidate(first.id)

    const saved = await savePendingCandidates([{ ...base, asin: 'B0DUPTEST1', price: 49, url }])
    expect(saved).toBe(0)
    expect(await getPendingCandidates(10)).toHaveLength(0)
  })

  it('re-guarda un rechazado si el precio cae ≥10%, marcado como revisado', async () => {
    const { savePendingCandidates, getPendingCandidates, rejectCandidate } = await import('@/lib/pending-candidates')
    const url = 'https://www.amazon.es/dp/B0DUPTEST2'

    await savePendingCandidates([{ ...base, asin: 'B0DUPTEST2', price: 50, url }])
    const [first] = await getPendingCandidates(10)
    await rejectCandidate(first.id)

    const saved = await savePendingCandidates([{ ...base, asin: 'B0DUPTEST2', price: 40, url }])
    expect(saved).toBe(1)

    const [reentry] = await getPendingCandidates(10)
    expect(reentry.price).toBe(40)
    expect(reentry.source).toContain('revisado -20%')
  })

  it('no re-guarda un candidato ya aprobado', async () => {
    const { savePendingCandidates, getPendingCandidates, approveCandidate } = await import('@/lib/pending-candidates')
    const url = 'https://www.amazon.es/dp/B0DUPTEST3'

    await savePendingCandidates([{ ...base, asin: 'B0DUPTEST3', price: 50, url }])
    const [first] = await getPendingCandidates(10)
    await approveCandidate(first.id)

    const saved = await savePendingCandidates([{ ...base, asin: 'B0DUPTEST3', price: 30, url }])
    expect(saved).toBe(0)
  })

  it('no guarda un candidato cuyo ASIN ya es un deal', async () => {
    const { savePendingCandidates, getPendingCandidates } = await import('@/lib/pending-candidates')
    const { getDb } = await import('@/lib/db')
    const db = getDb()
    const asin = 'B0DEALTEST'

    await db.execute({
      sql: `INSERT INTO deals (id, title, slug, originalPrice, salePrice, asin, affiliateUrl, storeId, status)
            VALUES ('deal-test-dupe', 'Deal test', 'deal-test-dupe', 60, 45, ?, 'https://www.amazon.es/dp/B0DEALTEST?tag=t', 'amazon', 'published')`,
      args: [asin],
    })

    try {
      const saved = await savePendingCandidates([{
        ...base, asin, price: 30, url: 'https://www.amazon.es/dp/B0DEALTEST',
      }])
      expect(saved).toBe(0)
      expect(await getPendingCandidates(10)).toHaveLength(0)
    } finally {
      await db.execute({ sql: 'DELETE FROM deals WHERE id = ?', args: ['deal-test-dupe'] })
    }
  })

  it('no guarda un candidato AliExpress cuyo item ya es un deal', async () => {
    const { savePendingCandidates } = await import('@/lib/pending-candidates')
    const { getDb } = await import('@/lib/db')
    const db = getDb()

    await db.execute({
      sql: `INSERT INTO deals (id, title, slug, originalPrice, salePrice, affiliateUrl, storeId, status)
            VALUES ('deal-test-ae', 'Deal AE test', 'deal-test-ae', 40, 30, 'https://www.aliexpress.com/item/1005001234567.html', 'aliexpress', 'published')`,
    })

    try {
      const saved = await savePendingCandidates([{
        ...base, asin: '', price: 25, url: 'https://www.aliexpress.com/item/1005001234567.html', brand: null,
      }])
      expect(saved).toBe(0)
    } finally {
      await db.execute({ sql: 'DELETE FROM deals WHERE id = ?', args: ['deal-test-ae'] })
    }
  })

  it('no guarda un clon (similitud ≥0.85) de un deal activo con otro ASIN', async () => {
    const { savePendingCandidates, getPendingCandidates } = await import('@/lib/pending-candidates')
    const { getDb } = await import('@/lib/db')
    const db = getDb()

    await db.execute({
      sql: `INSERT INTO deals (id, title, slug, originalPrice, salePrice, brand, storeId, status)
            VALUES ('deal-test-clon', 'Daiwa Revros LT - Carrete de Pesca para Lagos y Ríos, tamaño 1000-6000', 'deal-test-clon', 80, 65, 'Daiwa', 'amazon', 'published')`,
    })

    try {
      const saved = await savePendingCandidates([{
        ...base,
        asin: 'B0CLONTEST',
        title: 'Daiwa Revros LT, Carrete de Pesca para Lagos y Ríos tamaño 1000',
        price: 60,
        url: 'https://www.amazon.es/dp/B0CLONTEST',
        brand: 'Daiwa',
      }])
      expect(saved).toBe(0)
      expect(await getPendingCandidates(10)).toHaveLength(0)
    } finally {
      await db.execute({ sql: 'DELETE FROM deals WHERE id = ?', args: ['deal-test-clon'] })
    }
  })

  it('sí guarda un producto distinto (similitud <0.85)', async () => {
    const { savePendingCandidates } = await import('@/lib/pending-candidates')
    const { getDb } = await import('@/lib/db')
    const db = getDb()

    await db.execute({
      sql: `INSERT INTO deals (id, title, slug, originalPrice, salePrice, brand, storeId, status)
            VALUES ('deal-test-distinto', 'Daiwa Revros LT - Carrete de Pesca para Lagos y Ríos, tamaño 1000-6000', 'deal-test-distinto', 80, 65, 'Daiwa', 'amazon', 'published')`,
    })

    try {
      const saved = await savePendingCandidates([{
        ...base,
        asin: 'B0DISTINTO',
        title: 'Mustad Kit de anzuelos surtidos 100 unidades con caja',
        price: 15,
        url: 'https://www.amazon.es/dp/B0DISTINTO',
        brand: 'Mustad',
      }])
      expect(saved).toBe(1)
    } finally {
      await db.execute({ sql: 'DELETE FROM deals WHERE id = ?', args: ['deal-test-distinto'] })
      await db.execute({ sql: 'DELETE FROM pending_candidates WHERE url = ?', args: ['https://www.amazon.es/dp/B0DISTINTO'] })
    }
  })
})

describe('rate-limit', () => {
  it('allows requests within the limit', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    expect(await checkRateLimit('test-ip-1', 'newsletter')).toBe(true)
    expect(await checkRateLimit('test-ip-1', 'newsletter')).toBe(true)
    expect(await checkRateLimit('test-ip-1', 'newsletter')).toBe(true)
  })

  it('rejects requests over the limit', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    for (let i = 0; i < 3; i++) {
      await checkRateLimit('test-ip-2', 'newsletter')
    }
    expect(await checkRateLimit('test-ip-2', 'newsletter')).toBe(false)
  })

  it('votes are limited to 1 per deal per ip', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    expect(await checkRateLimit('vote:ip:deal1', 'votes')).toBe(true)
    expect(await checkRateLimit('vote:ip:deal1', 'votes')).toBe(false)
  })

  it('cleanExpiredRateLimits removes old entries', async () => {
    const { checkRateLimit, cleanExpiredRateLimits } = await import('@/lib/rate-limit')
    const { getDb } = await import('@/lib/db')
    const db = getDb()

    await checkRateLimit('expirable-key', 'contact')
    // Forzamos reset_at en el pasado
    await db.execute({
      sql: "UPDATE rate_limits SET reset_at = datetime('now', '-1 hour') WHERE key = 'contact:expirable-key'",
    })
    await cleanExpiredRateLimits()

    const result = await db.execute({ sql: 'SELECT * FROM rate_limits WHERE key = ?', args: ['contact:expirable-key'] })
    expect(result.rows).toHaveLength(0)
  })
})

describe('validation schemas', () => {
  it('dealSchema rejects invalid salePrice', async () => {
    const { dealSchema } = await import('@/lib/validation')
    const result = dealSchema.safeParse({ title: 'X', slug: 'x', originalPrice: 10, salePrice: -5 })
    expect(result.success).toBe(false)
  })

  it('dealSchema rejects invalid slug characters', async () => {
    const { dealSchema } = await import('@/lib/validation')
    const result = dealSchema.safeParse({ title: 'X', slug: 'Con Espacios', originalPrice: 10, salePrice: 5 })
    expect(result.success).toBe(false)
  })

  it('parseOrThrow throws ValidationError on invalid data', async () => {
    const { dealSchema, parseOrThrow, ValidationError } = await import('@/lib/validation')
    expect(() => parseOrThrow(dealSchema, {})).toThrow(ValidationError)
  })

  it('postSchema rejects invalid slug', async () => {
    const { postSchema } = await import('@/lib/validation')
    const result = postSchema.safeParse({ title: 'X', slug: 'a/b' })
    expect(result.success).toBe(false)
  })
})
