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
  ],
  'Feeder': [
    'caña feeder',
    'carrete feeder',
    'kit feeder',
    'comida feeder',
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
  ],
  'Equipo': [
    'traje impermeable pesca',
    'botas pesca',
    'gafas polarizadas pesca',
    'sombrero pesca',
    'guantes pesca',
  ],
}

const BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'shakespeare', 'okuma', 'caperlan', 'grauvell', 'yuki',
  'ryobi', 'lineaeffe', 'rapala', 'savage gear',
]

export const KEYWORDS: string[] = [
  ...Object.values(CATEGORIES).flat(),
  ...BRANDS.flatMap(brand => [
    `caña ${brand}`,
    `carrete ${brand}`,
    `${brand} oferta`,
  ]),
  'carrete pesca barato',
  'caña pesca calidad precio',
  'combo pesca completo',
  'material pesca oferta',
  'kit pesca principiante',
  'caña telescópica pesca',
  'señuelos lucio',
  'señuelos black bass',
  'bajo de línea pesca',
  'emerger pesca',
]
