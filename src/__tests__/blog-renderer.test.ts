import { describe, it, expect } from 'vitest'
import {
  extractProducts,
  extractFAQs,
  extractToc,
  slugify,
  mdToHtml,
  bestStoreUrl,
  BADGE_LABELS,
} from '@/lib/blog-renderer'

describe('extractProducts', () => {
  it('returns empty products and unchanged content when no PRODUCTS_DATA', () => {
    const content = '## Intro\nSolo texto.'
    const { products, clean } = extractProducts(content)
    expect(products).toHaveLength(0)
    expect(clean).toBe(content)
  })

  it('parses legacy asin format into a single Amazon store', () => {
    const content = `Intro
<!-- PRODUCTS_DATA: [{"asin":"B0TEST01","title":"Caña","price":"39,99 €","rating":4.5,"image":"https://img.example.com/1.jpg","scores":{"Rendimiento":90}}] -->`
    const { products, clean } = extractProducts(content)
    expect(products).toHaveLength(1)
    expect(products[0].title).toBe('Caña')
    expect(products[0].stores).toEqual([
      { name: 'Amazon', url: 'https://www.amazon.es/dp/B0TEST01', price: '39,99 €' },
    ])
    expect(clean).not.toContain('PRODUCTS_DATA')
    expect(clean).toContain('Intro')
  })

  it('parses the stores format keeping slug and badge', () => {
    const content = `<!--PRODUCTS_DATA: [{"title":"Carrete","rating":4,"image":"https://img.example.com/2.jpg","scores":{"Freno":85},"slug":"carrete-x","badge":"Mejor elección","badgeColor":"#00D4FF","stores":[{"name":"Amazon","url":"https://amazon.es/dp/B0X","price":"49,90 €"},{"name":"AliExpress","url":"https://es.aliexpress.com/item/123.html","price":"44,50 €"}]}]-->`
    const { products } = extractProducts(content)
    expect(products).toHaveLength(1)
    expect(products[0].slug).toBe('carrete-x')
    expect(products[0].badge).toBe('Mejor elección')
    expect(products[0].stores).toHaveLength(2)
  })

  it('returns empty on malformed JSON', () => {
    const content = '<!--PRODUCTS_DATA: [{"title":broken-->'
    const { products } = extractProducts(content)
    expect(products).toHaveLength(0)
  })
})

describe('slugify', () => {
  it('lowercases, replaces spaces and keeps spanish accents', () => {
    expect(slugify('Cañas de Pesca 2026')).toBe('cañas-de-pesca-2026')
    expect(slugify('Señuelos y Vinilos')).toBe('señuelos-y-vinilos')
  })

  it('trims leading/trailing dashes and caps at 60 chars', () => {
    expect(slugify('  Hola  ')).toBe('hola')
    expect(slugify('a'.repeat(80)).length).toBeLessThanOrEqual(60)
  })
})

describe('extractFAQs', () => {
  const content = `# Post
## Introducción
Texto.
## FAQ
### ¿Qué carrete compro?
- Uno de spinning 2500.
- Barato.
### ¿Cuánto dura?
Con cuidado, años.
## Conclusión
Fin.`

  it('extracts questions and answers from the FAQ section', () => {
    const faqs = extractFAQs(content)
    expect(faqs).toHaveLength(2)
    expect(faqs[0].question).toBe('¿Qué carrete compro?')
    expect(faqs[0].answer).toBe('Uno de spinning 2500. Barato.')
    expect(faqs[1].question).toBe('¿Cuánto dura?')
  })

  it('returns empty when no FAQ heading', () => {
    expect(extractFAQs('## Solo intro')).toHaveLength(0)
  })
})

describe('extractToc', () => {
  it('builds TOC from H2 headings with slug ids', () => {
    const toc = extractToc('## Los Mejores\n\n## Análisis — detalle\n\n### no-count')
    expect(toc).toEqual([
      { id: 'los-mejores', text: 'Los Mejores' },
      { id: 'análisis', text: 'Análisis' },
    ])
  })
})

describe('mdToHtml', () => {
  const products = [
    {
      title: 'Caña <b>Pro</b>',
      rating: 4.5,
      image: 'https://img.example.com/pro.jpg?x=1&y=2',
      scores: { Rendimiento: 90 },
      slug: 'cana-pro',
      stores: [
        { name: 'Amazon', url: 'https://amazon.es/dp/B0PRO', price: '59,90 €' },
        { name: 'AliExpress', url: 'https://es.aliexpress.com/item/9.html', price: '49,90 €' },
      ],
    },
  ]

  it('renders PRODUCT_IMG marker into a CTA block with best price and store links', () => {
    const html = mdToHtml('<!--PRODUCT_IMG:1-->', products)
    expect(html).toContain('Comprar · 49,90 €')
    expect(html).toContain('Ver en PesCatch')
    expect(html).toContain('/deals/cana-pro')
    expect(html).toContain('Todas las tiendas:')
    expect(html).toContain('Amazon 59,90 €')
    expect(html).toContain('https://es.aliexpress.com/item/9.html')
  })

  it('adds tag param to amazon store urls', () => {
    const html = mdToHtml('<!--PRODUCT_IMG:1-->', products)
    expect(html).toContain('amazon.es/dp/B0PRO')
    expect(html).toMatch(/tag=[a-zA-Z0-9]+/)
  })

  it('escapes html in titles and image srcs', () => {
    const html = mdToHtml('<!--PRODUCT_IMG:1-->', products)
    expect(html).toContain('Caña &lt;b&gt;Pro&lt;/b&gt;')
    expect(html).toContain('&amp;y=2')
  })

  it('renders an empty paragraph for a marker without matching product', () => {
    const html = mdToHtml('<!--PRODUCT_IMG:5-->', products)
    expect(html).not.toContain('PRODUCT_IMG')
    expect(html).not.toContain('Comprar ·')
  })

  it('renders markdown headings with slug ids', () => {
    const html = mdToHtml('## Análisis completo\n\nTexto.', products)
    expect(html).toContain('<h2 id="análisis-completo"')
  })
})

describe('bestStoreUrl', () => {
  it('applies tag only to amazon stores', () => {
    const amazon = bestStoreUrl({ name: 'Amazon', url: 'https://amazon.es/dp/B0X', price: '1 €' })
    expect(amazon).toContain('tag=')
    const other = bestStoreUrl({ name: 'AliExpress', url: 'https://es.aliexpress.com/item/1.html', price: '1 €' })
    expect(other).toBe('https://es.aliexpress.com/item/1.html')
  })
})

describe('BADGE_LABELS', () => {
  it('has a positional fallback for every product', () => {
    expect(BADGE_LABELS).toHaveLength(5)
    expect(BADGE_LABELS[0]).toBe('Mejor elección')
  })
})