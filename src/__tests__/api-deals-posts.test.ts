import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { initSchema } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === 'admin_token' ? { name, value: process.env.ADMIN_SECRET || '' } : undefined),
  }),
}))

beforeAll(async () => {
  await initSchema()
  await seedDatabase()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const authParams = (id: string) => ({ params: Promise.resolve({ id }) })

describe('GET /api/deals', () => {
  it('returns published deals', async () => {
    const { GET } = await import('@/app/api/deals/route')
    const res = await GET(new NextRequest('http://localhost/api/deals'))
    expect(res.status).toBe(200)
    const deals = await res.json()
    expect(Array.isArray(deals)).toBe(true)
  })

  it('filters by category', async () => {
    const { GET } = await import('@/app/api/deals/route')
    const res = await GET(new NextRequest('http://localhost/api/deals?category=carretes'))
    const deals = await res.json()
    for (const deal of deals) {
      expect(deal.category).toBe('carretes')
    }
  })
})

describe('POST /api/deals (admin)', () => {
  it('creates a deal with valid data (auth mocked)', async () => {
    const { POST } = await import('@/app/api/deals/route')
    const res = await POST(jsonRequest('/api/deals', {
      title: 'Deal desde API',
      slug: `api-deal-${Date.now()}`,
      productId: `prod-api-${Date.now()}`,
      originalPrice: 80,
      salePrice: 60,
      storeId: 'amazon',
      storeName: 'Amazon',
      category: 'carretes',
    }))
    expect(res.status).toBe(201)
    const deal = await res.json()
    expect(deal.id).toBeTruthy()
  })

  it('rejects invalid data with 400', async () => {
    const { POST } = await import('@/app/api/deals/route')
    const res = await POST(jsonRequest('/api/deals', { title: '', salePrice: -5 }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Datos inválidos')
    expect(Array.isArray(body.issues)).toBe(true)
  })
})

describe('GET /api/deals/[id]', () => {
  it('returns 404 for non-existent deal', async () => {
    const { GET } = await import('@/app/api/deals/[id]/route')
    const res = await GET(new NextRequest('http://localhost/api/deals/xyz'), authParams('xyz'))
    expect(res.status).toBe(404)
  })

  it('returns a deal for existing id', async () => {
    const { getDeals } = await import('@/data/queries')
    const deals = await getDeals()
    if (deals.length === 0) return
    const { GET } = await import('@/app/api/deals/[id]/route')
    const res = await GET(new NextRequest(`http://localhost/api/deals/${deals[0].id}`), authParams(deals[0].id))
    expect(res.status).toBe(200)
    const deal = await res.json()
    expect(deal.id).toBe(deals[0].id)
  })
})

describe('PATCH /api/deals/[id] (admin)', () => {
  it('publishes a deal', async () => {
    const { createDeal, deleteDeal } = await import('@/data/queries')
    const deal = await createDeal({
      title: 'Publish Test',
      slug: `publish-${Date.now()}`,
      productId: `prod-publish-${Date.now()}`,
      originalPrice: 50,
      salePrice: 40,
      storeId: 'amazon',
      storeName: 'Amazon',
      status: 'draft',
    })
    const { PATCH } = await import('@/app/api/deals/[id]/route')
    const res = await PATCH(jsonRequest(`/api/deals/${deal.id}`, { status: 'published' }), authParams(deal.id))
    expect(res.status).toBe(200)
    const updated = await res.json()
    expect(updated.status).toBe('published')
    await deleteDeal(deal.id)
  })
})

describe('POST /api/deals/bulk (admin)', () => {
  it('returns 400 without ids', async () => {
    const { POST } = await import('@/app/api/deals/bulk/route')
    const res = await POST(jsonRequest('/api/deals/bulk', { ids: [], action: 'delete' }))
    expect(res.status).toBe(400)
  })

  it('publishes deals by id', async () => {
    const { createDeal, deleteDeal, getDealById } = await import('@/data/queries')
    const deal = await createDeal({
      title: 'Bulk Test',
      slug: `bulk-${Date.now()}`,
      productId: `prod-bulk-${Date.now()}`,
      originalPrice: 50,
      salePrice: 40,
      storeId: 'amazon',
      storeName: 'Amazon',
      status: 'draft',
    })
    const { POST } = await import('@/app/api/deals/bulk/route')
    const res = await POST(jsonRequest('/api/deals/bulk', { ids: [deal.id], action: 'publish' }))
    expect(res.status).toBe(200)
    expect((await getDealById(deal.id))!.status).toBe('published')
    await deleteDeal(deal.id)
  })
})

describe('POST /api/deals/batch', () => {
  it('returns empty array for no ids', async () => {
    const { POST } = await import('@/app/api/deals/batch/route')
    const res = await POST(jsonRequest('/api/deals/batch', { ids: [] }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })
})

describe('GET /api/posts', () => {
  it('returns posts with limit', async () => {
    const { GET } = await import('@/app/api/posts/route')
    const res = await GET(new NextRequest('http://localhost/api/posts?limit=5'))
    expect(res.status).toBe(200)
    const posts = await res.json()
    expect(posts.length).toBeLessThanOrEqual(5)
  })
})

describe('POST /api/posts (admin)', () => {
  it('creates a post', async () => {
    const { POST } = await import('@/app/api/posts/route')
    const res = await POST(jsonRequest('/api/posts', {
      title: 'Post API',
      slug: `post-api-${Date.now()}`,
      excerpt: 'Excerpt',
      content: '# Contenido',
    }))
    expect(res.status).toBe(201)
    const post = await res.json()
    expect(post.id).toBeTruthy()
  })
})

describe('GET /api/posts/[id]', () => {
  it('returns 404 for non-existent post', async () => {
    const { GET } = await import('@/app/api/posts/[id]/route')
    const res = await GET(new NextRequest('http://localhost/api/posts/xyz'), authParams('xyz'))
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/posts/[id] (admin)', () => {
  it('sets post to draft', async () => {
    const { createPost, deletePost } = await import('@/data/blog-queries')
    const post = await createPost({ title: 'Draft Me', slug: `draft-${Date.now()}`, content: '# X' })
    const { PATCH } = await import('@/app/api/posts/[id]/route')
    const res = await PATCH(jsonRequest(`/api/posts/${post.id}`, { status: 'draft' }), authParams(post.id))
    expect(res.status).toBe(200)
    const updated = await res.json()
    expect(updated.status).toBe('draft')
    expect(updated.hidden).toBe(true)
    await deletePost(post.id)
  })
})

describe('POST /api/posts/bulk (admin)', () => {
  it('deletes posts by id', async () => {
    const { createPost, getPostById } = await import('@/data/blog-queries')
    const post = await createPost({ title: 'Bulk Post', slug: `bulkpost-${Date.now()}`, content: '# X' })
    const { POST } = await import('@/app/api/posts/bulk/route')
    const res = await POST(jsonRequest('/api/posts/bulk', { ids: [post.id], action: 'delete' }))
    expect(res.status).toBe(200)
    expect(await getPostById(post.id)).toBeUndefined()
  })
})

describe('GET /api/comments (admin)', () => {
  it('returns comments with auth', async () => {
    const { GET } = await import('@/app/api/comments/route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect(Array.isArray(await res.json())).toBe(true)
  })
})
