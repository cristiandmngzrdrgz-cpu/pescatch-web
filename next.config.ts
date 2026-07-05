import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
