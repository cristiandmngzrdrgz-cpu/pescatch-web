import Link from 'next/link'
import Image from 'next/image'
import { Fish } from 'lucide-react'
import { NewsletterForm } from './newsletter-form'

export function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className="relative overflow-hidden" style={{ background: '#0A1326', borderTop: '1px solid rgba(30,58,95,0.5)' }}>
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <Image src="/images/cat-nautica.jpg" alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div className="mx-auto max-w-7xl px-4 relative z-10">
        <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-x-12 py-16">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #00D4FF, #1A2535)', boxShadow: '0 0 12px rgba(0,212,255,0.2)' }}>
                <Fish className="h-4 w-4" style={{ color: '#FFFFFF' }} />
              </div>
              <span className="font-extrabold text-lg tracking-tight" style={{ color: '#E8F0FE' }}>PesCatch</span>
            </div>
            <p className="text-sm leading-relaxed max-w-md" style={{ color: '#4A6080' }}>
              La plataforma líder en chollos de pesca en España. Buscamos, verificamos y publicamos las mejores ofertas en material de pesca para que ahorres en tu pasión.
            </p>
            <div className="mt-5">
              <label className="text-sm block mb-2.5 font-medium" style={{ color: '#8BA3C7' }}>Recibe los mejores chollos en tu email</label>
              <NewsletterForm />
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider" style={{ color: '#E8F0FE' }}>Enlaces</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/search', label: 'Buscar Ofertas' },
                { href: '/categories', label: 'Categorías' },
                { href: '/about', label: 'Sobre Nosotros' },
                { href: '/contact', label: 'Contacto' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors duration-200 hover:text-[#00D4FF] hover:translate-x-1 inline-block"
                    style={{ color: '#4A6080' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider" style={{ color: '#E8F0FE' }}>Legal</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/privacy', label: 'Privacidad' },
                { href: '/terms', label: 'Términos' },
                { href: '/cookies', label: 'Cookies' },
                { href: '/affiliate', label: 'Afiliados' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors duration-200 hover:text-[#00D4FF] hover:translate-x-1 inline-block"
                    style={{ color: '#4A6080' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="py-6 flex flex-col sm:flex-row justify-between items-center gap-2"
          style={{ borderTop: '1px solid rgba(30,58,95,0.3)' }}>
          <p className="text-xs" style={{ color: '#4A6080' }}>
            &copy; {currentYear} PesCatch. Todos los derechos reservados.
          </p>
          <p className="text-xs text-center sm:text-right max-w-md" style={{ color: '#4A6080' }}>
            En calidad de Afiliado de Amazon, obtenemos ingresos por las compras adscritas que cumplen los requisitos aplicables.{' '}
            <Link href="/affiliate" className="hover:underline font-medium" style={{ color: '#00D4FF' }}>
              Más info
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
