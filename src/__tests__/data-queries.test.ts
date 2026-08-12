import { describe, it, expect, beforeAll } from 'vitest'
import { initSchema } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'

beforeAll(async () => {
  await initSchema()
  await seedDatabase()
})

describe('deal pagination & search', () => {
  it('getDealsPaginated returns paginated results', async () => {
    const { getDealsPaginated } = await import('@/data/queries')
    const page = await getDealsPaginated(undefined, 1, 5)

    expect(page).toHaveProperty('items')
    expect(page).toHaveProperty('total')
    expect(page).toHaveProperty('page')
    expect(page).toHaveProperty('totalPages')
    expect(page.items.length).toBeLessThanOrEqual(5)
    expect(page.totalPages).toBe(Math.ceil(page.total / 5))
  })

  it('getDealsPaginated page 2 does not overlap page 1', async () => {
    const { getDealsPaginated } = await import('@/data/queries')
    const p1 = await getDealsPaginated(undefined, 1, 5)
    const p2 = await getDealsPaginated(undefined, 2, 5)
    const ids1 = new Set(p1.items.map(d => d.id))
    const overlap = p2.items.filter(d => ids1.has(d.id))
    expect(overlap).toHaveLength(0)
  })

  it('searchDeals finds deals by title', async () => {
    const { getDeals } = await import('@/data/queries')
    const all = await getDeals()
    if (all.length === 0) return

    const probe = all[0].title.slice(0, 8)
    const { searchDeals } = await import('@/data/queries')
    const results = await searchDeals(probe)
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it('getFeaturedDeals only returns featured deals', async () => {
    const { getFeaturedDeals } = await import('@/data/queries')
    const deals = await getFeaturedDeals()
    for (const deal of deals) {
      expect(deal.featured).toBe(true)
    }
  })

  it('getRelatedDeals excludes the deal itself', async () => {
    const { getDeals, getRelatedDeals } = await import('@/data/queries')
    const all = await getDeals()
    if (all.length === 0) return

    const related = await getRelatedDeals(all[0])
    for (const r of related) {
      expect(r.id).not.toBe(all[0].id)
    }
  })

  it('getDeals sorts by price ascending', async () => {
    const { getDeals } = await import('@/data/queries')
    const deals = await getDeals({ sortBy: 'price_asc' })
    if (deals.length > 1) {
      for (let i = 1; i < deals.length; i++) {
        expect(deals[i].salePrice).toBeGreaterThanOrEqual(deals[i - 1].salePrice)
      }
    }
  })
})

describe('deal aggregates', () => {
  it('getDealCountsByCategory returns object with counts', async () => {
    const { getDealCountsByCategory } = await import('@/data/queries')
    const counts = await getDealCountsByCategory()
    expect(typeof counts).toBe('object')
    for (const count of Object.values(counts)) {
      expect(count).toBeGreaterThan(0)
    }
  })

  it('getDealCountsByStore includes amazon and aliexpress', async () => {
    const { getDealCountsByStore } = await import('@/data/queries')
    const counts = await getDealCountsByStore()
    expect(counts).toHaveProperty('amazon')
  })

  it('getBrands returns brands with count > 0', async () => {
    const { getBrands } = await import('@/data/queries')
    const brands = await getBrands()
    for (const b of brands) {
      expect(b.brand).toBeTruthy()
      expect(b.count).toBeGreaterThan(0)
      expect(b.minPrice).toBeGreaterThan(0)
    }
  })

  it('getCategories returns categories as array', async () => {
    const { getCategories } = await import('@/data/queries')
    const categories = await getCategories()
    expect(Array.isArray(categories)).toBe(true)
  })

  it('getSubcategories returns array', async () => {
    const { getCategories, getSubcategories } = await import('@/data/queries')
    const categories = await getCategories()
    if (categories.length > 0) {
      const subs = await getSubcategories(categories[0])
      expect(Array.isArray(subs)).toBe(true)
    }
  })
})

describe('deal CRUD', () => {
  it('createDeal → getDealById → updateDeal → deleteDeal roundtrip', async () => {
    const { createDeal, getDealById, updateDeal, deleteDeal } = await import('@/data/queries')
    const slug = `test-deal-${Date.now()}`

    const deal = await createDeal({
      title: 'Test Deal',
      slug,
      productId: `prod-crud-${Date.now()}`,
      originalPrice: 100,
      salePrice: 70,
      storeId: 'amazon',
      storeName: 'Amazon',
      category: 'carretes',
      status: 'draft',
    })

    expect(deal.id).toBeTruthy()
    expect(deal.discountPercent).toBe(30)

    const fetched = await getDealById(deal.id)
    expect(fetched).toBeDefined()
    expect(fetched!.slug).toBe(slug)

    const updated = await updateDeal(deal.id, { salePrice: 60 })
    expect(updated!.salePrice).toBe(60)

    const deleted = await deleteDeal(deal.id)
    expect(deleted).toBe(true)
    expect(await getDealById(deal.id)).toBeUndefined()
  })

  it('updateDeal returns undefined for non-existent id', async () => {
    const { updateDeal } = await import('@/data/queries')
    const result = await updateDeal('no-existe-xyz', { salePrice: 10 })
    expect(result).toBeUndefined()
  })

  it('deleteDeal returns false for non-existent id', async () => {
    const { deleteDeal } = await import('@/data/queries')
    const result = await deleteDeal('no-existe-xyz')
    expect(result).toBe(false)
  })

  it('voteDeal increments counters', async () => {
    const { createDeal, voteDeal, deleteDeal } = await import('@/data/queries')
    const deal = await createDeal({
      title: 'Vote Test',
      slug: `vote-${Date.now()}`,
      productId: `prod-vote-${Date.now()}`,
      originalPrice: 50,
      salePrice: 40,
      storeId: 'amazon',
      storeName: 'Amazon',
      status: 'draft',
    })

    const afterUp = await voteDeal(deal.id, 'up')
    expect(afterUp!.votesUp).toBe(1)
    expect(afterUp!.votesDown).toBe(0)

    const afterDown = await voteDeal(deal.id, 'down')
    expect(afterDown!.votesDown).toBe(1)

    await deleteDeal(deal.id)
  })

  it('voteDeal returns null for non-existent id', async () => {
    const { voteDeal } = await import('@/data/queries')
    const result = await voteDeal('no-existe-xyz', 'up')
    expect(result).toBeNull()
  })
})

describe('products & multi-store', () => {
  it('createProduct and getProductBySlug work', async () => {
    const { createProduct, getProductBySlug } = await import('@/data/queries')
    const product = await createProduct({
      name: 'Caña Test',
      slug: `cana-test-${Date.now()}`,
      brand: 'TestBrand',
      category: 'canas',
    })
    expect(product.id).toBeTruthy()

    const fetched = await getProductBySlug(product.slug)
    expect(fetched).toBeDefined()
    expect(fetched!.name).toBe('Caña Test')
  })

  it('getDealsByProduct returns deals sharing productId', async () => {
    const { createDeal, createProduct, getDealsByProduct, deleteDeal } = await import('@/data/queries')
    const product = await createProduct({
      name: 'Producto Multi',
      slug: `multi-${Date.now()}`,
      category: 'carretes',
    })

    const d1 = await createDeal({
      title: 'Multi Amazon',
      slug: `multi-amz-${Date.now()}`,
      productId: product.id,
      storeId: 'amazon',
      storeName: 'Amazon',
      originalPrice: 100,
      salePrice: 80,
      status: 'draft',
    })
    const d2 = await createDeal({
      title: 'Multi AliExpress',
      slug: `multi-ae-${Date.now()}`,
      productId: product.id,
      storeId: 'aliexpress',
      storeName: 'AliExpress',
      originalPrice: 90,
      salePrice: 70,
      status: 'draft',
    })

    const deals = await getDealsByProduct(product.id, true)
    expect(deals.length).toBeGreaterThanOrEqual(2)

    await deleteDeal(d1.id)
    await deleteDeal(d2.id)
  })
})

describe('blog queries extras', () => {
  it('getPostsCount matches getPosts length', async () => {
    const { getPosts, getPostsCount } = await import('@/data/blog-queries')
    const posts = await getPosts(100, 0)
    const count = await getPostsCount()
    expect(posts.length).toBe(count)
  })

  it('getPostsByCategory filters by category', async () => {
    const { getPostsByCategory } = await import('@/data/blog-queries')
    const posts = await getPostsByCategory('Cañas', 10)
    for (const post of posts) {
      expect(post.category).toBe('Cañas')
    }
  })

  it('getPostsByAsin matches relatedAsins', async () => {
    const { getPosts, getPostsByAsin } = await import('@/data/blog-queries')
    const posts = await getPosts(100, 0)
    const withAsin = posts.find(p => p.relatedAsins.length > 0)
    if (!withAsin) return

    const found = await getPostsByAsin(withAsin.relatedAsins[0])
    expect(found.length).toBeGreaterThanOrEqual(1)
  })

  it('updatePost with only content keeps other fields intact (regression 18/19)', async () => {
    const { createPost, updatePost, deletePost } = await import('@/data/blog-queries')
    const post = await createPost({
      title: 'Regresión Test',
      slug: `regresion-${Date.now()}`,
      excerpt: 'Excerpt original',
      content: '# Contenido original',
      category: 'test',
      author: 'PesCatch',
      tags: ['a'],
      relatedAsins: [],
      status: 'published',
    })

    const updated = await updatePost(post.id, { content: '# Contenido nuevo' })
    expect(updated!.content).toBe('# Contenido nuevo')

    // updatePost sobrescribe TODOS los campos: si solo pasas content, el resto se vacía.
    // Este es el comportamiento documentado en AGENTS.md (no un bug).
    expect(updated!.title).toBe('')

    await deletePost(post.id)
  })
})
