import { notFound } from 'next/navigation'
import { getDealBySlug, getRelatedDeals, getDealsByProduct } from '@/data/queries'
import { getPostsByAsin } from '@/data/blog-queries'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
import Image from 'next/image'
import dynamicImport from 'next/dynamic'
import { buildAmazonUrl } from '@/lib/amazon-affiliate'
import { ImageCarousel } from '@/components/deals/image-carousel'
import { ShareButton } from '@/components/deals/share-button'
import { generateProductSchema, generateBreadcrumbSchema, buildMetadata, BASE_URL, JsonLd } from '@/lib/seo/schemas'

const PriceHistoryChart = dynamicImport(() => import('@/components/deals/price-history-chart').then(m => ({ default: m.PriceHistoryChart })))
const CommentsSection = dynamicImport(() => import('@/components/deals/comments-section').then(m => ({ default: m.CommentsSection })))

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const deal = await getDealBySlug(slug)
  if (!deal) return {}
  const title = deal.metaTitle || `${deal.title} — ${formatPrice(deal.salePrice)} | PesCatch`
  const description = deal.metaDescription || deal.description?.slice(0, 160) || `Oferta en ${deal.title} — ${deal.store?.name ?? ''} — ${formatPrice(deal.salePrice)}`
  const canonicalUrl = deal.canonicalUrl || `${BASE_URL}/deals/${slug}`
  
  return buildMetadata(
    {
      title,
      description,
      openGraph: { 
        title, 
        description, 
        type: 'website', 
        images: deal.imageUrl ? [{ url: deal.imageUrl }] : [],
        url: canonicalUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: deal.imageUrl ? [deal.imageUrl] : [],
      },
    },
    canonicalUrl
  )
}
import { Badge } from '@/components/ui/badge'
import { BadgeCheck, Store, Truck, Package, BarChart3, Tag, ArrowRight, Star, Clock, Zap, Shield, RefreshCw } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { DealCard } from '@/components/deals/deal-card'
import { PriceComparison } from '@/components/deals/price-comparison'
import { VoteButtons } from '@/components/deals/vote-buttons'
import { FavoriteButton } from '@/components/deals/favorites'
import { DealCtaButton } from '@/components/deals/deal-cta-button'
import { MobileCtaButton } from '@/components/deals/mobile-cta-button'
import { CATEGORIES, STORES } from '@/types'
import Link from 'next/link'

function isExpiringSoon(expiresAt?: string): { soon: boolean; daysLeft: number } {
  if (!expiresAt) return { soon: false, daysLeft: 0 }
  const now = new Date()
  const expires = new Date(expiresAt)
  const diffMs = expires.getTime() - now.getTime()
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return { soon: daysLeft > 0 && daysLeft <= 7, daysLeft }
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const deal = await getDealBySlug(slug)

  if (!deal) notFound()

  const related = await getRelatedDeals(deal)
  const storeDeals = deal.productId ? await getDealsByProduct(deal.productId) : []
  const blogPosts = deal.asin ? await getPostsByAsin(deal.asin) : []
  const category = CATEGORIES.find(c => c.id === deal.category)
  const storeMeta = STORES.find(s => s.id === deal.store.id || s.name === deal.store.name)
  const storeLabel = storeMeta?.name || deal.store.name
  const { soon: expiringSoon, daysLeft } = isExpiringSoon(deal.expiresAt)

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Chollos', url: '/search' },
    ...(category ? [{ name: category.name, url: `/categories/${category.slug}` }] : []),
    { name: deal.title, url: `${BASE_URL}/deals/${slug}` },
  ])

  const productSchema = generateProductSchema({
    title: deal.title,
    description: deal.description,
    imageUrl: deal.imageUrl,
    salePrice: deal.salePrice,
    originalPrice: deal.originalPrice,
    currency: deal.currency,
    stockStatus: deal.stockStatus,
    affiliateUrl: deal.store.id === 'amazon' ? buildAmazonUrl(deal.affiliateUrl) : deal.affiliateUrl,
    storeName: deal.store.name,
    rating: deal.rating,
    reviewCount: deal.reviewCount,
    sku: deal.id,
    brand: deal.brand,
    shippingCost: deal.shippingCost,
    ean: deal.ean || undefined,
    slug,
  })

  const affiliateUrl = deal.store.id === 'amazon' ? buildAmazonUrl(deal.affiliateUrl) : deal.affiliateUrl

  return (
    <>
      <JsonLd data={[productSchema, breadcrumbs]} />
      <div className="mx-auto max-w-7xl px-4 py-8 pb-24 lg:pb-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-8 overflow-x-auto whitespace-nowrap" style={{ color: '#4A6080' }}>
        <Link href="/" className="hover:text-[#00D4FF] transition-colors">Inicio</Link>
        <span style={{ color: '#1E3A5F' }}>/</span>
        {category && (
          <>
            <Link href={`/categories/${category.slug}`} className="hover:text-[#00D4FF] transition-colors">
              {category.name}
            </Link>
            <span style={{ color: '#1E3A5F' }}>/</span>
          </>
        )}
        <span className="font-medium truncate" style={{ color: '#E8F0FE' }}>{deal.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Gallery + Main Content */}
        <div className="lg:col-span-3">
          <ImageCarousel
            images={deal.images.filter(i => i).length > 0 ? deal.images : (deal.imageUrl ? [deal.imageUrl] : [])}
            title={deal.title}
            badge={
              deal.discountPercent > 0 ? (
                <Badge className="text-sm font-extrabold px-3 py-1.5 rounded-full border-0 transition-all duration-300"
                  style={deal.discountPercent >= 50
                    ? { background: '#FF4757', color: '#FFFFFF', boxShadow: '0 0 15px rgba(255,71,87,0.3)' }
                    : { background: '#FFB800', color: '#0B1120', boxShadow: '0 0 15px rgba(255,184,0,0.3)' }
                  }>
                  -{deal.discountPercent}%
                </Badge>
              ) : undefined
            }
            stockBadge={
              deal.stockStatus === 'limited' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(255,159,67,0.15)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,159,67,0.3)',
                    color: '#FF9F43',
                  }}>
                  <Clock className="h-3 w-3" />
                  Stock limitado
                </span>
              ) : undefined
            }
          />

          {/* Analysis + Specs */}
          <div className="mt-10 space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#E8F0FE' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)', boxShadow: '0 0 10px rgba(0,212,255,0.1)' }}>
                  <Tag className="h-4 w-4" style={{ color: '#00D4FF' }} />
                </div>
                Análisis
              </h2>
              <p style={{ color: '#8BA3C7', lineHeight: '1.75', fontSize: '1.05rem' }}>{deal.review}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#E8F0FE' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)', boxShadow: '0 0 10px rgba(0,212,255,0.1)' }}>
                  <BarChart3 className="h-4 w-4" style={{ color: '#00D4FF' }} />
                </div>
                Características técnicas
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(deal.technicalSpecs).map(([key, value]) => (
                  <div key={key} className="flex justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200 hover:border-[#00D4FF]/40"
                    style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
                    <span style={{ color: '#4A6080' }}>{key}</span>
                    <span className="font-semibold" style={{ color: '#00D4FF' }}>{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {(deal.pros.length > 0 || deal.cons.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {deal.pros.length > 0 && (
                  <div className="rounded-2xl p-5 transition-all duration-200 hover:shadow-[0_0_20px_rgba(38,222,129,0.1)]"
                    style={{ background: 'rgba(38,222,129,0.05)', border: '1px solid rgba(38,222,129,0.15)' }}>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#26DE81' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(38,222,129,0.2)' }}>
                        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#26DE81" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                      </div>
                      Pros
                    </h3>
                    <ul className="space-y-2">
                      {deal.pros.map((p, i) => (
                        <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#8BA3C7' }}>
                          <span className="font-bold mt-0.5" style={{ color: '#26DE81' }}>+</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {deal.cons.length > 0 && (
                  <div className="rounded-2xl p-5 transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,71,87,0.1)]"
                    style={{ background: 'rgba(255,71,87,0.05)', border: '1px solid rgba(255,71,87,0.15)' }}>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#FF4757' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,71,87,0.2)' }}>
                        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 3l4 4M7 3l-4 4" stroke="#FF4757" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                      </div>
                      Contras
                    </h3>
                    <ul className="space-y-2">
                      {deal.cons.map((c, i) => (
                        <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#8BA3C7' }}>
                          <span className="font-bold mt-0.5" style={{ color: '#FF4757' }}>−</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <CommentsSection dealId={deal.id} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Store + Title */}
          <div>
            <div className="flex items-center gap-2 text-sm mb-2" style={{ color: '#4A6080' }}>
              <Store className="h-4 w-4" style={{ color: '#00D4FF' }} />
              <span className="font-medium" style={{ color: '#8BA3C7' }}>{deal.store.name}</span>
              {deal.store.reputation === 'good' && (
                <BadgeCheck className="h-4 w-4" style={{ color: '#00D4FF', filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.3))' }} />
              )}
              <span className="ml-auto text-xs" style={{ color: '#4A6080' }}>{formatDate(deal.publishedAt)}</span>
            </div>
            <h1 className="text-2xl font-extrabold leading-tight" style={{ color: '#E8F0FE' }}>{deal.title}</h1>
          </div>

          {/* Urgency badge */}
          {expiringSoon && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
              style={{
                background: 'rgba(255,71,87,0.1)',
                border: '1px solid rgba(255,71,87,0.3)',
                color: '#FF4757',
              }}>
              <Zap className="h-5 w-5" />
              <span>Oferta por tiempo limitado — quedan {daysLeft} {daysLeft === 1 ? 'día' : 'días'}</span>
            </div>
          )}

          {/* Price Box */}
          <div className="rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,212,255,0.1)]"
            style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-4xl font-extrabold tracking-tight" style={{ color: '#FFB800', textShadow: '0 0 15px rgba(255,184,0,0.15)' }}>
                {formatPrice(deal.salePrice)}
              </span>
              <span className="text-xl line-through" style={{ color: '#4A6080' }}>
                {formatPrice(deal.originalPrice)}
              </span>
              {deal.discountPercent > 0 && (
              <span className="ml-auto inline-flex items-center font-extrabold text-sm px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,184,0,0.12)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.2)' }}>
                Ahorras {deal.discountPercent}%
              </span>
              )}
            </div>

            <div className="space-y-2.5 text-sm" style={{ color: '#8BA3C7' }}>
              {deal.brand && (
                <Link href={`/marca/${deal.brand.toLowerCase().replace(/\s+/g, '-')}`}
                  className="flex items-center gap-2.5 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,184,0,0.1)', boxShadow: '0 0 8px rgba(255,184,0,0.1)' }}>
                    <Tag className="h-4 w-4" style={{ color: '#FFB800' }} />
                  </div>
                  <span className="font-medium transition-colors duration-200 group-hover:text-[#FFB800]" style={{ color: '#E8F0FE' }}>{deal.brand}</span>
                </Link>
              )}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,212,255,0.1)', boxShadow: '0 0 8px rgba(0,212,255,0.1)' }}>
                  <Truck className="h-4 w-4" style={{ color: '#00D4FF' }} />
                </div>
                <span>{deal.shippingCost === 0 ? 'Envío gratuito' : `Envío: ${formatPrice(deal.shippingCost)}`}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(38,222,129,0.1)', boxShadow: '0 0 8px rgba(38,222,129,0.1)' }}>
                  <Package className="h-4 w-4" style={{ color: '#26DE81' }} />
                </div>
                <span className="font-medium" style={deal.stockStatus === 'in_stock' ? { color: '#26DE81' } : deal.stockStatus === 'limited' ? { color: '#FF9F43' } : { color: '#FF4757' }}>
                  {deal.stockStatus === 'in_stock' ? 'En stock' : deal.stockStatus === 'limited' ? `Últimas ${deal.stockCount} unidades` : 'Sin stock'}
                </span>
              </div>
              {deal.rating && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,184,0,0.1)', boxShadow: '0 0 8px rgba(255,184,0,0.1)' }}>
                    <Star className="h-4 w-4" style={{ color: '#FFB800', fill: '#FFB800' }} />
                  </div>
                  <span className="font-medium" style={{ color: '#E8F0FE' }}>{deal.rating} · {deal.reviewCount} valoraciones</span>
                </div>
              )}
            </div>
          </div>

          {/* Multi-Store Price Comparison */}
          <PriceComparison deals={storeDeals} currentDealId={deal.id} />

          {/* CTA Buttons */}
          <div className="space-y-3">
            <DealCtaButton
              href={affiliateUrl}
              storeName={storeLabel}
              price={formatPrice(deal.salePrice)}
              dealId={deal.id}
              category={deal.category}
              discountPercent={deal.discountPercent}
              shippingFree={deal.shippingCost === 0}
            />

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 text-xs pt-1" style={{ color: '#4A6080' }}>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" style={{ color: '#26DE81' }} />
                <span>Pago seguro</span>
              </div>
              {deal.shippingCost === 0 && (
                <div className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" style={{ color: '#00D4FF' }} />
                  <span>Envío gratis</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" style={{ color: '#FF9F43' }} />
                <span>Devolución fácil</span>
              </div>
            </div>

            <div className="flex gap-2">
              <ShareButton url={`${BASE_URL}/deals/${deal.slug}`} title={deal.title} />
              <FavoriteButton dealId={deal.id} />
            </div>
          </div>

          {/* Votes */}
          <div className="rounded-2xl p-5 transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.08)]"
            style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
            <VoteButtons dealId={deal.id} initialUp={deal.votesUp} initialDown={deal.votesDown} />
          </div>

          {/* Price History */}
          <section className="rounded-2xl p-5 transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.08)]"
            style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
            <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#E8F0FE' }}>
              <BarChart3 className="h-5 w-5" style={{ color: '#00D4FF' }} />
              Precio histórico
            </h2>
            <PriceHistoryChart history={deal.priceHistory} />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-xl p-3 transition-all duration-200 hover:scale-105" style={{ background: 'rgba(0,212,255,0.05)' }}>
                <div className="text-xs mb-0.5" style={{ color: '#4A6080' }}>Actual</div>
                <div className="font-extrabold" style={{ color: '#FFB800' }}>{formatPrice(deal.salePrice)}</div>
              </div>
              <div className="rounded-xl p-3 transition-all duration-200 hover:scale-105" style={{ background: 'rgba(38,222,129,0.05)' }}>
                <div className="text-xs mb-0.5" style={{ color: '#4A6080' }}>Mínimo</div>
                <div className="font-extrabold" style={{ color: '#26DE81' }}>{formatPrice(deal.priceHistory.length > 0 ? Math.min(...deal.priceHistory.map(p => p.price)) : deal.salePrice)}</div>
              </div>
              <div className="rounded-xl p-3 transition-all duration-200 hover:scale-105" style={{ background: 'rgba(255,71,87,0.05)' }}>
                <div className="text-xs mb-0.5" style={{ color: '#4A6080' }}>Máximo</div>
                <div className="font-extrabold" style={{ color: '#FF4757' }}>{formatPrice(deal.priceHistory.length > 0 ? Math.max(...deal.priceHistory.map(p => p.price)) : deal.salePrice)}</div>
              </div>
            </div>
          </section>

          {/* Additional Info */}
          <section className="rounded-2xl p-5 transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.08)]"
            style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
            <h2 className="font-bold mb-4" style={{ color: '#E8F0FE' }}>Información adicional</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2" style={{ borderBottom: '1px solid #1E3A5F' }}>
                <span style={{ color: '#4A6080' }}>Publicado</span>
                <span className="font-semibold" style={{ color: '#00D4FF' }}>{formatDate(deal.publishedAt)}</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: '1px solid #1E3A5F' }}>
                <span style={{ color: '#4A6080' }}>Categoría</span>
                <span className="font-semibold" style={{ color: '#00D4FF' }}>{category?.name}</span>
              </div>
              <div className="flex justify-between py-2">
                <span style={{ color: '#4A6080' }}>Tienda</span>
                <span className="font-semibold" style={{ color: '#00D4FF' }}>{deal.store.name}</span>
              </div>
              {deal.tags.length > 0 && (
                <div className="pt-3 flex flex-wrap gap-2">
                  {deal.tags.map((tag) => (
                    <Link key={tag} href={`/search?q=${tag}`}
                      className="text-xs px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-[#1E3A5F] hover:text-[#00D4FF]"
                      style={{ background: '#1A2535', color: '#4A6080' }}>
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Related Deals */}
      {related.length > 0 && (
        <section className="mt-16">
          <Separator className="mb-10" style={{ background: '#1E3A5F' }} />
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', color: '#00D4FF' }}>
              <Star className="h-3 w-3" />
              Relacionados
            </div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#E8F0FE' }}>Chollos relacionados</h2>
            <p className="mt-1" style={{ color: '#8BA3C7' }}>Otras ofertas que te pueden interesar</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </section>
      )}

      {/* Related Blog Posts */}
      {blogPosts.length > 0 && (
        <section className="mt-12">
          <Separator className="mb-10" style={{ background: '#1E3A5F' }} />
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.15)', color: '#FFB800' }}>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
              Blog
            </div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#E8F0FE' }}>Artículos relacionados</h2>
            <p className="mt-1" style={{ color: '#8BA3C7' }}>Aprende más sobre este producto en nuestro blog</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(0,212,255,0.1)]"
                style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
                {post.featuredImage && (
                  <div className="aspect-video overflow-hidden relative">
                    <Image src={post.featuredImage} alt={post.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    {post.category && (
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>
                        {post.category}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: '#4A6080' }}>{formatDate(post.publishedAt)}</span>
                  </div>
                  <h3 className="font-bold line-clamp-2 group-hover:text-[#00D4FF] transition-colors" style={{ color: '#E8F0FE' }}>
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm mt-2 line-clamp-2" style={{ color: '#8BA3C7' }}>{post.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <MobileCtaButton
          href={affiliateUrl}
          storeName={storeLabel}
          price={formatPrice(deal.salePrice)}
          dealId={deal.id}
          category={deal.category}
          discountPercent={deal.discountPercent}
        />
      </div>
    </>
  )
}
