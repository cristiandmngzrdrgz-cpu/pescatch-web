import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/data/blog-queries'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { buildAmazonUrl } from '@/lib/amazon-affiliate'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface ProductStore {
  name: string
  url: string
  price: string
}

interface ProductEntry {
  title: string
  rating: number
  image: string
  scores: Record<string, number>
  stores: ProductStore[]
}

function extractProducts(content: string): { products: ProductEntry[]; clean: string } {
  const match = content.match(/<!--\s*PRODUCTS_DATA:\s*(\[.*?\])\s*-->/)
  if (!match) return { products: [], clean: content }
  try {
    const raw = JSON.parse(match[1])
    const clean = content.replace(/<!--\s*PRODUCTS_DATA:\s*(\[.*?\])\s*-->/g, '')

    let products: ProductEntry[]
    if (raw[0]?.stores) {
      products = raw as ProductEntry[]
    } else {
      products = raw.map((p: { asin?: string; title: string; price: string; rating: number; image: string; scores: Record<string, number> }) => ({
        title: p.title,
        rating: p.rating,
        image: p.image,
        scores: p.scores,
        stores: [{ name: 'Amazon', url: `https://www.amazon.es/dp/${p.asin}`, price: p.price }],
      }))
    }

    return { products, clean }
  } catch {
    return { products: [], clean: content }
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = await getPostBySlug(slug)
    if (!post) return {}
    return {
      title: `${post.title} | PesCatch Blog`,
      description: post.excerpt,
      openGraph: {
        title: `${post.title} | PesCatch Blog`,
        description: post.excerpt,
        type: 'article',
        images: post.featuredImage ? [{ url: post.featuredImage }] : [],
      },
    }
  } catch { return {} }
}

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9áéíóúüñ]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60)
}

interface TocEntry { id: string; text: string }

function extractToc(md: string): TocEntry[] {
  const toc: TocEntry[] = []
  const lines = md.split('\n')
  for (const line of lines) {
    const match = line.match(/^## (.+)$/)
    if (match) {
      const text = match[1].replace(/\*\*(.+?)\*\*/g, '$1').split(' — ')[0].trim()
      toc.push({ id: slugify(match[1]), text })
    }
  }
  return toc
}

function bestStoreUrl(store: ProductStore): string {
  if (store.name.toLowerCase() === 'amazon') return buildAmazonUrl(store.url)
  return store.url
}

function mdToHtml(md: string, products: ProductEntry[]): string {
  let html = md.replace(/<[^>]*>/g, '')
    .replace(/^## (.+)$/gm, (_, heading) => {
      const id = slugify(heading)
      return `<div class="flex items-center gap-3 mt-10 mb-4"><div class="w-1 h-8 rounded-full" style="background:linear-gradient(180deg,#00D4FF,#FFB800)"></div><h2 id="${id}" class="text-2xl font-bold scroll-mt-24" style="color:#E8F0FE">${heading}</h2></div>`
    })
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-8 mb-3" style="color:#E8F0FE">$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4 class="text-lg font-bold mt-6 mb-2" style="color:#8BA3C7">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#E8F0FE">$1</strong>')
    .replace(/^---$/gm, '<hr style="border-color:#1E3A5F;margin:2rem 0">')
    .replace(/^- (.+)$/gm, '<li style="color:#8BA3C7;margin-bottom:0.25rem">• $1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed" style="line-height:1.85;color:#8BA3C7">')

  html = '<p class="mb-4 leading-relaxed" style="line-height:1.85;color:#8BA3C7">' + html + '</p>'

  html = html.replace(/<!--PRODUCT_IMG:(\d+)-->/g, (_, num) => {
    const i = parseInt(num) - 1
    const p = products[i]
    if (!p) return ''
    return `<div class="my-8 rounded-2xl overflow-hidden" style="position:relative;height:280px;background:linear-gradient(135deg,#1A2535,rgba(0,212,255,0.03));border:1px solid #1E3A5F">
      <img src="${p.image}" alt="${p.title}" class="absolute inset-0 w-full h-full object-contain p-6" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%" />
      <div class="absolute bottom-0 left-0 right-0 px-5 py-3" style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(180deg,transparent 0%,rgba(11,18,32,0.85) 100%)">
        <span class="text-xs font-semibold" style="color:#00D4FF">${p.title}</span>
      </div>
    </div>`
  })

  return html
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className="w-4 h-4" viewBox="0 0 24 24" fill={s <= Math.round(value) ? '#FFB800' : '#1E3A5F'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span className="text-xs ml-1" style={{ color: '#8BA3C7' }}>{value}</span>
    </div>
  )
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5" style={{ color: '#8BA3C7' }}>
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1A2535' }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: 'linear-gradient(90deg, #00D4FF, #FFB800)' }} />
      </div>
    </div>
  )
}

const BADGE_LABELS = ['Mejor elección', 'Gama alta', 'Calidad-precio', 'Recomendada', 'Económica']
const BADGE_COLORS = ['#00D4FF', '#6366F1', '#22C55E', '#F59E0B', '#EF4444']

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const { products, clean } = extractProducts(post.content)

  const sortedByPrice = [...products].sort((a, b) => {
    const aPrice = parseFloat((a.stores?.[0]?.price || '0').replace('€', '').replace('~', '').split('-')[0].trim())
    const bPrice = parseFloat((b.stores?.[0]?.price || '0').replace('€', '').replace('~', '').split('-')[0].trim())
    return bPrice - aPrice
  })
  function badgeLabel(i: number): string {
    const product = products[i]
    const idx = sortedByPrice.indexOf(product)
    return idx >= 0 && idx < BADGE_LABELS.length ? BADGE_LABELS[idx] : ''
  }
  function badgeColor(i: number): string {
    const product = products[i]
    const idx = sortedByPrice.indexOf(product)
    return idx >= 0 && idx < BADGE_COLORS.length ? BADGE_COLORS[idx] : BADGE_COLORS[4]
  }

  const toc = extractToc(clean)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <nav className="flex items-center gap-2 text-sm mb-8" style={{ color: '#4A6080' }}>
        <Link href="/" className="hover:text-[#00D4FF] transition-colors">Inicio</Link>
        <span style={{ color: '#1E3A5F' }}>/</span>
        <Link href="/blog" className="hover:text-[#00D4FF] transition-colors">Blog</Link>
        <span style={{ color: '#1E3A5F' }}>/</span>
        <span className="truncate max-w-[200px]" style={{ color: '#E8F0FE' }}>{post.title}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4" style={{ color: '#E8F0FE' }}>{post.title}</h1>
      <p className="text-lg mb-8" style={{ color: '#8BA3C7', lineHeight: '1.7' }}>{post.excerpt}</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* TOC Sidebar */}
        {toc.length > 0 && (
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 rounded-2xl p-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#00D4FF' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                Contenido
              </div>
              <nav className="space-y-1.5">
                {toc.map((entry) => (
                  <a key={entry.id} href={`#${entry.id}`}
                    className="block text-xs py-1.5 px-3 rounded-lg transition-all duration-200 hover:text-[#00D4FF] hover:bg-[#1A2535] no-underline"
                    style={{ color: '#8BA3C7' }}>
                    {entry.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* Main content */}
        <div className={toc.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4 max-w-3xl mx-auto'}>

          {/* Mobile TOC */}
          {toc.length > 0 && (
            <details className="lg:hidden mb-6 rounded-2xl overflow-hidden" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
              <summary className="flex items-center gap-2 p-4 text-sm font-semibold cursor-pointer select-none" style={{ color: '#00D4FF' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                Contenido del artículo
              </summary>
              <div className="px-4 pb-4 space-y-1">
                {toc.map((entry) => (
                  <a key={entry.id} href={`#${entry.id}`}
                    className="block text-xs py-1.5 px-3 rounded-lg transition-colors hover:text-[#00D4FF] no-underline"
                    style={{ color: '#8BA3C7' }}>
                    {entry.text}
                  </a>
                ))}
              </div>
            </details>
          )}

          {/* Hero product cards */}
          {products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {products.map((p, i) => {
                const best = p.stores.reduce((a, b) => parseFloat(a.price) < parseFloat(b.price) ? a : b)
                return (
                <div key={i}
                  className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(0,212,255,0.12)]"
                  style={{ border: '1px solid #1E3A5F', height: '340px' }}>
                  <Image src={p.image} alt={p.title} fill sizes="33vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0" style={{
                    background: 'linear-gradient(180deg, rgba(11,18,32,0.05) 0%, rgba(11,18,32,0.2) 25%, rgba(11,18,32,0.85) 55%, #0B1120 100%)',
                  }} />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[0.6rem] font-bold px-2 py-1 rounded-full"
                        style={{ background: `${badgeColor(i)}30`, backdropFilter: 'blur(8px)', color: badgeColor(i), border: `1px solid ${badgeColor(i)}50` }}>
                        #{i + 1} {badgeLabel(i)}
                      </span>
                      {p.stores.length > 1 && (
                        <span className="text-[0.6rem] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(0,212,255,0.15)', backdropFilter: 'blur(8px)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }}>
                          {p.stores.length} tiendas
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold mb-1 text-sm leading-snug" style={{ color: '#E8F0FE' }}>{p.title}</h3>
                    <StarRating value={p.rating} />
                    <div className="mt-2.5">
                      <a href={bestStoreUrl(best)} target="_blank" rel="nofollow sponsored"
                        className="flex items-center justify-between w-full p-2.5 rounded-xl transition-all duration-200 hover:bg-[#1A2535] no-underline"
                        style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}>
                        <span className="text-xs" style={{ color: '#A0B8D8' }}>{best.name}</span>
                        <span className="text-sm font-bold" style={{ color: '#FFB800' }}>{best.price}</span>
                      </a>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}

          {/* Article */}
          <div className="text-base leading-relaxed mb-10" style={{ color: '#8BA3C7' }}>
            <div dangerouslySetInnerHTML={{ __html: mdToHtml(clean, products) }} />
          </div>

          {/* Scores */}
          {products.length > 0 && (
            <div className="rounded-2xl p-6 md:p-8 mb-10" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: '#E8F0FE' }}>Puntuaciones detalladas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                        <Image src={p.image} alt="" fill sizes="40px" className="object-contain p-1" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate" style={{ color: '#E8F0FE' }}>{p.title}</div>
                        <div className="font-bold text-sm" style={{ color: '#FFB800' }}>{p.stores[0]?.price || ''}</div>
                      </div>
                    </div>
                    {Object.entries(p.scores || {}).map(([label, value]) => (
                      <ScoreBar key={label} label={label} value={value} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table comparison */}
          {products.length > 0 && (
            <div className="rounded-2xl overflow-hidden mb-10" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
              <div className="p-6 pb-0">
                <h2 className="text-xl font-bold mb-1" style={{ color: '#E8F0FE' }}>Comparativa rápida</h2>
                <p className="text-sm mb-4" style={{ color: '#8BA3C7' }}>Resumen de los productos analizados</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1E3A5F' }}>
                      <th className="text-left p-4 font-semibold" style={{ color: '#4A6080' }}>Producto</th>
                      <th className="text-center p-4 font-semibold" style={{ color: '#4A6080' }}>Precio</th>
                      <th className="text-center p-4 font-semibold" style={{ color: '#4A6080' }}>Valoración</th>
                      <th className="text-center p-4 font-semibold hidden sm:table-cell" style={{ color: '#4A6080' }}>Mejor tienda</th>
                      <th className="text-right p-4 font-semibold" style={{ color: '#4A6080' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => {
                      const best = p.stores.reduce((a, b) => parseFloat(a.price) < parseFloat(b.price) ? a : b)
                      return (
                        <tr key={i} style={{ borderBottom: i < products.length - 1 ? '1px solid #1E3A5F' : 'none' }}
                          className="hover:bg-[#1A2535] transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                                <img src={p.image} alt="" className="w-full h-full object-contain p-1" />
                              </div>
                              <div>
                                <div className="font-semibold text-xs" style={{ color: '#E8F0FE' }}>{p.title}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center font-bold" style={{ color: '#FFB800' }}>{best.price}</td>
                          <td className="p-4 text-center"><StarRating value={p.rating} /></td>
                          <td className="p-4 text-center hidden sm:table-cell" style={{ color: '#8BA3C7' }}>{best.name}</td>
                          <td className="p-4 text-right">
                            <a href={bestStoreUrl(best)} target="_blank" rel="nofollow sponsored"
                              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:gap-1.5 no-underline"
                              style={{ background: '#00D4FF', color: '#0B1120' }}>
                              Ver <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                            </a>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CTAs */}
          {products.length > 0 && (
            <div className="rounded-2xl p-6 md:p-8 mb-10" style={{ background: 'linear-gradient(135deg, #111827, #0B1120)', border: '1px solid #1E3A5F' }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: '#E8F0FE' }}>Dónde comprar cada producto</h2>
              <div className="space-y-3">
                {products.map((p, i) => {
                  const sorted = [...p.stores].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
                  return (
                  <div key={i} className="rounded-xl p-4 transition-all duration-300"
                    style={{ background: '#0B1120', border: '1px solid #1E3A5F' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                        <Image src={p.image} alt="" fill sizes="48px" className="object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${badgeColor(i)}20`, color: badgeColor(i) }}>#{i + 1}</span>
                          <div className="font-semibold text-sm truncate" style={{ color: '#E8F0FE' }}>{p.title}</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {sorted.map((s, si) => (
                        <a key={si} href={bestStoreUrl(s)} target="_blank" rel="nofollow sponsored"
                          className="flex items-center justify-between px-3 py-2 rounded-lg transition-all no-underline hover:bg-[#1A2535] group"
                          style={{ background: si === 0 ? 'rgba(255,184,0,0.06)' : 'transparent' }}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm" style={{ color: '#8BA3C7' }}>{s.name}</span>
                            {si === 0 && (
                              <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,184,0,0.15)', color: '#FFB800' }}>
                                Mejor precio
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: si === 0 ? '#FFB800' : '#4A6080' }}>{s.price}</span>
                            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" style={{ color: '#4A6080' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          {/* Ad */}
          <div className="rounded-xl p-6 text-center" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
            <p className="text-sm" style={{ color: '#4A6080' }}>Publicidad</p>
          </div>
        </div>
      </div>
    </div>
  )
}
