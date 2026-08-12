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
