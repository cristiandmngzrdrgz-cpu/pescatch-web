// PROPÓSITO: crear el post "mejores carretes de agua salada 2026" con precios
//            verificados contra ficha de Amazon (8-nov-2026) y sin descuentos inventados.
// FECHA: 2026-11-08
// ESTADO: one-shot ejecutado (post `mejores-carretes-agua-salada-2026` publicado) → archivado.
// Uso: npx tsx scripts/create-post-carretes-agua-salada.ts [--apply]

import 'dotenv/config'
import { initSchema, migrateSchema, getDb } from '../src/lib/db'
import { createPost, getPostBySlug } from '../src/data/blog-queries'

const SLUG = 'mejores-carretes-agua-salada-2026'
const PUBLISHED_AT = '2026-11-08T09:00:00.000Z'

interface Item {
  slug: string
  title: string
  price: string
  badge: string
  badgeColor: string
  scores: Record<string, number>
  image?: string
}

const ITEMS: Item[] = [
  {
    slug: 'penn-pursuit-iv---carrete-giratorio-de-agua-salada-pesca-giratoria-plantilla-car',
    title: 'PENN Pursuit IV',
    price: '44,99€',
    badge: 'Entrada al mar',
    badgeColor: '#22C55E',
    scores: { Precio: 94, Versatilidad: 84, Freno: 72, Durabilidad: 74 },
  },
  {
    slug: 'penn-wrath-ii---carrete-giratorio-duradero-y-ligero-diseado-para-ser-verstil-y-d',
    title: 'PENN Wrath II',
    price: '60,72€',
    badge: 'Mejor precio',
    badgeColor: '#22C55E',
    scores: { Precio: 90, Ligereza: 86, Resistencia: 82, Freno: 74 },
  },
  {
    slug: 'penn-combat-iii---carrete-giratorio-de-agua-salada---carrete-verstil-de-pesca-ma',
    title: 'PENN Combat III',
    price: '74,82€',
    badge: '−17%',
    badgeColor: '#F59E0B',
    scores: { Equilibrio: 92, Versatilidad: 90, Freno: 84, Precio: 86 },
  },
  {
    slug: 'shimano-socorro-sw-10000',
    title: 'Shimano Socorro SW 10000',
    price: '118,71€',
    badge: 'Tamaño 10000',
    badgeColor: '#38BDF8',
    scores: { Capacidad: 90, Resistencia: 86, Precio: 80, Peso: 68 },
  },
  {
    slug: 'penn-spinfisher-vii-carrete-giratorio-live-liner-y-longcast-carrete-para-pesca-e',
    title: 'PENN Spinfisher VII',
    price: '166,82€',
    badge: 'Sellado IPX5',
    badgeColor: '#38BDF8',
    scores: { Sellado: 94, Durabilidad: 90, Freno: 86, Precio: 72 },
  },
  {
    slug: 'penn-clash-ii-carrete-giratorio-ligero-para-agua-salada-y-kayak-para-pesca-con-s',
    title: 'PENN Clash II',
    price: '222,00€',
    badge: 'Ligero',
    badgeColor: '#A78BFA',
    scores: { Ligereza: 92, Suavidad: 90, Resistencia: 86, Precio: 70 },
  },
  {
    slug: 'shimano-saragosa-sw-a---carrete-de-agua-salada',
    title: 'Shimano Saragosa SW A',
    price: '252,95€',
    badge: 'Jigging',
    badgeColor: '#38BDF8',
    scores: { Potencia: 92, Freno: 90, Sellado: 86, Precio: 66 },
  },
  {
    slug: 'okuma-komodo-ss---marco-de-aluminio-de-gran-capacidad-engranajes-de-acero-inoxid',
    title: 'Okuma Komodo SS',
    price: '308,79€',
    badge: 'Potencia',
    badgeColor: '#F59E0B',
    scores: { Potencia: 96, Engranajes: 92, Capacidad: 90, Precio: 58 },
  },
]

function normalizeImage(url: string): string {
  if (!url) return ''
  if (url.includes('m.media-amazon.com')) {
    return url.replace(/\._AC_[^/]*\.jpg$/i, '._AC_SL1500_.jpg')
  }
  return url
}

async function main() {
  const apply = process.argv.includes('--apply')
  await initSchema()
  await migrateSchema()
  const db = getDb()

  const existing = await getPostBySlug(SLUG)
  if (existing) {
    console.error(`El post ${SLUG} ya existe (id ${existing.id}). Abortado.`)
    process.exit(1)
  }

  const cards = []
  for (const item of ITEMS) {
    const res = await db.execute({
      sql: 'SELECT title, salePrice, originalPrice, discountPercent, imageUrl, affiliateUrl, rating, reviewCount, stockStatus, status FROM deals WHERE slug = ?',
      args: [item.slug],
    })
    if (res.rows.length === 0) {
      console.error(`Deal no encontrado: ${item.slug}`)
      process.exit(1)
    }
    const row = res.rows[0]
    if (String(row.status) !== 'published') {
      console.error(`Deal no publicado: ${item.slug} (${row.status})`)
      process.exit(1)
    }
    const realPrice = `${Number(row.salePrice).toFixed(2).replace('.', ',')}€`
    if (realPrice !== item.price) {
      console.error(`Precio descuadrado en ${item.slug}: BD ${realPrice} vs post ${item.price}`)
      process.exit(1)
    }
    if (Number(row.rating) === 0) {
      console.error(`Deal sin rating verificado: ${item.slug}`)
      process.exit(1)
    }
    cards.push({
      title: item.title,
      rating: Number(row.rating) || 0,
      image: item.image ?? normalizeImage(String(row.imageUrl || '')),
      badge: item.badge,
      badgeColor: item.badgeColor,
      scores: item.scores,
      stores: [{ name: 'Amazon', url: String(row.affiliateUrl), price: realPrice }],
      slug: item.slug,
    })
  }

  const productsData = `<!-- PRODUCTS_DATA: ${JSON.stringify(cards)} -->`

  const content = `# Los mejores carretes de agua salada de 2026: 8 opciones de mar por presupuesto

> El mar se come los carretes baratos. No de golpe: primero el freno empieza a rascar, luego el rodamiento del pinión se pone áspero y al año el carrete tiene una holgura que no tenía. Esta lista va de 44,99 € a 308,79 € con el precio de la ficha comprobado hoy, 8 de noviembre de 2026. Seis de los ocho van a precio de ficha: solo el Combat III y el Socorro tienen tachado real.

## Tabla resumen

| # | Carrete | Precio | Descuento | Para quién |
|---|---------|--------|-----------|------------|
| 1 | PENN Pursuit IV | 44,99€ | precio de ficha | primera temporada en el mar |
| 2 | PENN Wrath II | 60,72€ | precio de ficha | spinning desde costa con poco presupuesto |
| 3 | PENN Combat III | 74,82€ | −17% | el equilibrio de la lista |
| 4 | Shimano Socorro SW 10000 | 118,71€ | −7% | embarcación y jigging ligero |
| 5 | PENN Spinfisher VII | 166,82€ | precio de ficha | pescar mucho y que dure |
| 6 | PENN Clash II | 222,00€ | precio de ficha | spinning marítimo intensivo |
| 7 | Shimano Saragosa SW A | 252,95€ | precio de ficha | jigging y peces que tiran |
| 8 | Okuma Komodo SS | 308,79€ | precio de ficha | potencia de perfil bajo |

${productsData}

## Qué mirar antes de comprar

**1. Sellado y anticorrosión.** Es la diferencia real entre un carrete de mar y uno de agua dulce pintado de negro. Un sellado tipo IPX5 (lo lleva el Spinfisher VII) aguanta salpicaduras y lluvia; un carrete sin sellar aguanta la salida, pero no la temporada.

**2. El freno.** No es solo cuántos kilos aguanta: son las arandelas. Un freno de fibra con arandelas de acero se mantiene suave con los meses; uno de cartón empieza a pegarse en cuanto entra arena. Si pescas desde embarcación, el freno delantero es lo normal; el live liner del Spinfisher solo tiene sentido si sueltas línea con el pez ya enganchado.

**3. El tamaño.** Para costa y spinning, 2500-4000. Para embarcación ligera y curricán, 5000-6000. Para jigging y fondo, 8000-10000. Un 10000 en una caña de spinning desde playa es un error: pesa y desequilibra.

**4. El cuerpo.** Grafito barato significa menos rigidez cuando el pez tira. Aleación o aluminio cuestan más, pero el carrete no flexa bajo carga. El Komodo SS es el ejemplo extremo: marco de aluminio y engranajes de acero inoxidable.

**5. Los rodamientos.** El número importa menos que dónde están. Cinco rodamientos bien colocados dan un carrete más suave que nueve mal repartidos.

## Los 8, uno a uno

### 1. PENN Pursuit IV — 44,99€

<!--PRODUCT_IMG:1-->

PENN Pursuit IV

**Pros:** Es el más barato de la lista y aun así tiene **4,6★ con 728 valoraciones**, la mayor muestra de todas. La ficha lo presenta como carrete polivalente para barco, kayak y orilla. A este precio, si haces diez salidas al año y lo aclaras con agua dulce al llegar a casa, cumple de sobra.

**Contras:** No esperes sellado ni un freno de gama alta. Es un carrete para peces normales desde costa o kayak, no para pelear con un gran pez desde una roca.

**Para quién:** tu primera temporada en el mar, o un segundo carrete de apoyo para llevar en el coche.

### 2. PENN Wrath II — 60,72€

<!--PRODUCT_IMG:2-->

PENN Wrath II

**Pros:** PENN lo vende como duradero y ligero, pensado para lubina, bacalao, abadejo y especies de roca. **4,6★ con 74 valoraciones** y 60,72€ a precio de ficha: es el paso lógico entre el Pursuit y el Combat.

**Contras:** Aún tiene pocas valoraciones comparado con el resto. Y no lleva el sellado del Spinfisher, así que el mantenimiento tras cada salida no es opcional.

**Para quién:** quien pesca lubina y especies de roca desde costa y quiere un PENN sin llegar a los 75€.

### 3. PENN Combat III — 74,82€ (−17%)

<!--PRODUCT_IMG:3-->

PENN Combat III

**Pros:** Es el único descuento serio de la lista: **74,82€ frente a 89,90€, un −17% que está en la ficha**. La propia ficha lo presenta para barco, kayak, orilla, spinning, jigging y surf, y tiene **4,3★ con 153 valoraciones**. Si tuviera que quedarme con uno solo por relación precio/polivalencia, sería este.

**Contras:** No es ultraligero ni un carrete de agua dulce fina. Pesa lo suyo y está pensado para mar.

**Para quién:** el que quiere un carrete para todo en el mar sin pasar de 80€.

### 4. Shimano Socorro SW 10000 — 118,71€ (−7%)

<!--PRODUCT_IMG:4-->

Shimano Socorro SW 10000

**Pros:** El Shimano más barato de la lista con SW en el nombre, y el primer salto de tamaño: un **10000** con capacidad para jigging y embarcación. **4,4★ con 491 valoraciones** y 118,71€ frente a 127,59€ (−7%).

**Contras:** El envío tarda 2-3 días, no es inmediato. Y un 10000 no es un carrete para lanzar desde playa: es para dejarse caer y recoger.

**Para quién:** embarcación, jigging ligero y curricán de fondo. El carrete de "vamos a probar a fondo".

### 5. PENN Spinfisher VII — 166,82€

<!--PRODUCT_IMG:5-->

PENN Spinfisher VII

**Pros:** Aquí empieza el carrete que aguanta años. La ficha habla de **sellado IPX5 y CNC**, con versiones live liner y longcast. **4,5★ con 286 valoraciones**. Es el que compra quien ya se ha cargado un carrete barato y no quiere repetir.

**Contras:** 166,82€ sin tachado. Y ahora mismo **solo queda 1 unidad**. Si lo que buscas es la versión longcast para playa, mira la comparativa de carretes de surfcasting.

**Para quién:** quien pesca dos veces por semana y quiere dejar de comprar carretes cada dos años.

### 6. PENN Clash II — 222,00€

<!--PRODUCT_IMG:6-->

PENN Clash II

**Pros:** **4,6★ con 440 valoraciones**, la mejor nota de la lista con volumen alto. La ficha lo describe como ligero para agua salada y kayak, pensado para pesca con señuelos: lubina, abadejo, bacalao. Si haces spinning marítimo en serio, es el carrete que más se ajusta.

**Contras:** 222€ a precio de ficha, sin descuento. Y no es un carrete de embarcación pesada: para eso está el Saragosa o el Socorro 10000.

**Para quién:** spinning desde costa y kayak con señuelos, muchas salidas al año.

### 7. Shimano Saragosa SW A — 252,95€

<!--PRODUCT_IMG:7-->

Shimano Saragosa SW A

**Pros:** La gama SW de Shimano para jigging y popping. **4,4★ con 89 valoraciones**. Es un carrete para peces que tiran de verdad, con un freno pensado para trabajar con él, no para pasearlo.

**Contras:** **Solo queda 1 unidad** y 252,95€ es mucho para pesca desde costa. Si tu pesca es lubina desde espigón, no necesitas este hierro.

**Para quién:** jigging desde embarcación y salidas en las que el pez no se rinde en diez segundos.

### 8. Okuma Komodo SS — 308,79€

<!--PRODUCT_IMG:8-->

Okuma Komodo SS

**Pros:** Perfil bajo con **marco de aluminio, engranajes de acero inoxidable y gran capacidad de línea**, según la ficha. Es el carrete de potencia de la lista, para jigging y para peces grandes con caña de casting. **4,6★ con 86 valoraciones**.

**Contras:** Es el más caro y el más especializado. Un perfil bajo no es para todo el mundo: si vienes de spinning con carrete frontal, el cambio de muñeca se nota.

**Para quién:** embarcación y jigging con caña de casting, o quien ya sabe que va a pelear piezas grandes.

## Cuál elegir según tu pesca

**Spinning desde costa:** si pescas mucho, **Clash II (222€)**; si quieres gastar menos, **Combat III (74,82€)**; si empiezas, **Pursuit IV (44,99€)**.

**Kayak:** **Combat III** o **Clash II**. Los dos ligeros, los dos con nota alta.

**Embarcación y fondo:** **Socorro SW 10000 (118,71€)**. Es el tamaño y el precio que tienen sentido para dejarse caer.

**Jigging:** **Saragosa SW A (252,95€)** si quieres frontal; **Komodo SS (308,79€)** si prefieres perfil bajo y potencia.

**Curricán y arrastre:** necesitas multiplicador. En la web tienes Rival Level Wind, Squall y Torium SW en la categoría de carretes.

**Surfcasting:** no lo mezcles con esta lista. Un carrete de playa necesita lance largo y bobina cónica; lo tienes en [los mejores carretes de surfcasting de 2026](/blog/mejores-carretes-surfcasting-2026) y en [el equipo de surfcasting barato](/blog/equipo-surfcasting-barato-2026).

## Mantenimiento: lo que separa un carrete de dos años de uno de diez

- **Agua dulce al llegar a casa**, sin presión y sin sumergirlo. Un chorro suave por la bobina y el cuerpo.
- **Freno suelto** para guardar: las arandelas comprimidas meses se deforman.
- **Secarlo antes de guardarlo**, y nunca dejarlo en el maletero con la funda húmeda.
- **Grasa una vez al año** en el eje y el guía-hilos. Si pescas mucho, dos.
- **Revisar el hilo** después de cada salida: el trenzado con sal se corta donde roza la anilla.

## Conclusión

**Menos de 80€:** **Combat III (74,82€)** es el mejor carrete de esta lista por debajo de ese precio, y el único con un descuento real. Si no llegas, el **Pursuit IV (44,99€)** cumple para empezar.

**Entre 80 y 170€:** **Socorro SW 10000 (118,71€)** si pescas desde embarcación; **Spinfisher VII (166,82€)** si quieres un carrete que dure y pescas mucho.

**Más de 200€:** **Clash II (222€)** para spinning marítimo, **Saragosa SW A (252,95€)** para jigging frontal y **Komodo SS (308,79€)** si quieres perfil bajo y potencia.

Y una regla que vale más que cualquier comparativa: el carrete barato que aclaras cada salida dura más que el caro que guardas con sal.

## FAQ

### ¿Puedo usar un carrete de agua dulce en el mar?

Puedes, y te va a durar poco. La sal entra en el freno y en los rodamientos y no sale con un aclarado superficial. Si vas a pescar en mar de forma habitual, compra un carrete con sellado o, como mínimo, uno pensado para agua salada y acláralo después de cada salida.

### ¿Cuánto hay que gastar para un carrete de mar decente?

Con 60-75€ ya tienes un carrete que aguanta una temporada si lo cuidas: el Wrath II y el Combat III son ese rango. A partir de 150€ empiezas a pagar sellado y materiales, y ahí el carrete dura años en vez de temporadas.

### ¿Qué tamaño elijo para pescar desde embarcación?

Para fondo y jigging ligero, un 8000-10000 es lo normal. El Socorro SW 10000 de esta lista es ese perfil: capacidad de hilo y freno para trabajar con plomo, no para lanzar. Para spinning desde la borda, un 4000-6000 va sobrado.

### ¿Cada cuánto se cambia un carrete de mar?

No hay un plazo fijo. Se cambia cuando el freno rasca, el carrete tiene holgura o el giro no es suave ni después de limpiarlo. Un carrete de 60€ cuidado dura dos o tres temporadas; uno sellado de 170€ puede durar el triple.

### ¿Merece la pena pagar por el sellado IPX5?

Si pescas en mar varias veces al mes, sí. El sellado protege el mecanismo de salpicaduras y lluvia, que es la vía por la que entra el agua en un carrete normal. Si pescas cuatro veces al año desde kayak en agua calmada, un carrete sin sellar bien cuidado te vale.
`

  if (!apply) {
    console.log(`DRY-RUN: se crearía el post ${SLUG} (${content.length} chars, ${cards.length} productos, ${(content.match(/<!--PRODUCT_IMG:/g) || []).length} CTAs).`)
    return
  }

  const post = await createPost({
    title: 'Los mejores carretes de agua salada de 2026: 8 opciones de mar por presupuesto',
    slug: SLUG,
    excerpt: 'Ocho carretes de mar con precio verificado: PENN Combat III al −17%, Pursuit IV desde 44,99€, Spinfisher VII sellado IPX5, Socorro SW 10000, Saragosa y Komodo SS. Cuál elegir según tu pesca.',
    content,
    featuredImage: 'https://m.media-amazon.com/images/I/61rLu5BPLNL._AC_SL1500_.jpg',
    author: 'PesCatch',
    category: 'Carretes',
    tags: ['agua salada', 'carretes', 'mar', 'embarcacion', 'jigging', 'penn', 'shimano', 'okuma'],
    relatedAsins: [],
    status: 'draft',
    metaTitle: 'Carretes de agua salada 2026: 8 opciones desde 44,99 €',
    metaDescription: 'Comparativa de 8 carretes de mar con precio verificado: PENN Combat III −17%, Spinfisher VII, Saragosa SW y Komodo SS. Cuál comprar según tu pesca.',
    focusKeyword: 'carrete agua salada',
    publishedAt: PUBLISHED_AT,
  })

  console.log(`✅ Post creado en local: ${post.slug} (id ${post.id}, status ${post.status}, hidden ${post.hidden})`)
  console.log('Siguiente: npx tsx scripts/publish-post.ts ' + SLUG + ' --apply')
}

main().catch(e => { console.error(e); process.exit(1) })
