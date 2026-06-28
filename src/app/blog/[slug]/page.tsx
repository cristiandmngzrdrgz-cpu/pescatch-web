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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const productImages = [
    'https://m.media-amazon.com/images/I/41V-9WQRBCL._AC_SX679_.jpg',
    'https://m.media-amazon.com/images/I/61+Evme+0DL._AC_SX679_.jpg',
  ]

  const content = post.content

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <nav className="flex items-center gap-2 text-sm mb-8" style={{ color: '#4A6080' }}>
        <Link href="/" className="hover:text-[#00D4FF] transition-colors">Inicio</Link>
        <span style={{ color: '#1E3A5F' }}>/</span>
        <Link href="/blog" className="hover:text-[#00D4FF] transition-colors">Blog</Link>
        <span style={{ color: '#1E3A5F' }}>/</span>
        <span className="truncate max-w-[200px]" style={{ color: '#E8F0FE' }}>{post.title}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4" style={{ color: '#E8F0FE' }}>{post.title}</h1>
      <p className="text-lg mb-8" style={{ color: '#8BA3C7', lineHeight: '1.7' }}>{post.excerpt}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {[0, 1].map(idx => (
          <div key={idx} className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
            <div className="h-48 rounded-xl mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.03))' }}>
              <img src={productImages[idx]} alt="" className="max-h-full max-w-full object-contain p-4" />
            </div>
          </div>
        ))}
      </div>

      <div style={{ color: '#8BA3C7', fontSize: '1.075rem', lineHeight: '1.85', whiteSpace: 'pre-wrap' }}>{content}</div>
    </div>
  )
}
