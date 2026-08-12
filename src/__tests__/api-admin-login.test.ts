import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { initSchema } from '@/lib/db'

const cookieStore = new Map<string, string>()

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieStore.has(name) ? { name, value: cookieStore.get(name) } : undefined),
    set: (name: string, value: string) => { cookieStore.set(name, value) },
    delete: (name: string) => { cookieStore.delete(name) },
  }),
}))

beforeAll(async () => {
  await initSchema()
})

beforeEach(() => {
  cookieStore.clear()
  process.env.ADMIN_SECRET = 'test-admin-secret'
})

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/login', () => {
  it('returns 401 for wrong secret', async () => {
    const { POST } = await import('@/app/api/admin/login/route')
    const res = await POST(jsonRequest('/api/admin/login', { secret: 'wrong-secret' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 for non-string secret', async () => {
    const { POST } = await import('@/app/api/admin/login/route')
    const res = await POST(jsonRequest('/api/admin/login', { secret: 123 }))
    expect(res.status).toBe(401)
  })

  it('returns 500 when ADMIN_SECRET is not set', async () => {
    delete process.env.ADMIN_SECRET
    const { POST } = await import('@/app/api/admin/login/route')
    const res = await POST(jsonRequest('/api/admin/login', { secret: 'anything' }))
    expect(res.status).toBe(500)
  })

  it('sets the cookie for correct secret', async () => {
    const { POST } = await import('@/app/api/admin/login/route')
    const res = await POST(jsonRequest('/api/admin/login', { secret: 'test-admin-secret' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
