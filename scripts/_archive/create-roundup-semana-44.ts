// PROPÓSITO: Crear el roundup de la semana 44 (26 oct-1 nov 2026) como borrador local,
//            con precios verificados el 24 oct 2026 y sin descuentos inventados.
// FECHA: 2026-10-24
// Uso: npx tsx scripts/create-roundup-semana-44.ts [--apply]

import 'dotenv/config'
import { initSchema, migrateSchema, getDb } from '../../src/lib/db'
import { createPost, getPostBySlug } from '../../src/data/blog-queries'

const SLUG = 'chollos-pesca-semana-44-2026'
const PUBLISHED_AT = '2026-10-29T09:00:00.000Z'

interface Item {
  slug: string
  title: string
  store: 'Amazon' | 'AliExpress'
  price: string
  badge: string
  badgeColor: string
  scores: Record<string, number>
  image?: string
}

const ITEMS: Item[] = [
  {
    slug: 'daiwa-carrete-giratorio-23bg-sw-4000-18000-varios-modelo-2023',
    title: 'Daiwa 23BG SW 4000',
    store: 'Amazon',
    price: '194,44€',
    badge: 'Verificado',
    badgeColor: 'green',
    scores: { Resistencia: 94, Freno: 90, Suavidad: 84, Precio: 78 },
    image: 'https://m.media-amazon.com/images/I/51sLxCiu8OL._AC_SL1500_.jpg',
  },
  {
    slug: 'okuma-carretes-convector-de-perfil-bajo-3bb1rb-541-multi-talla-nica',
    title: 'Okuma Convector con contador',
    store: 'Amazon',
    price: '158,13€',
    badge: 'Verificado',
    badgeColor: 'green',
    scores: { Contador: 92, Engranajes: 88, Precio: 80, Peso: 72 },
    image: 'https://m.media-amazon.com/images/I/611DO8-SUWL._AC_SL1500_.jpg',
  },
  {
    slug: 'daiwa-24-carretes-prorex-x-lt',
    title: 'Daiwa Prorex X LT',
    store: 'Amazon',
    price: '92,41€',
    badge: 'Verificado',
    badgeColor: 'green',
    scores: { Ligereza: 90, Suavidad: 86, Depredador: 88, Precio: 82 },
    image: 'https://m.media-amazon.com/images/I/61Tzq98+qkL._AC_SL1500_.jpg',
  },
  {
    slug: 'okuma-magda-pro-line-counter-levelwind---carrete-de-arrastre',
    title: 'Okuma Magda Pro Line Counter',
    store: 'Amazon',
    price: '83,17€',
    badge: 'Verificado',
    badgeColor: 'green',
    scores: { Contador: 92, Durabilidad: 86, Precio: 84, Peso: 70 },
    image: 'https://m.media-amazon.com/images/I/71MbaGagrFL._AC_SL1500_.jpg',
  },
  {
    slug: 'navis---traje-de-lluvia-para-hombre-resistente-al-agua-con-pantalones-3-piezas-c',
    title: 'Navis traje de lluvia 3 piezas',
    store: 'Amazon',
    price: '75,65€',
    badge: '−15%',
    badgeColor: '#F59E0B',
    scores: { Impermeabilidad: 90, Abrigo: 86, Precio: 84, Transpirabilidad: 74 },
    image: 'https://m.media-amazon.com/images/I/71uFZyUAQsL._AC_SL1500_.jpg',
  },
  {
    slug: 'okumatrout-rod',
    title: 'Okuma Trout Rod',
    store: 'Amazon',
    price: '51,41€',
    badge: 'Verificado',
    badgeColor: 'green',
    scores: { Sensibilidad: 90, Anillas: 84, Precio: 88, Acción: 80 },
    image: 'https://m.media-amazon.com/images/I/613HYgnOS5L._AC_SL1500_.jpg',
  },
  {
    slug: 'leydun-micro-hilo-de-pescar-ms-fino-100m-150m-4-hebras-trenzadas-de-pe-monofilam_aliexpress',
    title: 'Leydun trenzado PE 4 hebras',
    store: 'AliExpress',
    price: '3,39€',
    badge: 'Verificado',
    badgeColor: 'green',
    scores: { Precio: 96, Suavidad: 86, Durabilidad: 78, Color: 72 },
  },
  {
    slug: 'caja-de-aparejos-de-pesca-de-gran-capacidad-accesorios-impermeables-almacenamien_aliexpress',
    title: 'Caja de aparejos impermeable',
    store: 'AliExpress',
    price: '6,19€',
    badge: 'Verificado',
    badgeColor: 'green',
    scores: { Precio: 96, Capacidad: 88, Impermeabilidad: 84, Cierre: 80 },
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
      sql: 'SELECT title, salePrice, originalPrice, imageUrl, affiliateUrl, rating FROM deals WHERE slug = ?',
      args: [item.slug],
    })
    if (res.rows.length === 0) {
      console.error(`Deal no encontrado: ${item.slug}`)
      process.exit(1)
    }
    const row = res.rows[0]
    const realPrice = `${Number(row.salePrice).toFixed(2).replace('.', ',')}€`
    if (realPrice !== item.price) {
      console.error(`Precio descuadrado en ${item.slug}: BD ${realPrice} vs post ${item.price}`)
      process.exit(1)
    }
    cards.push({
      title: item.title,
      rating: Number(row.rating) || 0,
      image: item.image ?? normalizeImage(String(row.imageUrl || '')),
      badge: item.badge,
      badgeColor: item.badgeColor,
      scores: item.scores,
      stores: [{ name: item.store, url: String(row.affiliateUrl), price: realPrice }],
      slug: item.slug,
    })
  }

  const productsData = `<!-- PRODUCTS_DATA: ${JSON.stringify(cards)} -->`

  const content = `# 8 chollos de pesca de la semana (26 oct-1 nov 2026): Daiwa y Okuma con precio verificado

> Semana de carretes. Cinco fichas nuevas de Daiwa y Okuma comprobadas hoy contra la página de Amazon: el BG SW de agua salada, el Convector y el Magda Pro con contador de línea, el Prorex X LT para depredador y la caña Trout. Solo hay un tachado real esta semana, el chubasquero Navis al −15%. El resto va a precio de ficha y así lo contamos. Para cerrar el equipo, dos complementos de AliExpress por menos de 7 €.

## Tabla resumen

| # | Producto | Precio | Descuento | Tienda |
|---|----------|--------|-----------|--------|
| 1 | Daiwa 23BG SW 4000 — carrete de agua salada | 194,44€ | precio verificado | Amazon |
| 2 | Okuma Convector — contador de línea | 158,13€ | precio verificado | Amazon |
| 3 | Daiwa Prorex X LT — spinning de depredador | 92,41€ | precio verificado | Amazon |
| 4 | Okuma Magda Pro — levelwind con contador | 83,17€ | precio verificado | Amazon |
| 5 | Navis traje de lluvia — 3 piezas | 75,65€ | −15% | Amazon |
| 6 | Okuma Trout Rod — caña de trucha | 51,41€ | precio verificado | Amazon |
| 7 | Leydun trenzado PE — 4 hebras | 3,39€ | precio verificado | AliExpress |
| 8 | Caja de aparejos — impermeable | 6,19€ | precio verificado | AliExpress |

${productsData}

## Los 8, uno a uno

### 1. Daiwa 23BG SW 4000

<!--PRODUCT_IMG:1-->

Daiwa 23BG SW 4000

**Pros:** Es el carrete de mar de la semana. Cuerpo completo de metal, 5 rodamientos más 1 de rodillo, freno de 12 kg y 285 g en la talla 4000, con recogida de 99 cm por vuelta y relación 6,2:1. La gama llega de 4000 a 18000, así que hay talla para spinning desde roca, jigging ligero o embarcación. 4,4★ con 111 valoraciones. **Contras:** 194,44€ sin tachado: es compra de fondo de armario, no de impulso. Para spinning fino de lubina sobra carrete y peso.

### 2. Okuma Convector con contador

<!--PRODUCT_IMG:2-->

Okuma Convector con contador

**Pros:** Contador de línea mecánico en pies con tecnología CVT antivaho, engranajes de latón cortados a máquina y bobina de aluminio A6061-T6 anodizado. Relación 5,4:1 y 3 rodamientos más 1 de rodillo: un carrete de arrastre para curricán y pesca desde embarcación, donde el contador te dice exactamente cuánta línea llevas fuera. 4,5★ con 403 valoraciones. **Contras:** No es un carrete de lance: si pescas desde costa, este no es tu carrete. 158,13€ a precio de ficha.

### 3. Daiwa Prorex X LT

<!--PRODUCT_IMG:3-->

Daiwa Prorex X LT

**Pros:** La gama LT de Daiwa (light & tough) aplicada al spinning de depredador: lucio, perca, black bass. Compacto, con la suavidad típica de Daiwa en esta gama y un precio de 92,41€ que lo pone en el rango de carrete principal sin llegar a los 150€. 4,5★ con 37 valoraciones. **Contras:** La ficha de Amazon no detalla peso ni freno máximo, así que no lo compres comparando cifras: compáralo por tacto y por el uso que le vas a dar. Para agua salada, mejor el BG SW.

### 4. Okuma Magda Pro Line Counter

<!--PRODUCT_IMG:4-->

Okuma Magda Pro Line Counter

**Pros:** El otro carrete de curricán de la lista. Levelwind con contador de línea, pensado para repetir tiradas a la misma profundidad y no pelearte con el reparto de hilo. 83,17€ es el precio más bajo de los cuatro carretes y tiene 4,2★ con 382 valoraciones. **Contras:** Pesa y está pensado para caña de barco, no para lanzar desde la orilla. Si buscas un carrete de spinning, mira el Prorex.

### 5. Navis traje de lluvia 3 piezas

<!--PRODUCT_IMG:5-->

Navis traje de lluvia 3 piezas

**Pros:** Es el único descuento real de la semana: 75,65€ frente a 89€, un −15% que sí está en la ficha. Conjunto de chaqueta y peto con pantalones, resistente al agua y con costuras selladas, para las jornadas de otoño en las que acabas calado antes de las nueve. 4,4★ con 398 valoraciones. **Contras:** No es un traje transpirable de gama alta: en días de calor y caminata larga acabas sudando. Ocupa en la mochila, pero para el coche es lo práctico.

### 6. Okuma Trout Rod

<!--PRODUCT_IMG:6-->

Okuma Trout Rod

**Pros:** Blank de carbono IM-8, ligero y sensible, con anillas de óxido de aluminio que aguantan trenzado, monofilamento y fluorocarbono. Detalles que no se ven en una caña de 50€: portacarretes y mangos premium, más enganche de acero inoxidable para el señuelo. 51,41€. **Contras:** Es una caña específica de trucha: si pescas lubina o carpa, no es tu caña. La ficha no fija longitud y acción en el título, así que elige bien la variante antes de comprar.

### 7. Leydun trenzado PE 4 hebras

<!--PRODUCT_IMG:7-->

Leydun trenzado PE 4 hebras

**Pros:** 3,39€ por 100-150 m de trenzado de 4 hebras y 4,9★ con 2.416 valoraciones. Para rellenar una bobina de repuesto, montar un equipo ultraligero o probar un diámetro nuevo sin gastarte 25€ en una bobina de marca. **Contras:** En las reseñas se repite que pierde color en las primeras jornadas y que en diámetros muy finos conviene revisar el nudo. No es un trenzado para pesca pesada.

### 8. Caja de aparejos impermeable

<!--PRODUCT_IMG:8-->

Caja de aparejos impermeable

**Pros:** 6,19€ por una caja de gran capacidad con divisores, juntas y cierre pensados para que no entre agua en la mochila. 4,9★ con 1.016 valoraciones. Es el complemento que evita que los anzuelos acaben clavados en la bolsa de lluvia. **Contras:** Descuento real del 1% (6,22€ a 6,19€), así que se compra por precio y organización, no por ganga. Es plástico, no una maleta rígida premium.

## Conclusión

Si pescas trucha o río con poco presupuesto: **Trout Rod (51,41€) + Leydun (3,39€)** son 54,80€ y tienes caña y línea para toda la temporada.

Con **80-100€** el dilema está claro. Para spinning de depredador desde orilla o embarcación ligera, el **Prorex X LT (92,41€)**. Si pescas curricán desde barco, el **Magda Pro (83,17€)** te da contador por menos dinero.

Para mar de verdad y títulos de fondo de armario, el **Daiwa 23BG SW (194,44€)** es el salto de calidad. Y si el 23BG se te va de presupuesto, el **Okuma Convector (158,13€)** es el otro carrete con contador para embarcación.

La compra de la semana en cuanto a ahorro es el **chubasquero Navis (75,65€, −15%)**: es el único producto de la lista con tachado real y el que más vas a usar en las próximas semanas.

## FAQ

### ¿Los descuentos son reales?

Sí. El único tachado de esta lista es el del traje Navis (89€ a 75,65€, −15%), comprobado en la ficha de Amazon. Los cuatro carretes, la caña, la línea y la caja se publican a precio de ficha, sin inventar un porcentaje.

### ¿Por qué hay productos con 0% de descuento?

Porque son fichas nuevas o precios estables y preferimos enseñarlos con el precio real. Un 0% honesto vale más que un −40% falso: si el precio baja, el enlace te lleva al precio actual de la tienda.

### ¿Los precios pueden cambiar?

Sí, y cambian. Los de esta lista están verificados el 24 de octubre de 2026 contra la página de cada producto. Si algo se ha movido, el enlace y la ficha de PesCatch muestran el precio vigente.

### ¿Qué carrete elijo para pescar desde embarcación?

Para curricán y arrastre, el Okuma Magda Pro (83,17€) o el Convector (158,13€), los dos con contador de línea. Para lanzar desde la bañera o la roca, el Daiwa Prorex X LT (92,41€) o el 23BG SW si buscas un carrete de agua salada con más freno.
`

  if (!apply) {
    console.log(`DRY-RUN: se crearía el post ${SLUG} (${content.length} chars, ${cards.length} productos, ${(content.match(/<!--PRODUCT_IMG:/g) || []).length} CTAs).`)
    return
  }

  const post = await createPost({
    title: '8 chollos de pesca de la semana (26 oct-1 nov 2026): Daiwa y Okuma con precio verificado',
    slug: SLUG,
    excerpt: 'Los 8 chollos de la semana 44: cuatro carretes Daiwa y Okuma con precio verificado hoy, la caña Okuma Trout, el chubasquero Navis al −15% y dos complementos AliExpress desde 3,39€. Sin descuentos inflados.',
    content,
    featuredImage: 'https://m.media-amazon.com/images/I/51sLxCiu8OL._AC_SL1500_.jpg',
    author: 'PesCatch',
    category: 'Guias',
    tags: ['chollos', 'ofertas', 'descuentos', 'semana', 'comparativa', 'daiwa', 'okuma'],
    relatedAsins: [],
    status: 'draft',
    metaTitle: 'Chollos pesca semana 44: Daiwa, Okuma y chubasquero -15%',
    metaDescription: 'Carretes Daiwa y Okuma con precio verificado, chubasquero Navis al −15% y complementos desde 3,39€. Compara precios reales antes de que cambien.',
    focusKeyword: 'chollos pesca semana',
    publishedAt: PUBLISHED_AT,
  })

  console.log(`✅ Post creado en local: ${post.slug} (id ${post.id}, status ${post.status}, hidden ${post.hidden})`)
  console.log('Siguiente: npx tsx scripts/_archive/push-post-to-prod.ts ' + SLUG + ' --apply')
}

main().catch(e => { console.error(e); process.exit(1) })
