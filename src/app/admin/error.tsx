'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#0B1120' }}>
      <div className="max-w-md text-center p-8">
        <div className="text-6xl mb-6" style={{ color: '#EF4444' }}>!</div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: '#E8F0FE' }}>Error en el panel</h1>
        <p className="text-sm mb-6" style={{ color: '#8BA3C7' }}>
          Ha ocurrido un error al cargar el panel de administración.
        </p>
        {error.digest && (
          <p className="text-xs mb-6 font-mono" style={{ color: '#4A6080' }}>
            ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl transition-colors"
          style={{ background: '#00D4FF', color: '#0B1120' }}
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
