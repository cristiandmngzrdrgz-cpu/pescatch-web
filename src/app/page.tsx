import { getDeals, getFeaturedDeals } from '@/data/queries'
import { DealCard } from '@/components/deals/deal-card'
import { Fish, TrendingDown, Store, Tag, ArrowRight, Clock, Zap, Star } from 'lucide-react'
import Link from 'next/link'
import { CATEGORIES } from '@/types'

export default async function HomePage() {
  const featured = await getFeaturedDeals()
  const latest = await getDeals({ sortBy: 'newest' })
  const topDiscounts = (await getDeals({ sortBy: 'discount' })).slice(0, 5)
  const categoryDealCounts = new Map<string, number>()
  for (const cat of CATEGORIES) {
    categoryDealCounts.set(cat.slug, (await getDeals({ category: cat.slug })).length)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A1326 0%, #0B1120 40%, #111827 100%)' }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.4), transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(255,184,0,0.35), transparent 70%)' }} />
          <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.3), transparent 70%)' }} />
        </div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Scanline */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
          <div className="absolute inset-x-0 h-[2px] bg-[#00D4FF]" style={{ animation: 'scanline 8s linear infinite' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-sm rounded-full px-4 py-1.5 mb-6 animate-pulse"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#26DE81' }} />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#26DE81' }} />
                </span>
                <span className="font-semibold ml-1">Chollos verificados en tiempo real</span>
              </div>

              <h1 className="text-[2.5rem] sm:text-[3.25rem] font-extrabold leading-[1.05] tracking-tight mb-4" style={{ color: '#E8F0FE' }}>
                Los Mejores{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #00D4FF 0%, #00D4FF 40%, #FFB800 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 12px rgba(0,212,255,0.3))',
                }}>
                  Chollos
                </span>{' '}
                de Pesca
              </h1>
              <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: '#8BA3C7' }}>
                Ahorra hasta un <span className="font-bold" style={{ color: '#FFB800' }}>50%</span> en material de pesca de calidad.
                Todas las ofertas verificadas manualmente por pescadores como tú.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/search" className="inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-full glow-cta group"
                  style={{ background: '#00D4FF', color: '#0B1120', boxShadow: '0 4px 20px rgba(0,212,255,0.4)' }}>
                  Ver Ofertas
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/categories" className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full transition-all hover:border-[#00D4FF]/50 hover:shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                  style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.08)', color: '#8BA3C7' }}>
                  Categorías
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { icon: TrendingDown, text: 'Precio mínimo garantizado' },
                  { icon: Store, text: '8 tiendas verificadas' },
                  { icon: Tag, text: `${featured.length} chollos activos` },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#4A6080' }}>
                    <item.icon className="h-4 w-4" style={{ color: '#00D4FF' }} />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero floating cards */}
            <div className="hidden lg:flex flex-col gap-4">
              {[
                { title: 'Carrete Shimano Stradic FL', discount: '-42%', price: '109,99\u20AC' },
                { title: 'Ca\u00F1a Daiwa Tatula XT', discount: '-35%', price: '104,50\u20AC' },
                { title: 'Rapala X-Rap 10cm', discount: '-30%', price: '13,99\u20AC' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-5 rounded-2xl transition-all cursor-pointer glass"
                  style={{
                    border: '1px solid rgba(30,58,95,0.5)',
                    animation: `fadeInUp 0.6s ease-out ${i * 0.15}s both`,
                  }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #00D4FF, #1A2535)', boxShadow: '0 0 15px rgba(0,212,255,0.15)' }}>
                    <Fish className="h-6 w-6" style={{ color: 'rgba(255,255,255,0.9)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: '#E8F0FE' }}>{item.title}</div>
                    <div className="text-xs mt-1" style={{ color: '#4A6080' }}>desde {item.price}</div>
                  </div>
                  <span className="font-bold text-xs px-3 py-1.5 rounded-full flex-shrink-0"
                    style={{ background: '#FFB800', color: '#0B1120', boxShadow: '0 0 12px rgba(255,184,0,0.3)' }}>
                    {item.discount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Deals */}
      {featured.length > 0 && (
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-16 md:py-20" style={{ background: '#0B1120' }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>
              <Fish className="h-3 w-3" />
              Explora
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#E8F0FE' }}>Categorías</h2>
            <p className="mt-2 text-lg" style={{ color: '#8BA3C7' }}>Explora los chollos por tipo de material de pesca</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => {
              const dealCount = categoryDealCounts.get(cat.slug) || 0
              return (
                <Link key={cat.id} href={`/categories/${cat.slug}`}
                  className="group relative overflow-hidden p-7 text-center rounded-2xl transition-all duration-300 hover:-translate-y-1"
                  style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(0,212,255,0.08) 0%, transparent 70%)',
                      boxShadow: 'inset 0 0 30px rgba(0,212,255,0.05)',
                    }} />
                  <div className="relative z-10">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{ background: '#1A2535', boxShadow: '0 0 0 rgba(0,212,255,0)' }}>
                      <Fish className="h-7 w-7 transition-all duration-300 group-hover:text-[#00D4FF]" style={{ color: '#4A6080' }} />
                    </div>
                    <h3 className="font-semibold transition-colors duration-300 group-hover:text-[#00D4FF]" style={{ color: '#E8F0FE' }}>{cat.name}</h3>
                    <p className="text-sm mt-1" style={{ color: '#4A6080' }}>
                      {dealCount} {dealCount === 1 ? 'chollo' : 'chollos'}
                    </p>
                  </div>
                </Link>
              )
            })}
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {latest.slice(0, 4).map((deal) => {
              const hoursAgo = Math.floor((Date.now() - new Date(deal.publishedAt).getTime()) / 3600000)
              return (
                <Link key={deal.id} href={`/deals/${deal.slug}`}
                  className="group flex gap-5 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 glow-cyan"
                  style={{ background: '#0B1120', border: '1px solid #1E3A5F' }}>
                  <div className="w-[100px] h-[100px] shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.1))' }}>
                    <Fish className="h-9 w-9 transition-colors duration-300 group-hover:text-[#00D4FF]" style={{ color: '#4A6080' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4A6080' }}>
                      <Clock className="h-3.5 w-3.5" />
                      {hoursAgo < 1 ? 'Hace minutos' : hoursAgo < 24 ? `Hace ${hoursAgo} horas` : `Hace ${Math.floor(hoursAgo / 24)} días`}
                      <span className="mx-1.5" style={{ color: '#1E3A5F' }}>·</span>
                      <span className="font-semibold uppercase tracking-wider text-[0.65rem]" style={{ color: '#00D4FF' }}>{deal.category}</span>
                    </div>
                    <h3 className="font-semibold text-sm mt-1.5 line-clamp-2 group-hover:text-[#00D4FF] transition-colors duration-300" style={{ color: '#E8F0FE' }}>
                      {deal.title}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-lg font-bold" style={{ color: '#FFB800' }}>{deal.salePrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                      <span className="text-xs line-through" style={{ color: '#4A6080' }}>{deal.originalPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                      <span className="ml-auto text-[0.65rem] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,184,0,0.12)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.2)' }}>
                        -{deal.discountPercent}%
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Top Discounts */}
      {topDiscounts.length > 0 && (
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
              {topDiscounts.map((deal) => (
                <Link key={deal.id} href={`/deals/${deal.slug}`}
                  className="flex-shrink-0 w-[260px] snap-start p-6 text-center rounded-2xl transition-all duration-300 hover:-translate-y-1 glow-amber"
                  style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
                  <span className="inline-block font-extrabold text-2xl px-5 py-2 rounded-full mb-4"
                    style={{ background: '#FFB800', color: '#0B1120', boxShadow: '0 0 20px rgba(255,184,0,0.3)' }}>
                    -{deal.discountPercent}%
                  </span>
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-[#00D4FF] transition-colors" style={{ color: '#E8F0FE' }}>{deal.title}</h3>
                  <div className="mt-3">
                    <span className="line-through text-sm" style={{ color: '#4A6080' }}>{deal.originalPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                    <div className="font-bold text-xl mt-0.5" style={{ color: '#FFB800', textShadow: '0 0 10px rgba(255,184,0,0.2)' }}>{deal.salePrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-1 text-xs" style={{ color: '#4A6080' }}>
                    <Zap className="h-3.5 w-3.5" style={{ color: '#FFB800' }} />
                    <span>Ahorras {(deal.originalPrice - deal.salePrice).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
