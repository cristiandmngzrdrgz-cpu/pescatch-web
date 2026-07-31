import { getDb } from '../db'
import { normalizeCategory } from '../normalize-category'

export interface FuzzyMatchResult {
  productId: string
  confidence: number
  matchType: 'exact' | 'fuzzy' | 'none'
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractKeyWords(text: string): string[] {
  const normalized = normalizeText(text)
  const stopWords = new Set([
    'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'o', 'con', 'para',
    'the', 'and', 'or', 'with', 'for', 'in', 'on', 'at', 'to',
  ])
  return normalized.split(' ').filter(w => w.length > 2 && !stopWords.has(w))
}

function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  return union.size === 0 ? 0 : intersection.size / union.size
}

function calculateSimilarity(name1: string, name2: string, brand1: string, brand2: string): number {
  const words1 = new Set(extractKeyWords(name1))
  const words2 = new Set(extractKeyWords(name2))

  let score = jaccardSimilarity(words1, words2)

  if (brand1 && brand2) {
    const normBrand1 = normalizeText(brand1)
    const normBrand2 = normalizeText(brand2)
    if (normBrand1 === normBrand2) {
      score += 0.3
    } else if (normBrand1.includes(normBrand2) || normBrand2.includes(normBrand1)) {
      score += 0.15
    }
  }

  return Math.min(1, score)
}

export function dealMatchSimilarity(name1: string, brand1: string, name2: string, brand2: string): number {
  return calculateSimilarity(name1, name2, brand1, brand2)
}

export async function findFuzzyMatch(
  name: string,
  brand: string,
  category: string,
): Promise<FuzzyMatchResult> {
  const db = getDb()

  const result = await db.execute(
    'SELECT id, name, brand, category FROM products'
  )

  if (result.rows.length === 0) {
    return { productId: '', confidence: 0, matchType: 'none' }
  }

  const normalizedCategory = normalizeCategory(category)
  let bestMatch: { id: string; confidence: number } | null = null

  for (const row of result.rows) {
    const existingName = row.name as string
    const existingBrand = row.brand as string
    const existingCategory = normalizeCategory(row.category as string)

    let similarity = calculateSimilarity(name, existingName, brand, existingBrand)

    if (normalizedCategory && existingCategory === normalizedCategory) {
      similarity = Math.min(1, similarity + 0.1)
    }

    if (!bestMatch || similarity > bestMatch.confidence) {
      bestMatch = { id: row.id as string, confidence: similarity }
    }
  }

  if (!bestMatch) {
    return { productId: '', confidence: 0, matchType: 'none' }
  }

  if (bestMatch.confidence >= 0.85) {
    return { productId: bestMatch.id, confidence: bestMatch.confidence, matchType: 'exact' }
  }

  if (bestMatch.confidence >= 0.70) {
    return { productId: bestMatch.id, confidence: bestMatch.confidence, matchType: 'fuzzy' }
  }

  return { productId: '', confidence: bestMatch.confidence, matchType: 'none' }
}
