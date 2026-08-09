import { getDeals, getBrands } from '@/data/queries'
import { getPosts } from '@/data/blog-queries'
import { CATEGORIES } from '@/types'

const BASE_URL = 'https://www.pescatch.es'

export async function GET() {
  const [deals, posts, brands] = await Promise.all([
    getDeals({ sortBy: 'newest' }),
    getPosts(5000),
    getBrands(),
  ])

  const brandSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-')

  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'daily', lastmod: '' },
    { loc: '/categories', priority: '0.9', changefreq: 'weekly', lastmod: '' },
    { loc: '/top-chollos', priority: '0.9', changefreq: 'daily', lastmod: '' },
    { loc: '/chollos-hoy', priority: '0.7', changefreq: 'daily', lastmod: '' },
    { loc: '/search', priority: '0.8', changefreq: 'daily', lastmod: '' },
    { loc: '/favoritos', priority: '0.5', changefreq: 'daily', lastmod: '' },
    { loc: '/blog', priority: '0.9', changefreq: 'weekly', lastmod: '' },
    { loc: '/marcas', priority: '0.9', changefreq: 'weekly', lastmod: '' },
    ...CATEGORIES.map(cat => ({
      loc: `/categories/${cat.slug}`,
      priority: '0.8',
      changefreq: 'weekly' as const,
      lastmod: '',
    })),
    ...CATEGORIES.flatMap(cat =>
      cat.subcategories.map(sub => ({
        loc: `/categories/${cat.slug}/${sub.slug}`,
        priority: '0.7',
        changefreq: 'weekly' as const,
        lastmod: '',
      }))
    ),
    ...deals.map(deal => ({
      loc: `/deals/${deal.slug}`,
      priority: '0.9',
      changefreq: 'daily' as const,
      lastmod: deal.updatedAt ? deal.updatedAt.slice(0, 10) : '',
    })),
    ...posts.map(post => ({
      loc: `/blog/${post.slug}`,
      priority: '0.8',
      changefreq: 'weekly' as const,
      lastmod: post.updatedAt ? post.updatedAt.slice(0, 10) : '',
    })),
    ...brands.map(b => ({
      loc: `/marca/${brandSlug(b.brand)}`,
      priority: '0.7',
      changefreq: 'weekly' as const,
      lastmod: '',
    })),
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${BASE_URL}${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ''}
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
