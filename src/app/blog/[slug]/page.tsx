import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/data/blog-queries'
import { getDeals } from '@/data/queries'
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

async function findDealByAsin(asin: string) {
  try {
    const deals = await getDeals()
    return deals.find(d => d.affiliateUrl.includes(asin)) || null
  } catch { return null }
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  const pct = Math.min(Math.max(value, 0), 100)
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1" style={{ color: '#8BA3C7' }}>
        <span>{label}</span>
        <span>{pct}/100</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1A2535' }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #00D4FF, #FFB800)' }} />
      </div>
    </div>
  )
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const relatedProducts = await Promise.all(post.relatedAsins.map(async asin => {
    const deal = await findDealByAsin(asin)
    if (deal) return { ...deal, asin }
    return { asin, title: `Ver en Amazon`, salePrice: 0, rating: 0, reviewCount: 0, imageUrl: '', affiliateUrl: `https://www.amazon.es/dp/${asin}`, store: { name: 'Amazon' } }
  }))

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: 'PesCatch' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8" style={{ color: '#4A6080' }}>
          <Link href="/" className="hover:text-[#00D4FF] transition-colors">Inicio</Link>
          <span style={{ color: '#1E3A5F' }}>/</span>
          <Link href="/blog" className="hover:text-[#00D4FF] transition-colors">Blog</Link>
          <span style={{ color: '#1E3A5F' }}>/</span>
          <span className="truncate max-w-[200px]" style={{ color: '#E8F0FE' }}>{post.title}</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4" style={{ color: '#E8F0FE' }}>
          {post.title}
        </h1>
        <p className="text-lg mb-8" style={{ color: '#8BA3C7', lineHeight: '1.7' }}>{post.excerpt}</p>

        {/* Hero: Side by side product cards */}
        {relatedProducts.length >= 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {relatedProducts.slice(0, 2).map((product, idx) => (
              <a key={product.asin} href={product.affiliateUrl} target="_blank" rel="nofollow sponsored"
                className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 no-underline"
                style={{ background: 'linear-gradient(135deg, #111827, #0B1120)', border: '1px solid #1E3A5F' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(0,212,255,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E3A5F'; e.currentTarget.style.boxShadow = 'none' }}>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: idx === 0 ? 'rgba(0,212,255,0.15)' : 'rgba(255,184,0,0.15)', color: idx === 0 ? '#00D4FF' : '#FFB800', border: `1px solid ${idx === 0 ? 'rgba(0,212,255,0.3)' : 'rgba(255,184,0,0.3)'}` }}>
                      {idx === 0 ? '⭐ Nuestra elección' : '🥈 Alternativa'}
                    </span>
                    <span className="text-xs" style={{ color: '#4A6080' }}>{product.store?.name || 'Amazon'}</span>
                  </div>

                  {product.imageUrl && (
                    <div className="relative h-48 md:h-56 rounded-xl overflow-hidden mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.03))' }}>
                      <img src={product.imageUrl} alt={product.title} className="max-h-full max-w-full object-contain p-4 group-hover:scale-105 transition-transform duration-700" loading={idx === 0 ? 'eager' : 'lazy'} />
                    </div>
                  )}

                  <h3 className="text-lg font-bold mb-2" style={{ color: '#E8F0FE' }}>{product.title}</h3>

                  {product.salePrice > 0 && (
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-extrabold" style={{ color: '#FFB800', textShadow: '0 0 10px rgba(255,184,0,0.1)' }}>
                        {(product.salePrice || 0).toFixed(2).replace('.', ',')}€
                      </span>
                    </div>
                  )}

                  {(product.rating ?? 0) > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg key={star} className="w-4 h-4" viewBox="0 0 24 24" fill={star <= Math.round(product.rating || 0) ? '#FFB800' : '#1E3A5F'}>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm" style={{ color: '#8BA3C7' }}>{product.rating} · {product.reviewCount ?? 0} valoraciones</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 mt-4 pt-4" style={{ borderTop: '1px solid #1E3A5F' }}>
                    <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#00D4FF' }}>
                      Ver oferta
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                    {idx === 0 && (
                      <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)' }}>
                        RECOMENDADO
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Quick Verdict Bar */}
        <div className="rounded-2xl p-6 mb-10" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#E8F0FE' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Veredicto rápido
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg" role="img" aria-label="check">🏆</span>
                <span className="font-bold" style={{ color: '#00D4FF' }}>Compra {relatedProducts[0]?.title?.split('-')[0] || 'el primero'} si...</span>
              </div>
              <ul className="space-y-1 text-sm" style={{ color: '#8BA3C7' }}>
                <li className="flex items-start gap-2">• Pescas más de 30 jornadas al año</li>
                <li className="flex items-start gap-2">• Valoras la suavidad y durabilidad extrema</li>
                <li className="flex items-start gap-2">• Pesca en agua salada frecuentemente</li>
                <li className="flex items-start gap-2">• Presupuesto no es limitación</li>
              </ul>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.15)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg" role="img" aria-label="star">💰</span>
                <span className="font-bold" style={{ color: '#FFB800' }}>Compra {relatedProducts[1]?.title?.split('-')[0] || 'el segundo'} si...</span>
              </div>
              <ul className="space-y-1 text-sm" style={{ color: '#8BA3C7' }}>
                <li className="flex items-start gap-2">• Pescas findes o vacaciones</li>
                <li className="flex items-start gap-2">• Empiezas en el spinning</li>
                <li className="flex items-start gap-2">• Necesitas un segundo carrete</li>
                <li className="flex items-start gap-2">• Buscas la mejor relación calidad-precio</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="text-base leading-relaxed space-y-5 mb-10" style={{ color: '#8BA3C7' }}>
          {post.content.split('\n\n').map((p, i) => {
            const trimmed = p.trim()
            if (!trimmed) return null
            if (trimmed.startsWith('## ')) {
              return (
                <div key={i} className="mt-10 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #00D4FF, #FFB800)' }} />
                    <h2 className="text-2xl font-bold" style={{ color: '#E8F0FE' }}>{trimmed.replace('## ', '')}</h2>
                  </div>
                </div>
              )
            }
            if (trimmed.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-8 mb-3" style={{ color: '#E8F0FE' }}>{trimmed.replace('### ', '')}</h3>
            if (trimmed.startsWith('- ') && !trimmed.startsWith('- **')) {
              return <div key={i} className="flex items-start gap-3 pl-2 my-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00D4FF' }} /><span className="flex-1" style={{ color: '#8BA3C7' }}>{trimmed.replace('- ', '')}</span></div>
            }
            if (trimmed.startsWith('|')) {
              const rows = trimmed.split('\n').filter(r => r.trim() && !r.includes('---'))
              if (rows.length < 2) return <p key={i}>{trimmed}</p>
              const headers = rows[0].split('|').filter(c => c.trim()).map(c => c.trim())
              const dataRows = rows.slice(1).map(r => r.split('|').filter(c => c.trim()).map(c => c.trim()))
              return (
                <div key={i} className="overflow-hidden rounded-xl my-6" style={{ border: '1px solid #1E3A5F' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: '#111827' }}>
                        {headers.map((h, j) => (
                          <th key={j} className={`px-4 py-3 text-left font-bold ${j === 0 ? '' : 'text-center'}`} style={{ color: '#E8F0FE', borderBottom: '2px solid #1E3A5F' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataRows.map((row, j) => (
                        <tr key={j} style={{ borderBottom: '1px solid #1E3A5F', background: j % 2 === 0 ? 'transparent' : 'rgba(17,24,39,0.3)' }}>
                          {row.map((cell, k) => {
                            const isWinner = cell.includes('✅')
                            const isLoser = cell.includes('❌')
                            const displayCell = cell.replace('✅ ', '').replace('❌ ', '')
                            return (
                              <td key={k} className={`px-4 py-2.5 ${k === 0 ? 'font-medium' : 'text-center'}`} style={{ color: isWinner ? '#26DE81' : isLoser ? '#FF4757' : k === 0 ? '#E8F0FE' : '#8BA3C7' }}>
                                {k > 0 && isWinner ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20"><svg className="w-4 h-4" fill="#26DE81" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span> : null}
                                {k > 0 && isLoser ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20"><svg className="w-4 h-4" fill="#FF4757" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></span> : null}
                                {k === 0 ? displayCell : (!isWinner && !isLoser) ? displayCell : null}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
            return <p key={i} className="leading-relaxed" style={{ lineHeight: '1.8' }}>{trimmed}</p>
          })}
        </div>

        {/* Comparison Table with Scores */}
        {relatedProducts.length >= 2 && (
          <div className="rounded-2xl p-6 md:p-8 mb-10" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: '#E8F0FE' }}>Puntuaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedProducts.slice(0, 2).map((product, idx) => (
                <div key={product.asin}>
                  <div className="flex items-center gap-3 mb-4">
                    {product.imageUrl && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                        <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-sm" style={{ color: '#E8F0FE' }}>{product.title?.substring(0, 40)}</div>
                      {product.salePrice > 0 && <div className="font-bold" style={{ color: '#FFB800' }}>{(product.salePrice || 0).toFixed(2).replace('.', ',')}€</div>}
                    </div>
                  </div>
                  <ScoreBar label="Construcción" value={idx === 0 ? 95 : 75} />
                  <ScoreBar label="Suavidad" value={idx === 0 ? 95 : 70} />
                  <ScoreBar label="Durabilidad" value={idx === 0 ? 90 : 65} />
                  <ScoreBar label="Calidad/Precio" value={idx === 0 ? 70 : 95} />
                  <ScoreBar label="Agua Salada" value={idx === 0 ? 90 : 55} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Cards with Buy Buttons */}
        {relatedProducts.length > 0 && (
          <div className="rounded-2xl p-6 md:p-8 mb-10" style={{ background: 'linear-gradient(135deg, #111827, #0B1120)', border: '1px solid #1E3A5F' }}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: '#E8F0FE' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              Comparativa de precios
            </h2>
            <div className="space-y-3">
              {relatedProducts.map(product => (
                <a key={product.asin} href={product.affiliateUrl} target="_blank" rel="nofollow sponsored"
                  className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 no-underline group"
                  style={{ background: '#0B1120', border: '1px solid #1E3A5F' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'; e.currentTarget.style.background = '#111827' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E3A5F'; e.currentTarget.style.background = '#0B1120' }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {product.imageUrl && (
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                        <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" loading="lazy" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate" style={{ color: '#E8F0FE' }}>{product.title}</div>
                      <div className="text-xs" style={{ color: '#4A6080' }}>{product.store?.name || 'Amazon'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {product.salePrice > 0 && (
                      <span className="text-xl font-extrabold" style={{ color: '#FFB800' }}>{(product.salePrice || 0).toFixed(2).replace('.', ',')}€</span>
                    )}
                    <span className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 group-hover:shadow-lg" style={{ background: '#00D4FF', color: '#0B1120' }}>
                      Comprar
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* AdSense Slot */}
        <div className="rounded-xl p-6 text-center" style={{ background: '#111827', border: '1px solid #1E3A5F', minHeight: '100px' }}>
          <p className="text-sm" style={{ color: '#4A6080' }}>Publicidad</p>
        </div>
      </div>
    </>
  )
}
