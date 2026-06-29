import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/data/blog-queries'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface ProductEntry {
  asin: string
  title: string
  price: string
  rating: number
  image: string
  scores: Record<string, number>
}

function extractProducts(content: string): { products: ProductEntry[]; clean: string } {
  const match = content.match(/<!--\s*PRODUCTS_DATA:\s*(\[.*?\])\s*-->/)
  if (!match) return { products: [], clean: content }
  try {
    const products = JSON.parse(match[1]) as ProductEntry[]
    const clean = content.replace(/<!--\s*PRODUCTS_DATA:\s*(\[.*?\])\s*-->/g, '')
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
    return { title: `${post.title} | PesCatch Blog`, description: post.excerpt }
  } catch { return {} }
}

function mdToHtml(md: string): string {
  let html = md
    .replace(/^## (.+)$/gm, '<div class="flex items-center gap-3 mt-10 mb-4"><div class="w-1 h-8 rounded-full" style="background:linear-gradient(180deg,#00D4FF,#FFB800)"></div><h2 class="text-2xl font-bold" style="color:#E8F0FE">$1</h2></div>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-8 mb-3" style="color:#E8F0FE">$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4 class="text-lg font-bold mt-6 mb-2" style="color:#8BA3C7">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#E8F0FE">$1</strong>')
    .replace(/^---$/gm, '<hr style="border-color:#1E3A5F;margin:2rem 0">')
    .replace(/^- (.+)$/gm, '<li style="color:#8BA3C7;margin-bottom:0.25rem">• $1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed" style="line-height:1.85;color:#8BA3C7">')
  return '<p class="mb-4 leading-relaxed" style="line-height:1.85;color:#8BA3C7">' + html + '</p>'
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <nav className="flex items-center gap-2 text-sm mb-8" style={{ color: '#4A6080' }}>
        <Link href="/" className="hover:text-[#00D4FF] transition-colors">Inicio</Link>
        <span style={{ color: '#1E3A5F' }}>/</span>
        <Link href="/blog" className="hover:text-[#00D4FF] transition-colors">Blog</Link>
        <span style={{ color: '#1E3A5F' }}>/</span>
        <span className="truncate max-w-[200px]" style={{ color: '#E8F0FE' }}>{post.title}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4" style={{ color: '#E8F0FE' }}>{post.title}</h1>
      <p className="text-lg mb-8" style={{ color: '#8BA3C7', lineHeight: '1.7' }}>{post.excerpt}</p>

      {/* Hero product cards */}
      {products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {products.map((p, i) => (
            <a key={p.asin} href={`https://www.amazon.es/dp/${p.asin}`} target="_blank" rel="nofollow sponsored"
              className="group rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 no-underline hover:border-[rgba(0,212,255,0.5)] hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]"
              style={{ background: 'linear-gradient(135deg, #111827, #0B1120)', border: '1px solid #1E3A5F' }}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{ background: `${BADGE_COLORS[i]}20`, color: BADGE_COLORS[i], border: `1px solid ${BADGE_COLORS[i]}40` }}>
                    #{i + 1} {BADGE_LABELS[i] || ''}
                  </span>
                  <span className="font-bold" style={{ color: '#4A6080' }}>{p.price}</span>
                </div>
                <div className="h-44 rounded-xl overflow-hidden mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.03))' }}>
                  <img src={p.image} alt={p.title} className="max-h-full max-w-full object-contain p-3 group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
                <h3 className="font-bold mb-1 text-sm leading-snug" style={{ color: '#E8F0FE' }}>{p.title}</h3>
                <StarRating value={p.rating} />
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid #1E3A5F' }}>
                  <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#00D4FF' }}>
                    Ver oferta
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Article */}
      <div className="text-base leading-relaxed mb-10" style={{ color: '#8BA3C7' }}>
        <div dangerouslySetInnerHTML={{ __html: mdToHtml(clean) }} />
      </div>

      {/* Scores */}
      {products.length > 0 && (
        <div className="rounded-2xl p-6 md:p-8 mb-10" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="text-xl font-bold mb-6" style={{ color: '#E8F0FE' }}>Puntuaciones detalladas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p, i) => (
              <div key={p.asin}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                    <img src={p.image} alt="" className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs truncate" style={{ color: '#E8F0FE' }}>{p.title}</div>
                    <div className="font-bold text-sm" style={{ color: '#FFB800' }}>{p.price}</div>
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

      {/* CTAs */}
      {products.length > 0 && (
        <div className="rounded-2xl p-6 md:p-8 mb-10" style={{ background: 'linear-gradient(135deg, #111827, #0B1120)', border: '1px solid #1E3A5F' }}>
          <h2 className="text-xl font-bold mb-6" style={{ color: '#E8F0FE' }}>Comparativa de precios</h2>
          <div className="space-y-3">
            {products.map((p, i) => (
              <a key={p.asin} href={`https://www.amazon.es/dp/${p.asin}`} target="_blank" rel="nofollow sponsored"
                className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 no-underline group hover:border-[rgba(0,212,255,0.4)] hover:bg-[#111827]"
                style={{ background: '#0B1120', border: '1px solid #1E3A5F' }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                    <img src={p.image} alt="" className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${BADGE_COLORS[i]}20`, color: BADGE_COLORS[i] }}>#{i + 1}</span>
                      <div className="font-semibold text-sm truncate" style={{ color: '#E8F0FE' }}>{p.title}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-xl font-extrabold" style={{ color: '#FFB800' }}>{p.price}</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full" style={{ background: '#00D4FF', color: '#0B1120' }}>
                    Comprar <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Ad */}
      <div className="rounded-xl p-6 text-center" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <p className="text-sm" style={{ color: '#4A6080' }}>Publicidad</p>
      </div>
    </div>
  )
}
