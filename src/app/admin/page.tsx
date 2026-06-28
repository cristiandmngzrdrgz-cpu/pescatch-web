import { getDeals } from '@/data/queries'
import Link from 'next/link'
import { TrendingDown, Tag, ThumbsUp, Star, Plus, Pencil } from 'lucide-react'

export default function AdminDashboard() {
  const deals = getDeals()
  const featured = deals.filter(d => d.featured)
  const avgDiscount = Math.round(deals.reduce((sum, d) => sum + d.discountPercent, 0) / deals.length)
  const totalVotes = deals.reduce((sum, d) => sum + d.votesUp + d.votesDown, 0)

  const stats = [
    { label: 'Chollos publicados', value: deals.length, icon: Tag, bg: '#1A2535', text: '#00D4FF' },
    { label: 'Destacados', value: featured.length, icon: Star, bg: 'rgba(255,184,0,0.1)', text: '#FFB800' },
    { label: 'Descuento medio', value: `${avgDiscount}%`, icon: TrendingDown, bg: 'rgba(38,222,129,0.1)', text: '#26DE81' },
    { label: 'Votos totales', value: totalVotes, icon: ThumbsUp, bg: 'rgba(0,212,255,0.1)', text: '#00D4FF' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#8BA3C7' }}>Resumen de actividad de PesCatch</p>
        </div>
        <Link
          href="/admin/deals/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl transition-colors"
          style={{ background: '#00D4FF', color: '#0B1120' }}
        >
          <Plus className="h-4 w-4" />
          Publicar chollo
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5"
            style={{ background: '#111827', border: '1px solid #1E3A5F' }}
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: stat.bg }}
            >
              <stat.icon className="h-5 w-5" style={{ color: stat.text }} />
            </div>
            <div className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>{stat.value}</div>
            <div className="text-sm mt-0.5" style={{ color: '#8BA3C7' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <h2 className="font-bold mb-4" style={{ color: '#E8F0FE' }}>Últimos chollos</h2>
        {deals.slice(0, 5).length > 0 ? (
          <div style={{ borderTop: '1px solid #1E3A5F' }}>
            {deals.slice(0, 5).map((deal) => (
              <div key={deal.id} className="flex items-center gap-4 py-3" style={{ borderBottom: '1px solid #1E3A5F' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
                  <Tag className="h-4 w-4" style={{ color: '#00D4FF' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: '#E8F0FE' }}>{deal.title}</div>
                  <div className="text-xs" style={{ color: '#4A6080' }}>{deal.category} · -{deal.discountPercent}%</div>
                </div>
                <Link
                  href={`/admin/deals/${deal.id}/edit`}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ border: '1px solid #1E3A5F', color: '#4A6080' }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm py-8 text-center" style={{ color: '#4A6080' }}>No hay chollos publicados aún.</p>
        )}
      </div>
    </div>
  )
}
