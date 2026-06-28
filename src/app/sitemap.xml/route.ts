import { getDeals } from '@/data/queries'
import { CATEGORIES } from '@/types'

const BASE_URL = 'https://pescatch.es'

export async function GET() {
  const deals = getDeals({ sortBy: 'newest' })

  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/categories', priority: '0.9', changefreq: 'weekly' },
    { loc: '/search', priority: '0.8', changefreq: 'daily' },
    ...CATEGORIES.map(cat => ({
      loc: `/categories/${cat.slug}`,
      priority: '0.8',
      changefreq: 'weekly' as const,
    })),
    ...CATEGORIES.flatMap(cat =>
      cat.subcategories.map(sub => ({
        loc: `/categories/${cat.slug}/${sub.slug}`,
        priority: '0.7',
        changefreq: 'weekly' as const,
      }))
    ),
    ...deals.map(deal => ({
      loc: `/deals/${deal.slug}`,
      priority: '0.9',
      changefreq: 'daily' as const,
    })),
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${BASE_URL}${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
