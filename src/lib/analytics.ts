import { track } from '@vercel/analytics'

export function trackDealClick(dealId: string, storeName: string, category: string) {
  track('deal_click', {
    dealId,
    store: storeName,
    category,
  })
}

export function trackDealView(dealId: string, category: string) {
  track('deal_view', {
    dealId,
    category,
  })
}

export function trackSearch(query: string, resultsCount: number) {
  track('search', {
    query,
    resultsCount,
  })
}

export function trackNewsletterSubscribe() {
  track('newsletter_subscribe')
}

export function trackContactForm() {
  track('contact_form_submit')
}
