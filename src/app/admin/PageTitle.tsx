'use client'

import { usePathname } from 'next/navigation'

const titleMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/deals': 'Chollos',
  '/admin/deals/new': 'Nuevo chollo',
  '/admin/blog': 'Blog',
  '/admin/blog/new': 'Nuevo post',
  '/admin/comments': 'Comentarios',
  '/admin/sync': 'Sync',
}

export function getPageTitle(pathname: string): string {
  if (titleMap[pathname]) return titleMap[pathname]

  if (pathname.match(/^\/admin\/deals\/[^/]+\/edit$/)) return 'Editar chollo'
  if (pathname.match(/^\/admin\/blog\/[^/]+\/edit$/)) return 'Editar post'

  const basePath = pathname.split('/').slice(0, 3).join('/')
  return titleMap[basePath] || 'Admin Panel'
}

export default function PageTitle() {
  const pathname = usePathname()
  return (
    <h1 className="text-lg font-semibold" style={{ color: '#E8F0FE' }}>
      {getPageTitle(pathname)}
    </h1>
  )
}