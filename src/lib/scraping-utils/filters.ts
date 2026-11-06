import { FISHING_WORDS, NON_FISHING_WORDS, FISHING_BRANDS } from './constants'

/**
 * Ruido no pesquero (jardín, bricolaje, mascotas, cocina...).
 * Se comprueba ANTES del atajo de marca: Amazon devuelve tijeras de podar al
 * buscar "carrete ryobi" y la marca no debe rescatar una herramienta.
 */
export function isOffTopic(title: string): boolean {
  const lower = title.toLowerCase()
  return NON_FISHING_WORDS.some(w => lower.includes(w))
}

export function isFishingProduct(title: string, keyword: string): boolean {
  const lower = title.toLowerCase()
  const kwLower = keyword.toLowerCase()

  // El ruido manda: que la keyword lleve una marca de pesca no convierte en
  // pesca unas tijeras de podar (caso real del discover con Ryobi).
  if (isOffTopic(lower)) return false

  if (FISHING_BRANDS.some(b => kwLower.includes(b) || lower.includes(b))) return true

  if (!FISHING_WORDS.some(w => lower.includes(w))) return false

  return true
}
