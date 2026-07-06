'use client'

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

export function FilterDrawer({ children, activeCount = 0 }: { children: React.ReactNode; activeCount?: number }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop: show directly */}
      <div className="hidden md:block">{children}</div>

      {/* Mobile: trigger button */}
      <div className="md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: '#111827',
            border: activeCount > 0 ? '1px solid rgba(0,212,255,0.4)' : '1px solid #1E3A5F',
            color: activeCount > 0 ? '#00D4FF' : '#8BA3C7',
          }}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,212,255,0.15)', color: '#00D4FF' }}>
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile: overlay drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl p-5 pb-8"
            style={{
              background: '#0F1A2E',
              border: '1px solid #1E3A5F',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-bold" style={{ color: '#E8F0FE' }}>Filtros</span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#1A2535' }}
              >
                <X className="h-4 w-4" style={{ color: '#8BA3C7' }} />
              </button>
            </div>
            <div className="space-y-5">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
