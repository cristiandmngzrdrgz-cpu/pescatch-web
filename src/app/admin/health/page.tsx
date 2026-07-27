import { getScrapingHealthStats } from '@/lib/scraping-health'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function HealthPage() {
  if (!await isAdminAuthenticated()) {
    redirect('/admin/login')
  }

  const stats = await getScrapingHealthStats(7)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scraping Health</h1>
        <p className="text-muted-foreground">Estado del scraping de precios (últimos 7 días)</p>
      </div>

      {stats.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No hay datos de scraping todavía. Ejecuta <code>npm run refresh-prices</code> para generar datos.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((store) => (
            <div key={store.store_id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold capitalize">{store.store_id}</h2>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  store.success_rate >= 80 ? 'bg-green-100 text-green-800' :
                  store.success_rate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {store.success_rate}% éxito
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Éxitos:</span>
                  <span className="ml-1 font-medium">{store.total_success}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fallos:</span>
                  <span className="ml-1 font-medium">{store.total_fail}</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Última ejecución: {new Date(store.last_run).toLocaleString('es-ES')}
              </div>

              {store.recent_errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-red-600 mb-1">Errores recientes:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
                    {store.recent_errors.slice(0, 3).map((err, i) => (
                      <li key={i} className="truncate">• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
