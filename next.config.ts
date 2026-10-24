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
