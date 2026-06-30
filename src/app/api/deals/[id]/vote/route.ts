import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { vote } = await request.json()

  if (vote !== 'up' && vote !== 'down') {
    return NextResponse.json({ error: 'vote must be "up" or "down"' }, { status: 400 })
  }

  const { voteDeal } = await import('@/data/queries')
  const result = await voteDeal(id, vote)
  if (!result) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  return NextResponse.json(result)
}
