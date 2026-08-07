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

const BASE_URL = 'https://www.pescatch.es'

interface SeoData {
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  featuredImage?: string
}

const SEO: Record<string, SeoData> = {
  'shimano-vs-daiwa-mejores-carretes-spinning': {
    metaTitle: 'Mejores carretes de spinning 2026: Shimano vs Daiwa comparados',
    metaDescription: '¿Shimano o Daiwa? Comparamos los 6 mejores carretes de spinning calidad-precio de 2026: Sienna, Ninja LT, Catana, Laguna, Sedona y Exceler. Precios, pros y contras.',
    focusKeyword: 'mejores carretes de spinning 2026',
    featuredImage: 'https://m.media-amazon.com/images/I/71qfny63ZvL._AC_SX679_.jpg',
  },
  'mejores-canas-spinning-2026': {
    metaTitle: 'Las 5 mejores cañas de spinning de 2026 (comparativa)',
    metaDescription: 'Comparamos las mejores cañas de spinning de 2026: Daiwa Morethan Branzino AGS, Shimano Dialuna, Hart Bloody Marine, Daiwa Legalis Seabass y Ninja Spinning. Precios y pros.',
    focusKeyword: 'mejores cañas de spinning 2026',
    featuredImage: 'https://m.media-amazon.com/images/I/51ksaDREYxL._AC_SL1500_.jpg',
  },
  'mejores-kits-senuelos-empezar-2026': {
    metaTitle: 'Los 5 mejores kits de señuelos para empezar a pescar 2026',
    metaDescription: '¿No sabes qué señuelos comprar? Comparamos los mejores kits para principiantes: Savage Gear Perch Academy, Berkley PowerBait, Abu Garcia y más. Precios, pros y contras.',
    focusKeyword: 'kits de señuelos para empezar a pescar',
    featuredImage: 'https://m.media-amazon.com/images/I/71r0yNvrRZL._AC_SL1500_.jpg',
  },
  'mejores-canas-surfcasting-2026': {
    metaTitle: 'Las 5 mejores cañas de surfcasting calidad-precio 2026',
    metaDescription: 'Comparamos las mejores cañas de surfcasting de 2026: Shimano Ultegra XR Surf, Daiwa Crosscast Surf 33, PENN Squadron IV, Ninja Surf SCW y Mitchell Adventure 2.',
    focusKeyword: 'mejores cañas de surfcasting calidad-precio',
    featuredImage: 'https://m.media-amazon.com/images/I/412vINaBcEL._AC_SL1500_.jpg',
  },
  'mejores-carretes-spinning-calidad-precio-2026': {
    metaTitle: 'Mejores carretes de spinning calidad-precio 2026: comparativa',
    metaDescription: 'Los mejores carretes de spinning calidad-precio de 2026 comparados en Amazon, Decathlon y AliExpress. Guía de compra con precios, pros y contras.',
    focusKeyword: 'carretes spinning calidad precio 2026',
  },
  'mejores-gafas-sol-polarizadas-pescar-2026': {
    metaTitle: 'Las 6 mejores gafas de sol polarizadas para pescar 2026',
    metaDescription: 'Gafas de sol polarizadas para pescar al mejor precio: HAWKERS a 22€, Polaroid, Lamicall, GQUEEN, Cressi y Hifot. Descuentos reales, pros, contras y FAQ.',
    focusKeyword: 'gafas de sol polarizadas para pescar',
  },
  'shimano-stradic-fl-vs-daiwa-ninja-lt-comparativa': {
    metaTitle: 'Shimano Stradic FL vs Daiwa Ninja LT: comparativa 2026',
    metaDescription: 'Comparamos el Shimano Stradic FL y el Daiwa Ninja LT: rendimiento, precio y relación calidad-precio. ¿Qué carrete de spinning comprar en 2026?',
    focusKeyword: 'Shimano Stradic FL vs Daiwa Ninja LT',
  },
}

async function main() {
  const local = createClient({ url: 'file:///' + path.resolve('data', 'pescatch.db').replace(/\\/g, '/') })
  const turso: Client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN })

  console.log('=== Aplicando SEO a posts ===')
  for (const [slug, seo] of Object.entries(SEO)) {
    const canonical = `${BASE_URL}/blog/${slug}`
    const cols = ['metaTitle', 'metaDescription', 'canonicalUrl', 'focusKeyword']
    const vals: Array<string | number | null> = [seo.metaTitle, seo.metaDescription, canonical, seo.focusKeyword]
    if (seo.featuredImage) { cols.push('featuredImage'); vals.push(seo.featuredImage) }

    // Local
    const lr = await local.execute({ sql: 'SELECT 1 FROM posts WHERE slug=?', args: [slug] })
    const localUpd = lr.rows.length > 0
    if (localUpd) {
      await local.execute({
        sql: `UPDATE posts SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE slug = ?`,
        args: [...vals, slug],
      })
    }

    // Turso
    const tr = await turso.execute({ sql: 'SELECT 1 FROM posts WHERE slug=?', args: [slug] })
    const tursoUpd = tr.rows.length > 0
    if (tursoUpd) {
      await turso.execute({
        sql: `UPDATE posts SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE slug = ?`,
        args: [...vals, slug],
      })
    }

    console.log(`  ${slug}: local=${localUpd ? 'OK' : 'no-existe'} turso=${tursoUpd ? 'OK' : 'no-existe'} | ${seo.metaTitle}`)
  }

  local.close()
  turso.close()
  console.log('\n✅ SEO aplicado')
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
