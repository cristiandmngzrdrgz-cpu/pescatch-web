// PROPÓSITO: reescribir el cuerpo del post 'mejores-carretes-baratos-aliexpress-2026'
// con la estructura ganadora (intro + para los que tienen prisa + tabla + análisis
// por producto + cómo elegir + veredicto + FAQ). Conserva el bloque PRODUCTS_DATA
// intacto (cards con títulos, precios, imágenes y enlaces de afiliado).
// FECHA: 2026-08-07
// USO: npx tsx scripts/_archive/rewrite-ae-carretes-post.ts
import 'dotenv/config'
import { getPostBySlug, updatePost } from '../../src/data/blog-queries'

const SLUG = 'mejores-carretes-baratos-aliexpress-2026'

interface Section {
  short: string
  title: string
  badge: string
  price: string
  uso: string
  tec: string[]
  pros: string[]
  cons: string[]
  veredicto: string[]
}

const sections: Section[] = [
  {
    short: 'Lurekiller',
    title: 'Lurekiller — el metálico que aguanta la sal por menos de 22 €',
    badge: 'Mejor calidad-precio',
    price: '~21,81 €',
    uso: 'surfcasting ligero y pesca de barco ocasional',
    tec: ['Tallas 4000/5000/6000/10000', 'Cuerpo totalmente metálico', 'Para barco, mar y surf'],
    pros: ['Precio muy agresivo', 'Cuerpo metálico que aguanta la sal', 'Tallas de surf y barco'],
    cons: ['Marca sin reconocimiento', 'Rodamientos no especificados'],
    veredicto: [
      'Si tu rato es el surfcasting ligero o la pesca de barco ocasional y no quieres asustarte con los 100 € de las marcas patrias, este es tu carrete.',
      'Por menos de 22 € te llevas un cuerpo de metal total, con tallas de 4000 hasta 10000 para cubrir playa y barco. No es la pieza más refinada ni presume de rodamientos, pero por este precio cumple de sobra y aguanta la sal.',
    ],
  },
  {
    short: 'Sellado 9+1',
    title: 'Giratorio sellado 9+1 BB — el pensado para agua salada',
    badge: 'Mejor para agua salada',
    price: '~39,24 €',
    uso: 'spinning de mar y escollera',
    tec: ['9+1 rodamientos', 'Relación 5.2:1', 'Tallas 1000 a 6000', 'Arrastre máximo 15 kg'],
    pros: ['Rodamientos sellados contra la corrosión', 'Muchos tamaños para elegir', 'Relación equilibrada'],
    cons: ['Marca blanca', 'Peso algo alto en tallas grandes'],
    veredicto: [
      'Está construido pensando en la sal: rodamientos sellados y un acabado que aguanta el óxido, que es justo lo que mata a la mayoría de carretes baratos en la escollera.',
      'Con 9+1 rodamientos, arrastre de 15 kg y tallas de 1000 a 6000, cubre desde el spinning ligero hasta el mar. Es la opción más segura si pescas en agua salada sin gastar una barbaridad.',
    ],
  },
  {
    short: 'Noeby',
    title: 'Noeby — la gama alta con pedigree de AliExpress',
    badge: 'Gama alta con pedigree',
    price: '~60,04 €',
    uso: 'spinning potente, surf ligero y mar',
    tec: ['Tallas 3000 a 6000', 'Arrastre máximo 25 kg', 'Engranaje de aleación de zinc', 'Cuerpo de aluminio'],
    pros: ['Marca con buena reputación entre pescadores', 'Arrastre de 25 kg bestial', 'Construcción de aluminio'],
    cons: ['Precio más elevado', 'Engranajes de zinc, no de acero'],
    veredicto: [
      'Si buscas la referencia de AliExpress, es esta: una marca con nombre entre pescadores y una construcción de aluminio que se nota en la mano.',
      'El arrastre de 25 kg se ríe de carretes de marca patria que cuestan el triple, y en tallas 3000-6000 cubre spinning potente, surf ligero y mar. Es la gama alta si quieres algo que dure sin enterarte de que lo llevas.',
    ],
  },
  {
    short: 'Baitcasting electrónico',
    title: 'Baitcasting con freno electrónico — para entrar sin ovillos',
    badge: 'Mejor baitcasting barato',
    price: '~39,87 €',
    uso: 'bar, río y jigging ligero',
    tec: ['Freno magnético electrónico 5ª generación', 'Alarma de freno antirretorno', 'Baitcasting'],
    pros: ['Freno electrónico que evita los ovillos', 'Alarma antirretorno muy útil', 'Acabado premium'],
    cons: ['Peso algo alto', 'Curva de aprendizaje del baitcasting'],
    veredicto: [
      'Para el bar y el río, el miedo de todo el que entra al baitcasting son los famosos nidos de pájaro. El freno magnético electrónico de este carrete los evita casi por completo.',
      'Con alarma antirretorno y acabado premium por menos de 40 €, es la mejor puerta de entrada al baitcasting sin la frustración de la primera semana.',
    ],
  },
  {
    short: 'CAZULO',
    title: 'CAZULO — el rey del lance largo en la playa',
    badge: 'Para lance largo',
    price: '~45,89 €',
    uso: 'surfcasting y larga distancia',
    tec: ['Tallas 8000 a 12000', 'Resistente a la corrosión', 'Para playa y agua salada'],
    pros: ['Tirada larga de verdad', 'Cuerpo anticorrosión para playa', 'Tallas de gama alta'],
    cons: ['Pesado en tallas 12000', 'Voluminoso'],
    veredicto: [
      'Si el surfcasting es lo tuyo, este carrete va pensado para lanzar lejos: tallas de 8000 a 12000 con un cuerpo anticorrosión que aguanta la arena y la sal.',
      'Es grande y algo pesado en las tallas superiores, pero en la playa no lo notas tanto y la tirada larga se agradece cuando el pescado está a 100 metros.',
    ],
  },
]

async function main() {
  const post = await getPostBySlug(SLUG)
  if (!post) {
    console.error(`Post no encontrado: ${SLUG}`)
    process.exit(1)
  }

  const pdMatch = post.content.match(/<!--\s*PRODUCTS_DATA:\s*(\[.*?\])\s*-->/)
  if (!pdMatch) {
    console.error('No se encontró el bloque PRODUCTS_DATA')
    process.exit(1)
  }
  const productsBlock = `<!-- PRODUCTS_DATA: ${pdMatch[1]} -->`

  const intro = `Los carretes de las marcas patrias te piden 100 € o más por un cuerpo metálico y sellado. En AliExpress, ese mismo carrete lo encuentras por 22 €. Suena raro, pero lleva años pasando: las marcas blancas fabrican para toda Europa y el precio se queda en una fracción.

He analizado 5 carretes de AliExpress que están dando que hablar, elegidos de un filtrado de varias decenas de candidatos y pensados para lo que pescas de verdad: mar, playa, barco o dulce.`

  const quick = `## Para los que tienen prisa

- **¿Pescas en el mar y quieres algo barato y sellado?** El **giratorio sellado 9+1 BB** (~39 €).
- **¿Quieres la mejor relación calidad-precio?** El **Lurekiller** metálico (~22 €).
- **¿Surfcasting o lance largo?** El **CAZULO** de 8000 a 12000 (~46 €).
- **¿Entrar al baitcasting sin ovillos?** El **baitcasting con freno electrónico** (~40 €).
- **¿Gama alta sin pagar el triple?** El **Noeby** con arrastre de 25 kg (~60 €).`

  const tabla = `## Comparativa rápida

| Carrete | Precio ref. | Tipo | Lo mejor |
| --- | --- | --- | --- |
| ${sections[0].short} | ${sections[0].price} | Giratorio | ${sections[0].badge} |
| Giratorio sellado 9+1 | ${sections[1].price} | Giratorio | ${sections[1].badge} |
| ${sections[2].short} | ${sections[2].price} | Giratorio | ${sections[2].badge} |
| Baitcasting electrónico | ${sections[3].price} | Baitcasting | ${sections[3].badge} |
| ${sections[4].short} | ${sections[4].price} | Giratorio | ${sections[4].badge} |`

  function section(s: Section, i: number): string {
    return `${i > 0 ? '---\n\n' : ''}## ${i + 1}. ${s.title}
<!--PRODUCT_IMG:${i + 1}-->

Precio de referencia: **${s.price}** · Uso ideal: ${s.uso}

${s.veredicto.join('\n\n')}

**Lo mejor:**
${s.pros.map((x) => `- ${x}`).join('\n')}

**A vigilar:**
${s.cons.map((x) => `- ${x}`).join('\n')}

**Ficha rápida:** ${s.tec.join(' · ')}
`
  }

  const elegir = `---

## Cómo elegir tu carrete en AliExpress

- **Spinning y dulce:** una talla 3000 va sobrada. Ligera y versátil para todo el día.
- **Mar y escollera:** busca rodamientos sellados y una talla 4000-5000. Ahí brilla el **giratorio sellado 9+1**.
- **Surfcasting y lance largo:** sube a 8000-12000, como el **CAZULO**. La tirada larga manda sobre el peso.
- **Bar o río con señuelos:** un baitcasting con freno electrónico te evita los ovillos de la primera semana.
- **Presupuesto justo o barco:** un metálico como el **Lurekiller** cubre de sobra sin tocar los 100 €.`

  const veredicto = `## Veredicto final

Si solo vas a llevar un carrete de AliExpress a casa, **el giratorio sellado 9+1 BB** es la elección más segura: sellado contra la sal, 9 rodamientos y 39 €. Si tu presupuesto es mínimo, el **Lurekiller** por menos de 22 € es la mejor relación calidad-precio que vas a encontrar.

Y si ya pescas con asiduidad y quieres subir de nivel, el **Noeby** con sus 25 kg de arrastre es la gama alta que no le pide nada a las marcas patrias. Elige según tu pesca, no según el logo: los precios de este artículo son de referencia a fecha de publicación y pueden variar por talla, cupones y promociones activas.`

  const faq = `## FAQ

### ¿Son fiables los carretes de AliExpress?

A igualdad de especificaciones, hay marcas blancas que aguantan perfectamente la pesca de aficionado y de media intensidad. Lo importante es elegir rodamientos sellados si vas a agua salada y revisar los comentarios de otros compradores. Los de esta lista llevan tiempo con buena reputación entre pescadores.

### ¿Qué tamaño de carrete necesito?

Para spinning de escollera y mar, un 4000-5000 es la talla más versátil. Si pescas a surfcasting o lance largo, sube a 8000-12000. Para dulce y spinning ligero, un 3000 va sobrado. En la ficha de cada carrete tienes las tallas disponibles.

### ¿Cómo de caro sale el envío?

El envío desde AliExpress suele ser gratuito o de muy pocos euros, según tienda y tamaño. Los precios de este artículo son de referencia a fecha de publicación y pueden variar según talla, cupones y promociones activas.`

  const content = `${intro}\n\n${quick}\n\n${tabla}\n\n${sections.map((s, i) => section(s, i)).join('\n')}\n${elegir}\n\n${veredicto}\n\n${faq}\n\n${productsBlock}`

  await updatePost(post.id, {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content,
    featuredImage: post.featuredImage,
    author: post.author,
    category: post.category,
    tags: post.tags,
    relatedAsins: post.relatedAsins,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    canonicalUrl: post.canonicalUrl,
    focusKeyword: post.focusKeyword,
    status: post.status,
  })

  console.log('✅ Cuerpo reescrito en local:', SLUG)
  console.log('Bloque PRODUCTS_DATA intacto, caracteres:', productsBlock.length)
  console.log('Nuevo contenido, caracteres:', content.length)
  console.log('\n👉 Ahora ejecuta: npx tsx scripts/_archive/push-post-to-prod.ts ' + SLUG + ' --apply')
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
