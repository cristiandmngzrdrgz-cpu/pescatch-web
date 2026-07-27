import { FISHING_WORDS, NON_FISHING_WORDS, FISHING_BRANDS } from './constants'

export function isFishingProduct(title: string, keyword: string): boolean {
  const lower = title.toLowerCase()
  const kwLower = keyword.toLowerCase()

  if (FISHING_BRANDS.some(b => kwLower.includes(b) || lower.includes(b))) return true

  if (!FISHING_WORDS.some(w => lower.includes(w))) return false

  if (NON_FISHING_WORDS.some(w => lower.includes(w))) return false

  return true
}
