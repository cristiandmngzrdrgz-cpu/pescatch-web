import { callGroq } from './ai-providers/groq'

export interface EnrichmentInput {
  title: string
  brand: string
  description?: string
  features?: string[]
  specs?: Record<string, string>
  category?: string
}

export interface AIEnrichment {
  review: string
  pros: string[]
  cons: string[]
  technicalSpecs: Record<string, string>
}

const SYSTEM_PROMPT = `Eres un pescador experimentado con 20 años de experiencia en spinning, surfcasting y pesca deportiva. Escribes reviews de productos de pesca para una web de chollos.

Tu estilo es:
- Directo y práctico, como si le hablaras a un colega pescador
- Sin tecnicismos vacíos ni marketing
- Mencionas casos de uso reales (pescar lubina desde roca, surfcasting en playa, etc.)
- Honestos sobre pros y contras reales
- Breve pero informativo

Respondes SIEMPRE en JSON válido con esta estructura exacta:
{
  "review": "2-3 frases sobre el producto, mencionando para qué tipo de pesca sirve y qué lo hace especial",
  "pros": ["3-4 ventajas reales basadas en las specs", "cada pro es específico y útil"],
  "cons": ["2-3 desventajas reales o limitaciones", "honesto pero no destructivo"],
  "technicalSpecs": {"Spec1": "valor", "Spec2": "valor"}
}

Reglas:
- NO inventes specs que no estén en los datos proporcionados
- Si no hay información suficiente, sé honesto en la review
- Los pros/cons deben ser específicos del producto, no genéricos
- technicalSpecs: extrae y estructura las specs más relevantes del producto
- Todo en español`

function buildUserPrompt(input: EnrichmentInput): string {
  const parts: string[] = []

  parts.push(`**Producto:** ${input.title}`)

  if (input.brand) {
    parts.push(`**Marca:** ${input.brand}`)
  }

  if (input.category) {
    parts.push(`**Categoría:** ${input.category}`)
  }

  if (input.description) {
    parts.push(`\n**Descripción:**\n${input.description.slice(0, 500)}`)
  }

  if (input.features && input.features.length > 0) {
    parts.push(`\n**Características:**\n${input.features.slice(0, 8).map(f => `- ${f}`).join('\n')}`)
  }

  if (input.specs && Object.keys(input.specs).length > 0) {
    parts.push(`\n**Especificaciones:**\n${Object.entries(input.specs).slice(0, 10).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`)
  }

  parts.push('\n---\nGenera la review, pros, contras y specs técnicas en JSON.')

  return parts.join('\n')
}

function parseAIResponse(response: string): AIEnrichment | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as Partial<AIEnrichment>

    if (!parsed.review || typeof parsed.review !== 'string') return null
    if (!Array.isArray(parsed.pros) || parsed.pros.length === 0) return null
    if (!Array.isArray(parsed.cons) || parsed.cons.length === 0) return null

    return {
      review: parsed.review,
      pros: parsed.pros.filter(p => typeof p === 'string'),
      cons: parsed.cons.filter(c => typeof c === 'string'),
      technicalSpecs: parsed.technicalSpecs && typeof parsed.technicalSpecs === 'object'
        ? parsed.technicalSpecs as Record<string, string>
        : {},
    }
  } catch {
    return null
  }
}

export async function enrichWithAI(input: EnrichmentInput): Promise<AIEnrichment | null> {
  const userPrompt = buildUserPrompt(input)

  const response = await callGroq([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.7,
    maxTokens: 1500,
  })

  if (!response) return null

  const enrichment = parseAIResponse(response)

  if (!enrichment) {
    console.log(`  ⚠️ Failed to parse AI response for "${input.title}"`)
    return null
  }

  return enrichment
}
