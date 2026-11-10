// PROPÓSITO: Validar el parseo del roundup semana 46 (7 productos, FAQ y render).
// FECHA: 2026-11-10

import { getPostBySlug } from '../../src/data/blog-queries'
import { extractProducts, extractFAQs, mdToHtml } from '../../src/lib/blog-renderer'

async function main() {
  const post = await getPostBySlug('chollos-pesca-semana-46-2026', true)
  if (!post) {
    console.log('NO POST')
    process.exit(1)
  }
  const { products, clean } = extractProducts(post.content)
  const faqs = extractFAQs(post.content)
  console.log('productos:', products.length)
  products.forEach((p, i) => console.log(`${i + 1}. ${p.title} | ${p.stores[0]?.price} | ${p.slug}`))
  console.log('faqs:', faqs.length, faqs.map((f) => f.question).join(' | '))
  const html = mdToHtml(clean, products)
  console.log('html len:', html.length, '| CTAs:', (html.match(/Comprar/g) || []).length, '| limpia:', !clean.includes('PRODUCTS_DATA'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
