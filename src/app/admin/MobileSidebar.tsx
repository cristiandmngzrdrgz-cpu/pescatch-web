'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fish, LayoutDashboard, List, PlusCircle, Newspaper, MessageSquare, RefreshCw, ArrowLeft, Menu, X, ClipboardList } from 'lucide-react'

export default function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const linkClass = (href: string) =>
    `block px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
      pathname === href ? 'text-[#00D4FF]' : 'text-[#8BA3C7]'
    }`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: '#00D4FF', color: '#0B1120' }}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 p-5 overflow-y-auto" style={{ background: '#111827' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1A2535' }}>
                  <Fish className="h-4 w-4" style={{ color: '#00D4FF' }} />
                </div>
                <div>
                  <div className="font-extrabold leading-tight" style={{ color: '#E8F0FE' }}>PesCatch</div>
                  <div className="text-xs mt-[-2px]" style={{ color: '#4A6080' }}>Admin Panel</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ color: '#8BA3C7' }} aria-label="Cerrar menú">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              <Link href="/admin" onClick={() => setOpen(false)} className={linkClass('/admin')}>
                <LayoutDashboard className="h-4 w-4 inline mr-2" />Dashboard
              </Link>

              <div className="mt-3 mb-1 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A6080' }}>Chollos</div>
              <Link href="/admin/deals" onClick={() => setOpen(false)} className={linkClass('/admin/deals')}>
                <List className="h-4 w-4 inline mr-2" />Todos los chollos
              </Link>
              <Link href="/admin/deals/new" onClick={() => setOpen(false)} className={linkClass('/admin/deals/new')}>
                <PlusCircle className="h-4 w-4 inline mr-2" />Nuevo chollo
              </Link>

              <div className="mt-3 mb-1 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A6080' }}>Blog</div>
              <Link href="/admin/blog" onClick={() => setOpen(false)} className={linkClass('/admin/blog')}>
                <Newspaper className="h-4 w-4 inline mr-2" />Todos los posts
              </Link>
              <Link href="/admin/blog/new" onClick={() => setOpen(false)} className={linkClass('/admin/blog/new')}>
                <PlusCircle className="h-4 w-4 inline mr-2" />Nuevo post
              </Link>

              <div className="mt-3 mb-1 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A6080' }}>Gestión</div>
              <Link href="/admin/candidates" onClick={() => setOpen(false)} className={linkClass('/admin/candidates')}>
                <ClipboardList className="h-4 w-4 inline mr-2" />Candidatos
              </Link>
              <Link href="/admin/comments" onClick={() => setOpen(false)} className={linkClass('/admin/comments')}>
                <MessageSquare className="h-4 w-4 inline mr-2" />Comentarios
              </Link>
              <Link href="/admin/sync" onClick={() => setOpen(false)} className={linkClass('/admin/sync')}>
                <RefreshCw className="h-4 w-4 inline mr-2" />Sync
              </Link>
            </nav>

            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-sm mt-6 pt-4"
              style={{ color: '#4A6080', borderTop: '1px solid #1E3A5F' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a la web
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
