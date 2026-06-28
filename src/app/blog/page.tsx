import { getPosts } from '@/data/blog-queries'
import Link from 'next/link'
import { Calendar, Tag, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog de Pesca - Guías, Comparativas y Consejos | PesCatch',
  description: 'Comparativas de productos, guías de pesca y consejos para pescadores.',
}

export default async function BlogPage() {
  let posts = []
  try {
    posts = await getPosts(20, 0)
  } catch (e) {
    console.error('Blog page error:', e)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-4xl font-extrabold mb-3" style={{ color: '#E8F0FE' }}>Blog de Pesca</h1>
      <p className="text-lg mb-10" style={{ color: '#8BA3C7' }}>Guías, comparativas y consejos para ayudarte a elegir el mejor equipo de pesca.</p>

      {posts.length === 0 ? (
        <p style={{ color: '#4A6080' }}>Próximamente nuevos artículos.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <article className="rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-1"
                style={{ background: '#0B1120', border: '1px solid #1E3A5F' }}>
                <div className="flex items-center gap-3 text-xs mb-3" style={{ color: '#4A6080' }}>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.publishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {post.category && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}>
                      <Tag className="h-3 w-3 inline mr-1" />{post.category}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: '#E8F0FE' }}>{post.title}</h2>
                <p className="text-sm line-clamp-3 mb-4" style={{ color: '#8BA3C7' }}>{post.excerpt}</p>
                <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#00D4FF' }}>
                  Leer artículo <ArrowRight className="h-4 w-4" />
                </span>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
