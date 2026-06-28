export async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: https://pescatch.es/sitemap.xml
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
