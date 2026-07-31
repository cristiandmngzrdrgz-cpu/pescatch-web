import { CATEGORIES } from '@/types'

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\uFFFD/g, '')
    .trim()
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

export const DEFAULT_CATEGORY = 'accesorios'

export function normalizeCategory(value: string | null | undefined): string {
  if (!value) return ''
  const normalized = normalizeText(value)

  for (const cat of CATEGORIES) {
    if (normalized === cat.slug || normalized === normalizeText(cat.name)) {
      return cat.slug
    }
  }

  let best: string | null = null
  let bestDist = Infinity
  for (const cat of CATEGORIES) {
    const dist = levenshtein(normalized, normalizeText(cat.name))
    if (dist < bestDist) {
      bestDist = dist
      best = cat.slug
    }
  }

  if (best && bestDist <= Math.max(1, Math.floor(normalized.length / 4))) {
    return best
  }

  return DEFAULT_CATEGORY
}

export function normalizeSubcategory(category: string, value: string | null | undefined): string {
  if (!value || !category) return value?.trim() || ''
  const cat = CATEGORIES.find(c => c.slug === category)
  if (!cat) return value.trim()

  const normalized = normalizeText(value)
  const match = cat.subcategories.find(s => normalizeText(s.slug) === normalized)
  if (match) return match.slug

  return value.trim()
}

export function isCanonicalCategory(value: string): boolean {
  return CATEGORIES.some(c => c.slug === value)
}
