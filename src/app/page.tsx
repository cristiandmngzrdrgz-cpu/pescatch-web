import { getFeaturedDeals, getDealCountsByCategory, getClickStats, getDealsPaginated } from '@/data/queries'
import { getPosts } from '@/data/blog-queries'
import { ProductCard } from '@/components/deals/product-card'
import { AdBanner } from '@/components/ads/AdBanner'
import { groupDealsByProduct } from '@/lib/group-deals'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import { Fish, ArrowRight, Clock, Zap, Star, Shield, BadgeCheck, Users, BookOpen, ChevronRight, Anchor, Wind, Target, Backpack, Shirt, Ship, Tag, ShoppingCart, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { CATEGORIES } from '@/types'
import type { BlogPost } from '@/types'
import type { Metadata } from 'next'
import { buildMetadata, BASE_URL, generateCollectionPageSchema, JsonLd } from '@/lib/seo/schemas'

// Revalidar cada 5 minutos — equilibrio entre frescura y rendimiento/SEO
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(
    {
      title: 'PesCatch - Chollos de Material de Pesca',
      description: 'Los mejores chollos y ofertas de material de pesca en España. Carretes, cañas, señuelos y accesorios al mejor precio en Amazon y AliExpress. Guías y comparativas escritas por pescadores.',
      openGraph: {
        title: 'PesCatch - Chollos de Material de Pesca',
        description: 'Los mejores chollos y ofertas de material de pesca en España. Ahorra hasta un 50%.',
        type: 'website',
        url: BASE_URL,
      },
    },
    BASE_URL,
  )
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  carretes: Anchor,
  canas: Wind,
  senuelos: Target,
  accesorios: Backpack,
  ropa: Shirt,
  nautica: Ship,
}

export default async function HomePage() {
  const [featured, latestResult, topDiscountsResult, posts, clickStats] = await Promise.all([
    getFeaturedDeals(),
    getDealsPaginated({ sortBy: 'newest' }, 1, 20),
    getDealsPaginated({ sortBy: 'discount' }, 1, 5),
    getPosts(4),
    getClickStats(),
  ])
  const latest = latestResult.items
  const topDiscounts = topDiscountsResult.items
  const totalDeals = latestResult.total
  const categoryDealCounts = new Map(Object.entries(await getDealCountsByCategory()))

  const totalSavings = latest.reduce((sum, d) => sum + Math.max(0, d.originalPrice - d.salePrice), 0)

  const groupedFeatured = groupDealsByProduct(featured)
  const groupedLatest = groupDealsByProduct(latest).sort((a, b) => {
    const aDate = Math.max(...a.deals.map(d => new Date(d.publishedAt).getTime()))
    const bDate = Math.max(...b.deals.map(d => new Date(d.publishedAt).getTime()))
    return bDate - aDate
  })
  const groupedTopDiscounts = groupDealsByProduct(topDiscounts)

  const itemListSchema = generateCollectionPageSchema({
    title: 'Chollos de material de pesca - PesCatch',
    description: 'Los mejores chollos y ofertas de material de pesca destacados en PesCatch',
    url: BASE_URL,
    itemCount: Math.min(featured.length, 20),
    items: featured.slice(0, 20).map(d => ({
      name: d.title,
      url: `${BASE_URL}/deals/${d.slug}`,
    })),
  })

  return (
    <>
      <JsonLd data={[itemListSchema]} />
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden min-h-[85vh] lg:min-h-[90vh] flex items-center">
          <div className="absolute inset-0" style={{ background: '#0B1A30' }}>
            <Image
              src="/images/hero-bg.jpg"
              alt="Pesca deportiva"
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: 'center 45%' }}
            />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(90deg, rgba(11,26,48,0.92) 0%, rgba(11,26,48,0.7) 40%, rgba(11,26,48,0.3) 70%, transparent 100%)',
          }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 lg:py-32 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="max-w-xl">
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="inline-flex items-center gap-2 text-sm rounded-full px-4 py-1.5"
                  style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}>
                  <BookOpen className="h-4 w-4" />
                  <span className="font-semibold">Guías y análisis</span>
                </div>
                <div className="inline-flex items-center gap-2 text-sm rounded-full px-4 py-1.5"
                  style={{ background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.3)', color: '#FFB800' }}>
                  <BadgeCheck className="h-4 w-4" />
                  <span className="font-semibold">+{totalDeals} ofertas</span>
            </div>
          </div>

              <h1 className="text-[2.5rem] sm:text-[3.5rem] lg:text-[4rem] font-extrabold leading-[1.05] tracking-tight mb-5"
                style={{ color: '#E8F0FE', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
                <span style={{
                  background: 'linear-gradient(135deg, #00D4FF, #5EEAD4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Guías de Pesca
                </span>
                <br />y los Mejores Chollos
              </h1>

              <p className="text-lg sm:text-xl leading-relaxed mb-8 max-w-lg" style={{ color: '#A0B8D8' }}>
                Analizamos y comparamos el material de pesca para que aciertes en cada compra. <strong style={{ color: '#E8F0FE' }}>Guías honestas, chollos verificados</strong> en Amazon y AliExpress.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/blog"
                  className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-full text-lg transition-all duration-300 hover:scale-105 active:scale-95 group"
                  style={{
                    background: 'linear-gradient(135deg, #00D4FF, #0099CC)',
                    color: '#0B1120',
                    boxShadow: '0 4px 25px rgba(0,212,255,0.5), 0 0 60px rgba(0,212,255,0.15)',
                  }}>
                  <BookOpen className="h-5 w-5" />
                  Ver Guías
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                </Link>
                <Link href="/search"
                  className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-full text-lg transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#A0B8D8',
                    backdropFilter: 'blur(4px)',
                  }}>
                  <Zap className="h-5 w-5" />
                  Ver Chollos
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-5">
                {[
                  { icon: BookOpen, text: 'Guías de compra', sub: 'Comparativas y análisis detallados' },
                  { icon: Shield, text: 'Multi-tienda', sub: 'Amazon · AliExpress' },
                  { icon: Users, text: `${totalDeals} ofertas`, sub: `Más de ${totalSavings.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} ahorrados` },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(0,212,255,0.1)' }}>
                      <item.icon className="h-5 w-5" style={{ color: '#00D4FF' }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: '#E8F0FE' }}>{item.text}</div>
                      <div className="text-xs" style={{ color: '#4A6080' }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Image */}
            <div className="hidden lg:block relative h-full min-h-[500px] rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 0 40px rgba(0,212,255,0.1), 0 20px 60px rgba(0,0,0,0.4)' }}>
              <Image
                src="/images/hero-bg.jpg"
                alt="Pesca deportiva"
                fill
                sizes="50vw"
                className="object-cover"
                style={{ objectPosition: 'center 30%' }}
              />
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.08), transparent 50%)',
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar — datos reales de click_tracking */}
      <section className="py-4" style={{ background: '#0B1A30', borderBottom: '1px solid #1E3A5F' }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm">
            {clickStats && (
              <>
                <div className="flex items-center gap-2" style={{ color: '#8BA3C7' }}>
                  <ShoppingCart className="h-4 w-4" style={{ color: '#00D4FF' }} />
                  <span className="font-semibold" style={{ color: '#E8F0FE' }}>{clickStats.purchasesThisWeek}</span>
                  <span>clics esta semana</span>
                </div>
                <div className="w-px h-6" style={{ background: '#1E3A5F' }} />
                {clickStats.hoursSinceLastPurchase !== null && (
                  <>
                    <div className="flex items-center gap-2" style={{ color: '#8BA3C7' }}>
                      <Clock className="h-4 w-4" style={{ color: '#FFB800' }} />
                      <span>Último clic: hace <span className="font-semibold" style={{ color: '#E8F0FE' }}>{clickStats.hoursSinceLastPurchase}h</span></span>
                    </div>
                    <div className="w-px h-6" style={{ background: '#1E3A5F' }} />
                  </>
                )}
              </>
            )}
            <div className="flex items-center gap-2" style={{ color: '#8BA3C7' }}>
              <TrendingUp className="h-4 w-4" style={{ color: '#26DE81' }} />
              <span>{totalSavings.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} ahorrados en total</span>
            </div>
            {clickStats ? (
              <p className="text-[0.7rem] ml-auto" style={{ color: '#4A6080' }}>Basado en clics de afiliados verificados</p>
            ) : (
              <p className="text-[0.7rem] ml-auto" style={{ color: '#4A6080' }}>{totalDeals} chollos verificados</p>
            )}
          </div>
        </div>
      </section>

      {/* BLOG — Featured posts (first section after hero) */}
      {posts.length > 0 && (
        <section className="py-20 md:py-24 relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #0B1A30 0%, #111827 100%)' }}>
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
            <Image src="/images/cat-senuelos.jpg" alt="" fill sizes="100vw" className="object-cover" style={{ objectPosition: 'center 30%' }} />
          </div>
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #00D4FF, #FFB800)' }} />
                  <div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
                      style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
                      <BookOpen className="h-3 w-3" />
                      Blog
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#E8F0FE' }}>Guías y comparativas</h2>
                <p className="mt-1.5 text-base" style={{ color: '#8BA3C7' }}>
                  Análisis honestos escritos por pescadores para ayudarte a elegir
                </p>
              </div>
              <Link href="/blog"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold transition-all hover:gap-2"
                style={{ color: '#00D4FF' }}>
                Ver todos los artículos <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((post: BlogPost) => {
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`}
                    className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]"
                    style={{
                      border: '1px solid #1E3A5F',
                      height: '420px',
                    }}>
                    {post.featuredImage ? (
                      <>
                        <Image src={post.featuredImage} alt="" fill sizes="33vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0" style={{
                          background: 'linear-gradient(180deg, rgba(11,18,32,0.1) 0%, rgba(11,18,32,0.3) 30%, rgba(11,18,32,0.85) 65%, #0B1120 100%)',
                        }} />
                      </>
                    ) : (
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0F1F38, #1B2A4A)' }}>
                        <Fish className="absolute -bottom-6 -right-6 h-48 w-48 opacity-[0.04]" style={{ color: '#00D4FF' }} />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider"
                          style={{ background: 'rgba(0,212,255,0.15)', backdropFilter: 'blur(8px)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }}>
                          {post.category || 'Artículo'}
                        </span>
                      </div>
                      <h3 className="font-bold text-base leading-snug mb-1.5 line-clamp-2 transition-colors duration-300 group-hover:text-[#00D4FF]"
                        style={{ color: '#E8F0FE' }}>
                        {post.title}
                      </h3>
                      <p className="text-sm leading-relaxed line-clamp-2 mb-3" style={{ color: '#A0B8D8' }}>
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs" style={{ color: '#4A6080' }}>
                          <Clock className="h-3 w-3" />
                          {new Date(post.publishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <span className="text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 group-hover:gap-2.5"
                          style={{ color: '#00D4FF' }}>
                          Leer <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link href="/blog"
                className="inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: '#00D4FF' }}>
                Ver todos los artículos <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Deals */}
      {groupedFeatured.length > 0 && (
        <section className="py-16 md:py-20" style={{ background: '#111827' }}>
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
                style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.2)', color: '#FFB800' }}>
                <Star className="h-3 w-3" fill="#FFB800" />
                Destacados
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#E8F0FE' }}>Chollos Destacados</h2>
              <p className="mt-2 text-lg" style={{ color: '#8BA3C7' }}>Las mejores ofertas seleccionadas por nuestro equipo</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {groupedFeatured.map((group) => (
                <ProductCard key={group.productId || group.slug} group={group} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ad: Home - entre Destacados y Categorias (no intrusivo, horizontal) */}
      <section className="py-6" style={{ background: '#0B1120' }}>
        <div className="mx-auto max-w-7xl px-4">
          <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME} format="horizontal" className="max-w-4xl mx-auto" />
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-20 relative overflow-hidden" style={{ background: '#0B1120' }}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <Image src="/images/cat-canas.jpg" alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="mx-auto max-w-7xl px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>
              <Fish className="h-3 w-3" />
              Explora
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#E8F0FE' }}>Categorías</h2>
            <p className="mt-2 text-lg" style={{ color: '#8BA3C7' }}>Explora los chollos por tipo de material de pesca</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATEGORIES.map((cat) => {
              const dealCount = categoryDealCounts.get(cat.slug) || 0
              const Icon = categoryIcons[cat.slug] || Fish
              const bgImages: Record<string, string> = {
                carretes: '/images/cat-carretes.jpg',
                canas: '/images/cat-canas.jpg',
                senuelos: '/images/cat-senuelos.jpg',
                accesorios: '/images/cat-accesorios.jpg',
                ropa: '/images/cat-ropa.jpg',
                nautica: '/images/cat-nautica.jpg',
              }
              const bg = bgImages[cat.slug]
              return (
                <Link key={cat.id} href={`/categories/${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={{ border: '1px solid #1E3A5F', minHeight: '240px' }}>
                  {bg && (
                    <>
                      <Image src={bg} alt="" fill sizes="25vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(11,26,48,0.85) 0%, rgba(11,26,48,0.7) 50%, rgba(11,26,48,0.9) 100%)' }} />
                    </>
                  )}
                  {!bg && (
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0F1F38, #1B2A4A)' }} />
                  )}
                  <div className="relative z-10 p-6 flex flex-col justify-between h-full min-h-[240px]">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                      style={{ background: 'rgba(0,212,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      {dealCount > 0 && (
                        <span className="inline-block w-fit text-xs font-bold px-3 py-1 rounded-full mb-2"
                          style={{ background: 'rgba(0,212,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
                          {dealCount} {dealCount === 1 ? 'chollo' : 'chollos'}
                        </span>
                      )}
                      <h3 className="text-xl font-bold" style={{ color: '#E8F0FE' }}>{cat.name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-sm group-hover:gap-2 transition-all"
                        style={{ color: '#00D4FF' }}>
                        <span>Ver chollos</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Popular Brands */}
      <section className="py-16 md:py-20" style={{ background: '#0B1A30' }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.2)', color: '#FFB800' }}>
              <Tag className="h-3 w-3" />
              Marcas
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#E8F0FE' }}>Chollos por Marca</h2>
            <p className="mt-2 text-lg" style={{ color: '#8BA3C7' }}>Explora las mejores ofertas de las marcas más populares</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {['shimano', 'daiwa', 'abu-garcia', 'mitchell', 'penn', 'okuma', 'rapala', 'caperlan', 'yo-zuri', 'berkley'].map((brand) => (
              <Link key={brand} href={`/marca/${brand}`}
                className="group text-center p-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(0,212,255,0.3)]"
                style={{
                  background: '#111827',
                  border: '1px solid #1E3A5F',
                }}>
                <span className="text-sm font-semibold transition-colors duration-300 group-hover:text-[#00D4FF]" style={{ color: '#E8F0FE' }}>
                  {brand.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Deals */}
      <section className="py-16 md:py-20" style={{ background: '#111827' }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>
              <Clock className="h-3 w-3" />
              Nuevos
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#E8F0FE' }}>Últimos Chollos</h2>
            <p className="mt-2 text-lg" style={{ color: '#8BA3C7' }}>Las ofertas más recientes añadidas a PesCatch</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {groupedLatest.slice(0, 4).map((group) => (
              <ProductCard key={group.productId || group.slug} group={group} />
            ))}
          </div>
        </div>
      </section>

      {/* Top Discounts */}
      {groupedTopDiscounts.length > 0 && (
        <section className="py-16 md:py-20" style={{ background: '#0B1120' }}>
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
                style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.2)', color: '#FF4757' }}>
                <Zap className="h-3 w-3" />
                Hot
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#E8F0FE' }}>Mayores Descuentos</h2>
              <p className="mt-2 text-lg" style={{ color: '#8BA3C7' }}>Los chollos con los porcentajes de ahorro más brutales</p>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {groupedTopDiscounts.map((group) => (
                <Link key={group.productId || group.slug} href={`/deals/${group.slug}`}
                  className="flex-shrink-0 w-[260px] snap-start p-6 text-center rounded-2xl transition-all duration-300 hover:-translate-y-1 glow-amber"
                  style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
                  {group.discountPercent > 0 && (
                  <span className="inline-block font-extrabold text-2xl px-5 py-2 rounded-full mb-4"
                    style={{ background: '#FFB800', color: '#0B1120', boxShadow: '0 0 20px rgba(255,184,0,0.3)' }}>
                    -{group.discountPercent}%
                  </span>
                  )}
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-[#00D4FF] transition-colors" style={{ color: '#E8F0FE' }}>{group.title}</h3>
                  <div className="mt-3">
                    <span className="font-bold text-xl" style={{ color: '#FFB800', textShadow: '0 0 10px rgba(255,184,0,0.2)' }}>{formatPrice(group.bestPrice)}</span>
                  </div>
                  {group.storeCount > 1 && (
                  <div className="mt-2 text-xs" style={{ color: '#4A6080' }}>
                    {group.storeCount} tiendas · Mejor en {group.bestStore}
                  </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA: Newsletter + Telegram */}
      <section className="py-16 md:py-20" style={{ background: 'linear-gradient(180deg, #0B1120 0%, #0A1326 100%)' }}>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="p-8 md:p-12 rounded-3xl" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#E8F0FE' }}>No te pierdas ningún chollo</h2>
            <p className="text-lg mb-8" style={{ color: '#8BA3C7' }}>Recibe los mejores descuentos directamente en tu email o en Telegram</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#newsletter"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #00D4FF, #0099CC)', color: '#FFFFFF', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Suscribirme al newsletter
              </Link>
              <a href="https://t.me/pescatch" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                Síguenos en Telegram
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  )
}
