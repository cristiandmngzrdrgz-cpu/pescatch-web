import { NextRequest, NextResponse } from 'next/server'
import { getDealById, updateDeal, deleteDeal } from '@/data/queries'
import { adminApiCheck } from '@/lib/admin-auth'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deal = await getDealById(id)
  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  return NextResponse.json(deal)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const { id } = await params
  const data = await request.json()
  const deal = await updateDeal(id, data)
  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  return NextResponse.json(deal)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const { id } = await params
  const deleted = await deleteDeal(id)
  if (!deleted) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
