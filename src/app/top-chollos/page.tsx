import { getDeals } from '@/data/queries'
import { ProductCard } from '@/components/deals/product-card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { groupDealsByProduct } from '@/lib/group-deals'
import {
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
  generateFAQSchema,
  buildMetadata,
  BASE_URL,
  JsonLd,
} from '@/lib/seo/schemas'
import type { Metadata } from 'next'
import { Zap, Star, ChevronDown } from 'lucide-react'
import { CATEGORIES } from '@/types'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const PER_BLOCK = 20

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = `${BASE_URL}/top-chollos`
  return buildMetadata(
    {
      title: 'Top Chollos de Pesca — Las Mejores Ofertas | PesCatch',
      description:
        'Los mejores chollos de material de pesca en España: mayores descuentos y más votados por la comunidad. Ofertas verificadas en Amazon y AliExpress.',
      openGraph: {
        title: 'Top Chollos de Pesca — Las Mejores Ofertas | PesCatch',
        description: 'Los chollos con mayor descuento y los más votados, actualizados cada día.',
        type: 'website',
        url: canonicalUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Top Chollos de Pesca | PesCatch',
        description: 'Las mejores ofertas de material de pesca, ordenadas por descuento y popularidad.',
      },
    },
    canonicalUrl,
  )
}

const FAQ = [
  {
    question: '¿Cómo se eligen los top chollos?',
    answer:
      'Combinamos dos criterios: los mayores descuentos reales sobre el precio original y los chollos más votados por la comunidad de PesCatch. Todos pasan una verificación de precio antes de publicarse.',
  },
  {
    question: '¿Con qué frecuencia se actualiza el top?',
    answer:
      'A diario. Cada mañana refrescamos los precios de todos los chollos publicados, así que el ranking refleja las ofertas vigentes en Amazon y AliExpress.',
  },
  {
    question: '¿Los precios incluyen envío?',
    answer:
      'El precio mostrado es el precio de venta del producto. Si el envío no es gratuito, se indica en la ficha del chollo con el coste de envío correspondiente.',
  },
]

export default async function TopChollosPage() {
  const [discountDeals, popularDeals] = await Promise.all([
    getDeals({ sortBy: 'discount' }),
    getDeals({ sortBy: 'popular' }),
  ])

  const topDiscounts = groupDealsByProduct(discountDeals.filter(d => d.discountPercent > 0)).slice(0, PER_BLOCK)
  const topPopular = groupDealsByProduct(popularDeals).slice(0, PER_BLOCK)

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Top Chollos', url: `${BASE_URL}/top-chollos` },
  ])

  const collectionSchema = generateCollectionPageSchema({
    title: 'Top Chollos de Pesca',
    description: 'Los mejores chollos y ofertas de material de pesca',
    url: `${BASE_URL}/top-chollos`,
    itemCount: topDiscounts.length,
    items: topDiscounts.map(g => ({ name: g.title, url: `${BASE_URL}/deals/${g.slug}` })),
  })

  const faqSchema = generateFAQSchema(FAQ)

  return (
    <>
      <JsonLd data={[collectionSchema, breadcrumbs, faqSchema]} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-10">
          <Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Top Chollos' }]} />
          <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#E8F0FE' }}>
            Top Chollos de Pesca
          </h1>
          <p style={{ color: '#8BA3C7' }}>
            Las mejores ofertas de material de pesca: los mayores descuentos y los chollos más votados por la comunidad, con precios verificados cada día.
          </p>
        </div>

        {/* Mayores descuentos */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #FFB800, #FF4757)' }} />
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' }}>
                <Zap className="h-3 w-3" />
                Hot
              </div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#E8F0FE' }}>Mayores Descuentos</h2>
            </div>
          </div>

          {topDiscounts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {topDiscounts.map((group) => (
                <ProductCard key={group.productId || group.slug} group={group} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
              <p style={{ color: '#8BA3C7' }}>Aún no hay chollos con descuento activo. Vuelve más tarde.</p>
            </div>
          )}
        </section>

        {/* Más votados */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #00D4FF, #26DE81)' }} />
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
                <Star className="h-3 w-3" fill="#00D4FF" />
                Populares
              </div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#E8F0FE' }}>Más Votados por la Comunidad</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {topPopular.map((group) => (
              <ProductCard key={group.productId || group.slug} group={group} />
            ))}
          </div>
        </section>

        {/* Bloque SEO: intro + FAQ */}
        <section className="mt-16 pt-8" style={{ borderTop: '1px solid #1E3A5F' }}>
          <div className="max-w-3xl">
            <p className="text-sm leading-relaxed" style={{ color: '#8BA3C7' }}>
              En PesCatch rastreamos a diario las ofertas de material de pesca en Amazon y AliExpress y
              las ordenamos aquí por su descuento real y por la valoración de la comunidad. Si buscas carretes, cañas,
              señuelos o accesorios al mejor precio, este es el ranking con los chollos más interesantes del momento.
            </p>
          </div>

          <div className="mt-8 grid gap-3 max-w-3xl">
            {FAQ.map((item) => (
              <details key={item.question}
                className="rounded-xl px-5 py-4 transition-all duration-200 group"
                style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
                <summary className="flex items-center justify-between gap-3 cursor-pointer list-none font-semibold text-sm"
                  style={{ color: '#E8F0FE' }}>
                  {item.question}
                  <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" style={{ color: '#00D4FF' }} />
                </summary>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: '#8BA3C7' }}>{item.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-2">
            <span className="text-sm mr-1" style={{ color: '#4A6080' }}>Explora por categoría:</span>
            {CATEGORIES.map((cat) => (
              <Link key={cat.id} href={`/categories/${cat.slug}`}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 hover:border-[#00D4FF]/50 hover:text-[#00D4FF]"
                style={{ background: '#111827', border: '1px solid #1E3A5F', color: '#8BA3C7' }}>
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
