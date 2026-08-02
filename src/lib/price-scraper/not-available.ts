import type { ScrapedPrice } from './types'

export function unavailablePrice(url: string): ScrapedPrice {
  return { price: 0, stock: 'out_of_stock', url, notAvailable: true }
}

export function isAmazonNotFoundPage(html: string, pageTitle: string, status: number): boolean {
  if (status === 404) return true
  const title = pageTitle.toLowerCase()
  const body = html.toLowerCase()
  return (
    title.includes('página no encontrada') ||
    title.includes('pagina no encontrada') ||
    title.includes('página no disponible') ||
    title.includes('page not found') ||
    body.includes('no pudimos encontrar la página que buscas') ||
    body.includes('la página que buscas no se encuentra') ||
    body.includes('este producto ya no está disponible')
  )
}

export function isDecathlonNotFoundPage(
  html: string,
  requestedUrl: string,
  finalUrl: string,
): boolean {
  const isProductPage = /\/p\//i.test(requestedUrl)
  if (!isProductPage) return false

  const redirectedToCategory = !/\/p\//i.test(finalUrl)
  const title = html.match(/<title[^>]*>([^<]+)</i)?.[1] || ''
  const categoryTitle = /^comprar\b/i.test(title.trim())
  const body = html.toLowerCase()
  const notFoundText =
    body.includes('este producto ya no está disponible') ||
    body.includes('producto no disponible') ||
    body.includes('no se encuentra el producto')

  return redirectedToCategory || categoryTitle || notFoundText
}

export function isAliExpressNotFoundPage(text: string): boolean {
  const t = text.toLowerCase()
  return (
    t.includes('producto no disponible') ||
    t.includes('product is no longer available') ||
    t.includes('item no longer exists') ||
    t.includes('item is no longer available') ||
    t.includes('product not found') ||
    t.includes('no longer available') ||
    t.includes('expired') ||
    t.includes('la página que buscas no existe')
  )
}
