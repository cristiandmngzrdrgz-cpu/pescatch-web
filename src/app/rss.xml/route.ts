import { getPosts } from '@/data/blog-queries'

const BASE_URL = 'https://pescatch.es'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const posts = await getPosts(50)

  const items = posts
    .map(
      (post) => `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${BASE_URL}/blog/${post.slug}</link>
    <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
    <description>${escapeXml(post.excerpt)}</description>
    <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
    ${post.category ? `<category>${escapeXml(post.category)}</category>` : ''}
  </item>`
    )
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
