const TAG = process.env.AMAZON_PA_TAG || 'pescatch-21'

export function buildAmazonUrl(urlOrAsin: string): string {
  if (!urlOrAsin) return urlOrAsin

  let url: string
  if (urlOrAsin.startsWith('http://') || urlOrAsin.startsWith('https://')) {
    url = urlOrAsin
  } else {
    url = `https://www.amazon.es/dp/${urlOrAsin}`
  }

  // Parsear la URL para manipular params de forma segura
  try {
    const parsed = new URL(url)
    const isProductUrl = /\/dp\/[A-Z0-9]{10}/i.test(parsed.pathname)

    if (isProductUrl) {
      if (!parsed.searchParams.has('th')) parsed.searchParams.set('th', '1')
      if (!parsed.searchParams.has('psc')) parsed.searchParams.set('psc', '1')
    }

    // Siempre sobreescribir el tag con el nuestro (evita tags de terceros en URLs pegadas)
    parsed.searchParams.set('tag', TAG)

    return parsed.toString()
  } catch {
    // Fallback para URLs malformadas
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}tag=${TAG}`
  }
}
