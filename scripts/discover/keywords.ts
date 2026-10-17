// Catálogo de búsquedas del pipeline de descubrimiento.
// - CATEGORIES: keywords por modalidad (fase Amazon stealth + AliExpress API).
// - AMAZON_BRAND_KEYWORDS: búsquedas de marca (solo fase Amazon).
// - BESTSELLER_NODES: nodos de /gp/bestsellers y /gp/new-releases (fetch directo).
//
// La rotación (pickKeywordBatch / pickNodeBatch) permite cubrir el catálogo
// completo en varios días sin repetir el mismo barrido cada día.

export interface KeywordEntry {
  category: string
  keyword: string
}

export interface BestsellerNode {
  label: string
  node: string
}

export const CATEGORIES: Record<string, string[]> = {
  'Spinning': [
    'caña spinning',
    'carrete spinning',
    'señuelos spinning',
    'kit spinning',
  ],
  'Surfcasting': [
    'caña surfcasting',
    'carrete surfcasting',
    'kit surfcasting',
    'combo surfcasting',
  ],
  'Carpfishing': [
    'caña carpfishing',
    'carrete carpfishing',
    'kit carpfishing',
    'bolsa carpfishing',
    'boilies carpfishing',
    'hair rig carpfishing',
    'colchón carpfishing',
    'saco carpfishing',
  ],
  'Feeder': [
    'caña feeder',
    'carrete feeder',
    'kit feeder',
    'cebo feeder',
  ],
  'Jigging': [
    'caña jigging',
    'carrete jigging',
    'señuelos jigging',
  ],
  'Eging': [
    'eging',
    'poteras calamar',
    'pajaritos pesca',
  ],
  'Rockfishing': [
    'caña rockfishing',
    'carrete rockfishing',
    'señuelos rockfishing',
  ],
  'Embarcación': [
    'caña embarcación',
    'carrete embarcación',
    'señuelos curricán',
  ],
  'Mosca': [
    'caña mosca',
    'carrete mosca',
    'moscas pesca',
    'sedal mosca',
  ],
  'Señuelos': [
    'señuelos pesca baratos',
    'vinilos pesca',
    'cucharillas pesca',
    'kit señuelos pesca',
    'rapala',
    'peces artificiales pesca',
  ],
  'Accesorios': [
    'caja pesca',
    'anzuelos pesca',
    'sedal pesca',
    'línea pesca',
    'plomos pesca',
    'cuchillo pesca',
    'linterna pesca',
    'sacadera pesca',
    'báscula pesca',
    'silla pesca',
  ],
  'Equipo': [
    'traje impermeable pesca',
    'botas pesca',
    'gafas polarizadas pesca',
    'sombrero pesca',
    'guantes pesca',
    'vadeador pesca',
  ],
}

// Caperlan excluida a propósito: marca propia de Decathlon, sin equivalente en Amazon.
export const BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'shakespeare', 'okuma', 'rapala', 'savage gear',
  'grauvell', 'yuki', 'lineaeffe', 'ryobi',
  'kastking', 'piscifun', 'cinnetic', 'kali kunnan',
  'trabucco', 'vercelli', 'zeox',
]

export const AMAZON_BRAND_KEYWORDS: KeywordEntry[] = BRANDS.flatMap(brand => [
  { category: 'Marcas', keyword: `carrete ${brand}` },
  { category: 'Marcas', keyword: `caña ${brand}` },
])

// Subnodos de la categoría "Pesca" de Amazon.es (/gp/bestsellers|new-releases/sports/<nodo>).
// "Pesca en hielo" (2928952031) se excluye: sin mercado en España.
export const BESTSELLER_NODES: BestsellerNode[] = [
  { label: 'Pesca general', node: '2928514031' },
  { label: 'Cañas', node: '29839731031' },
  { label: 'Carretes', node: '29839730031' },
  { label: 'Señuelos y moscas', node: '2928955031' },
  { label: 'Sedales', node: '2928954031' },
  { label: 'Accesorios', node: '2928942031' },
  { label: 'Aparejos terminales', node: '29839733031' },
  { label: 'Cebos', node: '29839729031' },
  { label: 'Combos caña+carrete', node: '2928949031' },
  { label: 'Pesca con mosca', node: '2928951031' },
]

export function flattenKeywords(categories: Record<string, string[]>): KeywordEntry[] {
  return Object.entries(categories).flatMap(([category, keywords]) =>
    keywords.map(keyword => ({ category, keyword }))
  )
}

/**
 * Devuelve un lote rotatorio del catálogo: si no se escanea todo cada día,
 * cada ejecución avanza el cursor y el ciclo completo se cubre en varios días.
 */
export function pickBatch<T>(all: T[], cursor: number, size: number): { batch: T[]; nextCursor: number } {
  if (all.length === 0) return { batch: [], nextCursor: 0 }

  const start = ((cursor % all.length) + all.length) % all.length
  const count = Math.min(size, all.length)
  const batch: T[] = []
  for (let i = 0; i < count; i++) batch.push(all[(start + i) % all.length])

  return { batch, nextCursor: (start + count) % all.length }
}

export function groupKeywords(entries: KeywordEntry[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}
  for (const entry of entries) {
    if (!grouped[entry.category]) grouped[entry.category] = []
    grouped[entry.category].push(entry.keyword)
  }
  return grouped
}
