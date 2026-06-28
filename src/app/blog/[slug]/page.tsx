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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const relatedProducts = await Promise.all(post.relatedAsins.map(async asin => {
    const deal = await findDealByAsin(asin)
    if (deal) return { id: deal.id, title: deal.title, price: deal.salePrice, imageUrl: deal.imageUrl, affiliateUrl: deal.affiliateUrl, storeName: deal.store.name }
    return { id: asin, title: `Ver en Amazon`, price: 0, imageUrl: '', affiliateUrl: `https://www.amazon.es/dp/${asin}`, storeName: 'Amazon' }
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
      <div className="mx-auto max-w-4xl px-4 py-12">
        <nav className="flex items-center gap-2 text-sm mb-8" style={{ color: '#4A6080' }}>
          <Link href="/" className="hover:text-[#00D4FF]">Inicio</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#00D4FF]">Blog</Link>
          <span>/</span>
          <span style={{ color: '#E8F0FE' }}>{post.title}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#E8F0FE' }}>{post.title}</h1>
        <p className="text-lg mb-10" style={{ color: '#8BA3C7' }}>{post.excerpt}</p>

        <div className="text-lg leading-relaxed space-y-4" style={{ color: '#8BA3C7' }}>
          {post.content.split('\n\n').map((p, i) => {
            const trimmed = p.trim()
            if (!trimmed) return null
            if (trimmed.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-8 mb-4" style={{ color: '#E8F0FE' }}>{trimmed.replace('## ', '')}</h2>
            if (trimmed.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-6 mb-3" style={{ color: '#E8F0FE' }}>{trimmed.replace('### ', '')}</h3>
            if (trimmed.startsWith('- ')) return <div key={i} className="flex items-start gap-2" style={{ color: '#8BA3C7' }}><span style={{ color: '#00D4FF' }}>▸</span>{trimmed.replace('- ', '')}</div>
            if (trimmed.startsWith('|') && trimmed.includes('---')) return null
            if (trimmed.startsWith('|')) {
              const cells = trimmed.split('|').filter(c => c.trim()).map(c => c.trim())
              return <div key={i} className="flex flex-wrap gap-4 text-sm" style={{ color: '#8BA3C7' }}>{cells.map((c, j) => <span key={j} style={c.includes('✅') ? { color: '#26DE81' } : c.includes('❌') ? { color: '#FF4757' } : {}}>{c}</span>)}</div>
            }
            return <p key={i} className="mb-3">{trimmed}</p>
          })}
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-12 p-6 rounded-2xl" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#E8F0FE' }}>Productos mencionados</h3>
            {relatedProducts.map(p => (
              <a key={p.id} href={p.affiliateUrl} target="_blank" rel="nofollow sponsored"
                className="flex items-center gap-3 p-3 rounded-xl mb-2 no-underline transition-all hover:scale-[1.01]"
                style={{ background: '#0B1120', border: '1px solid #1E3A5F' }}>
                <span className="flex-1 font-medium text-sm" style={{ color: '#E8F0FE' }}>{p.title}</span>
                {p.price > 0 && <span className="font-bold" style={{ color: '#FFB800' }}>{p.price.toFixed(2).replace('.', ',')}€</span>}
                <span style={{ color: '#00D4FF' }}>Ver en {p.storeName} →</span>
              </a>
            ))}
          </div>
        )}

        <div className="mt-12 p-6 rounded-xl text-center" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <p className="text-sm" style={{ color: '#4A6080' }}>Publicidad</p>
        </div>
      </div>
    </>
  )
}
