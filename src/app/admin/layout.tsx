import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { AdminLogin } from './admin-login'
import AdminHeader from './AdminHeader'
import AdminSidebar from './AdminSidebar'
import MobileSidebar from './MobileSidebar'

export const metadata: Metadata = {
  title: 'Panel Admin - PesCatch',
  robots: { index: false, follow: false },
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
    <>
    <div className="flex min-h-[calc(100vh-68px)]" style={{ background: '#0B1120' }}>
      <AdminSidebar />

      <div className="flex-1 overflow-auto">
        <AdminHeader />
        <div className="p-6 lg:p-8 max-w-6xl">
          {children}
        </div>
      </div>
    </div>
    <MobileSidebar />
    <Toaster position="top-right" richColors theme="dark" />
    </>
  )
}
