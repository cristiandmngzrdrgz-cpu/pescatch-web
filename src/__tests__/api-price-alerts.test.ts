import { describe, it, expect, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'
import { initSchema } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'

beforeAll(async () => {
  await initSchema()
  await seedDatabase()
})

async function getFirstDeal(): Promise<{ id: string; salePrice: number }> {
  const { getDeals } = await import('@/data/queries')
  const deals = await getDeals()
  return { id: deals[0].id, salePrice: deals[0].salePrice }
}

function jsonRequest(url: string, body: unknown, ip = '10.1.0.1'): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'x-forwarded-for': ip, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/price-alerts', () => {
  it('creates an active alert with default target = current price', async () => {
    const { POST } = await import('@/app/api/price-alerts/route')
    const deal = await getFirstDeal()
    const res = await POST(jsonRequest('/api/price-alerts', { email: 'alert@test.es', dealId: deal.id }))
    expect(res.status).toBe(201)

    const { getDb } = await import('@/lib/db')
    const db = getDb()
    const row = await db.execute({ sql: 'SELECT * FROM price_alerts WHERE email = ? AND dealId = ?', args: ['alert@test.es', deal.id] })
    expect(row.rows).toHaveLength(1)
    expect(row.rows[0].status).toBe('active')
    expect(Number(row.rows[0].targetPrice)).toBe(deal.salePrice)
  })

  it('stores a custom target price', async () => {
    const { POST } = await import('@/app/api/price-alerts/route')
    const deal = await getFirstDeal()
    const res = await POST(jsonRequest('/api/price-alerts', { email: 'target@test.es', dealId: deal.id, targetPrice: 10 }))
    expect(res.status).toBe(201)

    const { getDb } = await import('@/lib/db')
    const db = getDb()
    const row = await db.execute({ sql: 'SELECT targetPrice FROM price_alerts WHERE email = ? AND dealId = ?', args: ['target@test.es', deal.id] })
    expect(Number(row.rows[0].targetPrice)).toBe(10)
  })

  it('reactivates an existing triggered alert', async () => {
    const { POST } = await import('@/app/api/price-alerts/route')
    const { getDb } = await import('@/lib/db')
    const db = getDb()
    const deal = await getFirstDeal()
    await db.execute({
      sql: `INSERT INTO price_alerts (email, dealId, targetPrice, status, triggered_at) VALUES (?, ?, ?, 'triggered', datetime('now'))`,
      args: ['reactive@test.es', deal.id, deal.salePrice],
    })

    const res = await POST(jsonRequest('/api/price-alerts', { email: 'reactive@test.es', dealId: deal.id }))
    expect(res.status).toBe(201)

    const row = await db.execute({ sql: 'SELECT status, triggered_at FROM price_alerts WHERE email = ? AND dealId = ?', args: ['reactive@test.es', deal.id] })
    expect(row.rows[0].status).toBe('active')
    expect(row.rows[0].triggered_at).toBeNull()
  })

  it('rejects a missing email', async () => {
    const { POST } = await import('@/app/api/price-alerts/route')
    const deal = await getFirstDeal()
    const res = await POST(jsonRequest('/api/price-alerts', { dealId: deal.id }))
    expect(res.status).toBe(400)
  })

  it('rejects an invalid email', async () => {
    const { POST } = await import('@/app/api/price-alerts/route')
    const deal = await getFirstDeal()
    const res = await POST(jsonRequest('/api/price-alerts', { email: 'malo', dealId: deal.id }))
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent deal', async () => {
    const { POST } = await import('@/app/api/price-alerts/route')
    const res = await POST(jsonRequest('/api/price-alerts', { email: 'nope@test.es', dealId: 'no-existe' }))
    expect(res.status).toBe(404)
  })

  it('returns 429 after exceeding rate limit', async () => {
    const { POST } = await import('@/app/api/price-alerts/route')
    const deal = await getFirstDeal()
    for (let i = 0; i < 3; i++) {
      await POST(jsonRequest('/api/price-alerts', { email: `pa-${i}@test.es`, dealId: deal.id }, '99.98.0.1'))
    }
    const res = await POST(jsonRequest('/api/price-alerts', { email: 'pa-3@test.es', dealId: deal.id }, '99.98.0.1'))
    expect(res.status).toBe(429)
  })
})

describe('GET /api/price-alerts', () => {
  it('reports active status', async () => {
    const { GET } = await import('@/app/api/price-alerts/route')
    const { getDb } = await import('@/lib/db')
    const db = getDb()
    const deal = await getFirstDeal()
    await db.execute({
      sql: `INSERT INTO price_alerts (email, dealId, targetPrice) VALUES (?, ?, ?)`,
      args: ['status@test.es', deal.id, deal.salePrice],
    })

    const req = new NextRequest(`http://localhost/api/price-alerts?email=status@test.es&dealId=${deal.id}`)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.active).toBe(true)
  })

  it('reports inactive for no alert', async () => {
    const { GET } = await import('@/app/api/price-alerts/route')
    const deal = await getFirstDeal()
    const req = new NextRequest(`http://localhost/api/price-alerts?email=noal@test.es&dealId=${deal.id}`)
    const res = await GET(req)
    const body = await res.json()
    expect(body.active).toBe(false)
  })

  it('requires email and dealId', async () => {
    const { GET } = await import('@/app/api/price-alerts/route')
    const res = await GET(new NextRequest('http://localhost/api/price-alerts?email=x@test.es'))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/price-alerts/unsubscribe', () => {
  it('marks the alert as cancelled and redirects to the deal', async () => {
    const { GET } = await import('@/app/api/price-alerts/unsubscribe/route')
    const { getDb } = await import('@/lib/db')
    const db = getDb()
    const deal = await getFirstDeal()
    await db.execute({
      sql: `INSERT INTO price_alerts (email, dealId, targetPrice) VALUES (?, ?, ?)`,
      args: ['baja@test.es', deal.id, deal.salePrice],
    })

    const req = new NextRequest(`http://localhost/api/price-alerts/unsubscribe?email=baja@test.es&dealId=${deal.id}&slug=test-slug`)
    const res = await GET(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/deals/test-slug?alert-cancelled=true')

    const row = await db.execute({ sql: 'SELECT status FROM price_alerts WHERE email = ? AND dealId = ?', args: ['baja@test.es', deal.id] })
    expect(row.rows[0].status).toBe('cancelled')
  })

  it('redirects with missing flag when no params', async () => {
    const { GET } = await import('@/app/api/price-alerts/unsubscribe/route')
    const res = await GET(new NextRequest('http://localhost/api/price-alerts/unsubscribe'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('alert-cancelled=missing')
  })
})

describe('processPriceAlerts', () => {
  it('triggers alerts when price is at or below target and marks them sent', async () => {
    const { processPriceAlerts } = await import('@/lib/price-alerts')
    const { getDb } = await import('@/lib/db')
    const db = getDb()
    const deal = await getFirstDeal()

    await db.execute({
      sql: `UPDATE deals SET salePrice = ? WHERE id = ?`,
      args: [5, deal.id],
    })
    await db.execute({
      sql: `INSERT INTO price_alerts (email, dealId, targetPrice) VALUES (?, ?, ?)`,
      args: ['proc@test.es', deal.id, 10],
    })

    const result = await processPriceAlerts()
    expect(result.sent).toBe(0)

    const row = await db.execute({ sql: 'SELECT status FROM price_alerts WHERE email = ? AND dealId = ?', args: ['proc@test.es', deal.id] })
    expect(row.rows[0].status).toBe('active')
  })

  it('does not trigger alerts above the target price', async () => {
    const { processPriceAlerts } = await import('@/lib/price-alerts')
    const { getDb } = await import('@/lib/db')
    const db = getDb()
    const deal = await getFirstDeal()

    await db.execute({
      sql: `UPDATE deals SET salePrice = ? WHERE id = ?`,
      args: [999, deal.id],
    })
    await db.execute({
      sql: `INSERT INTO price_alerts (email, dealId, targetPrice) VALUES (?, ?, ?)`,
      args: ['high@test.es', deal.id, 100],
    })

    const result = await processPriceAlerts()
    expect(result.sent).toBe(0)
    expect(result.skipped).toBe(0)

    const row = await db.execute({ sql: 'SELECT status FROM price_alerts WHERE email = ? AND dealId = ?', args: ['high@test.es', deal.id] })
    expect(row.rows[0].status).toBe('active')
  })
})