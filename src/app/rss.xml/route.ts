import { getPosts } from '@/data/blog-queries'
import { getDeals } from '@/data/queries'

const BASE_URL = 'https://www.pescatch.es'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const [posts, deals] = await Promise.all([
    getPosts(50),
    getDeals({ sortBy: 'newest' }).then(d => d.slice(0, 30)),
  ])

  const postItems = posts.map(
    (post) => `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${BASE_URL}/blog/${post.slug}</link>
    <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
    <description>${escapeXml(post.excerpt)}</description>
    <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
    ${post.category ? `<category>${escapeXml(post.category)}</category>` : ''}
  </item>`
  )

  const dealItems = deals.map(
    (deal) => `  <item>
    <title>${escapeXml(deal.title)} — ${deal.salePrice.toFixed(2)}€ (${deal.discountPercent}% dto.)</title>
    <link>${BASE_URL}/deals/${deal.slug}</link>
    <guid isPermaLink="true">${BASE_URL}/deals/${deal.slug}</guid>
    <description>${escapeXml(deal.description || `${deal.store.name} — ${deal.salePrice.toFixed(2)}€ (antes ${deal.originalPrice.toFixed(2)}€)`)}</description>
    <pubDate>${new Date(deal.publishedAt).toUTCString()}</pubDate>
    <category>chollos</category>
  </item>`
  )

  const items = [...postItems, ...dealItems]
    .sort((a, b) => {
      const dateA = a.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
      const dateB = b.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>PesCatch - Guías y Chollos de Pesca</title>
  <link>${BASE_URL}</link>
  <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
  <description>Guías, análisis y los mejores chollos de material de pesca en España.</description>
  <language>es-ES</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
