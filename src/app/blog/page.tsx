import { getPosts } from '@/data/blog-queries'
import Link from 'next/link'
import { Calendar, Tag, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog de Pesca - Guías, Comparativas y Consejos | PesCatch',
  description: 'Comparativas de productos, guías de pesca y consejos para pescadores. Análisis detallados de carretes, cañas y señuelos con enlaces de compra.',
}

export default async function BlogPage() {
  const posts = await getPosts(20, 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold mb-3" style={{ color: '#E8F0FE' }}>
          Blog de Pesca
        </h1>
        <p className="text-lg" style={{ color: '#8BA3C7', maxWidth: '600px' }}>
          Guías, comparativas y consejos para ayudarte a elegir el mejor equipo de pesca.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20" style={{ color: '#4A6080' }}>
          <p className="text-lg">Próximamente nuevos artículos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <article
                className="rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: '#0B1120',
                  border: '1px solid #1E3A5F',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(0,212,255,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#1E3A5F'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {post.featuredImage && (
                  <div className="relative h-48 rounded-xl overflow-hidden mb-4" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                    <img src={post.featuredImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs mb-3" style={{ color: '#4A6080' }}>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.publishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {post.category && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}>
                      <Tag className="h-3 w-3" />
                      {post.category}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold mb-2 leading-snug" style={{ color: '#E8F0FE' }}>
                  {post.title}
                </h2>
                <p className="text-sm line-clamp-3 mb-4" style={{ color: '#8BA3C7', lineHeight: '1.6' }}>
                  {post.excerpt}
                </p>

                <div className="flex items-center gap-1 text-sm font-medium" style={{ color: '#00D4FF' }}>
                  Leer artículo
                  <ArrowRight className="h-4 w-4" />
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
