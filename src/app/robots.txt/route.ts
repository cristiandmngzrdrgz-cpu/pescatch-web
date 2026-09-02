export async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://www.pescatch.es/sitemap.xml
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
