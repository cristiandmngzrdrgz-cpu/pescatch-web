import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'contents.mediadecathlon.com' },
      { protocol: 'https', hostname: 'ae01.alicdn.com' },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
