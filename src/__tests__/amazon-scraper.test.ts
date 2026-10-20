import { describe, it, expect } from 'vitest'
import { parseAmazonPage } from '@/lib/price-scraper/amazon'

function page(body: string, head = '') {
  return `<html><head><title>Producto de prueba</title>${head}</head><body>${body}</body></html>`
}

describe('parseAmazonPage', () => {
  it('lee el precio actual con céntimos y el tachado real del bloque principal', () => {
    const html = page(`
      <div id="corePriceDisplay_desktop_feature_div">
        <span class="a-price aok-align-center reinventPricePriceToPayMargin priceToPay">
          <span class="a-offscreen"></span>
        </span>
        <span class="aok-offscreen"> 22,49 € con un ahorro del 50 %</span>
        <span class="a-price a-text-price apex-basisprice-value">
          <span class="a-offscreen">44,99€</span>
        </span>
      </div>
      <div id="ads"><span class="a-offscreen">37,95 €</span></div>
    `)

    expect(parseAmazonPage(html)).toEqual({
      price: 22.49,
      originalPrice: 44.99,
      stock: 'in_stock',
    })
  })

  it('no usa el primer precio de la página si es un anuncio', () => {
    const html = page(`
      <div id="ads"><span class="a-offscreen">37,95 €</span></div>
      <div id="corePriceDisplay_desktop_feature_div">
        <span class="aok-offscreen">58,99 €</span>
      </div>
    `)

    expect(parseAmazonPage(html)).toEqual({
      price: 58.99,
      originalPrice: null,
      stock: 'in_stock',
    })
  })

  it('usa el tachado del bloque principal, no un original viejo de otra zona', () => {
    const html = page(`
      <div id="ads"><span class="a-offscreen">55,00 €</span></div>
      <div id="corePriceDisplay_desktop_feature_div">
        <span class="aok-offscreen">32,90 € con un ahorro del 5 %</span>
        <span class="a-price a-text-price"><span class="a-offscreen">34,69 €</span></span>
      </div>
    `)

    expect(parseAmazonPage(html)).toEqual({
      price: 32.9,
      originalPrice: 34.69,
      stock: 'in_stock',
    })
  })

  it('usa JSON-LD como fallback si no hay bloque de precio', () => {
    const html = page(
      '',
      `<script type="application/ld+json">${JSON.stringify({
        '@type': 'Product',
        offers: { price: '44.49', availability: 'https://schema.org/InStock' },
      })}</script>`,
    )

    expect(parseAmazonPage(html)).toEqual({
      price: 44.49,
      originalPrice: null,
      stock: 'in_stock',
    })
  })

  it('devuelve null si solo hay precios de anuncios', () => {
    const html = page(`
      <div id="ads"><span class="a-offscreen">37,95 €</span></div>
      <div class="otro"><span class="a-offscreen">58,99 €</span></div>
    `)

    expect(parseAmazonPage(html)).toBeNull()
  })

  it('lee el bloque clásico con a-price actual y a-text-price de tachado', () => {
    const html = page(`
      <div id="corePrice_feature_div">
        <span class="a-price priceToPay"><span class="a-offscreen">12,44 €</span></span>
        <span class="a-price a-text-price"><span class="a-offscreen">13,99 €</span></span>
      </div>
    `)

    expect(parseAmazonPage(html)).toEqual({
      price: 12.44,
      originalPrice: 13.99,
      stock: 'in_stock',
    })
  })
})
