import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'PesCatch - Chollos de Pesca',
    template: '%s | PesCatch',
  },
  description: 'Los mejores chollos y ofertas de material de pesca en España. Carretes, cañas, señuelos y accesorios al mejor precio en Amazon, AliExpress y Decathlon.',
  keywords: ['chollos pesca', 'ofertas pesca', 'material pesca', 'cañas', 'carretes', 'señuelos', 'ahorrar pesca'],
  authors: [{ name: 'PesCatch' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'PesCatch',
    title: 'PesCatch - Chollos de Material de Pesca',
    description: 'Los mejores chollos y ofertas de material de pesca en España. Ahorra hasta un 50% en material de pesca verificado.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PesCatch - Chollos de Pesca',
    description: 'Chollos de material de pesca verificados por pescadores.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--background)', color: '#E8F0FE' }}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
