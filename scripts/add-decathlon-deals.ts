import 'dotenv/config'
import { appendRow, readAllRows } from '../src/lib/sync/google-sheets-client'

interface DealToAdd {
  name: string
  brand: string
  category: string
  subcategory: string
  imageUrl: string
  description: string
  decathlonPrice: number
  decathlonUrl: string
  decathlonShipping: number
}

const deals: DealToAdd[] = [
  {
    name: 'SHIMANO Nexave 2500 HG FL - Carrete Pesca Señuelos',
    brand: 'Shimano',
    category: 'Carretes',
    subcategory: 'spinning',
    imageUrl: 'https://contents.mediadecathlon.com/p3086657/k$387b9be8f7a1d765a91ce807795e8e9b/9e34ef82-9829-4357-8a5a-cc26a072cf90.jpg?format=auto&f=3000x0',
    description: 'El carrete NEXAVE 2500 HG FL combina potencia y rotación suave. Su alta velocidad de recuperación y su robustez lo convierten en una opción ideal para la pesca de depredadores. Tamaño 2500, peso 250g, ratio 6,0:1, recuperación 91cm, 3+1 rodamientos, freno 4kg.',
    decathlonPrice: 51.99,
    decathlonUrl: 'https://www.decathlon.es/es/p/carrete-pesca-senuelos-nexave-2500-hg-fl/384206/m9018007',
    decathlonShipping: 0,
  },
  {
    name: 'CAPERLAN Symbios-900 4.35m 100-250g Black Edition - Caña Surfcasting',
    brand: 'Caperlan',
    category: 'Cañas',
    subcategory: 'surfcasting',
    imageUrl: 'https://contents.mediadecathlon.com/p3380032/k$7fd18ac63887f1365a4dc7b8cb2791cf/1f5a21c5-8a2f-4857-b3c5-1b1f0e3d84c6.jpg?format=auto&f=3000x0',
    description: 'Caña surfcasting SYMBIOS-900 435 BLACK EDITION de 4,35m con carbono 40T. 8 anillas Fuji Low Rider Inox SIC, acción Hybrid Sensitiv Tip, portacarrete Fuji DPS. Potencia 100-250g, 3 elementos asimétricos, peso 430g. Doble campeona del mundo 2022.',
    decathlonPrice: 239.99,
    decathlonUrl: 'https://www.decathlon.es/es/p/cana-pesca-surfcasting-symbios-900-4-35-m-100-250-g-black-edition/333371/m8641813',
    decathlonShipping: 0,
  },
  {
    name: 'MITCHELL Premium Pro 6000 Black Gold - Carrete Pesca Mar',
    brand: 'Mitchell',
    category: 'Carretes',
    subcategory: 'mar',
    imageUrl: 'https://contents.mediadecathlon.com/p1885648/k$4ff4a32a608e7aadeceb69a2e92e4a73/c7bb8b7b-0f84-4ed7-9aa7-ef0298ad5827.jpg?format=auto&f=3000x0',
    description: 'Carrete Premium Pro 6000 Black Gold de Mitchell. Robusto, permite pescar varios peces en la misma línea. Tamaño 6000, peso 440g, ratio 5,2:1, recuperación 91cm, 5 rodamientos, bobina de aluminio, freno 8kg.',
    decathlonPrice: 43.99,
    decathlonUrl: 'https://www.decathlon.es/es/p/carrete-premium-pro-6000-black-gold/X8538076/m8538076',
    decathlonShipping: 0,
  },
  {
    name: 'CAPERLAN Ilicium Jigging 500 6.2" 30lb - Conjunto Pesca Jig Señuelo Mar',
    brand: 'Caperlan',
    category: 'Kits',
    subcategory: 'jigging',
    imageUrl: 'https://contents.mediadecathlon.com/p3380032/k$7fd18ac63887f1365a4dc7b8cb2791cf/1f5a21c5-8a2f-4857-b3c5-1b1f0e3d84c6.jpg?format=auto&f=3000x0',
    description: 'Conjunto de pesca a jig para mar Ilicium Jigging 500. 6.2" de acción, 30lb de potencia. Equipo completo para iniciarse en la pesca a jigging desde embarcación.',
    decathlonPrice: 79.99,
    decathlonUrl: 'https://www.decathlon.es/es/p/conjunto-pesca-jig-senuelo-mar-ilicium-jigging-500-6-2-30-lb/339714/m8738770',
    decathlonShipping: 0,
  },
  {
    name: 'CAPERLAN Resifight 500 3.00m Medium - Caña Pesca Fija',
    brand: 'Caperlan',
    category: 'Cañas',
    subcategory: 'fija',
    imageUrl: 'https://contents.mediadecathlon.com/p3380032/k$7fd18ac63887f1365a4dc7b8cb2791cf/1f5a21c5-8a2f-4857-b3c5-1b1f0e3d84c6.jpg?format=auto&f=3000x0',
    description: 'Caña de pesca fija Resifight 500 de 3.00m acción Medium. Ideal para pesca en agua dulce y mar desde costa. Buena relación calidad-precio para iniciación y perfeccionamiento.',
    decathlonPrice: 34.99,
    decathlonUrl: 'https://www.decathlon.es/es/p/cana-pesca-fija-resifight-500-3-00-t-medium/350630/m8844118',
    decathlonShipping: 0,
  },
  {
    name: 'CAPERLAN Essenseat 500 Adjust - Asiento Pesca Silla Plegable',
    brand: 'Caperlan',
    category: 'Accesorios',
    subcategory: 'sillas',
    imageUrl: 'https://contents.mediadecathlon.com/p3380032/k$7fd18ac63887f1365a4dc7b8cb2791cf/1f5a21c5-8a2f-4857-b3c5-1b1f0e3d84c6.jpg?format=auto&f=3000x0',
    description: 'Silla plegable de pesca Essenseat 500 Adjust con respaldo ajustable. Cómoda y resistente, ideal para largas jornadas de pesca en cualquier terreno.',
    decathlonPrice: 69.99,
    decathlonUrl: 'https://www.decathlon.es/es/p/asiento-pesca-silla-plegable-essenseat-500-adjust/334474/m8658748',
    decathlonShipping: 0,
  },
  {
    name: 'CAPERLAN Paraguas U500 XL 2.3m - Sombrilla Pesca',
    brand: 'Caperlan',
    category: 'Accesorios',
    subcategory: 'sombrillas',
    imageUrl: 'https://contents.mediadecathlon.com/p3380032/k$7fd18ac63887f1365a4dc7b8cb2791cf/1f5a21c5-8a2f-4857-b3c5-1b1f0e3d84c6.jpg?format=auto&f=3000x0',
    description: 'Paraguas/sombrilla de pesca U500 XL con 2.3m de diámetro. Protección contra el sol y la lluvia. Resistente y fácil de montar.',
    decathlonPrice: 55.00,
    decathlonUrl: 'https://www.decathlon.es/es/p/paraguas-sombrilla-pesca-u500-xl-2-3-m-diametro/340904/m8754390',
    decathlonShipping: 0,
  },
]

async function main() {
  const { headers } = await readAllRows()
  let added = 0

  for (const d of deals) {
    const row = headers.map(h => {
      switch (h) {
        case 'name': return d.name
        case 'brand': return d.brand
        case 'category': return d.category
        case 'subcategory': return d.subcategory
        case 'imageUrl': return d.imageUrl
        case 'description': return d.description
        case 'decathlonPrice': return d.decathlonPrice
        case 'decathlonUrl': return d.decathlonUrl
        case 'decathlonShipping': return d.decathlonShipping
        case 'decathlonStock': return 'in_stock'
        default: return ''
      }
    })

    try {
      await appendRow(row)
      console.log(`  ✅ ${d.brand.padEnd(12)} ${d.decathlonPrice.toFixed(2).padStart(7)}€ - ${d.name.slice(0, 50)}`)
      added++
    } catch (err) {
      console.log(`  ❌ ${d.name.slice(0, 50)}: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log(`\n✅ ${added} productos añadidos al Sheet`)
  console.log('👉 Ejecuta: npm run sync  (para traerlos a la web)')
}

main().catch(console.error)
