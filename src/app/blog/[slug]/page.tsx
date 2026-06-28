import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/data/blog-queries'
import { getDeals } from '@/data/queries'
import Link from 'next/link'
import { Calendar, Tag, ArrowRight, ExternalLink, Star } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

async function findDealByAsin(asin: string) {
  const deals = await getDeals()
  return deals.find(d => d.affiliateUrl.includes(asin)) || null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  return {
    title: `${post.title} | PesCatch Blog`,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const relatedProducts = await Promise.all(post.relatedAsins.map(async asin => {
    const deal = await findDealByAsin(asin)
    if (deal) return { ...deal, asin }
    return { asin, title: `Producto en Amazon (${asin})`, salePrice: 0, rating: 0, imageUrl: '', affiliateUrl: `https://www.amazon.es/dp/${asin}`, store: { name: 'Amazon' } }
  }))

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage || undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: 'PesCatch', url: 'https://pescatch.es' },
    about: relatedProducts.map(p => ({
      '@type': 'Product',
      name: p.title,
      offers: {
        '@type': 'Offer',
        price: p.salePrice || 0,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: p.affiliateUrl,
      }
    }))
  }

  const lineBreakBlock = '<div style="margin-top:1.75rem"></div>'

  const linkedContent = post.content
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#E8F0FE">$1</strong>')
    .replace(/\n\n/g, lineBreakBlock)
    .replace(/\n- /g, '\n' + '<span style="display:flex;align-items:flex-start;gap:0.5rem;margin-top:0.5rem"><span style="color:#00D4FF;flex-shrink:0;margin-top:0.15rem">▸</span><span>')
    .replace(/\n(?=\d+\. )/g, lineBreakBlock)
    .replace(/(\d+)\. /g, '<span style="display:flex;align-items:flex-start;gap:0.5rem;margin-top:0.5rem"><span style="color:#FFB800;flex-shrink:0;font-weight:700;min-width:1.5rem">$1.</span><span>')
    .replace(/\n/g, '</span></span>')

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8" style={{ color: '#4A6080' }}>
          <Link href="/" className="hover:text-[#00D4FF] transition-colors">Inicio</Link>
          <span style={{ color: '#1E3A5F' }}>/</span>
          <Link href="/blog" className="hover:text-[#00D4FF] transition-colors">Blog</Link>
          <span style={{ color: '#1E3A5F' }}>/</span>
          <span className="font-medium truncate" style={{ color: '#E8F0FE' }}>{post.title}</span>
        </nav>

        {/* Article Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3 text-xs mb-4" style={{ color: '#4A6080' }}>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.publishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {post.category && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}>
                <Tag className="h-3 w-3" />
                {post.category}
              </span>
            )}
            <span className="flex items-center gap-1">{post.author}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4" style={{ color: '#E8F0FE' }}>
            {post.title}
          </h1>
          <p className="text-lg" style={{ color: '#8BA3C7', lineHeight: '1.7' }}>
            {post.excerpt}
          </p>
        </div>

        {post.featuredImage && (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-10" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
            <img src={post.featuredImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}

        {/* Article Body */}
        <div className="prose" style={{ color: '#8BA3C7', fontSize: '1.075rem', lineHeight: '1.85' }}>
          {post.content.split('\n\n').map((paragraph, i) => {
            const trimmed = paragraph.trim()
            if (!trimmed) return null

            if (trimmed.startsWith('## ')) {
              return <h2 key={i} className="text-2xl font-bold mt-10 mb-4" style={{ color: '#E8F0FE' }} id={trimmed.replace('## ', '').toLowerCase().replace(/\s+/g, '-')}>{trimmed.replace('## ', '')}</h2>
            }
            if (trimmed.startsWith('### ')) {
              return <h3 key={i} className="text-xl font-bold mt-8 mb-3" style={{ color: '#E8F0FE' }}>{trimmed.replace('### ', '')}</h3>
            }
            if (trimmed.startsWith('- ')) {
              return (
                <div key={i} className="flex items-start gap-2 my-1" style={{ color: '#8BA3C7' }}>
                  <span className="flex-shrink-0 mt-1.5" style={{ color: '#00D4FF' }}>▸</span>
                  <span>{trimmed.replace('- ', '')}</span>
                </div>
              )
            }
            if (trimmed.startsWith('|')) {
              const rows = trimmed.split('\n').filter(r => r.trim())
              if (rows.length < 2) return <p key={i} style={{ color: '#8BA3C7' }}>{trimmed}</p>
              const headers = rows[0].split('|').filter(c => c.trim()).map(c => c.trim())
              const data = rows.slice(2).map(r => r.split('|').filter(c => c.trim()).map(c => c.trim()))
              return (
                <div key={i} className="overflow-x-auto my-6">
                  <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #1E3A5F' }}>
                        {headers.map((h, j) => (
                          <th key={j} className="px-4 py-3 text-left font-bold" style={{ color: '#E8F0FE' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, j) => (
                        <tr key={j} style={{ borderBottom: '1px solid #1E3A5F' }}>
                          {row.map((cell, k) => (
                            <td key={k} className={`px-4 py-2.5 ${k === 0 ? 'font-medium' : ''}`} style={k === 0 ? { color: '#E8F0FE' } : { color: '#8BA3C7' }}>
                              {cell.startsWith('✅') ? <span style={{ color: '#26DE81' }}>{cell}</span> : cell.startsWith('❌') ? <span style={{ color: '#FF4757' }}>{cell}</span> : cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }

            return <p key={i} className="mb-4" style={{ color: '#8BA3C7', lineHeight: '1.85' }}>{trimmed}</p>
          })}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 p-8 rounded-2xl" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: '#E8F0FE' }}>
              <ExternalLink className="h-5 w-5" style={{ color: '#00D4FF' }} />
              Productos mencionados en este artículo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedProducts.map(product => (
                <a
                  key={product.asin}
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="nofollow sponsored"
                  className="flex items-center gap-4 p-4 rounded-xl transition-all duration-300 no-underline"
                  style={{ background: '#0B1120', border: '1px solid #1E3A5F' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0,212,255,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1E3A5F'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {product.imageUrl && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                      <img src={product.imageUrl} alt={product.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs mb-1" style={{ color: '#4A6080' }}>{product.store?.name || 'Amazon'}</div>
                    <div className="font-semibold text-sm truncate" style={{ color: '#E8F0FE' }}>{product.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {product.salePrice > 0 && (
                        <span className="font-bold text-lg" style={{ color: '#FFB800' }}>{product.salePrice.toFixed(2).replace('.', ',')}€</span>
                      )}
                      {product.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs" style={{ color: '#4A6080' }}>
                          <Star className="h-3 w-3" style={{ color: '#FFB800', fill: '#FFB800' }} />
                          {product.rating}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 flex-shrink-0" style={{ color: '#00D4FF' }} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Google AdSense Slot */}
        <div className="mt-12 text-center">
          <div className="p-6 rounded-xl" style={{ background: '#111827', border: '1px solid #1E3A5F', minHeight: '120px' }}>
            <p className="text-sm" style={{ color: '#4A6080' }}>Publicidad</p>
            {/* <!-- Replace with AdSense code after approval --> */}
          </div>
        </div>
      </div>
    </>
  )
}
