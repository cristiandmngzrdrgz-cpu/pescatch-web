// PROPÓSITO: Sembrar la rotación de Telegram con los 8 deals del último post
// (los de agosto que se repetían cada semana) para que el próximo digest no
// vuelva a publicarlos.
// FECHA: 2026-10-19 — one-shot, se puede borrar tras ejecutarlo.
import dotenv from 'dotenv'
import { getDb, initSchema } from '../../src/lib/db'

const prod = process.argv.includes('--prod')
const apply = process.argv.includes('--apply')

dotenv.config({ path: prod ? '.env.vercel' : '.env', quiet: true })

// Slugs exactos del mensaje del 19-oct-2026 09:58 (t.me/s/pescatch).
const LAST_POST_SLUGS = [
  'penn-surfblaster-iii-carrete-de-pesca-de-lanzamiento-largo-para-surf-playa-y-pes',
  'dam-xtherm-winter-suit-thermo-suits-unisex-adulto-pack-de-1',
  'goture-combos-de-caa-y-carrete-telescpico-para-pesca-caa-de-pescar-telescpica-de_aliexpress',
  'caas-de-pescar-biutifu-bigfish-para-surfcasting-30m-33m-36m-39m-42m-45m-carbono-_aliexpress',
  'caa-de-pescar-ultraligera-tsurinoya-bfs-subtile-82g-para-seuelos-caa-de-pescar-f_aliexpress',
  'navis---traje-de-lluvia-para-hombre-resistente-al-agua-con-pantalones-3-piezas-c',
  'mitchell-tanager-sw-surf-spinning-caa-blank-de-grafito-resistente-al-agua-salada',
  'navis-marine-traje-de-lluvia-hombre-impermeable-pu---chaqueta-y-peto-ajustable-c',
]

async function main() {
  await initSchema()
  const db = getDb()

  const placeholders = LAST_POST_SLUGS.map(() => '?').join(',')
  const result = await db.execute({
    sql: `SELECT id, title, slug, commission, discountPercent
          FROM deals
          WHERE slug IN (${placeholders})`,
    args: LAST_POST_SLUGS,
  })

  console.log(`${prod ? 'Turso' : 'local'}: ${result.rows.length}/${LAST_POST_SLUGS.length} deals del último post`)
  for (const row of result.rows) {
    console.log(`- ${row.id} | ${row.title} | com ${row.commission} | -${row.discountPercent}%`)
  }
  if (result.rows.length !== LAST_POST_SLUGS.length) {
    const found = new Set(result.rows.map(r => r.slug))
    const missing = LAST_POST_SLUGS.filter(slug => !found.has(slug))
    console.warn(`⚠️ Slugs no encontrados: ${missing.join(', ')}`)
  }

  if (!apply) {
    console.log('\nDry-run. Ejecuta con --apply para marcarlos como enviados.')
    return
  }

  for (const row of result.rows) {
    await db.execute({
      sql: `INSERT INTO telegram_sent_deals (dealId, sentAt, mode)
            VALUES (?, datetime('now'), 'digest')
            ON CONFLICT(dealId) DO UPDATE SET
              sentAt = datetime('now'),
              mode = excluded.mode`,
      args: [row.id as string],
    })
  }

  console.log(`\n✅ ${result.rows.length} deals marcados como enviados (rotación 21 días).`)
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
