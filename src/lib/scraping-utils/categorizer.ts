import { POPULAR_BRANDS, FISHING_BRANDS } from './constants'
import { normalizeCategory, normalizeText } from '@/lib/normalize-category'

export function extractBrand(title: string): string | null {
  const lower = title.toLowerCase()
  for (const b of FISHING_BRANDS) {
    if (lower.includes(b)) return b.charAt(0).toUpperCase() + b.slice(1)
  }
  return null
}

/** Accesorios que nunca son caña/carrete aunque los mencionen ("grasa para carretes"). */
const HARD_ACCESSORY: RegExp[] = [
  /grasa/, /lubricante/, /\baceite\b/, /kit de rodamiento|juego de rodamiento/,
  /repuesto/, /recambio/, /\bspare\b/, /manivela/, /mango (de )?(repuesto|recambio|suelto|carrete)/,
  /hilos?\b/, /monofilamento|monofilament|fluorocarbono|trenzad/, /\bsedal\b/,
  /alicate/, /cuchillo/, /bascula/, /salabre/, /linterna/, /paraguas/, /toolbox/,
]

/**
 * Contenedores y soportes: solo cuentan si encabezan el título, porque un combo
 * de caña puede traer "bolsa de transporte" al final sin dejar de ser una caña.
 */
const CONTAINERS: RegExp[] = [/estuche/, /bolsa/, /\bfunda\b/, /organizador/, /soporte/, /holder/]

/** Aparejos sueltos: accesorios salvo que el título describa un señuelo con anzuelo. */
const SOFT_ACCESSORY: RegExp[] = [
  /anzuelo/, /\bplomo/, /\bboya/, /flotador/, /\bcebo/, /alimentador/,
]

const LURE: RegExp[] = [
  /senuelo/, /swimbait/, /wobbler/, /popper/, /stickbait/, /vinilo/,
  /cucharilla|chuchara/, /spinnerbait/, /\bjig\b/, /\begi\b/, /minnow/, /\bshad\b/,
  /streamer/, /artificial/, /mosca/, /crankbait/, /gusano/, /\bgrub\b/,
  /excitador/, /currican/, /gulp/, /\bvib\b/,
]

// El orden importa: ropa antes que cañas ("botas de caña media"), y cañas antes
// que carretes (una caña "spinning" no es un carrete) y que señuelos ("caña con peso de señuelo").
const RULES: Array<[string, RegExp[]]> = [
  ['ropa', [
    /traje/, /\bbota/, /gafas/, /sombrero/, /guante/, /gorra/, /polarizad/,
    /vadeador/, /wading/, /chaqueta/, /calcetin/, /sombrilla/,
  ]],
  ['cañas', [
    /canas?\b/, /angelrute/, /spinnrute/, /\brods?\b/, /blank/,
    /telescopica/, /casting weight/, /jig training/, /carp rod/, /surf rod/,
  ]],
  ['carretes', [
    /carrete/, /\breels?\b/, /angelrolle/, /spinnrolle/, /freno delantero/,
    /\bbobina\b/, /\bbaitcaster\b/, /\bmultiplier\b/,
  ]],
  ['nautica', [
    /kayak/, /canoa/, /\bbote\b/, /inflable/, /\bremo\b/, /nautic/,
  ]],
]

/**
 * Clasifica un producto por su título. Normaliza tildes antes de comparar porque
 * los títulos de AliExpress llegan a veces en NFD (n + tilde combinada).
 */
export function categorizeProduct(title: string): string {
  const lower = normalizeText(title)
  const head = lower.slice(0, 40)

  if (CONTAINERS.some(p => p.test(head))) return 'accesorios'
  if (HARD_ACCESSORY.some(p => p.test(lower))) return 'accesorios'

  for (const [cat, patterns] of RULES) {
    if (patterns.some(p => p.test(lower))) return normalizeCategory(cat)
  }

  if (LURE.some(p => p.test(lower))) return 'senuelos'

  if (SOFT_ACCESSORY.some(p => p.test(lower))) return 'accesorios'

  if (POPULAR_BRANDS.some(b => lower.startsWith(b))) return normalizeCategory('Accesorios')

  return 'accesorios'
}
