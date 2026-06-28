import { NextRequest, NextResponse } from 'next/server'
import { getPosts, createPost } from '@/data/blog-queries'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = parseInt(searchParams.get('offset') || '0')
  const posts = await getPosts(limit, offset)
  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  const post = await createPost(data)
  return NextResponse.json(post, { status: 201 })
}
