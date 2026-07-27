import { getDeals } from '@/data/queries'

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
  const deals = await getDeals({ sortBy: 'newest' }).then(d => d.slice(0, 50))

  const items = deals
    .map(
      (deal) => `  <item>
    <title>${escapeXml(deal.title)} — ${deal.salePrice.toFixed(2)}€ (${deal.discountPercent}% dto.)</title>
    <link>${BASE_URL}/deals/${deal.slug}</link>
    <guid isPermaLink="true">${BASE_URL}/deals/${deal.slug}</guid>
    <description>${escapeXml(deal.description || `${deal.store.name} — ${deal.salePrice.toFixed(2)}€ (antes ${deal.originalPrice.toFixed(2)}€)`)}</description>
    <pubDate>${new Date(deal.publishedAt).toUTCString()}</pubDate>
    <category>${escapeXml(deal.category)}</category>
    ${deal.imageUrl ? `<enclosure url="${escapeXml(deal.imageUrl)}" type="image/jpeg" />` : ''}
  </item>`
    )
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>PesCatch - Chollos de Pesca</title>
  <link>${BASE_URL}</link>
  <atom:link href="${BASE_URL}/deals.xml" rel="self" type="application/rss+xml" />
  <description>Los mejores chollos de material de pesca en España. Actualizado diariamente.</description>
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
