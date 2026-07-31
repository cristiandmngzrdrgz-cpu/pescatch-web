import type { Metadata } from 'next'

export const BASE_URL = 'https://pescatch.es'

export interface BreadcrumbItem {
  name: string
  url: string
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[], id?: string) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  }
  if (id) schema['@id'] = id
  return schema
}

export function generateProductSchema(deal: {
  title: string
  description: string
  imageUrl: string
  images?: string[]
  salePrice: number
  originalPrice: number
  currency: string
  stockStatus: string
  affiliateUrl: string
  storeName: string
  rating?: number
  reviewCount?: number
  sku: string
  brand?: string
  shippingCost?: number
  ean?: string
  slug?: string
  expiresAt?: string
  review?: string
  pros?: string[]
  publishedAt?: string
}) {
  const pageUrl = `${BASE_URL}/deals/${deal.slug || deal.sku}`

  // priceValidUntil: usa expiresAt real si existe, si no 90 dias (mas creible que 30)
  const priceValidUntil = deal.expiresAt
    ? deal.expiresAt.split('T')[0]
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Imagenes: array con todas las disponibles (Google prefiere multiples)
  const allImages = [deal.imageUrl, ...(deal.images ?? [])].filter(Boolean)

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${pageUrl}#product`,
    name: deal.title,
    description: deal.description || deal.title,
    // Array de imagenes: Google muestra la primera en resultados
    image: allImages.length > 1 ? allImages : (allImages[0] || ''),
    sku: deal.sku,
    // itemCondition requerido por Google Shopping para rich snippets
    itemCondition: 'https://schema.org/NewCondition',
    offers: {
      '@type': 'Offer',
      price: deal.salePrice,
      priceCurrency: 'EUR',
      // url canonica apunta a la ficha, no al afiliado
      url: pageUrl,
      priceValidUntil,
      availability: deal.stockStatus === 'in_stock'
        ? 'https://schema.org/InStock'
        : deal.stockStatus === 'limited'
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: deal.storeName,
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: deal.shippingCost ?? 0,
          currency: 'EUR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'ES',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 5, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'ES',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
  }

  if (deal.brand) {
    schema.brand = { '@type': 'Brand', name: deal.brand }
  }

  if (deal.ean) {
    schema.gtin13 = deal.ean
    schema.mpn = deal.ean
  }

  if (deal.rating && deal.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: deal.rating,
      reviewCount: deal.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  // Review editorial: aumenta confianza y puede generar snippet de review en Google
  if (deal.review) {
    const pros = deal.pros ?? []
    schema.review = {
      '@type': 'Review',
      author: {
        '@type': 'Organization',
        name: 'PesCatch',
        url: BASE_URL,
      },
      datePublished: deal.publishedAt
        ? deal.publishedAt.split('T')[0]
        : new Date().toISOString().split('T')[0],
      reviewBody: pros.length > 0
        ? `${deal.review} Destacamos: ${pros.slice(0, 2).join(', ')}.`
        : deal.review,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: deal.rating ?? 4,
        bestRating: 5,
        worstRating: 1,
      },
      publisher: {
        '@type': 'Organization',
        name: 'PesCatch',
        url: BASE_URL,
      },
    }
  }

  return schema
}

// ItemPage conecta el Product con la WebPage — mejora la comprension de Google
export function generateItemPageSchema(params: {
  title: string
  description: string
  slug: string
  imageUrl?: string
  publishedAt?: string
  updatedAt?: string
  brand?: string
  category?: string
}) {
  const pageUrl = `${BASE_URL}/deals/${params.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: params.title,
    description: params.description,
    isPartOf: { '@id': `${BASE_URL}/#website` },
    primaryImageOfPage: params.imageUrl
      ? { '@type': 'ImageObject', url: params.imageUrl }
      : undefined,
    datePublished: params.publishedAt,
    dateModified: params.updatedAt,
    breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
    inLanguage: 'es-ES',
    potentialAction: {
      '@type': 'ReadAction',
      target: [pageUrl],
    },
  }
}

export function generateReviewSchema(reviews: Array<{
  author: string
  content: string
  date: string
  rating?: number
}>, productName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      name: productName,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: reviews[0]?.rating || 4,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      '@type': 'Person',
      name: reviews[0]?.author || 'Usuario',
    },
    reviewBody: reviews[0]?.content || '',
    datePublished: reviews[0]?.date || new Date().toISOString(),
  }
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function generateBlogPostingSchema(post: {
  title: string
  excerpt: string
  content: string
  featuredImage: string
  author: string
  publishedAt: string
  updatedAt: string
  slug: string
  tags: string[]
  category: string
}) {
  const wordCount = post.content.split(/\s+/).length

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'PesCatch',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/images/logo.png`,
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
    articleSection: post.category,
    wordCount,
  }
}

export function generateCollectionPageSchema(params: {
  title: string
  description: string
  url: string
  itemCount: number
  items?: Array<{ name: string; url: string }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: params.title,
    description: params.description,
    url: params.url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: params.itemCount,
      itemListElement: params.items?.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: item.name,
          url: item.url,
        },
      })) || [],
    },
  }
}

export function generateSearchResultsPageSchema(query: string, resultCount: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: `Resultados para "${query}"`,
    description: `Se encontraron ${resultCount} chollos para "${query}"`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: resultCount,
    },
  }
}

export function buildMetadata(
  metadata: Metadata,
  canonicalUrl?: string,
): Metadata {
  return {
    ...metadata,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: canonicalUrl || BASE_URL,
    },
  }
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const schemas = Array.isArray(data) ? data : [data]
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}