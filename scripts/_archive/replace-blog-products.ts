import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'
import path from 'path'

function loadProdEnv() {
  const prod = config({ path: '.env.vercel' }).parsed || {}
  for (const [key, value] of Object.entries(prod)) {
    if (value !== '' && process.env[key] === undefined) process.env[key] = value
  }
}
loadProdEnv()

// Reemplazos de texto markdown (por post), ordenados de más específico a menos
const TEXT_REPLS: Record<string, Array<[string, string]>> = {
  'mejores-canas-spinning-2026': [
    ['## 2. Shimano Dialuna Inshore S100MH — Gama alta versátil', '## 2. Shimano Dialuna Inshore 86M — Gama alta versátil'],
    ['La **Shimano Dialuna Inshore** representa', 'La **Shimano Dialuna Inshore 86M** representa'],
  ],
  'mejores-canas-surfcasting-2026': [
    ['## 2. Daiwa Crosscast Surf 33 423H — La mejor calidad-precio', '## 2. Daiwa Crosscast Surf 33 453 H — La mejor calidad-precio'],
    ['Por unos 58€ tienes un blank de carbono ligero y sensible.', 'Por unos 145€ tienes un blank de carbono ligero y sensible, en la medida de 4,50 metros.'],
    ['- **Precio:** ~58€ | **Longitud:** 4.20m | **Acción:** 100-225g', '- **Precio:** ~145€ | **Longitud:** 4.50m | **Acción:** 100-225g'],
    ['## 4. Daiwa Ninja Surf SCW 420 — La telescópica de toda la vida', '## 4. Daiwa Shorecast Surf-S — Surfcasting de 3 piezas'],
    ['Por unos 63€ recibes una caña de 4.20m que se guarda en poco espacio.', 'Por unos 105€ recibes una caña de surfcasting de 3 piezas, ligera y bien equilibrada para lances largos.'],
    ['- **Precio:** ~63€ | **Longitud:** 4.20m | **Telescópica**', '- **Precio:** ~105€ | **Longitud:** 4.20m | **3 piezas**'],
    ['- Ideal para surfcasting de playa con cebo\n- Lo mejor: Portabilidad, precio contenido', '- Ideal para surfcasting de playa y roca con cebo\n- Lo mejor: Buena relación calidad-precio, portabilidad'],
    ['La **Daiwa Crosscast Surf 33** es mi recomendación para el 90% de los pescadores. Por unos 58€ tienes una caña de carbono que compite con modelos del doble de precio.', 'La **Daiwa Crosscast Surf 33** es mi recomendación para el 90% de los pescadores. Por unos 145€ tienes una caña de carbono que compite con modelos del doble de precio.'],
  ],
  'mejores-kits-senuelos-empezar-2026': [
    ['el **Savage Gear Sandeel Kit** te saca del apuro por unos 32€.', 'el **Savage Gear LRF Mini Sandeel Kit** te saca del apuro por unos 17€.'],
    ['## 4. Savage Gear Gravity Stick Mini Kit — Señuelos blandos de alta precisión', '## 4. Savage Gear Gravity Stick Kit — Señuelos blandos de alta precisión'],
    ['El **Savage Gear Gravity Stick Mini Kit** es un set', 'El **Savage Gear Gravity Stick Kit** es un set'],
    ['- **Contenido:** 6 Gravity Stick, cabezas plomadas, sonajeros', '- **Contenido:** 6 Gravity Stick, cabezas plomadas, sonajeros, caja'],
    ['## 5. Savage Gear Sandeel Kit — La opción económica para agua salada', '## 5. Savage Gear LRF Mini Sandeel Kit — La opción económica para agua salada'],
    ['El **Savage Gear Sandeel Kit** es el kit de señuelos para agua salada más equilibrado en precio-calidad. Incluye señuelos de cola de pala y babosa de 10 y 11cm, con cabezas plomadas, diseñados específicamente para pescar en mar.', 'El **Savage Gear LRF Mini Sandeel Kit** es el kit de señuelos ultraligeros para agua salada más equilibrado en precio-calidad. Incluye señuelos de cola de pala y babosa de perfil fino, con cabezas plomadas, diseñados específicamente para pescar en mar y costa.'],
    ['Combinados con las cabezas plomadas incluidas, tienes un equipo completísimo para pescar lubina, dorada y anjova en costa por unos 32€. La relación calidad-precio es difícil de superar.', 'Combinados con las cabezas plomadas incluidas, tienes un equipo completísimo para pescar lubina, dorada y anjova en costa por unos 17€. La relación calidad-precio es difícil de superar.'],
    ['- **Contenido:** 8 señuelos Sandeel, cabezas plomadas, bolsa\n- **Especies:** Lubina, dorada, anjova, palometón\n- **Tamaños:** 10-11cm', '- **Contenido:** señuelos LRF Sandeel, cabezas plomadas, bolsa\n- **Especies:** Lubina, dorada, anjova, palometón\n- **Tamaños:** ultraligeros'],
    ['el **Savage Gear Gravity Stick Mini Kit** te abre la puerta a la pesca finesse sin pagar precios de gama alta.', 'el **Savage Gear Gravity Stick Kit** te abre la puerta a la pesca finesse sin pagar precios de gama alta.'],
    ['Y si tu presupuesto es muy ajustado, el **Savage Gear Sandeel Kit** te saca adelante por unos 32€.', 'Y si tu presupuesto es muy ajustado, el **Savage Gear LRF Mini Sandeel Kit** te saca adelante por unos 17€.'],
    ['El Savage Gear Sandeel es ideal si pescas en el mar.', 'El Savage Gear LRF Mini Sandeel es ideal si pescas en el mar.'],
    ['Si pescas en el mar, el Savage Gear Sandeel Kit está diseñado específicamente para agua salada.', 'Si pescas en el mar, el Savage Gear LRF Mini Sandeel Kit está diseñado específicamente para agua salada.'],
  ],
}

interface Repl {
  oldAsin: string
  newAsin: string
  newTitle: string
  newPrice: string
  newImage: string
}

const REPLS: Repl[] = [
  { oldAsin: 'B0BRBVJ91D', newAsin: 'B0BRBVZ3TK', newTitle: 'Shimano Dialuna Inshore 86M', newPrice: '250,85€', newImage: 'https://m.media-amazon.com/images/I/31jr38sRT4L._AC_SL1024_.jpg' },
  { oldAsin: 'B098131M93', newAsin: 'B0GWNZFLNQ', newTitle: 'Daiwa Crosscast Surf 33 453 H', newPrice: '144,59€', newImage: 'https://m.media-amazon.com/images/I/41DJ67t1vZL._AC_SL1500_.jpg' },
  { oldAsin: 'B0844Y3MNW', newAsin: 'B0BG8H9LKR', newTitle: 'Daiwa Shorecast Surf-S', newPrice: '105€', newImage: 'https://m.media-amazon.com/images/I/61YYw0CG2WL._AC_SL1500_.jpg' },
  { oldAsin: 'B0B4QNRP49', newAsin: 'B08SJ16MNH', newTitle: 'Savage Gear Gravity Stick Kit', newPrice: '40,61€', newImage: 'https://m.media-amazon.com/images/I/815WFE5-PQL._AC_SL1500_.jpg' },
  { oldAsin: 'B077JM564T', newAsin: 'B00IPMOFT2', newTitle: 'Savage Gear LRF Mini Sandeel Kit', newPrice: '16,99€', newImage: 'https://m.media-amazon.com/images/I/417Tf2bLdDL._AC_SL1000_.jpg' },
]

async function main() {
  const local = createClient({ url: 'file:///' + path.resolve('data', 'pescatch.db').replace(/\\/g, '/') })
  const turso: Client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN })

  for (const [slug, textRepls] of Object.entries(TEXT_REPLS)) {
    const r = await local.execute({ sql: 'SELECT content, relatedAsins FROM posts WHERE slug=?', args: [slug] })
    let content = r.rows[0].content as string
    let related = JSON.parse((r.rows[0].relatedAsins as string) || '[]') as string[]

    const repls = REPLS.filter((x) => related.includes(x.oldAsin))
    console.log(`\n=== ${slug}: ${repls.length} productos a reemplazar ===`)

    // 1. relatedAsins
    for (const repl of repls) {
      related = related.map((a) => (a === repl.oldAsin ? repl.newAsin : a))
    }

    // 2. PRODUCTS_DATA
    const pdRegex = /<!--\s*PRODUCTS_DATA:\s*(\[.*?\])\s*-->/
    const pdMatch = content.match(pdRegex)
    if (pdMatch) {
      const raw = JSON.parse(pdMatch[1])
      const newRaw = raw.map((item: any) => {
        let hit = false
        if (item.asin) {
          const repl = repls.find((x) => x.oldAsin === item.asin)
          if (repl) {
            item.asin = repl.newAsin
            item.title = repl.newTitle
            item.image = repl.newImage
            item.price = repl.newPrice
            hit = true
          }
        }
        if (Array.isArray(item.stores)) {
          item.stores = item.stores.map((s: any) => {
            const repl = repls.find((x) => s.url && s.url.includes(x.oldAsin))
            if (repl) {
              s.url = s.url.replace(repl.oldAsin, repl.newAsin)
              s.price = repl.newPrice
              item.title = repl.newTitle
              item.image = repl.newImage
              if ('price' in item) item.price = repl.newPrice
              hit = true
            }
            return s
          })
        }
        return item
      })
      content = content.replace(pdRegex, `<!-- PRODUCTS_DATA: ${JSON.stringify(newRaw)} -->`)
      for (const repl of repls) {
        const count = (content.match(new RegExp(repl.newAsin, 'g')) || []).length
        console.log(`  ✓ ${repl.oldAsin} → ${repl.newAsin} (${repl.newTitle} ${repl.newPrice}) | aparece ${count}x en content`)
      }
    }

    // 3. Texto markdown
    let applied = 0
    for (const [oldS, newS] of textRepls) {
      const idx = content.indexOf(oldS)
      if (idx === -1) { console.log(`  ⚠️ No encontrado: "${oldS.slice(0, 60)}"`); continue }
      content = content.replace(oldS, newS)
      applied++
    }
    console.log(`  → ${applied}/${textRepls.length} reemplazos de texto aplicados`)

    // Guardar
    await local.execute({ sql: 'UPDATE posts SET content=?, relatedAsins=? WHERE slug=?', args: [content, JSON.stringify(related), slug] })
    await turso.execute({ sql: 'UPDATE posts SET content=?, relatedAsins=? WHERE slug=?', args: [content, JSON.stringify(related), slug] })
    console.log(`  → local + turso OK`)
  }

  local.close()
  turso.close()
  console.log('\n✅ Reemplazos aplicados en local y Turso')
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
