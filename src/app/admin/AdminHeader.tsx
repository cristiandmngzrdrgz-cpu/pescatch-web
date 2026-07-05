'use client'

import PageTitle from './PageTitle'
import LogoutButton from './LogoutButton'

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-700 bg-[#0B1120]">
      <PageTitle />
      <LogoutButton />
    </header>
  )
}