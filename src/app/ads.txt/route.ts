export const dynamic = 'force-static'

export async function GET() {
  // Fuente canónica = public/ads.txt — mantener sincronizado
  const body = `google.com, pub-6408920021627188, DIRECT, f08c47fec0942fa0
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
