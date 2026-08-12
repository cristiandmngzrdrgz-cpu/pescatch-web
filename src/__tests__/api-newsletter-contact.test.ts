import { describe, it, expect, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'
import { initSchema } from '@/lib/db'

beforeAll(async () => {
  await initSchema()
})

function jsonRequest(url: string, body: unknown, ip = '1.2.3.4'): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'x-forwarded-for': ip, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/newsletter/subscribe', () => {
  it('subscribes a valid email', async () => {
    const { POST } = await import('@/app/api/newsletter/subscribe/route')
    const res = await POST(jsonRequest('/api/newsletter/subscribe', { email: 'nuevo@test.es' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('rejects a missing email', async () => {
    const { POST } = await import('@/app/api/newsletter/subscribe/route')
    const res = await POST(jsonRequest('/api/newsletter/subscribe', {}))
    expect(res.status).toBe(400)
  })

  it('rejects an invalid email format', async () => {
    const { POST } = await import('@/app/api/newsletter/subscribe/route')
    const res = await POST(jsonRequest('/api/newsletter/subscribe', { email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('normalizes email to lowercase trimmed', async () => {
    const { POST } = await import('@/app/api/newsletter/subscribe/route')
    const res = await POST(jsonRequest('/api/newsletter/subscribe', { email: '  MAYUS@TEST.ES  ' }))
    expect(res.status).toBe(201)
    const { getDb } = await import('@/lib/db')
    const db = getDb()
    const row = await db.execute({ sql: 'SELECT email FROM subscribers WHERE email = ?', args: ['mayus@test.es'] })
    expect(row.rows).toHaveLength(1)
  })

  it('returns 409 for duplicate email', async () => {
    const { POST } = await import('@/app/api/newsletter/subscribe/route')
    const { getDb } = await import('@/lib/db')
    const db = getDb()
    await db.execute({ sql: 'INSERT INTO subscribers (email) VALUES (?)', args: ['dupe@test.es'] })

    const res = await POST(jsonRequest('/api/newsletter/subscribe', { email: 'dupe@test.es' }))
    expect(res.status).toBe(409)
  })

  it('returns 429 after exceeding rate limit', async () => {
    const { POST } = await import('@/app/api/newsletter/subscribe/route')
    for (let i = 0; i < 3; i++) {
      await POST(jsonRequest('/api/newsletter/subscribe', { email: `rl-${i}@test.es` }, '99.99.99.99'))
    }
    const res = await POST(jsonRequest('/api/newsletter/subscribe', { email: 'rl-3@test.es' }, '99.99.99.99'))
    expect(res.status).toBe(429)
  })
})

describe('GET /api/newsletter/unsubscribe', () => {
  it('removes the subscriber and redirects', async () => {
    const { GET } = await import('@/app/api/newsletter/unsubscribe/route')
    const { getDb } = await import('@/lib/db')
    const db = getDb()
    await db.execute({ sql: 'INSERT INTO subscribers (email) VALUES (?)', args: ['baja@test.es'] })

    const req = new NextRequest('http://localhost/api/newsletter/unsubscribe?email=baja@test.es')
    const res = await GET(req)
    expect(res.status).toBe(307)

    const row = await db.execute({ sql: 'SELECT * FROM subscribers WHERE email = ?', args: ['baja@test.es'] })
    expect(row.rows).toHaveLength(0)
  })

  it('redirects with missing-email flag when no email', async () => {
    const { GET } = await import('@/app/api/newsletter/unsubscribe/route')
    const req = new NextRequest('http://localhost/api/newsletter/unsubscribe')
    const res = await GET(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('unsubscribed=missing-email')
  })
})

describe('POST /api/contact', () => {
  it('stores a valid message', async () => {
    const { POST } = await import('@/app/api/contact/route')
    const res = await POST(jsonRequest('/api/contact', { name: 'Ana', email: 'ana@test.es', message: 'Hola' }))
    expect(res.status).toBe(201)

    const { getDb } = await import('@/lib/db')
    const db = getDb()
    const row = await db.execute({ sql: 'SELECT * FROM contact_messages WHERE email = ?', args: ['ana@test.es'] })
    expect(row.rows).toHaveLength(1)
  })

  it('rejects missing email or message', async () => {
    const { POST } = await import('@/app/api/contact/route')
    expect((await POST(jsonRequest('/api/contact', { email: 'x@test.es' }))).status).toBe(400)
    expect((await POST(jsonRequest('/api/contact', { message: 'solo msg' }))).status).toBe(400)
  })

  it('rejects invalid email', async () => {
    const { POST } = await import('@/app/api/contact/route')
    const res = await POST(jsonRequest('/api/contact', { email: 'malo', message: 'hola' }))
    expect(res.status).toBe(400)
  })

  it('rejects messages over 5000 chars', async () => {
    const { POST } = await import('@/app/api/contact/route')
    const res = await POST(jsonRequest('/api/contact', { email: 'ok@test.es', message: 'x'.repeat(5001) }))
    expect(res.status).toBe(400)
  })

  it('truncates name to 100 chars', async () => {
    const { POST } = await import('@/app/api/contact/route')
    const longName = 'n'.repeat(200)
    const res = await POST(jsonRequest('/api/contact', { name: longName, email: 'name@test.es', message: 'hola' }))
    expect(res.status).toBe(201)

    const { getDb } = await import('@/lib/db')
    const db = getDb()
    const row = await db.execute({ sql: 'SELECT name FROM contact_messages WHERE email = ?', args: ['name@test.es'] })
    expect(String(row.rows[0].name).length).toBe(100)
  })

  it('returns 429 after exceeding rate limit', async () => {
    const { POST } = await import('@/app/api/contact/route')
    for (let i = 0; i < 5; i++) {
      await POST(jsonRequest('/api/contact', { email: `c-${i}@test.es`, message: 'hola' }, '88.88.88.88'))
    }
    const res = await POST(jsonRequest('/api/contact', { email: 'c-5@test.es', message: 'hola' }, '88.88.88.88'))
    expect(res.status).toBe(429)
  })
})
