import { NextRequest, NextResponse } from 'next/server'
import { cancelPriceAlert } from '@/lib/price-alerts'

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  const dealId = request.nextUrl.searchParams.get('dealId')
  const slug = request.nextUrl.searchParams.get('slug')

  if (!email || !dealId) {
    return NextResponse.redirect(new URL('/?alert-cancelled=missing', request.url))
  }

  await cancelPriceAlert(email.toLowerCase(), dealId)

  if (slug) {
    return NextResponse.redirect(new URL(`/deals/${slug}?alert-cancelled=true`, request.url))
  }
  return NextResponse.redirect(new URL('/?alert-cancelled=true', request.url))
}