import { getDealsPaginated, getBrands } from '@/data/queries'
import { ProductCard } from '@/components/deals/product-card'
import { SearchPagination } from '@/components/search/search-pagination'
import { groupDealsByProduct } from '@/lib/group-deals'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Fish } from 'lucide-react'
import type { Metadata } from 'next'
import type { DealFilters } from '@/types'
import { generateBreadcrumbSchema, generateCollectionPageSchema, buildMetadata, BASE_URL, JsonLd } from '@/lib/seo/schemas'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12

function formatBrand(slug: string): string {
  return slug
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const brands = await getBrands()
  const match = brands.find(b => b.brand.toLowerCase() === formatBrand(slug).toLowerCase())
  const brand = match?.brand || formatBrand(slug)

  const canonicalUrl = `${BASE_URL}/marca/${slug}`

  return buildMetadata(
    {
      title: `${brand} — Chollos y Ofertas de ${brand} | PesCatch`,
      description: `Encuentra los mejores chollos de ${brand} en pesca.${match ? ` ${match.count} ofertas en Amazon, Decathlon y AliExpress.` : ''}`,
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
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const brands = await getBrands()
  const match = brands.find(b => b.brand.toLowerCase() === formatBrand(slug).toLowerCase())
  const brand = match?.brand || formatBrand(slug)

  if (!match) notFound()

  const page = Math.max(1, Number(sp.page) || 1)

  const filters: DealFilters = { brand }
  const { items: deals, total, totalPages } = await getDealsPaginated(filters, page, PAGE_SIZE)

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Marcas', url: '/marcas' },
    { name: brand, url: `${BASE_URL}/marca/${slug}` },
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
      <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: '#4A6080' }}>
        <Link href="/" className="hover:text-[#00D4FF] transition-colors">Inicio</Link>
        <span style={{ color: '#1E3A5F' }}>/</span>
        <Link href="/marcas" className="hover:text-[#00D4FF] transition-colors">Marcas</Link>
        <span style={{ color: '#1E3A5F' }}>/</span>
        <span style={{ color: '#E8F0FE' }}>{brand}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#E8F0FE' }}>{brand}</h1>
        <p style={{ color: '#8BA3C7' }}>
          {total} {total === 1 ? 'chollo disponible' : 'chollos disponibles'} de {brand}
          {match && <> &middot; Hasta -{match.maxDiscount}% &middot; Desde {match.minPrice.toFixed(0)}€</>}
          {totalPages > 1 && <span> &middot; Página {page} de {totalPages}</span>}
        </p>
      </div>

      {deals.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {groupDealsByProduct(deals).map((group) => (
              <ProductCard key={group.productId || group.slug} group={group} />
            ))}
          </div>
          <Suspense>
            <SearchPagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              basePath={`/marca/${slug}`}
            />
          </Suspense>
        </>
      ) : (
        <div className="text-center py-16 rounded-2xl transition-all duration-200"
          style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <Fish className="h-10 w-10 mx-auto mb-3 opacity-50" style={{ color: '#4A6080' }} />
          <p className="mb-3" style={{ color: '#8BA3C7' }}>No hay chollos de {brand} actualmente.</p>
          <Link href="/marcas" className="font-semibold hover:underline transition-colors" style={{ color: '#00D4FF' }}>Ver todas las marcas</Link>
        </div>
      )}
    </div>
    </>
  )
}
