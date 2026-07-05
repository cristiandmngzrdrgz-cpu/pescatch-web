'use client'

import Link from 'next/link'
import { Fish, Anchor, Wind, Target, Backpack } from 'lucide-react'

const SUGGESTED = [
  { href: '/categories/carretes', label: 'Carretes', icon: 'Anchor' },
  { href: '/categories/canas', label: 'Cañas', icon: 'Wind' },
  { href: '/categories/senuelos', label: 'Señuelos', icon: 'Target' },
  { href: '/categories/accesorios', label: 'Accesorios', icon: 'Backpack' },
]

const iconMap: Record<string, React.ReactNode> = {
  Anchor: <Anchor className="h-4 w-4" />,
  Wind: <Wind className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  Backpack: <Backpack className="h-4 w-4" />,
}

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4" style={{ background: '#0B1120' }}>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ background: '#1A2535', boxShadow: '0 0 20px rgba(0,212,255,0.1)' }}>
          <Fish className="h-8 w-8" style={{ color: '#00D4FF' }} />
        </div>
        <div className="text-6xl font-extrabold mb-2" style={{ color: '#1E3A5F' }}>404</div>
        <h1 className="text-2xl font-extrabold mb-3" style={{ color: '#E8F0FE' }}>Página no encontrada</h1>
        <p className="text-sm mb-8 leading-relaxed max-w-xs mx-auto" style={{ color: '#8BA3C7' }}>
          El chollo o la página que buscas no existe o ha sido eliminada.
        </p>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#4A6080' }}>Explora por categoría</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SUGGESTED.map((item) => (
              <Link key={item.href} href={item.href}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full transition-all duration-200 hover:border-[#00D4FF]/50 hover:text-[#00D4FF]"
                style={{ background: '#111827', border: '1px solid #1E3A5F', color: '#8BA3C7' }}>
                {iconMap[item.icon]}
                {item.label}
              </Link>
            ))}
          </div>
        </div>

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
