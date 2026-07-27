import { POPULAR_BRANDS, FISHING_BRANDS } from './constants'

export function extractBrand(title: string): string | null {
  const lower = title.toLowerCase()
  for (const b of FISHING_BRANDS) {
    if (lower.includes(b)) return b.charAt(0).toUpperCase() + b.slice(1)
  }
  return null
}

export function categorizeProduct(title: string): string {
  const lower = title.toLowerCase()

  const categoryRules: Array<[string, RegExp[]]> = [
    ['Carretes', [/carrete/, /spin/i, /\.?fg\b/, /\.?hg\b/, /\.?lt\b/, /\.?xh\b/]],
    ['Cañas', [/caña/, /cana/, /telescópica/, /telescopica/, /blank/, /casting weight/]],
    ['Señuelos', [/señuelo/, /senuelo/, /vinilo/, /peces? artificiales/, /kit.*[Ss]eñuelos?/, /cucharill/, /rapala/]],
    ['Kits', [/combo/, /conjunto/, /kit .*(pesca|carp|cana|carrete)/]],
    ['Accesorios', [/caja/, /anzuelo/, /sedal/, /plomo/, /cuchillo/, /alicate/, /línea/, /linea/, /bajo de línea/]],
    ['Ropa', [/traje/, /bota/, /gafas/, /sombrero/, /guante/, /gorra/, /polarizada/]],
    ['Submarina', [/submarina/, /submarino/, /escarpín/, /escarpin/, /espadon/, /fusil/, /mascara/]],
  ]

  for (const [cat, patterns] of categoryRules) {
    if (patterns.some(p => p.test(lower))) return cat
  }

  if (POPULAR_BRANDS.some(b => lower.startsWith(b))) return 'Accesorios'

  return 'Equipo'
}
