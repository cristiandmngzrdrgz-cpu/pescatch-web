import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/data/blog-queries'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

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
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#E8F0FE">$1</strong>')
    .replace(/^---$/gm, '<hr style="border-color:#1E3A5F;margin:2rem 0">')
    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed" style="line-height:1.85;color:#8BA3C7">')
  return '<p class="mb-4 leading-relaxed" style="line-height:1.85;color:#8BA3C7">' + html + '</p>'
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1" style={{ color: '#8BA3C7' }}>
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1A2535' }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: 'linear-gradient(90deg, #00D4FF, #FFB800)' }} />
      </div>
    </div>
  )
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const asins = ['B07XWJDZMM', 'B0CH15QHMD']
  const prices = ['189,99€', '56,30€']
  const ratings = [4.7, 4.5]
  const images = [
    'https://m.media-amazon.com/images/I/41V-9WQRBCL._AC_SX679_.jpg',
    'https://m.media-amazon.com/images/I/61+Evme+0DL._AC_SX679_.jpg',
  ]
  const titles = ['Shimano Stradic FL', 'Daiwa Ninja LT']

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

      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {[0, 1].map(i => (
          <a key={asins[i]} href={`https://www.amazon.es/dp/${asins[i]}`} target="_blank" rel="nofollow sponsored"
            className="group rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 no-underline hover:border-[rgba(0,212,255,0.5)] hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]"
            style={{ background: 'linear-gradient(135deg, #111827, #0B1120)', border: '1px solid #1E3A5F', transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)' }}>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ background: i === 0 ? 'rgba(0,212,255,0.15)' : 'rgba(255,184,0,0.15)', color: i === 0 ? '#00D4FF' : '#FFB800', border: `1px solid ${i === 0 ? 'rgba(0,212,255,0.3)' : 'rgba(255,184,0,0.3)'}` }}>
                  {i === 0 ? 'Nuestra elección' : 'Alternativa'}
                </span>
              </div>
              <div className="h-52 rounded-xl overflow-hidden mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.03))' }}>
                <img src={images[i]} alt={titles[i]} className="max-h-full max-w-full object-contain p-4 group-hover:scale-105 transition-transform duration-700" />
              </div>
              <h3 className="font-bold mb-1" style={{ color: '#E8F0FE', fontSize: '1.05rem' }}>{titles[i]}</h3>
              <span className="text-3xl font-extrabold" style={{ color: '#FFB800' }}>{prices[i]}</span>
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map(s => <svg key={s} className="w-4 h-4" viewBox="0 0 24 24" fill={s <= Math.round(ratings[i]) ? '#FFB800' : '#1E3A5F'}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                <span className="text-xs ml-1" style={{ color: '#8BA3C7' }}>{ratings[i]}</span>
              </div>
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #1E3A5F' }}>
                <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#00D4FF' }}>
                  Ver oferta
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Article */}
      <div className="text-base leading-relaxed mb-10" style={{ color: '#8BA3C7' }}>
        <div dangerouslySetInnerHTML={{ __html: mdToHtml(post.content) }} />
      </div>

      {/* Scores */}
      <div className="rounded-2xl p-6 md:p-8 mb-10" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <h2 className="text-xl font-bold mb-6" style={{ color: '#E8F0FE' }}>Puntuaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[0, 1].map(i => <div key={i}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                <img src={images[i]} alt="" className="w-full h-full object-contain p-1" />
              </div>
              <div><div className="font-semibold text-sm" style={{ color: '#E8F0FE' }}>{titles[i]}</div><div className="font-bold" style={{ color: '#FFB800' }}>{prices[i]}</div></div>
            </div>
            <ScoreBar label="Construcción" value={i === 0 ? 95 : 75} />
            <ScoreBar label="Suavidad" value={i === 0 ? 95 : 70} />
            <ScoreBar label="Durabilidad" value={i === 0 ? 90 : 65} />
            <ScoreBar label="Calidad/Precio" value={i === 0 ? 70 : 95} />
            <ScoreBar label="Resistencia salada" value={i === 0 ? 90 : 55} />
          </div>)}
        </div>
      </div>

      {/* CTAs */}
      <div className="rounded-2xl p-6 md:p-8 mb-10" style={{ background: 'linear-gradient(135deg, #111827, #0B1120)', border: '1px solid #1E3A5F' }}>
        <h2 className="text-xl font-bold mb-6" style={{ color: '#E8F0FE' }}>Comparativa de precios</h2>
        <div className="space-y-3">
          {[0, 1].map(i => (
            <a key={i} href={`https://www.amazon.es/dp/${asins[i]}`} target="_blank" rel="nofollow sponsored"
              className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 no-underline group hover:border-[rgba(0,212,255,0.4)] hover:bg-[#111827]"
              style={{ background: '#0B1120', border: '1px solid #1E3A5F' }}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                  <img src={images[i]} alt="" className="w-full h-full object-contain p-1" />
                </div>
                <div className="min-w-0"><div className="font-semibold text-sm truncate" style={{ color: '#E8F0FE' }}>{titles[i]}</div></div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-xl font-extrabold" style={{ color: '#FFB800' }}>{prices[i]}</span>
                <span className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full" style={{ background: '#00D4FF', color: '#0B1120' }}>
                  Comprar <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Ad */}
      <div className="rounded-xl p-6 text-center" style={{ background: '#111827', border: '1px solid #1E3A5F' }}><p className="text-sm" style={{ color: '#4A6080' }}>Publicidad</p></div>
    </div>
  )
}
