import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'
import { DISABLED_STORES } from '@/data/queries'
import Link from 'next/link'
import { Fish } from 'lucide-react'
import type { Metadata } from 'next'
import { generateBreadcrumbSchema, buildMetadata, BASE_URL, JsonLd } from '@/lib/seo/schemas'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(
    {
      title: 'Marcas de Pesca — Chollos por Marca | PesCatch',
      description: 'Explora chollos de material de pesca por marca: Shimano, Daiwa, Abu Garcia, Mitchell, Penn y más. Encuentra las mejores ofertas en España.',
      openGraph: {
        title: 'Marcas de Pesca | PesCatch',
        description: 'Explora chollos de pesca por marca: Shimano, Daiwa, Abu Garcia, Mitchell, Penn y más.',
        type: 'website',
        url: `${BASE_URL}/marcas`,
      },
    },
    `${BASE_URL}/marcas`,
  )
}

const POPULAR_BRANDS = ['Shimano', 'Daiwa', 'Abu Garcia', 'Mitchell', 'Penn', 'Caperlan', 'Shakespeare', 'Okuma', 'Rapala', 'Savage Gear']

function brandSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

interface BrandRow {
  brand: string
  count: number
  min_price: number
  max_price: number
  max_discount: number
  stores: string
}

export default async function MarcasPage() {
  const db = getDb()
  await seedDatabase()

  const storePlaceholders = DISABLED_STORES.map(() => '?').join(',')
  const result = await db.execute({
    sql: `SELECT brand, COUNT(*) as count, MIN(salePrice) as min_price, MAX(salePrice) as max_price,
            MAX(discountPercent) as max_discount,
            GROUP_CONCAT(DISTINCT storeName) as stores
     FROM deals
     WHERE status = 'published' AND brand != ''
       AND (expiresAt IS NULL OR expiresAt > datetime('now'))
       AND storeId NOT IN (${storePlaceholders})
     GROUP BY LOWER(brand)
     ORDER BY count DESC, brand ASC`,
    args: DISABLED_STORES,
  })

  const brands: BrandRow[] = result.rows.map(r => ({
    brand: r.brand as string,
    count: Number(r.count),
    min_price: Number(r.min_price),
    max_price: Number(r.max_price),
    max_discount: Number(r.max_discount),
    stores: r.stores as string,
  }))

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Marcas', url: '/marcas' },
  ])

  return (
    <>
      <JsonLd data={[breadcrumbs]} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', color: '#00D4FF' }}>
            <Fish className="h-3 w-3" />
            Marcas
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#E8F0FE' }}>Marcas de Pesca</h1>
          <p className="mt-2 text-lg" style={{ color: '#8BA3C7' }}>Explora chollos por marca de material de pesca</p>
        </div>

        {brands.length > 0 ? (
          <>
            {/* Populares */}
            <section className="mb-12">
              <h2 className="text-xl font-bold mb-5" style={{ color: '#E8F0FE' }}>Marcas populares</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {brands
                  .filter(b => POPULAR_BRANDS.some(p => p.toLowerCase() === b.brand.toLowerCase()))
                  .map(b => {
                    const slug = brandSlug(b.brand)
                    return (
                      <Link key={slug} href={`/marca/${slug}`}
                        className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(0,212,255,0.1)]"
                        style={{ background: '#111827', border: '1px solid #1E3A5F', aspectRatio: '1' }}>
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                          <h3 className="font-bold text-sm mb-1 group-hover:text-[#00D4FF] transition-colors" style={{ color: '#E8F0FE' }}>{b.brand}</h3>
                          <p className="text-xs" style={{ color: '#4A6080' }}>{b.count} {b.count === 1 ? 'chollo' : 'chollos'}</p>
                          {b.max_discount > 0 && (
                            <span className="text-[0.65rem] font-bold mt-2 px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>
                              Hasta -{b.max_discount}%
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
              </div>
            </section>

            {/* Todas */}
            <section>
              <h2 className="text-xl font-bold mb-5" style={{ color: '#E8F0FE' }}>Todas las marcas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {brands.map(b => {
                  const slug = brandSlug(b.brand)
                  return (
                    <Link key={slug} href={`/marca/${slug}`}
                      className="flex items-center justify-between rounded-xl p-4 transition-all duration-200 hover:border-[#00D4FF]/30 group"
                      style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
                      <div>
                        <span className="font-medium text-sm group-hover:text-[#00D4FF] transition-colors" style={{ color: '#E8F0FE' }}>{b.brand}</span>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs" style={{ color: '#4A6080' }}>{b.count} {b.count === 1 ? 'chollo' : 'chollos'}</span>
                          <span className="text-xs" style={{ color: '#4A6080' }}>Desde {b.min_price.toFixed(0)}€</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#00D4FF' }}>
                        Ver &rarr;
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>
          </>
        ) : (
          <div className="text-center py-16 rounded-2xl" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
            <Fish className="h-10 w-10 mx-auto mb-3 opacity-50" style={{ color: '#4A6080' }} />
            <p style={{ color: '#8BA3C7' }}>No hay marcas con chollos disponibles actualmente.</p>
            <Link href="/" className="font-semibold hover:underline transition-colors mt-3 inline-block" style={{ color: '#00D4FF' }}>Volver al inicio</Link>
          </div>
        )}
      </div>
    </>
  )
}
