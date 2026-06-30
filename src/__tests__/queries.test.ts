import { describe, it, expect, beforeAll } from 'vitest'
import { getDb, initSchema } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'

beforeAll(async () => {
  await initSchema()
  await seedDatabase()
})

describe('deals queries', () => {
  it('getDeals returns deals with correct shape', async () => {
    const { getDeals } = await import('@/data/queries')
    const deals = await getDeals()

    expect(Array.isArray(deals)).toBe(true)
    if (deals.length > 0) {
      const deal = deals[0]
      expect(deal).toHaveProperty('id')
      expect(deal).toHaveProperty('title')
      expect(deal).toHaveProperty('slug')
      expect(deal).toHaveProperty('originalPrice')
      expect(deal).toHaveProperty('salePrice')
      expect(deal).toHaveProperty('discountPercent')
      expect(deal).toHaveProperty('category')
      expect(deal).toHaveProperty('store')
      expect(deal.store).toHaveProperty('id')
      expect(deal.store).toHaveProperty('name')
    }
  })

  it('getDeals with category filter returns only matching deals', async () => {
    const { getDeals } = await import('@/data/queries')
    const deals = await getDeals({ category: 'carretes' })

    for (const deal of deals) {
      expect(deal.category).toBe('carretes')
    }
  })

  it('getDeals sorts by newest', async () => {
    const { getDeals } = await import('@/data/queries')
    const deals = await getDeals({ sortBy: 'newest' })

    if (deals.length > 1) {
      const dates = deals.map(d => new Date(d.publishedAt).getTime())
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeLessThanOrEqual(dates[i - 1])
      }
    }
  })

  it('getDeals sorts by discount', async () => {
    const { getDeals } = await import('@/data/queries')
    const deals = await getDeals({ sortBy: 'discount' })

    if (deals.length > 1) {
      for (let i = 1; i < deals.length; i++) {
        expect(deals[i].discountPercent).toBeLessThanOrEqual(deals[i - 1].discountPercent)
      }
    }
  })

  it('getDealsBySlug returns a single deal', async () => {
    const { getDeals, getDealBySlug } = await import('@/data/queries')
    const all = await getDeals()
    if (all.length > 0) {
      const deal = await getDealBySlug(all[0].slug)
      expect(deal).toBeDefined()
      expect(deal!.slug).toBe(all[0].slug)
    }
  })

  it('getDealBySlug returns undefined for non-existent slug', async () => {
    const { getDealBySlug } = await import('@/data/queries')
    const deal = await getDealBySlug('slug-que-no-existe-xyz')
    expect(deal).toBeUndefined()
  })
})

describe('blog queries', () => {
  it('getPosts returns posts with correct shape', async () => {
    const { getPosts } = await import('@/data/blog-queries')
    const posts = await getPosts()

    expect(Array.isArray(posts)).toBe(true)
    if (posts.length > 0) {
      const post = posts[0]
      expect(post).toHaveProperty('id')
      expect(post).toHaveProperty('title')
      expect(post).toHaveProperty('slug')
      expect(post).toHaveProperty('content')
      expect(post).toHaveProperty('publishedAt')
    }
  })

  it('getPostBySlug returns a single post', async () => {
    const { getPosts, getPostBySlug } = await import('@/data/blog-queries')
    const posts = await getPosts()
    if (posts.length > 0) {
      const post = await getPostBySlug(posts[0].slug)
      expect(post).toBeDefined()
      expect(post!.slug).toBe(posts[0].slug)
    }
  })

  it('getPostBySlug returns undefined for non-existent slug', async () => {
    const { getPostBySlug } = await import('@/data/blog-queries')
    const post = await getPostBySlug('slug-que-no-existe-xyz')
    expect(post).toBeUndefined()
  })

  it('createPost and deletePost work end-to-end', async () => {
    const { createPost, deletePost, getPostBySlug } = await import('@/data/blog-queries')

    const post = await createPost({
      title: 'Test Post',
      slug: 'test-post-' + Date.now(),
      excerpt: 'Test excerpt',
      content: '# Test\n\nThis is a test post.',
      category: 'test',
      tags: ['test'],
      relatedAsins: [],
    })

    expect(post).toBeDefined()
    expect(post.title).toBe('Test Post')
    expect(post.slug).toContain('test-post-')

    const fetched = await getPostBySlug(post.slug)
    expect(fetched).toBeDefined()
    expect(fetched!.id).toBe(post.id)

    const deleted = await deletePost(post.id)
    expect(deleted).toBe(true)

    const afterDelete = await getPostBySlug(post.slug)
    expect(afterDelete).toBeUndefined()
  })
})

describe('comments queries', () => {
  it('getAllComments returns array', async () => {
    const { getAllComments, getComments } = await import('@/data/queries')
    const all = await getAllComments()
    expect(Array.isArray(all)).toBe(true)
  })

  it('addComment and deleteComment work', async () => {
    const { getDeals, addComment, getComments, deleteComment } = await import('@/data/queries')
    const deals = await getDeals()

    if (deals.length > 0) {
      const dealId = deals[0].id
      const comments = await addComment(dealId, 'Test User', 'Test comment content')
      expect(Array.isArray(comments)).toBe(true)

      const newComment = comments[comments.length - 1]
      expect(newComment.author).toBe('Test User')
      expect(newComment.content).toBe('Test comment content')

      const deleted = await deleteComment(newComment.id as number)
      expect(deleted).toBe(true)

      const afterDelete = await getComments(dealId)
      expect(afterDelete.find(c => c.id === newComment.id)).toBeUndefined()
    }
  })
})

describe('products queries', () => {
  it('getProductBySlug returns undefined for non-existent slug', async () => {
    const { getProductBySlug } = await import('@/data/queries')
    const product = await getProductBySlug('slug-que-no-existe-xyz')
    expect(product).toBeUndefined()
  })

  it('getProductByEan returns undefined for non-existent EAN', async () => {
    const { getProductByEan } = await import('@/data/queries')
    const product = await getProductByEan('0000000000000')
    expect(product).toBeUndefined()
  })
})
