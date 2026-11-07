// PROPÓSITO: crear el roundup de la semana 45 (2-8 nov 2026) como borrador local,
//            con precios verificados contra ficha y sin descuentos inventados.
// FECHA: 2026-11-07
// ESTADO: one-shot ejecutado (post `chollos-pesca-semana-45-2026` publicado) → archivado.
// Uso: npx tsx scripts/create-roundup-semana-45.ts [--apply]

import 'dotenv/config'
import { initSchema, migrateSchema, getDb } from '../src/lib/db'
import { createPost, getPostBySlug } from '../src/data/blog-queries'

const SLUG = 'chollos-pesca-semana-45-2026'
const PUBLISHED_AT = '2026-11-07T09:00:00.000Z'

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
    slug: 'penn-combat-iii---carrete-giratorio-de-agua-salada---carrete-verstil-de-pesca-ma',
    title: 'PENN Combat III',
    store: 'Amazon',
    price: '74,82€',
    badge: '−17%',
    badgeColor: '#F59E0B',
    scores: { Freno: 90, Resistencia: 88, Versatilidad: 92, Precio: 84 },
    image: 'https://m.media-amazon.com/images/I/61rLu5BPLNL._AC_SL1500_.jpg',
  },
  {
    slug: 'daiwa-shrs423h-ad-seahunter-surf-14-pies-350-880-onzas-3-piezas-barra-de-pesca-d',
    title: 'Daiwa Seahunter Surf 14 pies',
    store: 'Amazon',
    price: '98,60€',
    badge: 'Verificado',
    badgeColor: '#22C55E',
    scores: { Lance: 92, Sensibilidad: 84, Robustez: 86, Precio: 80 },
    image: 'https://m.media-amazon.com/images/I/61gWVN8oGIL._AC_SL1500_.jpg',
  },
  {
    slug: 'okuma-komodo-ss---marco-de-aluminio-de-gran-capacidad-engranajes-de-acero-inoxid',
    title: 'Okuma Komodo SS',
    store: 'Amazon',
    price: '308,79€',
    badge: 'Gama alta',
    badgeColor: '#F59E0B',
    scores: { Potencia: 94, Engranajes: 92, Capacidad: 90, Precio: 66 },
    image: 'https://m.media-amazon.com/images/I/71U9AGGhNHL._AC_SL1500_.jpg',
  },
  {
    slug: 'okuma-ceymar',
    title: 'Okuma Ceymar',
    store: 'Amazon',
    price: '63,55€',
    badge: 'Calidad-precio',
    badgeColor: '#22C55E',
    scores: { Suavidad: 86, Peso: 84, Freno: 80, Precio: 90 },
    image: 'https://m.media-amazon.com/images/I/71TV13tgrkL._AC_SL1500_.jpg',
  },
  {
    slug: 'penn-wrath-ii---carrete-giratorio-duradero-y-ligero-diseado-para-ser-verstil-y-d',
    title: 'PENN Wrath II',
    store: 'Amazon',
    price: '60,72€',
    badge: 'Verificado',
    badgeColor: '#22C55E',
    scores: { Resistencia: 84, Ligereza: 86, Precio: 88, Sal: 80 },
    image: 'https://m.media-amazon.com/images/I/71ADFxhJEGL._AC_SL1500_.jpg',
  },
  {
    slug: 'shakespeare-sigma-vadeador-de-pesca-con-botas',
    title: 'Shakespeare Sigma — vadeador con botas',
    store: 'Amazon',
    price: '79,99€',
    badge: 'Temporada',
    badgeColor: '#38BDF8',
    scores: { Impermeabilidad: 88, Abrigo: 82, Precio: 84, Comodidad: 78 },
    image: 'https://m.media-amazon.com/images/I/41nzMOBOudL._AC_SL1500_.jpg',
  },
  {
    slug: 'rapala---seuelo-de-pesca-x-rap-magnum---material-de-pesca-con-gran-babero-que-se',
    title: 'Rapala X-Rap Magnum',
    store: 'Amazon',
    price: '22,50€',
    badge: 'Verificado',
    badgeColor: '#22C55E',
    scores: { Nado: 92, Profundidad: 90, Acabado: 88, Precio: 82 },
    image: 'https://m.media-amazon.com/images/I/61ZZUC3nn3L._AC_SL1500_.jpg',
  },
  {
    slug: 'caa-de-pescar-telescpica-sougayilang-caa-de-fundicinspinning-de-16-21-m-5-6-secc_aliexpress',
    title: 'Caña telescópica Sougayilang 1,6-2,1 m',
    store: 'AliExpress',
    price: '11,78€',
    badge: '−14%',
    badgeColor: '#F59E0B',
    scores: { Transporte: 96, Precio: 96, Versatilidad: 82, Sensibilidad: 68 },
  },
  {
    slug: 'bolsa-para-caa-de-pescar-sougayilang-46cm57cm-gran-capacidad-100b-porttil-imperm_aliexpress',
    title: 'Bolsa de caña Sougayilang',
    store: 'AliExpress',
    price: '6,59€',
    badge: 'Verificado',
    badgeColor: '#22C55E',
    scores: { Precio: 96, Capacidad: 84, Impermeabilidad: 80, Cierre: 76 },
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

  const content = `# 9 chollos de pesca de la semana (2-8 nov 2026): carretes de mar, surfcasting y dos básicos por menos de 12 €

> Semana de mar y de fondo de armario. Seis fichas nuevas de Amazon comprobadas hoy contra la página del producto: el PENN Combat III al −17%, la caña Daiwa Seahunter Surf de 14 pies, el Okuma Komodo SS, el Ceymar, el Wrath II y el vadeador Shakespeare Sigma para las jornadas de frío. Cerramos con el Rapala X-Rap Magnum y dos básicos de AliExpress: una caña telescópica de 11,78€ y una bolsa de 6,59€. Solo hay dos tachados reales; el resto va a precio de ficha y así lo contamos.

## Tabla resumen

| # | Producto | Precio | Descuento | Tienda |
|---|----------|--------|-----------|--------|
| 1 | PENN Combat III — carrete de agua salada | 74,82€ | −17% | Amazon |
| 2 | Daiwa Seahunter Surf 14 pies — caña de surfcasting | 98,60€ | precio verificado | Amazon |
| 3 | Okuma Komodo SS — perfil bajo de aluminio | 308,79€ | precio verificado | Amazon |
| 4 | Okuma Ceymar — carrete polivalente | 63,55€ | precio verificado | Amazon |
| 5 | PENN Wrath II — carrete de agua salada | 60,72€ | precio verificado | Amazon |
| 6 | Shakespeare Sigma — vadeador con botas | 79,99€ | precio verificado | Amazon |
| 7 | Rapala X-Rap Magnum — señuelo de 12 m | 22,50€ | precio verificado | Amazon |
| 8 | Caña telescópica Sougayilang 1,6-2,1 m | 11,78€ | −14% | AliExpress |
| 9 | Bolsa de caña Sougayilang | 6,59€ | precio verificado | AliExpress |

${productsData}

## Los 9, uno a uno

### 1. PENN Combat III

<!--PRODUCT_IMG:1-->

PENN Combat III

**Pros:** Es el chollo de la semana: 74,82€ frente a 89,90€, un −17% que está en la ficha. La gama Combat III es el carrete de agua salada polivalente de PENN: la propia ficha lo vende para barco, kayak, orilla, spinning, jigging y surf. Si quieres un carrete de mar que aguante sal y no te dé miedo mojarlo, este es el rango de precio donde empieza lo serio. 4,3★ con 153 valoraciones. **Contras:** No es un carrete ultraligero ni un juguete para agua dulce: pesa lo suyo y está pensado para pesca marina. Si tu idea es spinning fino de lubina en río, hay opciones más ligeras por menos dinero.

### 2. Daiwa Seahunter Surf 14 pies

<!--PRODUCT_IMG:2-->

Daiwa Seahunter Surf 14 pies

**Pros:** Caña de surfcasting de 14 pies (4,27 m) en tres tramos, con acción para lanzar entre 3,50 y 8,80 onzas (unos 100-250 g). Es la caña para playa abierta y días de mar de fondo: lanzas plomo de verdad sin quedarte corto. 4,4★ con 47 valoraciones y 98,60€ a precio de ficha. **Contras:** 14 pies no es una caña para todo el mundo: necesita espacio, técnica de lance y un carrete con hilo suficiente. Para espigón o roca, mejor una caña más corta.

### 3. Okuma Komodo SS

<!--PRODUCT_IMG:3-->

Okuma Komodo SS

**Pros:** Perfil bajo con marco de aluminio, engranajes de acero inoxidable y gran capacidad de línea. Es un carrete de potencia para jigging, embarcación y pesca de especies que tiran de verdad, no un carrete de adorno. 4,6★ con 86 valoraciones. **Contras:** 308,79€ es el precio más alto de la lista y no es un carrete para empezar. Si pescas desde costa o haces spinning ligero, no necesitas este hierro.

### 4. Okuma Ceymar

<!--PRODUCT_IMG:4-->

Okuma Ceymar

**Pros:** El polivalente de la lista. La gama Ceymar lleva años siendo el carrete de entrada de Okuma para agua dulce y sal ligera: suave, ligero y con un precio de 63,55€ que deja margen para la caña. 4,6★ con 166 valoraciones. **Contras:** No es un carrete de agua salada pesada ni de jigging: para mar abierto, mejor el Combat III o el Wrath II. La ficha no detalla talla en el título, así que elige bien la variante.

### 5. PENN Wrath II

<!--PRODUCT_IMG:5-->

PENN Wrath II

**Pros:** El carrete de mar barato que no da vergüenza. PENN lo presenta como duradero y ligero, para lubina, bacalao, abadejo y especies de roca. 4,6★ con 74 valoraciones y 60,72€ a precio de ficha: si quieres entrar en agua salada sin gastarte 100€, este es el paso lógico. **Contras:** No tiene el freno ni los rodamientos de la gama alta de PENN. Para pesca exigente desde embarcación, el Combat III es el salto.

### 6. Shakespeare Sigma — vadeador con botas

<!--PRODUCT_IMG:6-->

Shakespeare Sigma — vadeador con botas

**Pros:** Vadeador de pecho con botas para las jornadas de frío y agua. 79,99€ y 4,3★ con 895 valoraciones: es la compra de temporada para pescar carpa, trucha o lubina en orilla sin acabar empapado. **Contras:** No es un vadeador transpirable de gama alta: en días de calor y caminata larga acabas sudando. Ojo con la talla de bota, que es lo que más se falla en estas fichas.

### 7. Rapala X-Rap Magnum

<!--PRODUCT_IMG:7-->

Rapala X-Rap Magnum

**Pros:** Señuelo hundido con babero grande y profundidad de nado de hasta 12 m. Es el Rapala para curricán y para buscar peces a media agua cuando el banco no está arriba. 4,7★ con 586 valoraciones y 22,50€ a precio de ficha. **Contras:** 12 m es mucha profundidad: si pescas en poca agua o desde costa, se te va a enganchar. No es un señuelo de superficie.

### 8. Caña telescópica Sougayilang 1,6-2,1 m

<!--PRODUCT_IMG:8-->

Caña telescópica Sougayilang 1,6-2,1 m

**Pros:** 11,78€ frente a 13,63€ (−14%) por una caña telescópica de 5-6 tramos, 1,6-2,1 m y acción de hasta 20 libras. Es la caña que llevas en el coche o en la mochila para una tarde improvisada, sin ocupar como una caña de dos tramos. 4,4★ con 67 valoraciones. **Contras:** Una telescópica de este precio no tiene la sensibilidad ni el tacto de una caña de dos tramos. Para pesca seria, es un recambio de emergencia, no tu caña principal.

### 9. Bolsa de caña Sougayilang

<!--PRODUCT_IMG:9-->

Bolsa de caña Sougayilang

**Pros:** 6,59€ por una bolsa de 46/57 cm en tela Oxford, impermeable y con capacidad para la caña y los aparejos. 4,6★ con 213 valoraciones. Es el complemento que evita que la caña acabe suelta en el maletero. **Contras:** Descuento real del 1% (6,67€ a 6,59€): se compra por precio y organización, no por ganga. No esperes una funda rígida de gama alta.

## Conclusión

Si quieres entrar en agua salada con poco presupuesto: **PENN Wrath II (60,72€)**. Es el carrete de mar con mejor relación precio/duración de la lista.

Para surfcasting de verdad: **Daiwa Seahunter Surf (98,60€)** más un carrete de 4000-6000. Si le sumas el **Combat III (74,82€)**, tienes equipo de playa completo por 173,42€ y el mayor descuento real de la semana.

Para embarcación y jigging: **Okuma Komodo SS (308,79€)** si buscas potencia de verdad; el **Ceymar (63,55€)** si lo que quieres es un carrete polivalente para agua dulce y sal ligera.

Y para las jornadas de frío: **vadeador Shakespeare Sigma (79,99€)**. La compra menos glamurosa de la lista y la que más vas a agradecer en diciembre.

Los dos básicos de AliExpress (**caña telescópica 11,78€ + bolsa 6,59€**) son 18,37€ y resuelven el equipo de emergencia.

## FAQ

### ¿Los descuentos son reales?

Sí. Los tachados de esta lista son los del PENN Combat III (89,90€ a 74,82€, −17%) y la caña telescópica Sougayilang (13,63€ a 11,78€, −14%). La bolsa tiene un −1% real (6,67€ a 6,59€). El resto se publica a precio de ficha, sin inventar un porcentaje.

### ¿Por qué hay productos con 0% de descuento?

Porque son fichas nuevas o precios estables y preferimos enseñarlos con el precio real. Un 0% honesto vale más que un −40% falso: si el precio baja, el enlace te lleva al precio actual de la tienda.

### ¿Los precios pueden cambiar?

Sí, y cambian. Los de esta lista están verificados el 7 de noviembre de 2026 contra la página de cada producto. Si algo se ha movido, el enlace y la ficha de PesCatch muestran el precio vigente.

### ¿Qué carrete elijo para surfcasting?

Para playa abierta, un 4000-6000 con buen freno y suficiente hilo. El **PENN Combat III (74,82€)** es la opción más completa de la lista; el **Wrath II (60,72€)** si quieres gastar menos. La caña Seahunter Surf pide plomos de 100-250 g, así que no le pongas un carrete de spinning ultraligero.
`

  if (!apply) {
    console.log(`DRY-RUN: se crearía el post ${SLUG} (${content.length} chars, ${cards.length} productos, ${(content.match(/<!--PRODUCT_IMG:/g) || []).length} CTAs).`)
    return
  }

  const post = await createPost({
    title: '9 chollos de pesca de la semana (2-8 nov 2026): carretes de mar, surfcasting y básicos desde 6,59€',
    slug: SLUG,
    excerpt: 'Los 9 chollos de la semana 45: PENN Combat III al −17%, caña Daiwa Seahunter Surf, Okuma Komodo SS, Ceymar, Wrath II, vadeador Sigma, Rapala X-Rap Magnum y dos básicos AliExpress desde 6,59€. Precios verificados hoy.',
    content,
    featuredImage: 'https://m.media-amazon.com/images/I/61rLu5BPLNL._AC_SL1500_.jpg',
    author: 'PesCatch',
    category: 'Guias',
    tags: ['chollos', 'ofertas', 'descuentos', 'semana', 'mar', 'surfcasting', 'penn', 'okuma', 'daiwa', 'rapala'],
    relatedAsins: [],
    status: 'draft',
    metaTitle: 'Chollos pesca semana 45: PENN Combat III -17% y mar',
    metaDescription: 'PENN Combat III al −17%, caña Daiwa Seahunter Surf, Okuma Komodo SS y básicos desde 6,59€. Precios reales verificados antes de que cambien.',
    focusKeyword: 'chollos pesca semana',
    publishedAt: PUBLISHED_AT,
  })

  console.log(`✅ Post creado en local: ${post.slug} (id ${post.id}, status ${post.status}, hidden ${post.hidden})`)
  console.log('Siguiente: npx tsx scripts/publish-post.ts ' + SLUG + ' --apply')
}

main().catch(e => { console.error(e); process.exit(1) })
