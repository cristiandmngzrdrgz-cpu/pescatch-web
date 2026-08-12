import { describe, it, expect, beforeAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { initSchema } from '@/lib/db'

// Mock autenticado: devuelve siempre el admin_token correcto.
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === 'admin_token' ? { name, value: process.env.ADMIN_SECRET || '' } : undefined),
    set: () => {},
    delete: () => {},
  }),
}))

beforeAll(async () => {
  await initSchema()
})

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/candidates', () => {
  it('rejects approve with missing id', async () => {
    const { POST } = await import('@/app/api/admin/candidates/route')
    const res = await POST(jsonRequest('/api/admin/candidates', { action: 'approve' }))
    expect(res.status).toBe(400)
  })

  it('rejects invalid action', async () => {
    const { POST } = await import('@/app/api/admin/candidates/route')
    const res = await POST(jsonRequest('/api/admin/candidates', { action: 'explode', id: 1 }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when candidate does not exist', async () => {
    const { POST } = await import('@/app/api/admin/candidates/route')
    const res = await POST(jsonRequest('/api/admin/candidates', { action: 'approve', id: 999999 }))
    expect(res.status).toBe(404)
  })

  it('rejects a candidate end-to-end', async () => {
    const { savePendingCandidates, getCandidateById } = await import('@/lib/pending-candidates')
    await savePendingCandidates([
      { asin: 'B0ADM1', title: 'Candidato Admin', price: 25, originalPrice: 30, rating: 4, reviews: 2, url: 'https://a.example/admin', keyword: 'x', category: 'accesorios', imageUrl: null, brand: 'Test', ean: null, score: 60, source: 'amazon' },
    ])
    const { getPendingCandidates } = await import('@/lib/pending-candidates')
    const pending = await getPendingCandidates(5)
    const candidate = pending[0]

    const { POST } = await import('@/app/api/admin/candidates/route')
    const res = await POST(jsonRequest('/api/admin/candidates', { action: 'reject', id: candidate.id }))
    expect(res.status).toBe(200)

    const updated = await getCandidateById(candidate.id)
    expect(updated!.status).toBe('rejected')
  })
})

describe('GET /api/sync', () => {
  it('returns stats with auth mocked', async () => {
    const { GET } = await import('@/app/api/sync/route')
    const req = new NextRequest('http://localhost/api/sync?mode=stats')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('dbStats')
    expect(body).toHaveProperty('lastSync')
    expect(body).toHaveProperty('history')
  })

  it('returns 400 for invalid mode', async () => {
    const { GET } = await import('@/app/api/sync/route')
    const req = new NextRequest('http://localhost/api/sync?mode=bogus')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})
