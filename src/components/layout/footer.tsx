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
            <a
              href="https://t.me/pescatch"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 hover:gap-3 no-underline"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Únete al canal de Telegram
            </a>
          </div>

          <div>
            <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider" style={{ color: '#E8F0FE' }}>Enlaces</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/top-chollos', label: 'Top Chollos' },
                { href: '/chollos-hoy', label: 'Chollos de Hoy' },
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
