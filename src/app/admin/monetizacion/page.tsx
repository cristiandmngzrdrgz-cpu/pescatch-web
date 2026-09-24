import { getDb } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MonetizacionPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login')
  const db = getDb()

  const [totalRes, last7Res, last30Res, byStoreRes, byDealRes, byCatRes, recentRes, dealsRes] = await Promise.all([
    db.execute('SELECT count(*) as c FROM click_tracking'),
    db.execute("SELECT count(*) as c FROM click_tracking WHERE timestamp > datetime('now','-7 days')"),
    db.execute("SELECT count(*) as c FROM click_tracking WHERE timestamp > datetime('now','-30 days')"),
    db.execute('SELECT storeId, count(*) as c FROM click_tracking GROUP BY storeId ORDER BY c DESC'),
    db.execute(`
      SELECT ct.dealId, d.title, d.slug, d.storeId, d.salePrice, d.commission, d.category, count(*) as clicks
      FROM click_tracking ct
      LEFT JOIN deals d ON d.id = ct.dealId
      GROUP BY ct.dealId
      ORDER BY clicks DESC
      LIMIT 10
    `),
    db.execute(`
      SELECT d.category, count(*) as clicks
      FROM click_tracking ct
      LEFT JOIN deals d ON d.id = ct.dealId
      WHERE d.category IS NOT NULL AND d.category != ''
      GROUP BY d.category
      ORDER BY clicks DESC
    `),
    db.execute('SELECT clickId, dealId, storeId, timestamp, referrer FROM click_tracking ORDER BY timestamp DESC LIMIT 20'),
    db.execute(`
      SELECT id, title, slug, storeId, salePrice, commission, discountPercent, category
      FROM deals WHERE status='published' ORDER BY commission DESC LIMIT 8
    `),
  ])

  const total = Number(totalRes.rows[0]?.c ?? 0)
  const last7 = Number(last7Res.rows[0]?.c ?? 0)
  const last30 = Number(last30Res.rows[0]?.c ?? 0)
  const byStore = byStoreRes.rows as unknown as { storeId: string; c: number }[]
  const byDeal = byDealRes.rows as unknown as { dealId: string; title: string; slug: string; storeId: string; salePrice: number; commission: number; category: string; clicks: number }[]
  const byCat = byCatRes.rows as unknown as { category: string; clicks: number }[]
  const recent = recentRes.rows as unknown as { clickId: string; dealId: string; storeId: string; timestamp: string; referrer: string }[]
  const topCommission = dealsRes.rows as unknown as { id: string; title: string; slug: string; storeId: string; salePrice: number; commission: number; discountPercent: number; category: string }[]

  const avgCommission = 1.84
  const estMonth = total > 0 ? `~${(total * 0.05 * avgCommission).toFixed(2)}€ (estimado 5% conv.)` : '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>Monetización</h1>
        <p className="text-sm mt-1" style={{ color: '#8BA3C7' }}>Clicks → tiendas · CTR proxy · high-ticket que más comisiones generan</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="text-xs" style={{ color: '#4A6080' }}>Clicks totales</div>
          <div className="text-2xl font-extrabold" style={{ color: '#00D4FF' }}>{total}</div>
          <div className="text-xs" style={{ color: '#8BA3C7' }}>{estMonth}</div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="text-xs" style={{ color: '#4A6080' }}>Últimos 7 días</div>
          <div className="text-2xl font-extrabold" style={{ color: '#26DE81' }}>{last7}</div>
          <div className="text-xs" style={{ color: '#8BA3C7' }}>Últimos 30: {last30}</div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="text-xs" style={{ color: '#4A6080' }}>Ticket medio publicado</div>
          <div className="text-2xl font-extrabold" style={{ color: '#FFB800' }}>30.37€</div>
          <div className="text-xs" style={{ color: '#8BA3C7' }}>Objetivo 42-48€ (high-ticket)</div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="text-xs" style={{ color: '#4A6080' }}>High-ticket top</div>
          <div className="text-sm font-bold" style={{ color: '#E8F0FE' }}>{topCommission[0]?.title?.slice(0,28) || '—'}</div>
          <div className="text-xs" style={{ color: '#26DE81' }}>{topCommission[0] ? `${topCommission[0].commission}€ comisión · ${topCommission[0].salePrice}€` : '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold mb-3" style={{ color: '#E8F0FE' }}>Por tienda</h2>
          {byStore.length === 0 ? <p className="text-sm" style={{ color: '#4A6080' }}>Sin clicks aún. Verás datos cuando haya CTR.</p> : (
            <div className="space-y-2">
              {byStore.map(r => (
                <div key={r.storeId} className="flex justify-between text-sm" style={{ borderBottom: '1px solid #1E3A5F' }}>
                  <span style={{ color: '#8BA3C7' }}>{r.storeId}</span>
                  <span style={{ color: '#00D4FF' }}>{r.c} clicks</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/api/admin/click-stats" className="inline-block mt-3 text-xs" style={{ color: '#4A6080' }}>JSON API → /api/admin/click-stats</Link>
        </div>

        <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <h2 className="font-bold mb-3" style={{ color: '#E8F0FE' }}>Por categoría</h2>
          {byCat.length === 0 ? <p className="text-sm" style={{ color: '#4A6080' }}>Sin datos por categoría.</p> : (
            <div className="space-y-2">
              {byCat.map(r => (
                <div key={r.category} className="flex justify-between text-sm">
                  <span style={{ color: '#8BA3C7' }}>{r.category}</span>
                  <span style={{ color: '#26DE81' }}>{r.clicks}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <h2 className="font-bold mb-3" style={{ color: '#E8F0FE' }}>Top deals por clicks</h2>
        {byDeal.length === 0 ? <p className="text-sm" style={{ color: '#4A6080' }}>Aún sin clicks. Cuando tengas tráfico verás qué chollo convierte.</p> : (
          <div className="space-y-2">
            {byDeal.map(d => (
              <div key={d.dealId} className="flex items-center gap-3 text-sm py-2" style={{ borderBottom: '1px solid #1E3A5F' }}>
                <span className="flex-1 truncate" style={{ color: '#E8F0FE' }}>{d.title || d.dealId}</span>
                <span style={{ color: '#4A6080' }}>{d.storeId}</span>
                <span style={{ color: '#FFB800' }}>{d.salePrice ? `${d.salePrice}€` : '—'}</span>
                <span style={{ color: '#26DE81' }}>{d.commission ? `${d.commission}€` : '—'}</span>
                <span className="font-bold" style={{ color: '#00D4FF' }}>{d.clicks} clicks</span>
                {d.slug && <Link href={`/deals/${d.slug}`} className="text-xs" style={{ color: '#4A6080' }}>ver</Link>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <h2 className="font-bold mb-3" style={{ color: '#E8F0FE' }}>High-ticket que más comisiona (top 8)</h2>
        <div className="space-y-2">
          {topCommission.map(d => (
            <div key={d.id} className="flex items-center gap-3 text-sm py-2" style={{ borderBottom: '1px solid #1E3A5F' }}>
              <span className="flex-1 truncate" style={{ color: '#E8F0FE' }}>{d.title}</span>
              <span style={{ color: '#4A6080' }}>{d.category}</span>
              <span style={{ color: '#FFB800' }}>{d.salePrice}€</span>
              <span className="font-bold" style={{ color: '#26DE81' }}>{d.commission}€</span>
              <Link href={`/deals/${d.slug}`} className="text-xs px-2 py-1 rounded" style={{ background: '#00D4FF', color: '#0B1120' }}>ver</Link>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: '#4A6080' }}>Prioriza estos en homepage y Telegram: 1 venta Stradic 179€ (9€) = 10 ventas kit 16€ (0.85€).</p>
      </div>

      <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <h2 className="font-bold mb-3" style={{ color: '#E8F0FE' }}>Promo 3×/semana (lunes/miércoles/viernes 09:10)</h2>
        <p className="text-xs mb-3" style={{ color: '#8BA3C7' }}>Telegram + X (draft si no hay X keys). Semi-auto 2 semanas: genera <code>data/promo-draft-YYYY-MM-DD.md</code> para tu visto bueno, luego full-auto. Cron Vercel <code>/api/cron/promo</code> + local <code>PesCatch-Promo-*</code>.</p>
        <div className="flex gap-2">
          <a href="/api/admin/promo" className="text-xs px-3 py-1 rounded" style={{ background: '#1A2535', border: '1px solid #1E3A5F', color: '#8BA3C7' }}>Preview JSON</a>
          <span className="text-xs px-3 py-1" style={{ color: '#4A6080' }}>POST /api/admin/promo → publica ahora (admin auth)</span>
        </div>
        <p className="text-xs mt-2" style={{ color: '#4A6080' }}>Comandos: <code>npm run promo:dry</code> preview · <code>npm run promo -- --apply</code> publica · <code>curl -X POST /api/cron/promo?force=1 -H &quot;Authorization: Bearer $CRON_SECRET&quot;</code></p>
      </div>

      <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <h2 className="font-bold mb-3" style={{ color: '#E8F0FE' }}>Recientes (20)</h2>
        {recent.length === 0 ? <p className="text-sm" style={{ color: '#4A6080' }}>Sin eventos.</p> : (
          <div className="space-y-1 text-xs" style={{ color: '#8BA3C7' }}>
            {recent.map(r => (
              <div key={r.clickId} className="flex gap-2 truncate">
                <span style={{ color: '#4A6080' }}>{r.timestamp?.slice(0,16)}</span>
                <span style={{ color: '#00D4FF' }}>{r.storeId}</span>
                <span className="truncate">{r.dealId}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
