import { getDeals, getFeaturedDeals } from '@/data/queries'
import { DealCard } from '@/components/deals/deal-card'
import { Fish, ArrowRight, Clock, Zap, Star, Shield, BadgeCheck, Percent, Users } from 'lucide-react'
import Link from 'next/link'
import { CATEGORIES } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const featured = await getFeaturedDeals()
  const latest = await getDeals({ sortBy: 'newest' })
  const topDiscounts = (await getDeals({ sortBy: 'discount' })).slice(0, 5)
  const totalDeals = latest.length
  const categoryDealCounts = new Map<string, number>()
  for (const cat of CATEGORIES) {
    categoryDealCounts.set(cat.slug, (await getDeals({ category: cat.slug })).length)
  }

  const totalSavings = latest.reduce((sum, d) => sum + Math.max(0, d.originalPrice - d.salePrice), 0)
  const bestPriceMap = new Map<string, { bestPrice: number; bestStore: string; storeCount: number }>()
  for (const deal of latest) {
    if (!deal.productId) continue
    const prev = bestPriceMap.get(deal.productId) ?? { bestPrice: Infinity, bestStore: '', storeCount: 0 }
    prev.storeCount++
    if (deal.salePrice < prev.bestPrice) {
      prev.bestPrice = deal.salePrice
      prev.bestStore = deal.store.name
    }
    bestPriceMap.set(deal.productId, prev)
  }

  const categoryImages: Record<string, string> = {
    carretes: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=400&q=80',
    canas: 'https://images.unsplash.com/photo-1572051416422-2270c7e21868?w=400&q=80',
    senuelos: 'https://images.unsplash.com/photo-1589187150112-5b9aadc86518?w=400&q=80',
    accesorios: 'https://images.unsplash.com/photo-1513863545813-5f7d724e4456?w=400&q=80',
  }

  return (
    <div>
      {/* HERO - Imagen real de pesca */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center"
        style={{ background: 'linear-gradient(135deg, #0A1326 0%, #0B1120 50%, #111827 100%)' }}>
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1621277230131-1966e041a6a6?w=1400&q=85"
            alt="Pesca deportiva"
            className="w-full h-full object-cover opacity-20"
            style={{ objectPosition: 'center 30%' }}
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(90deg, rgba(10,19,38,0.95) 0%, rgba(10,19,38,0.7) 50%, rgba(10,19,38,0.4) 100%)'
          }} />
        </div>

          <div className="relative mx-auto max-w-7xl px-4 py-24 lg:py-32 w-full">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="inline-flex items-center gap-2 text-sm rounded-full px-4 py-1.5"
                style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' }}>
                <BadgeCheck className="h-4 w-4" />
                <span className="font-semibold">+{totalDeals} ofertas</span>
              </div>
              <div className="inline-flex items-center gap-2 text-sm rounded-full px-4 py-1.5"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
                <Percent className="h-4 w-4" />
                <span className="font-semibold">{totalSavings.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} en ahorros</span>
              </div>
            </div>

            <h1 className="text-[2.75rem] sm:text-[4rem] font-extrabold leading-[1.05] tracking-tight mb-5"
              style={{ color: '#E8F0FE', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              El{' '}
              <span style={{
                background: 'linear-gradient(135deg, #00D4FF, #00D4FF 40%, #FFB800 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Material de Pesca
              </span>
              <br />al Mejor Precio
            </h1>

            <p className="text-lg sm:text-xl leading-relaxed mb-8 max-w-lg" style={{ color: '#8BA3C7' }}>
              Comparamos precios entre <strong style={{ color: '#E8F0FE' }}>Amazon, Decathlon y AliExpress</strong> para que ahorres en carretes, cañas, señuelos y accesorios.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/search"
                className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-full text-lg transition-all duration-300 hover:scale-105 active:scale-95 group"
                style={{
                  background: 'linear-gradient(135deg, #00D4FF, #0099CC)',
                  color: '#0B1120',
                  boxShadow: '0 4px 25px rgba(0,212,255,0.5), 0 0 60px rgba(0,212,255,0.15)',
                }}>
                Ver Ofertas
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <Link href="/categories"
                className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-full text-lg transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#8BA3C7',
                  backdropFilter: 'blur(4px)',
                }}>
                Categorías
              </Link>
            </div>

            {/* Trust bar */}
            <div className="mt-10 flex flex-wrap gap-5">
              {[
                { icon: Shield, text: 'Comparativa multi-tienda', sub: 'Amazon · Decathlon · AliExpress' },
                { icon: Users, text: `${totalDeals} ofertas verificadas`, sub: `Más de ${totalSavings.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} ahorrados` },
                { icon: Zap, text: 'Chollos actualizados', sub: 'Precios revisados cada semana' },
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
              {featured.map((deal) => {
                const cmp = deal.productId ? bestPriceMap.get(deal.productId) : undefined
                return (
                  <DealCard key={deal.id} deal={deal}
                    bestPriceStore={cmp?.bestStore}
                    storeCount={cmp?.storeCount} />
                )
              })}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATEGORIES.map((cat) => {
              const dealCount = categoryDealCounts.get(cat.slug) || 0
              const imgSrc = categoryImages[cat.slug] || ''
              return (
                <Link key={cat.id} href={`/categories/${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={{ background: '#111827', border: '1px solid #1E3A5F', minHeight: '260px' }}>
                  <div className="absolute inset-0">
                    {imgSrc && (
                      <img src={imgSrc} alt={cat.name}
                        className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                      />
                    )}
                    <div className="absolute inset-0" style={{
                      background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7) 100%)',
                    }} />
                  </div>
                  <div className="relative z-10 p-6 flex flex-col justify-end h-full min-h-[260px]">
                    {dealCount > 0 && (
                      <span className="inline-block w-fit text-xs font-bold px-3 py-1 rounded-full mb-3"
                        style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
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
                      <span className="font-semibold uppercase tracking-wider text-[0.65rem]" style={{ color: '#00D4FF' }}>{CATEGORIES.find(c => c.id === deal.category)?.name || deal.category}</span>
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
