import type { Metadata } from 'next'

export const BASE_URL = 'https://pescatch.es'

export interface BreadcrumbItem {
  name: string
  url: string
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  }
}

export function generateProductSchema(deal: {
  title: string
  description: string
  imageUrl: string
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
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: deal.title,
    // description es obligatorio para Merchant Listings
    description: deal.description || deal.title,
    image: deal.imageUrl,
    sku: deal.sku,
    offers: {
      '@type': 'Offer',
      price: deal.salePrice,
      priceCurrency: 'EUR',
      // description en Offer requerido para Fichas de comerciantes
      description: deal.description || deal.title,
      availability: deal.stockStatus === 'in_stock'
        ? 'https://schema.org/InStock'
        : deal.stockStatus === 'limited'
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/OutOfStock',
      url: deal.affiliateUrl,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

  if (deal.rating && deal.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: deal.rating,
      reviewCount: deal.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return schema
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