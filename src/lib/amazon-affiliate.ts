const TAG = process.env.AMAZON_PA_TAG || 'pescatch-21'

// Extrae el ASIN de una URL de Amazon (10 caracteres alfanuméricos tras /dp/)
export function extractAsin(urlOrAsin: string): string | null {
  if (!urlOrAsin) return null
  // Si ya es un ASIN puro (10 chars alfanum)
  if (/^[A-Z0-9]{10}$/i.test(urlOrAsin.trim())) return urlOrAsin.trim().toUpperCase()
  // Extraer de URL /dp/ASIN
  const match = urlOrAsin.match(/\/dp\/([A-Z0-9]{10})/i)
  return match ? match[1].toUpperCase() : null
}

export function buildAmazonUrl(urlOrAsin: string, variantAsin?: string): string {
  if (!urlOrAsin) return urlOrAsin

  try {
    let parsed: URL

    if (variantAsin) {
      parsed = new URL(`https://www.amazon.es/dp/${variantAsin.trim().toUpperCase()}`)
    } else if (urlOrAsin.startsWith('http://') || urlOrAsin.startsWith('https://')) {
      parsed = new URL(urlOrAsin)
    } else if (/^[A-Z0-9]{10}$/i.test(urlOrAsin.trim())) {
      parsed = new URL(`https://www.amazon.es/dp/${urlOrAsin.trim().toUpperCase()}`)
    } else {
      const separator = urlOrAsin.includes('?') ? '&' : '?'
      return `${urlOrAsin}${separator}tag=${TAG}`
    }

    const isProductUrl = /\/dp\/[A-Z0-9]{10}/i.test(parsed.pathname)

    if (isProductUrl) {
      // th=1 → confirma la variante seleccionada (evita redirect al padre)
      // psc=1 → evita popup de "¿quieres añadir garantía?" en algunos productos
      if (!parsed.searchParams.has('th')) parsed.searchParams.set('th', '1')
      if (!parsed.searchParams.has('psc')) parsed.searchParams.set('psc', '1')

      // Limpiar parámetros de tracking basura que Amazon añade a veces
      // (ref, linkCode, camp, creative, etc.) — solo conservar th, psc, customId y tag
      const keep = new Set(['th', 'psc', 'customId', 'tag', 'color', 'size'])
      for (const key of [...parsed.searchParams.keys()]) {
        if (!keep.has(key)) parsed.searchParams.delete(key)
      }
    }

    // Siempre sobreescribir el tag con el nuestro
    parsed.searchParams.set('tag', TAG)

    return parsed.toString()
  } catch {
    const separator = urlOrAsin.includes('?') ? '&' : '?'
    return `${urlOrAsin}${separator}tag=${TAG}`
  }
}

// Construye una URL de variante específica cuando tienes el ASIN padre
// y los parámetros de variante por separado (útil para scraping)
export function buildAmazonVariantUrl(
  parentAsinOrUrl: string,
  variantParams: Record<string, string> = {}
): string {
  const asin = extractAsin(parentAsinOrUrl) || parentAsinOrUrl
  const url = new URL(`https://www.amazon.es/dp/${asin}`)
  url.searchParams.set('th', '1')
  url.searchParams.set('psc', '1')
  for (const [key, value] of Object.entries(variantParams)) {
    url.searchParams.set(key, value)
  }
  url.searchParams.set('tag', TAG)
  return url.toString()
}
