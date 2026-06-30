'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

export default function SyncPage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [output, setOutput] = useState('')

  const handleSync = async () => {
    setStatus('running')
    setOutput('')

    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setOutput(data.message || 'Sync completado correctamente.')
      } else {
        setStatus('error')
        setOutput(data.error || 'Error desconocido')
      }
    } catch (err) {
      setStatus('error')
      setOutput((err as Error).message || 'Error de conexión')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#E8F0FE' }}>Sincronización</h1>
          <p className="text-sm mt-1" style={{ color: '#8BA3C7' }}>Sincroniza datos desde Google Sheets a la base de datos local</p>
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold" style={{ color: '#E8F0FE' }}>Google Sheets Sync</h2>
            <p className="text-sm mt-1" style={{ color: '#8BA3C7' }}>Sheet ID: 1h1T46ckMSZ73QSnX88ELxRQNiAyURxugOj3QEZH4IZc</p>
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

        {status === 'success' && (
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(38,222,129,0.1)', border: '1px solid rgba(38,222,129,0.3)' }}>
            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#26DE81' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: '#26DE81' }}>Sync completado</p>
              <p className="text-sm mt-0.5" style={{ color: '#8BA3C7' }}>{output}</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: '#EF4444' }}>Error de sincronización</p>
              <p className="text-sm mt-0.5" style={{ color: '#8BA3C7' }}>{output}</p>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4" style={{ borderTop: '1px solid #1E3A5F' }}>
          <p className="text-xs" style={{ color: '#4A6080' }}>
            También puedes ejecutar <code style={{ color: '#00D4FF' }}>npm run sync</code> en la terminal para sincronizar desde la línea de comandos.
            Asegúrate de que <code style={{ color: '#00D4FF' }}>.env.google-sheets.json</code> existe con las credenciales del service account.
          </p>
        </div>
      </div>
    </div>
  )
}
