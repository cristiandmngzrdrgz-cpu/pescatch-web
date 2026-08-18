import { marked } from 'marked'
import { buildAmazonUrl } from '@/lib/amazon-affiliate'

export interface ProductStore {
  name: string
  url: string
  price: string
}

export interface ProductEntry {
  title: string
  rating: number
  image: string
  scores: Record<string, number>
  stores: ProductStore[]
  slug?: string
  badge?: string
  badgeColor?: string
}

export function extractProducts(content: string): { products: ProductEntry[]; clean: string } {
  const match = content.match(/<!--\s*PRODUCTS_DATA:\s*(\[.*?\])\s*-->/)
  if (!match) return { products: [], clean: content }
  try {
    const raw = JSON.parse(match[1])
    const clean = content.replace(/<!--\s*PRODUCTS_DATA:\s*(\[.*?\])\s*-->/g, '')

    let products: ProductEntry[]
    if (raw[0]?.stores) {
      products = raw.map((p: Partial<ProductEntry> & { slug?: string }) => ({ ...p, slug: p.slug }))
    } else {
      products = raw.map((p: { asin?: string; title: string; price: string; rating: number; image: string; scores: Record<string, number>; badge?: string; badgeColor?: string }) => ({
        title: p.title,
        rating: p.rating,
        image: p.image,
        scores: p.scores,
        badge: p.badge,
        badgeColor: p.badgeColor,
        stores: [{ name: 'Amazon', url: `https://www.amazon.es/dp/${p.asin}`, price: p.price }],
      }))
    }

    return { products, clean }
  } catch {
    return { products: [], clean: content }
  }
}

export function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9áéíóúüñ]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60)
}

export function extractFAQs(content: string): Array<{ question: string; answer: string }> {
  const faqRegex = /^## (?:FAQ|Preguntas frecuentes|Preguntas)\s*([\s\S]*?)(?=^## |$(?![\s\S]))/m
  const match = content.match(faqRegex)
  if (!match) return []

  const faqSection = match[1]
  const qaRegex = /^### (.+?)\n([\s\S]+?)(?=^### |$(?![\s\S]))/gm
  const faqs: Array<{ question: string; answer: string }> = []

  let qaMatch
  while ((qaMatch = qaRegex.exec(faqSection)) !== null) {
    const question = qaMatch[1].trim()
    const answer = qaMatch[2].trim().replace(/^-\s+/gm, '').replace(/\n/g, ' ')
    faqs.push({ question, answer })
  }

  return faqs
}

export interface TocEntry { id: string; text: string }

export function extractToc(md: string): TocEntry[] {
  const toc: TocEntry[] = []
  const lines = md.split('\n')
  for (const line of lines) {
    const match = line.match(/^## (.+)$/)
    if (match) {
      const text = match[1].replace(/\*\*(.+?)\*\*/g, '$1').split(' — ')[0].trim()
      toc.push({ id: slugify(text), text })
    }
  }
  return toc
}

export function bestStoreUrl(store: ProductStore): string {
  if (store.name.toLowerCase() === 'amazon') return buildAmazonUrl(store.url)
  return store.url
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function mdToHtml(md: string, products: ProductEntry[]): string {
  const imgMarkers: string[] = []
  const processed = md.replace(/<!--PRODUCT_IMG:(\d+)-->/g, (_, num) => {
    const idx = imgMarkers.length
    imgMarkers.push(num)
    return `\x00PRODUCT_IMG_${idx}\x00`
  })

  const safe = processed.replace(/<[^>]*>/g, '')
  let html = marked.parse(safe) as string

  html = html.replace(/\x00PRODUCT_IMG_(\d+)\x00/g, (_, idx) => {
    const num = parseInt(imgMarkers[parseInt(idx, 10)], 10)
    const i = num - 1
    const p = products[i]
    if (!p) return ''
    const bestProduct = p.stores.reduce((a, b) => parseFloat(a.price) < parseFloat(b.price) ? a : b)
    const extraStores = p.stores
      .filter((s) => s !== bestProduct)
      .map((s) => `<a href="${escapeHtml(bestStoreUrl(s))}" target="_blank" rel="nofollow sponsored" style="color:#4A6080;font-size:12px;text-decoration:underline">${escapeHtml(s.name)} ${escapeHtml(s.price)}</a>`)
      .join(' · ')
    const pescatchLink = p.slug
      ? `<a href="/deals/${escapeHtml(p.slug)}" target="_blank" rel="nofollow sponsored" style="color:#00D4FF;font-size:12px;font-weight:700;text-decoration:none;border:1px solid rgba(0,212,255,0.25);border-radius:8px;padding:8px 12px;background:rgba(0,212,255,0.08)">Ver en PesCatch</a>`
      : ''
    return `<div class="my-8 rounded-2xl overflow-hidden" style="background:#1A2535;border:1px solid #1E3A5F">
      <div style="position:relative;height:280px;background:linear-gradient(135deg,#1A2535,rgba(0,212,255,0.03))">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" class="absolute inset-0 w-full h-full object-contain p-6" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%" />
      </div>
      <div style="padding:10px 20px;border-top:1px solid #1E3A5F;background:rgba(11,18,32,0.6)">
        <span class="text-xs font-semibold" style="color:#00D4FF">${escapeHtml(p.title)}</span>
      </div>
      <div style="padding:12px 20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid #1E3A5F;background:rgba(11,18,32,0.4)">
        <a href="${escapeHtml(bestStoreUrl(bestProduct))}" target="_blank" rel="nofollow sponsored" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#00D4FF;color:#0B1120;font-weight:700;font-size:13px;text-decoration:none;border-radius:10px;padding:10px 16px;min-width:180px">Comprar · ${escapeHtml(bestProduct.price)} <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></a>
        ${pescatchLink}
      </div>
      ${extraStores ? `<div style="padding:2px 20px 12px;color:#4A6080;font-size:12px">Todas las tiendas: ${extraStores}</div>` : ''}
    </div>`
  })

  html = html.replace(/<h2(?: id="[^"]*")?>(.+?)<\/h2>/g, (_, text) => {
    const clean = text.replace(/<[^>]*>/g, '')
    const id = slugify(clean)
    return `<div class="flex items-center gap-4 mt-12 mb-6"><div class="w-1.5 h-10 rounded-full" style="background:linear-gradient(180deg,#00D4FF,#FFB800);box-shadow:0 0 12px rgba(0,212,255,0.35)"></div><h2 id="${id}" class="text-3xl md:text-4xl font-extrabold scroll-mt-24 leading-tight" style="color:#E8F0FE;text-shadow:0 0 24px rgba(0,212,255,0.12)">${text}</h2></div>`
  })

  html = html.replace(/<h3(?: id="[^"]*")?>(.+?)<\/h3>/g, (_, text) => {
    const clean = text.replace(/<[^>]*>/g, '')
    const id = slugify(clean)
    return `<h3 id="${id}" class="text-xl font-bold mt-8 mb-3" style="color:#E8F0FE">${text}</h3>`
  })

  html = html.replace(/<h4(?: id="[^"]*")?>(.+?)<\/h4>/g, (_, text) => {
    const clean = text.replace(/<[^>]*>/g, '')
    const id = slugify(clean)
    return `<h4 id="${id}" class="text-lg font-bold mt-6 mb-2" style="color:#8BA3C7">${text}</h4>`
  })

  html = html.replace(/<strong>([^<]*)<\/strong>/g, '<strong style="color:#E8F0FE">$1</strong>')
  html = html.replace(/<p>/g, '<p class="mb-4 leading-relaxed" style="line-height:1.85;color:#8BA3C7">')
  html = html.replace(/<hr(?: \/)?>/g, '<hr style="border-color:#1E3A5F;margin:2rem 0">')
  html = html.replace(/<li>/g, '<li style="color:#8BA3C7;margin-bottom:0.25rem">')

  return html
}

export const BADGE_LABELS = ['Mejor elección', 'Gama alta', 'Calidad-precio', 'Recomendada', 'Económica']
export const BADGE_COLORS = ['#00D4FF', '#6366F1', '#22C55E', '#F59E0B', '#EF4444']