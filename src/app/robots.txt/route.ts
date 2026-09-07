export async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://www.pescatch.es/sitemap.xml
Sitemap: https://www.pescatch.es/rss.xml
Sitemap: https://www.pescatch.es/deals.xml
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
