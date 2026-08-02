import { getDb } from '../src/lib/db'

type Repl = [string, string]

const REPLACEMENTS: Record<string, Repl[]> = {
  'shimano-vs-daiwa-mejores-carretes-spinning': [
    ['para empezar (40€)', 'para empezar (31€)'],
    ['**Daiwa Ninja LT** (60€)', '**Daiwa Ninja LT** (52€)'],
    ['**Shimano Sedona** (75€)', '**Shimano Sedona** (67€)'],
    ['Por unos 40€ tienes un carrete', 'Por unos 31€ tienes un carrete'],
    ['Por 60€ tienes tecnología LT', 'Por 52€ tienes tecnología LT'],
    ['Por 75€ incorpora la tecnología Hagane', 'Por 67€ incorpora la tecnología Hagane'],
    ['segmento de los 75-80€', 'segmento de los 85-90€'],
    ['presupuesto a 75€, el Exceler', 'presupuesto a 86€, el Exceler'],
    ['Si el Ninja está fuera de presupuesto, el Laguna te dará el 90% de la experiencia por 15€ menos.', 'Si encuentras el Ninja a buen precio, no lo dudes. El Laguna comparte chasis LT y rotor Air Rotor con el Ninja, así que sigue siendo una alternativa sólida de Daiwa.'],
    ['- **Menos de 35€**: Shimano Sienna.', '- **Menos de 32€**: Shimano Sienna.'],
    ['- **45-50€**: Empate técnico. Daiwa Laguna LT por suavidad y peso, Shimano Catana por tacto y fiabilidad.', '- **34-53€**: Shimano Catana por tacto y fiabilidad.'],
    ['- **60-65€**: Daiwa Ninja LT. El más equilibrado de toda la comparativa.', '- **52€**: Daiwa Ninja LT. El más equilibrado de toda la comparativa.'],
    ['- **68-75€**: Shimano Sedona si valoras la durabilidad, Daiwa Exceler si prefieres velocidad de recogida.', '- **67-86€**: Shimano Sedona si valoras la durabilidad, Daiwa Exceler si prefieres velocidad de recogida.'],
  ],
  'mejores-canas-spinning-2026': [
    ['Por unos 150€ recibes una caña', 'Por unos 167€ recibes una caña'],
    ['Por unos 100€ tienes una caña', 'Por unos 84€ tienes una caña'],
    ['Por unos 50€, recibes una caña', 'Por unos 39€, recibes una caña'],
    ['No esperes la sensibilidad de una caña de 600€', 'No esperes la sensibilidad de una caña de 800€'],
    ['una caña de 150€ y una de 600€', 'una caña de 150€ y una de 800€'],
    ['### ¿Merece la pena gastar 600€ en una caña?', '### ¿Merece la pena gastar 800€ en una caña?'],
    ['los pescadores no necesitan una caña de 650€', 'los pescadores no necesitan una caña de 800€'],
  ],
  'mejores-kits-senuelos-empezar-2026': [
    ['**Savage Gear Sandeel Kit** te saca del apuro por poco más de 10€', '**Savage Gear Sandeel Kit** te saca del apuro por unos 32€'],
    ['en costa por menos de 15€', 'en costa por unos 32€'],
    ['por menos de 15€. No será lo mejor', 'por unos 32€. No será lo mejor'],
    ['te da vinilos y duros de calidad por menos de 40€', 'te da vinilos y duros de calidad por menos de 25€'],
  ],
  'mejores-canas-surfcasting-2026': [
    ['- **Precio:** ~355€ |', '- **Precio:** ~370€ |'],
    ['Por poco más de 100€ tienes un blank', 'Por unos 58€ tienes un blank'],
    ['- **Precio:** ~108€ |', '- **Precio:** ~58€ |'],
    ['- **Precio:** 86-110€ |', '- **Precio:** 86€ |'],
    ['Por unos 125€ recibes una caña', 'Por unos 63€ recibes una caña'],
    ['- **Precio:** ~125€ |', '- **Precio:** ~63€ |'],
    ['Por 25-35€ tienes una caña', 'Por unos 25€ tienes una caña'],
    ['- **Precio:** 24-55€ |', '- **Precio:** 25€ |'],
    ['Por 108€ tienes una caña de carbono que compite', 'Por unos 58€ tienes una caña de carbono que compite'],
  ],
}

async function main() {
  const db = getDb()
  const posts = await db.execute("SELECT slug, content FROM posts WHERE status='published'")
  for (const p of posts.rows) {
    const slug = p.slug as string
    const repls = REPLACEMENTS[slug]
    if (!repls) continue
    let content = p.content as string
    let changed = 0
    for (const [oldStr, newStr] of repls) {
      if (content.includes(oldStr)) {
        content = content.split(oldStr).join(newStr)
        changed++
      } else {
        console.log(`  ⚠️ no encontrado en ${slug}: "${oldStr.slice(0, 60)}"`)
      }
    }
    if (changed > 0) {
      await db.execute({ sql: 'UPDATE posts SET content = ? WHERE slug = ?', args: [content, slug] })
      console.log(`✅ ${slug}: ${changed} reemplazos`)
    }
  }
  db.close()
}
main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
