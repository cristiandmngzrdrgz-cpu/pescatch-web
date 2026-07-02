import type { Deal, ProductGroup } from '@/types'

export function groupDealsByProduct(deals: Deal[]): ProductGroup[] {
  const groups = new Map<string, { productId: string; deals: Deal[] }>()

  for (const deal of deals) {
    const key = deal.productId || deal.id
    const existing = groups.get(key)
    if (existing) {
      existing.deals.push(deal)
    } else {
      groups.set(key, { productId: deal.productId, deals: [deal] })
    }
  }

  const result: ProductGroup[] = []

  for (const { productId, deals: groupDeals } of groups.values()) {
    groupDeals.sort((a, b) => a.salePrice - b.salePrice)

    const best = groupDeals[0]
    const storeCount = groupDeals.length
    const hasMultipleStores = storeCount > 1

    result.push({
      productId,
      title: best.title,
      slug: best.slug,
      review: best.review || '',
      technicalSpecs: best.technicalSpecs || {},
      pros: best.pros || [],
      cons: best.cons || [],
      imageUrl: best.imageUrl || '',
      images: best.images || [],
      category: best.category,
      deals: groupDeals,
      bestPrice: best.salePrice,
      bestStore: best.store.name,
      storeCount,
      discountPercent: hasMultipleStores
        ? Math.max(...groupDeals.map(d => d.discountPercent))
        : best.discountPercent,
    })
  }

  result.sort((a, b) => b.bestPrice - a.bestPrice)

  return result
}
