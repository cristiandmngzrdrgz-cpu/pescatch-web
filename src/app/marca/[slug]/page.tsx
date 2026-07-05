import { getDeals } from '@/data/queries'
import { ProductCard } from '@/components/deals/product-card'
import { groupDealsByProduct } from '@/lib/group-deals'
import Link from 'next/link'
import { Fish } from 'lucide-react'
import type { Metadata } from 'next'
import { generateBreadcrumbSchema, generateCollectionPageSchema, buildMetadata, BASE_URL, JsonLd } from '@/lib/seo/schemas'

export const dynamic = 'force-dynamic'

function formatBrand(slug: string): string {
  return slug
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const brand = formatBrand(slug)

  const canonicalUrl = `${BASE_URL}/marca/${slug}`

  return buildMetadata(
    {
      title: `${brand} — Chollos y Ofertas de ${brand} | PesCatch`,
      description: `Encuentra los mejores chollos de ${brand} en pesca. Ofertas en Amazon, Decathlon y AliExpress.`,
      openGraph: {
        title: `${brand} — Chollos de ${brand} en PesCatch`,
        description: `Los mejores chollos de ${brand} en material de pesca al mejor precio.`,
        type: 'website',
        url: canonicalUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${brand} — Chollos | PesCatch`,
        description: `Encuentra chollos de ${brand} en pesca.`,
      },
    },
    canonicalUrl,
  )
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const brand = formatBrand(slug)

  const deals = await getDeals({ brand })

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: `Marca: ${brand}`, url: `${BASE_URL}/marca/${slug}` },
  ])

  const collectionSchema = generateCollectionPageSchema({
    title: `${brand} — Chollos y Ofertas`,
    description: `Los mejores chollos de ${brand} en pesca.`,
    url: `${BASE_URL}/marca/${slug}`,
    itemCount: deals.length,
    items: deals.map(d => ({ name: d.title, url: `${BASE_URL}/deals/${d.slug}` })),
  })

  return (
    <>
      <JsonLd data={[collectionSchema, breadcrumbs]} />
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <Link href="/" className="text-sm transition-colors duration-200 hover:text-[#00D4FF] mb-3 inline-block"
          style={{ color: '#4A6080' }}>
          &larr; Volver al inicio
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#E8F0FE' }}>{brand}</h1>
        <p style={{ color: '#8BA3C7' }}>{deals.length} {deals.length === 1 ? 'chollo disponible' : 'chollos disponibles'} de {brand}</p>
      </div>

      {deals.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {groupDealsByProduct(deals).map((group) => (
            <ProductCard key={group.productId || group.slug} group={group} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl transition-all duration-200"
          style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <Fish className="h-10 w-10 mx-auto mb-3 opacity-50" style={{ color: '#4A6080' }} />
          <p className="mb-3" style={{ color: '#8BA3C7' }}>No hay chollos de {brand} actualmente.</p>
          <Link href="/" className="font-semibold hover:underline transition-colors" style={{ color: '#00D4FF' }}>Ver todos los chollos</Link>
        </div>
      )}
    </div>
    </>
  )
}
