'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  RefreshCw, CheckCircle2, AlertCircle,
  Package, ShoppingCart, FileText, Clock,
  ChevronDown, ChevronRight, XCircle, Database
} from 'lucide-react'
import type { SyncRunResult, SyncLogEntry, DbStats } from '@/lib/run-sync'

interface SyncStatsResponse {
  dbStats: DbStats
  lastSync: SyncLogEntry | null
  history: SyncLogEntry[]
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hace unos segundos'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function SyncPage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<SyncRunResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [showLog, setShowLog] = useState(false)
  const [stats, setStats] = useState<SyncStatsResponse | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadStats() {
      try {
        const res = await fetch('/api/sync?mode=stats')
        if (res.ok && !cancelled) {
          const data = await res.json()
          setStats(data)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setStatsLoading(false)
      }
    }
    loadStats()
    return () => { cancelled = true }
  }, [])

  const refetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/sync?mode=stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleSync = async () => {
    setStatus('running')
    setResult(null)
    setErrorMessage('')
    setShowLog(false)

    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        setStatus('success')
        refetchStats()
      } else {
        setStatus('error')
        setErrorMessage(data.error || 'Error desconocido')
      }
    } catch (err) {
      setStatus('error')
      setErrorMessage((err as Error).message || 'Error de conexión')
    }
  }

  const hasErrors = result && result.errors.length > 0

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,212,255,0.1)' }}>
          <Database className="h-5 w-5" style={{ color: '#00D4FF' }} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>Sincronización</h1>
          <p className="text-sm mt-1" style={{ color: '#8BA3C7' }}>Sincroniza datos desde Google Sheets a la base de datos local</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)' }}>
              <Package className="h-5 w-5" style={{ color: '#00D4FF' }} />
            </div>
            <div>
              <p className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>
                {statsLoading ? '-' : stats?.dbStats.products ?? 0}
              </p>
              <p className="text-sm" style={{ color: '#8BA3C7' }}>Productos</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.1)' }}>
              <ShoppingCart className="h-5 w-5" style={{ color: '#FFB800' }} />
            </div>
            <div>
              <p className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>
                {statsLoading ? '-' : stats?.dbStats.deals ?? 0}
              </p>
              <p className="text-sm" style={{ color: '#8BA3C7' }}>Chollos</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(38,222,129,0.1)' }}>
              <FileText className="h-5 w-5" style={{ color: '#26DE81' }} />
            </div>
            <div>
              <p className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>
                {statsLoading ? '-' : stats?.dbStats.posts ?? 0}
              </p>
              <p className="text-sm" style={{ color: '#8BA3C7' }}>Artículos</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,163,199,0.1)' }}>
              <Clock className="h-5 w-5" style={{ color: '#8BA3C7' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#E8F0FE' }}>
                {statsLoading ? '-' : stats?.lastSync ? timeAgo(stats.lastSync.created_at) : 'Nunca'}
              </p>
              <p className="text-sm" style={{ color: '#8BA3C7' }}>Último sync</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main sync card */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Google Sheets Sync</h2>
            <p className="text-sm mt-1" style={{ color: '#8BA3C7' }}>
              Sheet ID: 1h1T46ckMSZ73QSnX88ELxRQNiAyURxugOj3QEZH4IZc
              {stats?.lastSync && (
                <span className="ml-3" style={{ color: '#4A6080' }}>
                  &middot; Último: {formatDate(stats.lastSync.created_at)}
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={handleSync}
            disabled={status === 'running'}
            className="h-11 px-6 font-semibold rounded-xl"
            style={{ background: status === 'running' ? '#1A2535' : '#00D4FF', color: status === 'running' ? '#4A6080' : '#0B1120' }}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${status === 'running' ? 'animate-spin' : ''}`} />
            {status === 'running' ? 'Sincronizando...' : 'Iniciar sync'}
          </Button>
        </div>

        {/* Result cards */}
        {status === 'success' && result && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
              <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(38,222,129,0.1)', border: '1px solid rgba(38,222,129,0.3)' }}>
                <p className="text-2xl font-extrabold" style={{ color: '#26DE81' }}>{result.created}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: '#26DE81' }}>Creados</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)' }}>
                <p className="text-2xl font-extrabold" style={{ color: '#00D4FF' }}>{result.updated}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: '#00D4FF' }}>Actualizados</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(139,163,199,0.1)', border: '1px solid rgba(139,163,199,0.3)' }}>
                <p className="text-2xl font-extrabold" style={{ color: '#8BA3C7' }}>{result.skipped}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: '#8BA3C7' }}>Omitidos</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: result.hiddenOrphans > 0 ? 'rgba(255,184,0,0.1)' : 'rgba(139,163,199,0.1)', border: result.hiddenOrphans > 0 ? '1px solid rgba(255,184,0,0.3)' : '1px solid rgba(139,163,199,0.3)' }}>
                <p className="text-2xl font-extrabold" style={{ color: result.hiddenOrphans > 0 ? '#FFB800' : '#8BA3C7' }}>{result.hiddenOrphans}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: result.hiddenOrphans > 0 ? '#FFB800' : '#8BA3C7' }}>Ocultados</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: hasErrors ? 'rgba(239,68,68,0.1)' : 'rgba(38,222,129,0.1)', border: hasErrors ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(38,222,129,0.3)' }}>
                <p className="text-2xl font-extrabold" style={{ color: hasErrors ? '#EF4444' : '#26DE81' }}>{result.errors.length}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: hasErrors ? '#EF4444' : '#26DE81' }}>Errores</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs mb-4" style={{ color: '#4A6080' }}>
              <span>{result.rowsProcessed} productos procesados</span>
              <span>&middot;</span>
              <span>{formatMs(result.durationMs)} de duración</span>
            </div>

            {/* Collapsible log */}
            {(result.errors.length > 0 || result.created > 0 || result.updated > 0) && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #1E3A5F' }}>
                <button
                  onClick={() => setShowLog(!showLog)}
                  className="flex items-center gap-2 text-sm font-semibold w-full py-2 rounded-lg transition-colors hover:bg-[#1A2535] px-3"
                  style={{ color: '#8BA3C7' }}
                >
                  {showLog ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Ver detalle por producto
                </button>

                {showLog && (
                  <div className="mt-3 space-y-1 max-h-64 overflow-y-auto rounded-xl p-3" style={{ background: '#0B1120', border: '1px solid #1E3A5F' }}>
                    {result.errors.map((err, i) => (
                      <div key={`err-${i}`} className="flex items-start gap-2 text-sm py-1.5 px-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)' }}>
                        <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
                        <span style={{ color: '#FCA5A5' }}>{err}</span>
                      </div>
                    ))}
                    {result.created > 0 && (
                      <div className="flex items-center gap-2 text-sm py-1.5 px-2" style={{ color: '#26DE81' }}>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{result.created} producto{result.created !== 1 ? 's' : ''} creado{result.created !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {result.updated > 0 && (
                      <div className="flex items-center gap-2 text-sm py-1.5 px-2" style={{ color: '#00D4FF' }}>
                        <RefreshCw className="h-4 w-4" />
                        <span>{result.updated} producto{result.updated !== 1 ? 's' : ''} actualizado{result.updated !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: '#EF4444' }}>Error de sincronización</p>
              <p className="text-sm mt-0.5" style={{ color: '#8BA3C7' }}>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid #1E3A5F' }}>
          <p className="text-xs" style={{ color: '#4A6080' }}>
            También puedes ejecutar <code style={{ color: '#00D4FF' }}>npm run sync</code> en la terminal para sincronizar desde la línea de comandos.
            Asegúrate de que <code style={{ color: '#00D4FF' }}>.env.google-sheets.json</code> existe con las credenciales del service account.
          </p>
        </div>
      </div>

      {/* Sync history */}
      {stats && stats.history.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #1E3A5F' }}>
            <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Historial de sincronizaciones</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1A2535', borderBottom: '1px solid #1E3A5F' }}>
                  <th className="text-left px-5 py-3.5 font-semibold uppercase tracking-wider text-xs" style={{ color: '#8BA3C7' }}>Fecha</th>
                  <th className="text-left px-5 py-3.5 font-semibold uppercase tracking-wider text-xs" style={{ color: '#8BA3C7' }}>Duración</th>
                  <th className="text-center px-5 py-3.5 font-semibold uppercase tracking-wider text-xs" style={{ color: '#8BA3C7' }}>Creados</th>
                  <th className="text-center px-5 py-3.5 font-semibold uppercase tracking-wider text-xs" style={{ color: '#8BA3C7' }}>Actualizados</th>
                  <th className="text-center px-5 py-3.5 font-semibold uppercase tracking-wider text-xs" style={{ color: '#8BA3C7' }}>Ocultos</th>
                  <th className="text-center px-5 py-3.5 font-semibold uppercase tracking-wider text-xs" style={{ color: '#8BA3C7' }}>Errores</th>
                </tr>
              </thead>
              <tbody>
                {stats.history.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #1E3A5F' }}>
                    <td className="px-5 py-4" style={{ color: '#E8F0FE' }}>{formatDate(entry.created_at)}</td>
                    <td className="px-5 py-4" style={{ color: '#8BA3C7' }}>{formatMs(entry.duration_ms)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(38,222,129,0.1)', color: '#26DE81' }}>
                        {entry.created}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>
                        {entry.updated}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{
                        background: entry.hidden_orphans > 0 ? 'rgba(255,184,0,0.1)' : 'rgba(139,163,199,0.1)',
                        color: entry.hidden_orphans > 0 ? '#FFB800' : '#8BA3C7'
                      }}>
                        {entry.hidden_orphans}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{
                        background: entry.errors.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(38,222,129,0.1)',
                        color: entry.errors.length > 0 ? '#EF4444' : '#26DE81'
                      }}>
                        {entry.errors.length}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
