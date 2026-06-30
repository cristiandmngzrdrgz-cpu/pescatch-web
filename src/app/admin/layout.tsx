import type { Metadata } from 'next'
import Link from 'next/link'
import { Fish, LayoutDashboard, PlusCircle, List, ArrowLeft, Newspaper, MessageSquare, RefreshCw } from 'lucide-react'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { AdminLogin } from './admin-login'

export const metadata: Metadata = {
  title: 'Panel Admin - PesCatch',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authed = await isAdminAuthenticated()

  if (!authed) {
    return <AdminLogin />
  }

  return (
    <div className="flex min-h-[calc(100vh-68px)]" style={{ background: '#0B1120' }}>
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
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{ color: '#8BA3C7' }}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="mt-2 mb-1 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A6080' }}>Chollos</div>
          <Link
            href="/admin/deals"
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{ color: '#8BA3C7' }}
          >
            <List className="h-4 w-4" />
            Todos los chollos
          </Link>
          <Link
            href="/admin/deals/new"
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{ color: '#8BA3C7' }}
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo chollo
          </Link>

          <div className="mt-3 mb-1 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A6080' }}>Blog</div>
          <Link
            href="/admin/blog"
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{ color: '#8BA3C7' }}
          >
            <Newspaper className="h-4 w-4" />
            Todos los posts
          </Link>
          <Link
            href="/admin/blog/new"
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{ color: '#8BA3C7' }}
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo post
          </Link>

          <div className="mt-3 mb-1 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A6080' }}>Gestión</div>
          <Link
            href="/admin/comments"
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{ color: '#8BA3C7' }}
          >
            <MessageSquare className="h-4 w-4" />
            Comentarios
          </Link>
          <Link
            href="/admin/sync"
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{ color: '#8BA3C7' }}
          >
            <RefreshCw className="h-4 w-4" />
            Sync
          </Link>
        </nav>

        <Link
          href="/"
          className="flex items-center gap-2 text-sm pt-4 mt-4 transition-colors"
          style={{ color: '#4A6080', borderTop: '1px solid #1E3A5F' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la web
        </Link>
      </aside>

      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-6xl">
          {children}
        </div>
      </div>
    </div>
  )
}
