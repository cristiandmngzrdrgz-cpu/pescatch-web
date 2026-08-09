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
import { Clock, ChevronDown } from 'lucide-react'
import { CATEGORIES } from '@/types'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const FALLBACK_LIMIT = 12

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = `${BASE_URL}/chollos-hoy`
  return buildMetadata(
    {
      title: 'Chollos de Hoy — Ofertas de Pesca Publicadas Hoy | PesCatch',
      description:
        'Los chollos de pesca publicados hoy en PesCatch: carretes, cañas, señuelos y accesorios recién añadidos con ofertas verificadas en Amazon y AliExpress.',
      openGraph: {
        title: 'Chollos de Hoy — Ofertas de Pesca | PesCatch',
        description: 'Las ofertas de material de pesca más recientes, publicadas hoy.',
        type: 'website',
        url: canonicalUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Chollos de Hoy | PesCatch',
        description: 'Los chollos de pesca recién publicados hoy.',
      },
    },
    canonicalUrl,
  )
}

const FAQ = [
  {
    question: '¿Cuándo se actualizan los chollos de hoy?',
    answer:
      'Esta página recoge todos los chollos publicados hoy en PesCatch. Se actualiza a lo largo del día según vamos añadiendo y verificando nuevas ofertas.',
  },
  {
    question: '¿Cómo sé que un chollo es de hoy?',
    answer:
      'Cada chollo muestra la fecha de publicación. La página de hoy solo incluye los añadidos en las últimas 24 horas; los más antiguos siguen disponibles en las categorías y en la búsqueda.',
  },
  {
    question: '¿Qué hago si hoy no hay novedades?',
    answer:
      'Si no se ha publicado ningún chollo nuevo hoy, mostramos las ofertas más recientes para que no te vayas con las manos vacías. Puedes volver mañana o explorar los top chollos.',
  },
]

export default async function ChollosHoyPage() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const publishedSince = todayStart.toISOString()

  const todaysDeals = await getDeals({ sortBy: 'newest', publishedSince })

  const grouped = groupDealsByProduct(todaysDeals)
  const isFallback = grouped.length === 0

  const dealsToShow = isFallback
    ? groupDealsByProduct(await getDeals({ sortBy: 'newest' })).slice(0, FALLBACK_LIMIT)
    : grouped

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Chollos de Hoy', url: `${BASE_URL}/chollos-hoy` },
  ])

  const collectionSchema = generateCollectionPageSchema({
    title: 'Chollos de Hoy',
    description: isFallback
      ? 'Los chollos de pesca más recientes publicados en PesCatch'
      : 'Los chollos de pesca publicados hoy en PesCatch',
    url: `${BASE_URL}/chollos-hoy`,
    itemCount: dealsToShow.length,
    items: dealsToShow.map(g => ({ name: g.title, url: `${BASE_URL}/deals/${g.slug}` })),
  })

  const faqSchema = generateFAQSchema(FAQ)

  return (
    <>
      <JsonLd data={[collectionSchema, breadcrumbs, faqSchema]} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-10">
          <Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Chollos de Hoy' }]} />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <Clock className="h-5 w-5" style={{ color: '#00D4FF' }} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#E8F0FE' }}>Chollos de Hoy</h1>
          </div>
          <p style={{ color: '#8BA3C7' }}>
            {isFallback
              ? 'Hoy aún no se ha publicado ningún chollo nuevo, así que te mostramos las ofertas más recientes.'
              : `Los chollos publicados hoy, verificados y listos para aprovechar: ${dealsToShow.length} ${dealsToShow.length === 1 ? 'oferta' : 'ofertas'}.`}
          </p>
        </div>

        {dealsToShow.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {dealsToShow.map((group) => (
              <ProductCard key={group.productId || group.slug} group={group} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
            <p className="mb-3" style={{ color: '#8BA3C7' }}>No hay chollos publicados todavía.</p>
            <Link href="/top-chollos" className="font-semibold hover:underline transition-colors" style={{ color: '#00D4FF' }}>
              Ver los top chollos
            </Link>
          </div>
        )}

        {/* Bloque SEO: intro + FAQ */}
        <section className="mt-16 pt-8" style={{ borderTop: '1px solid #1E3A5F' }}>
          <div className="max-w-3xl">
            <p className="text-sm leading-relaxed" style={{ color: '#8BA3C7' }}>
              Cada día en PesCatch revisamos las ofertas de material de pesca en Amazon y AliExpress y
              publicamos los chollos que superan nuestra verificación de precio. Esta página reúne todo lo que se ha
              añadido hoy: carretes, cañas, señuelos, cajas, ropa y accesorios. Si buscas novedades frescas, vuelve
              cada mañana.
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
