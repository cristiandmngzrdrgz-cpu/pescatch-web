import { describe, it, expect } from 'vitest'
import {
  generateProductSchema,
  generateBreadcrumbSchema,
  generateItemPageSchema,
  generateReviewSchema,
  generateFAQSchema,
  generateBlogPostingSchema,
  generateCollectionPageSchema,
  generateSearchResultsPageSchema,
  buildMetadata,
  BASE_URL,
} from '@/lib/seo/schemas'
import { getCategorySeo, BLOG_CATEGORY_BY_SLUG } from '@/lib/seo/category-content'

describe('generateProductSchema', () => {
  const baseDeal = {
    title: 'Caña Shimano FX 2,10m',
    description: 'Caña de spinning ligera',
    imageUrl: 'https://img.example.com/cana.jpg',
    salePrice: 39.95,
    originalPrice: 59.95,
    currency: 'EUR',
    stockStatus: 'in_stock',
    affiliateUrl: 'https://amazon.es/dp/B0TEST',
    storeName: 'Amazon',
    sku: 'B0TEST',
    slug: 'cana-shimano-fx',
  }

  it('builds a valid Product schema with offer and canonical url', () => {
    const schema = generateProductSchema(baseDeal)
    expect(schema['@type']).toBe('Product')
    expect(schema['@id']).toBe(`${BASE_URL}/deals/cana-shimano-fx#product`)
    const offers = schema.offers as Record<string, unknown>
    expect(offers['@type']).toBe('Offer')
    expect(offers.price).toBe(39.95)
    expect(offers.priceCurrency).toBe('EUR')
    expect(offers.url).toBe(`${BASE_URL}/deals/cana-shimano-fx`)
  })

  it('maps stockStatus to availability', () => {
    const inStock = generateProductSchema(baseDeal)
    expect((inStock.offers as Record<string, unknown>).availability).toBe('https://schema.org/InStock')

    const limited = generateProductSchema({ ...baseDeal, stockStatus: 'limited' })
    expect((limited.offers as Record<string, unknown>).availability).toBe('https://schema.org/LimitedAvailability')

    const out = generateProductSchema({ ...baseDeal, stockStatus: 'out_of_stock' })
    expect((out.offers as Record<string, unknown>).availability).toBe('https://schema.org/OutOfStock')
  })

  it('uses expiresAt for priceValidUntil when present, else a 90-day window', () => {
    const withExpiry = generateProductSchema({ ...baseDeal, expiresAt: '2026-09-30T00:00:00.000Z' })
    expect((withExpiry.offers as Record<string, unknown>).priceValidUntil).toBe('2026-09-30')

    const without = generateProductSchema(baseDeal)
    const validUntil = (without.offers as Record<string, unknown>).priceValidUntil as string
    const days = (Date.parse(validUntil) - Date.now()) / (24 * 60 * 60 * 1000)
    expect(days).toBeGreaterThanOrEqual(89)
    expect(days).toBeLessThanOrEqual(90)
  })

  it('includes images as an array when multiple are present', () => {
    const schema = generateProductSchema({ ...baseDeal, images: ['https://img.example.com/2.jpg'] })
    expect(Array.isArray(schema.image)).toBe(true)
    expect(schema.image).toHaveLength(2)
  })

  it('adds brand, gtin13 and mpn when ean is present', () => {
    const schema = generateProductSchema({ ...baseDeal, brand: 'Shimano', ean: '0022255230759' })
    expect(schema.brand).toEqual({ '@type': 'Brand', name: 'Shimano' })
    expect(schema.gtin13).toBe('0022255230759')
    expect(schema.mpn).toBe('0022255230759')
  })

  it('adds aggregateRating when rating and reviewCount are present', () => {
    const schema = generateProductSchema({ ...baseDeal, rating: 4.5, reviewCount: 12 })
    expect(schema.aggregateRating).toMatchObject({ '@type': 'AggregateRating', ratingValue: 4.5, reviewCount: 12 })
  })

  it('adds an editorial Review when review is present, including pros', () => {
    const schema = generateProductSchema({
      ...baseDeal,
      review: 'Buena caña para empezar.',
      pros: ['Ligera', 'Manejable'],
    })
    const review = schema.review as Record<string, unknown>
    expect(review['@type']).toBe('Review')
    expect((review.reviewBody as string)).toContain('Ligera, Manejable')
    expect((review.reviewRating as Record<string, unknown>).ratingValue).toBe(4)
  })

  it('does not add review when absent', () => {
    const schema = generateProductSchema(baseDeal)
    expect(schema.review).toBeUndefined()
  })
})

describe('generateBreadcrumbSchema', () => {
  it('builds itemListElement with absolute urls and positions', () => {
    const schema = generateBreadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Cañas', url: '/categories/canas' },
    ])
    expect(schema['@type']).toBe('BreadcrumbList')
    const items = schema.itemListElement as Array<{ '@type': string; position: number; name: string; item: string }>
    expect(items).toHaveLength(2)
    expect(items[0].position).toBe(1)
    expect(items[0].item).toBe(`${BASE_URL}/`)
    expect(items[1].item).toBe(`${BASE_URL}/categories/canas`)
  })

  it('keeps already-absolute urls unchanged and supports @id', () => {
    const schema = generateBreadcrumbSchema([{ name: 'X', url: 'https://external.com/x' }], '#id-123')
    expect(schema['@id']).toBe('#id-123')
    expect((schema.itemListElement as Array<{ item: string }>)[0].item).toBe('https://external.com/x')
  })
})

describe('generateItemPageSchema', () => {
  it('links breadcrumb and website @ids', () => {
    const schema = generateItemPageSchema({ title: 'T', description: 'D', slug: 'mi-chollo' })
    expect(schema['@type']).toBe('ItemPage')
    expect(schema['@id']).toBe(`${BASE_URL}/deals/mi-chollo#webpage`)
    expect((schema as Record<string, unknown>).breadcrumb).toEqual({ '@id': `${BASE_URL}/deals/mi-chollo#breadcrumb` })
    expect((schema as Record<string, unknown>).isPartOf).toEqual({ '@id': `${BASE_URL}/#website` })
    expect((schema as Record<string, unknown>).inLanguage).toBe('es-ES')
  })
})

describe('generateFAQSchema', () => {
  it('builds mainEntity questions with answers', () => {
    const schema = generateFAQSchema([
      { question: '¿Cuánto cuesta?', answer: '39,95€' },
      { question: '¿Es buena?', answer: 'Sí' },
    ])
    expect(schema['@type']).toBe('FAQPage')
    const main = schema.mainEntity as Array<Record<string, unknown>>
    expect(main).toHaveLength(2)
    expect(main[0]['@type']).toBe('Question')
    expect((main[0].acceptedAnswer as Record<string, unknown>).text).toBe('39,95€')
  })
})

describe('generateBlogPostingSchema', () => {
  const post = {
    title: 'Los mejores señuelos de spinning',
    excerpt: 'Análisis completo',
    content: 'Uno dos tres cuatro cinco seis siete ocho nueve diez once doce.',
    featuredImage: 'https://img.example.com/post.jpg',
    author: 'PesCatch',
    publishedAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-05T10:00:00.000Z',
    slug: 'mejores-senuelos-spinning',
    tags: ['señuelos', 'spinning'],
    category: 'Señuelos',
  }

  it('builds BlogPosting with wordCount and articleSection', () => {
    const schema = generateBlogPostingSchema(post)
    expect(schema['@type']).toBe('BlogPosting')
    expect(schema.headline).toBe(post.title)
    expect(schema.wordCount).toBe(12)
    expect(schema.articleSection).toBe('Señuelos')
    expect(schema.keywords).toBe('señuelos, spinning')
    expect((schema.mainEntityOfPage as Record<string, unknown>)['@id']).toBe(`${BASE_URL}/blog/${post.slug}`)
    expect((schema.publisher as Record<string, unknown>).name).toBe('PesCatch')
  })
})

describe('generateCollectionPageSchema', () => {
  it('builds ItemList with numbered elements', () => {
    const schema = generateCollectionPageSchema({
      title: 'Top chollos',
      description: 'Los mejores',
      url: `${BASE_URL}/top-chollos`,
      itemCount: 2,
      items: [
        { name: 'A', url: `${BASE_URL}/deals/a` },
        { name: 'B', url: `${BASE_URL}/deals/b` },
      ],
    })
    expect(schema['@type']).toBe('CollectionPage')
    const list = (schema as Record<string, unknown>).mainEntity as Record<string, unknown>
    expect(list.numberOfItems).toBe(2)
    const elements = list.itemListElement as Array<{ position: number; name: string }>
    expect(elements[1].position).toBe(2)
    expect(elements[1].name).toBe('B')
  })
})

describe('generateSearchResultsPageSchema', () => {
  it('describes the query and result count', () => {
    const schema = generateSearchResultsPageSchema('carrete', 5)
    expect(schema['@type']).toBe('SearchResultsPage')
    expect((schema as Record<string, unknown>).name).toContain('carrete')
    expect(((schema as Record<string, unknown>).mainEntity as Record<string, unknown>).numberOfItems).toBe(5)
  })
})

describe('generateReviewSchema', () => {
  it('uses first review data or defaults', () => {
    const schema = generateReviewSchema(
      [{ author: 'Ana', content: 'Genial', date: '2026-08-01', rating: 5 }],
      'Caña X',
    )
    expect(schema['@type']).toBe('Review')
    expect((schema.itemReviewed as Record<string, unknown>).name).toBe('Caña X')
    expect((schema.reviewRating as Record<string, unknown>).ratingValue).toBe(5)
    expect((schema.author as Record<string, unknown>).name).toBe('Ana')
  })

  it('defaults rating to 4 when absent', () => {
    const schema = generateReviewSchema([], 'Caña X')
    expect((schema.reviewRating as Record<string, unknown>).ratingValue).toBe(4)
  })
})

describe('buildMetadata', () => {
  it('sets metadataBase and canonical alternates', () => {
    const metadata = buildMetadata({ title: 'Mi página' }, `${BASE_URL}/search?q=x`)
    expect(metadata.metadataBase).toEqual(new URL(BASE_URL))
    expect(metadata.alternates?.canonical).toBe(`${BASE_URL}/search?q=x`)
  })

  it('defaults canonical to BASE_URL', () => {
    const metadata = buildMetadata({ title: 'Home' })
    expect(metadata.alternates?.canonical).toBe(BASE_URL)
  })
})

describe('category-content', () => {
  it('returns intro and faq for known categories', () => {
    for (const slug of ['carretes', 'canas', 'senuelos']) {
      const seo = getCategorySeo(slug)
      expect(seo).toBeTruthy()
      expect(seo!.intro.length).toBeGreaterThan(50)
      expect(seo!.faq.length).toBeGreaterThanOrEqual(3)
      expect(seo!.faq[0].question.endsWith('?')).toBe(true)
    }
  })

  it('returns undefined for unknown categories', () => {
    expect(getCategorySeo('no-existe')).toBeUndefined()
  })

  it('maps blog categories for the seo slugs', () => {
    expect(BLOG_CATEGORY_BY_SLUG.carretes).toBe('Carretes')
    expect(BLOG_CATEGORY_BY_SLUG.canas).toBe('Cañas')
    expect(BLOG_CATEGORY_BY_SLUG.senuelos).toBe('Señuelos')
  })
})