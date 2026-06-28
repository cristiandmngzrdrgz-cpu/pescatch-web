import { NextRequest, NextResponse } from 'next/server'
import { getDealById, updateDeal, deleteDeal } from '@/data/queries'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deal = getDealById(id)
  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  return NextResponse.json(deal)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await request.json()
  const deal = updateDeal(id, data)
  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  return NextResponse.json(deal)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = deleteDeal(id)
  if (!deleted) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
