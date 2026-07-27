import { getPosts, getPostsCount } from '@/data/blog-queries'
import type { BlogPost } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Clock, Fish } from 'lucide-react'
import type { Metadata } from 'next'
import { generateBreadcrumbSchema, generateCollectionPageSchema, buildMetadata, BASE_URL, JsonLd } from '@/lib/seo/schemas'

// Blog: revalidar cada 10 minutos (contenido menos volátil que los deals)
export const revalidate = 600

const POSTS_PER_PAGE = 12

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(
    {
      title: 'Blog de Pesca - Guías, Comparativas y Consejos | PesCatch',
      description: 'Comparativas de productos, guías de pesca y consejos para pescadores. Análisis honestos escritos por pescadores para ayudarte a elegir el mejor equipo.',
      openGraph: {
        title: 'Blog de Pesca | PesCatch',
        description: 'Comparativas de productos, guías de pesca y consejos para pescadores.',
        type: 'website',
        url: `${BASE_URL}/blog`,
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Blog de Pesca | PesCatch',
        description: 'Comparativas de productos y guías de pesca.',
      },
    },
    `${BASE_URL}/blog`,
  )
}

function readingTime(content: string): string {
  const words = content.split(/\s+/).length
  const minutes = Math.max(1, Math.round(words / 200))
  return `${minutes} min lectura`
}

function extractProductCount(content: string): number {
  const match = content.match(/<!--\s*PRODUCTS_DATA:\s*(\[.*?\])\s*-->/)
  if (!match) return 0
  try { return JSON.parse(match[1]).length } catch { return 0 }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const offset = (currentPage - 1) * POSTS_PER_PAGE

  let posts: BlogPost[] = []
  let totalPosts = 0
  try {
    ;[posts, totalPosts] = await Promise.all([
      getPosts(POSTS_PER_PAGE, offset),
      getPostsCount(),
    ])
  } catch (e) {
    console.error('Blog page error:', e)
  }

  const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE))

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Blog', url: '/blog' },
  ])

  const collectionSchema = generateCollectionPageSchema({
    title: 'Blog de Pesca',
    description: 'Comparativas de productos, guías de pesca y consejos para pescadores.',
    url: `${BASE_URL}/blog`,
    itemCount: posts.length,
    items: posts.map(p => ({ name: p.title, url: `${BASE_URL}/blog/${p.slug}` })),
  })

  return (
    <>
      <JsonLd data={[collectionSchema, breadcrumbs]} />
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-10 rounded-full" style={{ background: 'linear-gradient(180deg, #00D4FF, #FFB800)' }} />
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
              <BookOpen className="h-3 w-3" />
              Blog
            </div>
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#E8F0FE' }}>Blog de Pesca</h1>
        <p className="mt-2 text-lg max-w-xl" style={{ color: '#8BA3C7' }}>Guías, comparativas y consejos para ayudarte a elegir el mejor equipo de pesca.</p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <Fish className="h-12 w-12 mx-auto mb-4 opacity-50" style={{ color: '#4A6080' }} />
          <p className="text-lg" style={{ color: '#8BA3C7' }}>Próximamente nuevos artículos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map(post => {
            const pCount = extractProductCount(post.content)
            return (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(0,212,255,0.15)] no-underline"
                style={{
                  border: '1px solid #1E3A5F',
                  height: '380px',
                }}>
                {post.featuredImage ? (
                  <>
                    <Image src={post.featuredImage} alt="" fill sizes="50vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0" style={{
                      background: 'linear-gradient(180deg, rgba(11,18,32,0.05) 0%, rgba(11,18,32,0.25) 25%, rgba(11,18,32,0.85) 60%, #0B1120 100%)',
                    }} />
                  </>
                ) : (
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0F1F38, #1B2A4A)' }}>
                    <Fish className="absolute -bottom-10 -right-10 h-56 w-56 opacity-[0.04]" style={{ color: '#00D4FF' }} />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    {post.category && (
                      <span className="px-2.5 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider"
                        style={{ background: 'rgba(0,212,255,0.15)', backdropFilter: 'blur(8px)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }}>
                        {post.category}
                      </span>
                    )}
                    {pCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[0.6rem] font-bold"
                        style={{ background: 'rgba(255,184,0,0.12)', backdropFilter: 'blur(8px)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.2)' }}>
                        {pCount} productos
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold mb-1.5 line-clamp-2 group-hover:text-[#00D4FF] transition-colors" style={{ color: '#E8F0FE' }}>{post.title}</h2>
                  <p className="text-sm leading-relaxed line-clamp-2 mb-3" style={{ color: '#A0B8D8' }}>{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#4A6080' }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.publishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span style={{ color: '#1E3A5F' }}>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {readingTime(post.content)}
                      </span>
                    </div>
                    <span className="text-xs font-semibold flex items-center gap-1.5 group-hover:gap-2.5 transition-all" style={{ color: '#00D4FF' }}>
                      <BookOpen className="h-3.5 w-3.5" />
                      Leer <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/blog?page=${currentPage - 1}`}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_12px_rgba(0,212,255,0.15)]"
              style={{ background: '#111827', border: '1px solid #1E3A5F', color: '#00D4FF' }}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Link>
          )}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1" style={{ color: '#4A6080' }}>...</span>
                  )}
                  {p === currentPage ? (
                    <span className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold"
                      style={{ background: 'rgba(0,212,255,0.15)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)' }}>
                      {p}
                    </span>
                  ) : (
                    <Link href={`/blog?page=${p}`}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[#1E3A5F]"
                      style={{ color: '#8BA3C7' }}>
                      {p}
                    </Link>
                  )}
                </span>
              ))}
          </div>
          {currentPage < totalPages && (
            <Link
              href={`/blog?page=${currentPage + 1}`}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_12px_rgba(0,212,255,0.15)]"
              style={{ background: '#111827', border: '1px solid #1E3A5F', color: '#00D4FF' }}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
    </>
  )
}
