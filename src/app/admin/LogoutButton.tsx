'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/login', { method: 'DELETE' })
      if (response.ok) {
        toast.success('Sesión cerrada correctamente')
        router.push('/admin')
        router.refresh()
      } else {
        toast.error('Error al cerrar sesión')
      }
    } catch {
      toast.error('Error al cerrar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-1 text-sm"
      style={{ color: '#8BA3C7' }}
      aria-label="Cerrar sesión"
    >
      <LogOut className="h-4 w-4" />
      {isLoading ? 'Cerrando...' : 'Cerrar sesión'}
    </Button>
  )
}