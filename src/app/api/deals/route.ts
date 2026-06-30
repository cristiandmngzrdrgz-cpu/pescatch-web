import { NextRequest, NextResponse } from 'next/server'
import { getDeals, createDeal } from '@/data/queries'
import { adminApiCheck } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filters = {
    category: searchParams.get('category') || undefined,
    subcategory: searchParams.get('subcategory') || undefined,
    search: searchParams.get('search') || undefined,
    sortBy: (searchParams.get('sortBy') || undefined) as 'discount' | 'price_asc' | 'price_desc' | 'newest' | 'popular' | undefined,
    minDiscount: searchParams.get('minDiscount') !== null ? Number(searchParams.get('minDiscount')) : undefined,
    maxPrice: searchParams.get('maxPrice') !== null ? Number(searchParams.get('maxPrice')) : undefined,
  }

  const deals = await getDeals(filters)
  return NextResponse.json(deals)
}

export async function POST(request: NextRequest) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const data = await request.json()
  const deal = await createDeal(data)
  return NextResponse.json(deal, { status: 201 })
}
