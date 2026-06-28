import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/data/blog-queries'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = await getPostBySlug(slug)
    if (!post) return {}
    return { title: `${post.title} | PesCatch Blog`, description: post.excerpt }
  } catch { return {} }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 style={{ color: '#E8F0FE', fontSize: '2rem', fontWeight: 800 }}>{post.title}</h1>
      <div style={{ color: '#8BA3C7', fontSize: '1.1rem', lineHeight: 1.8, marginTop: '2rem', whiteSpace: 'pre-wrap' }}>
        {post.content}
      </div>
    </div>
  )
}
