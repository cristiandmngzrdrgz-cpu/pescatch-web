'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Fish } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4" style={{ background: '#0B1120' }}>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,71,87,0.1)' }}>
          <Fish className="h-8 w-8" style={{ color: '#FF4757' }} />
        </div>
        <h1 className="text-2xl font-extrabold mb-3" style={{ color: '#E8F0FE' }}>Algo salió mal</h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: '#8BA3C7' }}>
          Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o volver al inicio.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 font-semibold text-sm rounded-xl transition-all hover:scale-105"
            style={{ background: '#00D4FF', color: '#0B1120' }}
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 font-semibold text-sm rounded-xl transition-all hover:scale-105"
            style={{ background: '#1A2535', border: '1px solid #1E3A5F', color: '#8BA3C7' }}
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
