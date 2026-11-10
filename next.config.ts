import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // El slug antiguo se quedó con el título/imagen del Ninja X 2,70 m tras un cruce de sync.
        // Se redirige a la ficha correcta para no perder enlaces ni posicionamiento.
        source: '/deals/daiwa-caa-de-pescar-spinning-ninja-x-spin',
        destination: '/deals/daiwa-ninja-x-spin-270-m-15-50-g',
        permanent: true,
      },
      {
        // El deal se titulaba "Socorro SW" pero apuntaba al ASIN del Saragosa.
        // Al separarlos, la ficha de Socorro pasa a llevar la talla en el slug.
        source: '/deals/shimano-socorro-sw-carrete-de-pesca-de-agua-salada',
        destination: '/deals/shimano-socorro-sw-10000',
        permanent: true,
      },
      {
        // La ficha del Sienna FG 4000 quedó titulada como 2500 por una fila residual
        // de Decathlon. El slug bueno es el del 4000; el viejo se conserva con 308.
        source: '/deals/shimano-carrete-spinning-sienna-fg-2500',
        destination: '/deals/shimano-sienna-fg-4000---carrete-spinning',
        permanent: true,
      },
      {
        // Variante sin los guiones del nombre ("- Carrete") usada en un post del blog.
        source: '/deals/shimano-sienna-fg-4000',
        destination: '/deals/shimano-sienna-fg-4000---carrete-spinning',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/ads.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      },
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'contents.mediadecathlon.com' },
      { protocol: 'https', hostname: 'ae01.alicdn.com' },
      { protocol: 'https', hostname: 'ae-pic-a1.aliexpress-media.com' },
      { protocol: 'https', hostname: '**.aliexpress-media.com' },
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
