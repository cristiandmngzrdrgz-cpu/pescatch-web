'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// El AdminLayout ya muestra el formulario de login automáticamente en
// cualquier ruta /admin/* cuando no hay sesión, así que esta página no
// necesita pintar nada propio — solo redirige a /admin, que es donde
// vive la lógica real de autenticación.
export default function AdminLoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin')
  }, [router])

  return null
}
