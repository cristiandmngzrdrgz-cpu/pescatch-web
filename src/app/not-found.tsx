'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4" style={{ background: '#0B1120' }}>
      <div className="text-center max-w-md">
        <div className="text-6xl font-extrabold mb-4" style={{ color: '#1E3A5F' }}>404</div>
        <h1 className="text-2xl font-extrabold mb-3" style={{ color: '#E8F0FE' }}>Página no encontrada</h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: '#8BA3C7' }}>
          El chollo o la página que buscas no existe o ha sido eliminada.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 font-semibold text-sm rounded-xl transition-all hover:scale-105"
          style={{ background: '#00D4FF', color: '#0B1120' }}
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
