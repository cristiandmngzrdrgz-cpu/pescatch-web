import { describe, it, expect, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'
import { initSchema } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'

beforeAll(async () => {
  await initSchema()
  await seedDatabase()
})

async function getFirstDealId(): Promise<string> {
  const { getDeals } = await import('@/data/queries')
  const deals = await getDeals()
  return deals[0].id
}

function jsonRequest(url: string, body: unknown, ip = '10.0.0.1'): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'x-forwarded-for': ip, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/deals/[id]/vote', () => {
  it('votes up a deal', async () => {
    const { POST } = await import('@/app/api/deals/[id]/vote/route')
    const dealId = await getFirstDealId()
    const res = await POST(jsonRequest(`/api/deals/${dealId}/vote`, { vote: 'up' }), { params: Promise.resolve({ id: dealId }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.votesUp).toBeGreaterThanOrEqual(1)
  })

  it('rejects invalid vote value', async () => {
    const { POST } = await import('@/app/api/deals/[id]/vote/route')
    const dealId = await getFirstDealId()
    const res = await POST(jsonRequest(`/api/deals/${dealId}/vote`, { vote: 'sideways' }), { params: Promise.resolve({ id: dealId }) })
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent deal', async () => {
    const { POST } = await import('@/app/api/deals/[id]/vote/route')
    const res = await POST(jsonRequest('/api/deals/no-existe/vote', { vote: 'up' }, '10.0.0.2'), { params: Promise.resolve({ id: 'no-existe' }) })
    expect(res.status).toBe(404)
  })

  it('returns 429 after exceeding vote rate limit', async () => {
    const { POST } = await import('@/app/api/deals/[id]/vote/route')
    const dealId = await getFirstDealId()
    await POST(jsonRequest(`/api/deals/${dealId}/vote`, { vote: 'up' }, '10.0.0.3'), { params: Promise.resolve({ id: dealId }) })
    const res = await POST(jsonRequest(`/api/deals/${dealId}/vote`, { vote: 'up' }, '10.0.0.3'), { params: Promise.resolve({ id: dealId }) })
    expect(res.status).toBe(429)
  })
})

describe('comments on deal', () => {
  it('GET returns comments array', async () => {
    const { GET } = await import('@/app/api/deals/[id]/comments/route')
    const dealId = await getFirstDealId()
    const res = await GET(new NextRequest(`http://localhost/api/deals/${dealId}/comments`), { params: Promise.resolve({ id: dealId }) })
    expect(res.status).toBe(200)
    expect(Array.isArray(await res.json())).toBe(true)
  })

  it('POST adds a comment', async () => {
    const { POST } = await import('@/app/api/deals/[id]/comments/route')
    const dealId = await getFirstDealId()
    const res = await POST(jsonRequest(`/api/deals/${dealId}/comments`, { author: 'Test', content: 'Buen chollo' }, '10.0.1.1'), { params: Promise.resolve({ id: dealId }) })
    expect(res.status).toBe(201)
    const comments = await res.json()
    expect(comments.some((c: { content: string }) => c.content === 'Buen chollo')).toBe(true)
  })

  it('POST rejects missing content', async () => {
    const { POST } = await import('@/app/api/deals/[id]/comments/route')
    const dealId = await getFirstDealId()
    const res = await POST(jsonRequest(`/api/deals/${dealId}/comments`, { author: 'Test' }, '10.0.1.2'), { params: Promise.resolve({ id: dealId }) })
    expect(res.status).toBe(400)
  })

  it('POST rejects content over 2000 chars', async () => {
    const { POST } = await import('@/app/api/deals/[id]/comments/route')
    const dealId = await getFirstDealId()
    const res = await POST(jsonRequest(`/api/deals/${dealId}/comments`, { author: 'Test', content: 'x'.repeat(2001) }, '10.0.1.3'), { params: Promise.resolve({ id: dealId }) })
    expect(res.status).toBe(400)
  })
})

describe('admin comments moderation', () => {
  it('DELETE requires admin auth', async () => {
    const { DELETE } = await import('@/app/api/comments/[id]/route')
    const res = await DELETE(new Request('http://localhost/api/comments/1'), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('PATCH requires admin auth', async () => {
    const { PATCH } = await import('@/app/api/comments/[id]/route')
    const res = await PATCH(new Request('http://localhost/api/comments/1', { method: 'PATCH', body: JSON.stringify({ action: 'approve' }) }), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })
})
