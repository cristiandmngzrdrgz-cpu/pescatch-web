'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fish, LayoutDashboard, List, PlusCircle, ArrowLeft, Newspaper, MessageSquare, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'

function NavLink({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors"
      style={{
        background: active ? 'rgba(0,212,255,0.08)' : 'transparent',
        color: active ? '#00D4FF' : '#8BA3C7',
      }}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

function NavGroup({ label, icon: Icon, children, isActive }: { label: string; icon: React.ElementType; children: React.ReactNode; isActive: boolean }) {
  const [open, setOpen] = useState(isActive)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-colors"
        style={{ color: '#8BA3C7' }}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && <div className="ml-2 mt-0.5 flex flex-col gap-0.5">{children}</div>}
    </div>
  )
}

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-60 flex-col p-5" style={{ background: '#111827', borderRight: '1px solid #1E3A5F' }}>
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1A2535' }}>
          <Fish className="h-4 w-4" style={{ color: '#00D4FF' }} />
        </div>
        <div>
          <div className="font-extrabold leading-tight" style={{ color: '#E8F0FE' }}>PesCatch</div>
          <div className="text-xs mt-[-2px]" style={{ color: '#4A6080' }}>Admin Panel</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        <NavLink href="/admin" icon={LayoutDashboard} label="Dashboard" active={pathname === '/admin'} />

        <div className="mt-2 mb-1 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A6080' }}>Chollos</div>
        <NavGroup label="Chollos" icon={List} isActive={pathname.startsWith('/admin/deals')}>
          <NavLink href="/admin/deals" icon={List} label="Todos los chollos" active={pathname === '/admin/deals'} />
          <NavLink href="/admin/deals/new" icon={PlusCircle} label="Nuevo chollo" active={pathname === '/admin/deals/new'} />
        </NavGroup>

        <div className="mt-3 mb-1 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A6080' }}>Blog</div>
        <NavGroup label="Blog" icon={Newspaper} isActive={pathname.startsWith('/admin/blog')}>
          <NavLink href="/admin/blog" icon={Newspaper} label="Todos los posts" active={pathname === '/admin/blog'} />
          <NavLink href="/admin/blog/new" icon={PlusCircle} label="Nuevo post" active={pathname === '/admin/blog/new'} />
        </NavGroup>

        <div className="mt-3 mb-1 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A6080' }}>Gestión</div>
        <NavLink href="/admin/comments" icon={MessageSquare} label="Comentarios" active={pathname === '/admin/comments'} />
        <NavLink href="/admin/sync" icon={RefreshCw} label="Sync" active={pathname === '/admin/sync'} />
      </nav>

      <Link
        href="/"
        className="flex items-center gap-2 text-sm pt-4 mt-4 transition-colors hover:text-[#8BA3C7]"
        style={{ color: '#4A6080', borderTop: '1px solid #1E3A5F' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la web
      </Link>
    </aside>
  )
}
