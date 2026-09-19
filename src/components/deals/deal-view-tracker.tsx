'use client'
import { useEffect } from 'react'
import { trackDealView } from '@/lib/analytics'

export function DealViewTracker({ dealId, category }: { dealId: string; category: string }) {
  useEffect(() => {
    trackDealView(dealId, category)
  }, [dealId, category])
  return null
}
