import { getDb } from './db'
import type { InValue } from '@libsql/client'

interface EnrichmentResult {
  technicalSpecs: Record<string, string>
  review: string
  pros: string[]
  cons: string[]
}

export function generateEnrichment(
  title: string,
  brand: string,
  description: string,
  features: string[],
): EnrichmentResult {
  const technicalSpecs: Record<string, string> = {}
  for (const feat of features) {
    const parts = feat.split(/[:：]/)
    if (parts.length >= 2) {
      technicalSpecs[parts[0].trim()] = parts.slice(1).join(':').trim()
    }
  }

  const analysis = buildAnalysis(title, brand, description, technicalSpecs)
  const pros = extractPros(features, technicalSpecs, brand)
  const cons = extractCons(features, technicalSpecs)

  return { technicalSpecs, review: analysis, pros, cons }
}

function buildAnalysis(
  title: string,
  brand: string,
  description: string,
  specs: Record<string, string>,
): string {
  const brandPart = brand ? ` de ${brand}` : ''
  const parts: string[] = []

  if (description) {
    const cleanDesc = description.replace(/^[^a-zA-ZáéíóúÁÉÍÓÚ]*/, '').slice(0, 300)
    if (cleanDesc) parts.push(cleanDesc)
  }

  const specEntries = Object.entries(specs).filter(([k]) => !k.toLowerCase().includes('ean'))
  if (specEntries.length > 0) {
    const specLine = specEntries.slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ')
    parts.push(`Destaca por ${specLine}.`)
  }

  if (parts.length === 0) {
    parts.push(`${title}${brandPart}. Producto de pesca con buena relación calidad-precio.`)
  }

  return parts.join(' ')
}

function extractPros(features: string[], specs: Record<string, string>, brand: string): string[] {
  const pros: string[] = []
  const lower = [...features, ...Object.values(specs)].join(' ').toLowerCase()

  if (brand) pros.push(`Marca reconocida: ${brand}`)
  if (lower.includes('calidad') || lower.includes('quality') || lower.includes('resist')) {
    pros.push('Buena calidad de construcción')
  }
  if (lower.includes('liger') || lower.includes('light') || lower.includes('ultralight')) {
    pros.push('Diseño ligero para largas jornadas')
  }
  if (lower.includes('cómod') || lower.includes('comfort') || lower.includes('ergonóm')) {
    pros.push('Diseño ergonómico y cómodo')
  }
  if (lower.includes('acer') || lower.includes('inox') || lower.includes('stainless') || lower.includes('corros')) {
    pros.push('Materiales resistentes a la corrosión')
  }

  if (pros.length === 0) {
    pros.push('Buena relación calidad-precio')
    pros.push('Producto especializado para pesca')
  }

  return pros.slice(0, 4)
}

function extractCons(features: string[], specs: Record<string, string>): string[] {
  const cons: string[] = []
  const lower = [...features, ...Object.keys(specs), ...Object.values(specs)].join(' ').toLowerCase()

  if (!lower.includes('garant') && !lower.includes('warranty')) {
    cons.push('Garantía no especificada')
  }
  if (!lower.includes('accesorio') && !lower.includes('incluye') && !lower.includes('include')) {
    cons.push('Accesorios no incluidos')
  }

  if (cons.length === 0) {
    cons.push('Disponibilidad limitada')
  }

  return cons.slice(0, 3)
}

export interface EnrichedFields {
  technicalSpecs: string
  review: string
  pros: string
  cons: string
  brand?: string
  imageUrl?: string
  description?: string
}

export async function enrichDealInDb(dealId: string, data: EnrichedFields): Promise<void> {
  const db = getDb()

  const sets: string[] = []
  const args: InValue[] = []

  if (data.technicalSpecs && data.technicalSpecs !== '{}') {
    sets.push('technicalSpecs = ?')
    args.push(data.technicalSpecs)
  }
  if (data.review) {
    sets.push('review = ?')
    args.push(data.review)
  }
  if (data.pros && data.pros !== '[]') {
    sets.push('pros = ?')
    args.push(data.pros)
  }
  if (data.cons && data.cons !== '[]') {
    sets.push('cons = ?')
    args.push(data.cons)
  }
  if (data.brand) {
    sets.push('brand = ?')
    args.push(data.brand)
  }
  if (data.imageUrl) {
    sets.push('imageUrl = ?')
    args.push(data.imageUrl)
  }
  if (data.description) {
    sets.push('description = ?')
    args.push(data.description)
  }

  if (sets.length > 0) {
    sets.push("updatedAt = datetime('now')")
    args.push(dealId)
    await db.execute({
      sql: `UPDATE deals SET ${sets.join(', ')} WHERE id = ?`,
      args,
    })
  }
}

export function extractAsin(url: string): string | null {
  const m = url.match(/(?:dp|product|gp\/product)\/(B0[A-Z0-9]{8,})/i)
  return m?.[1] || null
}
