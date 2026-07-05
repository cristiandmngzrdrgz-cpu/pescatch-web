import { getDeals } from '@/data/queries'
import { getDb } from '@/lib/db'
import { getLastSync } from '@/lib/run-sync'
import Link from 'next/link'
import { TrendingDown, Tag, Star, Plus, Pencil, MessageSquare, FileText, Clock, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { CATEGORIES } from '@/types'

export default async function AdminDashboard() {
  const db = getDb()
  const deals = await getDeals()
  const featured = deals.filter(d => d.featured)
  const avgDiscount = deals.length > 0 ? Math.round(deals.reduce((sum, d) => sum + d.discountPercent, 0) / deals.length) : 0

  const [draftCountResult, commentCountResult, postCountResult] = await Promise.all([
    db.execute("SELECT COUNT(*) as count FROM deals WHERE status = 'draft'"),
    db.execute('SELECT COUNT(*) as count FROM comments'),
    db.execute("SELECT COUNT(*) as count FROM posts WHERE status = 'published'"),
  ])
  const draftCount = Number(draftCountResult.rows[0].count)
  const commentCount = Number(commentCountResult.rows[0].count)
  const postCount = Number(postCountResult.rows[0].count)
  const lastSync = await getLastSync()

  const stats = [
    { label: 'Chollos publicados', value: deals.length, icon: Tag, bg: '#1A2535', text: '#00D4FF' },
    { label: 'Borradores', value: draftCount, icon: FileText, bg: 'rgba(255,184,0,0.1)', text: '#FFB800' },
    { label: 'Artículos blog', value: postCount, icon: Star, bg: 'rgba(38,222,129,0.1)', text: '#26DE81' },
    { label: 'Comentarios', value: commentCount, icon: MessageSquare, bg: 'rgba(139,163,199,0.1)', text: '#8BA3C7' },
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
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
                    <div className="text-xs" style={{ color: '#4A6080' }}>{CATEGORIES.find(c => c.id === deal.category)?.name || deal.category}{deal.discountPercent > 0 ? ` · -${deal.discountPercent}%` : ''}</div>
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
          <Link href="/admin/deals" className="inline-block mt-4 text-sm font-medium" style={{ color: '#00D4FF' }}>
            Ver todos los chollos →
          </Link>
        </div>

        <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <RefreshCw className="h-4 w-4" style={{ color: '#8BA3C7' }} />
            <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Última sincronización</h2>
          </div>
          {lastSync ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                {lastSync.errors.length > 0 ? (
                  <AlertCircle className="h-5 w-5" style={{ color: '#EF4444' }} />
                ) : (
                  <CheckCircle2 className="h-5 w-5" style={{ color: '#26DE81' }} />
                )}
                <span className="text-sm font-semibold" style={{ color: lastSync.errors.length > 0 ? '#EF4444' : '#26DE81' }}>
                  {lastSync.errors.length > 0 ? 'Con errores' : 'Completado'}
                </span>
                <span className="text-xs" style={{ color: '#4A6080' }}>
                  {new Date(lastSync.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg p-2" style={{ background: 'rgba(38,222,129,0.1)' }}>
                  <div className="font-bold" style={{ color: '#26DE81' }}>{lastSync.created}</div>
                  <div style={{ color: '#8BA3C7' }}>Creados</div>
                </div>
                <div className="rounded-lg p-2" style={{ background: 'rgba(0,212,255,0.1)' }}>
                  <div className="font-bold" style={{ color: '#00D4FF' }}>{lastSync.updated}</div>
                  <div style={{ color: '#8BA3C7' }}>Actualizados</div>
                </div>
                <div className="rounded-lg p-2" style={{ background: lastSync.errors.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(139,163,199,0.1)' }}>
                  <div className="font-bold" style={{ color: lastSync.errors.length > 0 ? '#EF4444' : '#8BA3C7' }}>{lastSync.errors.length}</div>
                  <div style={{ color: '#8BA3C7' }}>Errores</div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm" style={{ color: '#4A6080' }}>Nunca se ha ejecutado una sincronización.</p>
              <Link href="/admin/sync">
                <span className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-xs font-semibold" style={{ background: '#00D4FF', color: '#0B1120' }}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Ir a Sync
                </span>
              </Link>
            </div>
          )}
          <Link href="/admin/sync" className="inline-block mt-4 text-sm font-medium" style={{ color: '#00D4FF' }}>
            Historial completo →
          </Link>
        </div>
      </div>
    </div>
  )
}
