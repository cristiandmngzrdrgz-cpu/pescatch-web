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

const BASE_URL = 'https://pescatch.es'

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PesCatch',
  url: BASE_URL,
  logo: `${BASE_URL}/images/logo.png`,
  sameAs: [
    'https://twitter.com/pescatches',
    'https://www.facebook.com/pescatches',
    'https://www.instagram.com/pescatches',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+34-000-000-000',
    contactType: 'customer service',
    availableLanguage: ['Spanish'],
  },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'PesCatch',
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export const metadata: Metadata = {
  title: {
    default: 'PesCatch - Chollos de Pesca',
    template: '%s | PesCatch',
  },
  description: 'Los mejores chollos y ofertas de material de pesca en España. Carretes, cañas, señuelos y accesorios al mejor precio en Amazon, AliExpress y Decathlon.',
  keywords: ['chollos pesca', 'ofertas pesca', 'material pesca', 'cañas', 'carretes', 'señuelos', 'ahorrar pesca'],
  authors: [{ name: 'PesCatch' }],
  creator: 'PesCatch',
  publisher: 'PesCatch',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'PesCatch',
    title: 'PesCatch - Chollos de Material de Pesca',
    description: 'Los mejores chollos y ofertas de material de pesca en España. Ahorra hasta un 50% en material de pesca verificado.',
    url: BASE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PesCatch - Chollos de Pesca',
    description: 'Chollos de material de pesca verificados por pescadores.',
    creator: '@pescatches',
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationSchema, websiteSchema]) }}
        />
        <link rel="canonical" href={BASE_URL} />
        <link rel="alternate" type="application/rss+xml" title="PesCatch RSS Feed" href={`${BASE_URL}/rss.xml`} />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--background)', color: '#E8F0FE' }}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}