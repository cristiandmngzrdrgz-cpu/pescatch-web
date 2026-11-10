// PROPÓSITO: Crear en local el roundup de chollos de la semana 46 (9-15 nov 2026) en draft.
// FECHA: 2026-11-10
// Se publica el jueves 12-nov con `npm run publish:post -- chollos-pesca-semana-46-2026 -- --apply`.

import 'dotenv/config'
import { createPost, getPostBySlug } from '../../src/data/blog-queries'

const slug = 'chollos-pesca-semana-46-2026'
const publishedAt = '2026-11-12T09:00:00.000Z'

const content = `# 7 chollos de pesca de la semana (9-15 nov 2026): seis carretes comprobados y el Rapala clásico al −23%

> Semana de carretes. Seis fichas de Amazon comprobadas hoy contra la página del producto: el Mitchell MX2 6000 al −36%, el Daiwa Fuego LT 2500 XH al −19%, el PENN Rival Longcast 7000 para lance largo, el Okuma Cedros CJ-4000H de agua salada, el PENN Pursuit IV 2500 y el Shakespeare Cypry FS para carpa. Cerramos con el Rapala Original Floating Minnow 9 cm al −23%. Tres descuentos reales y cuatro precios de ficha, sin inventar tachados. Esta semana no hay AliExpress: no hemos podido verificar precios de ficha y preferimos no publicar un número sin comprobarlo.

## Tabla resumen

| # | Producto | Precio | Descuento | Tienda |
|---|----------|--------|-----------|--------|
| 1 | Mitchell MX2 6000 — carrete de agua salada | 44,49€ | −36% | Amazon |
| 2 | Daiwa Fuego LT 2500 XH — carrete ligero | 95,00€ | −19% | Amazon |
| 3 | PENN Rival Longcast 7000 — carrete de lance | 180,52€ | precio verificado | Amazon |
| 4 | Okuma Cedros CJ-4000H — carrete de agua salada | 143,36€ | precio verificado | Amazon |
| 5 | PENN Pursuit IV 2500 — carrete de costa | 44,99€ | precio verificado | Amazon |
| 6 | Shakespeare Cypry FS 40 — carrete de carpa | 39,99€ | precio verificado | Amazon |
| 7 | Rapala Original Floating Minnow 9 cm — señuelo | 13,88€ | −23% | Amazon |

<!-- PRODUCTS_DATA: [{"title":"Mitchell MX2 6000","rating":4.5,"image":"https://m.media-amazon.com/images/I/716e1cd7CzL._AC_SL1500_.jpg","badge":"−36%","badgeColor":"#F59E0B","scores":{"Potencia":82,"Freno":78,"Resistencia":84,"Precio":96},"stores":[{"name":"Amazon","url":"https://www.amazon.es/dp/B0CDLY1JP7?th=1&psc=1&tag=pescatch-21","price":"44,49€"}],"slug":"mitchell-carrete-giratorio-de-agua-salada-mx2-el-carrete-de-pesca-de-mar-ideal-p"},{"title":"Daiwa Fuego LT 2500 XH","rating":4.7,"image":"https://m.media-amazon.com/images/I/61eDeU+OrFL._AC_SL1500_.jpg","badge":"−19%","badgeColor":"#F59E0B","scores":{"Suavidad":90,"Ligereza":94,"Freno":82,"Precio":88},"stores":[{"name":"Amazon","url":"https://www.amazon.es/dp/B0CTKCDGJY?th=1&psc=1&tag=pescatch-21","price":"95,00€"}],"slug":"daiwa-fuego-lt-spinning-reel-size-1000-6000-lightweight-zaion-v-carbon-body-aird"},{"title":"PENN Rival Longcast 7000","rating":4.4,"image":"https://m.media-amazon.com/images/I/61VKZbtiiRS._AC_SL1500_.jpg","badge":"Larga distancia","badgeColor":"#F59E0B","scores":{"Lance":94,"Capacidad":92,"Freno":88,"Precio":70},"stores":[{"name":"Amazon","url":"https://www.amazon.es/dp/B08N643WG2?th=1&psc=1&tag=pescatch-21","price":"180,52€"}],"slug":"penn-rival-longcast---carrete-de-pesca-ligero-de-larga-distancia-para-pesca-en-m"},{"title":"Okuma Cedros CJ-4000H","rating":4.4,"image":"https://m.media-amazon.com/images/I/61vJTITE5rL._AC_SL1500_.jpg","badge":"Agua salada","badgeColor":"#22C55E","scores":{"Resistencia":90,"Suavidad":84,"Sal":92,"Precio":74},"stores":[{"name":"Amazon","url":"https://www.amazon.es/dp/B08PPW1F5J?th=1&psc=1&tag=pescatch-21","price":"143,36€"}],"slug":"okuma-cedros---carrete-de-pescar-giratorio-para-agua-salada"},{"title":"PENN Pursuit IV 2500","rating":4.6,"image":"https://m.media-amazon.com/images/I/71deUqgCsxL._AC_SL1500_.jpg","badge":"Entrada al mar","badgeColor":"#22C55E","scores":{"Precio":94,"Versatilidad":86,"Freno":82,"Sal":84},"stores":[{"name":"Amazon","url":"https://www.amazon.es/dp/B096G9QM88?th=1&psc=1&tag=pescatch-21","price":"44,99€"}],"slug":"penn-pursuit-iv---carrete-giratorio-de-agua-salada-pesca-giratoria-plantilla-car"},{"title":"Shakespeare Cypry FS 40","rating":4.3,"image":"https://m.media-amazon.com/images/I/618-zf8NMvL._AC_SL1500_.jpg","badge":"Carpa","badgeColor":"#3B82F6","scores":{"Freespool":90,"Carpa":92,"Precio":90,"Robustez":82},"stores":[{"name":"Amazon","url":"https://www.amazon.es/dp/B01N9T27UW?th=1&psc=1&tag=pescatch-21","price":"39,99€"}],"slug":"shakespeare-cypry-fs-freespool---carrete-de-pesca-de-carpas-carpas-barbos-tencas"},{"title":"Rapala Original Floating Minnow 9 cm","rating":4.7,"image":"https://m.media-amazon.com/images/I/71ihrIlYsML._AC_SL1500_.jpg","badge":"−23%","badgeColor":"#F59E0B","scores":{"Natación":92,"Versatilidad":90,"Acabado":88,"Precio":86},"stores":[{"name":"Amazon","url":"https://www.amazon.es/dp/B001NXCBVY?th=1&psc=1&tag=pescatch-21","price":"13,88€"}],"slug":"rapala-original-floating-minnow-9cm---seuelo-de-pesca"}] -->

## Los 7, uno a uno

### 1. Mitchell MX2 6000

<!--PRODUCT_IMG:1-->

Mitchell MX2 6000

**Pros:** El chollo de la semana: 44,49€ frente a 69,99€, un −36% que está en la ficha. Es un 6000 de agua salada con cuerpo y rotor de grafito, 5+1 rodamientos de acero inoxidable y acabado anticorrosión. Por ese precio es el carrete para empezar a pescar en playa o desde barca sin miedo a que la sal se lo coma. La talla 6000 viene con pomo grande, pensado para recoger con fuerza. 4,5★ con 198 valoraciones. **Contras:** El grafito no es aluminio: bajo carga fuerte flexa más que un carrete de gama alta. Y un 6000 no es un carrete de spinning fino; para lubina en río, mejor un 2500.

### 2. Daiwa Fuego LT 2500 XH

<!--PRODUCT_IMG:2-->

Daiwa Fuego LT 2500 XH

**Pros:** 95,00€ frente a 117,78€ (−19%) por uno de los carretes ligeros más interesantes de Daiwa. 195 g, cuerpo ZAION V, rotor AIRDRIVE y eje MAGSEALED: tecnología de la gama alta bajada a precio medio. La talla 2500 XH es la del spinning polivalente: lubina, trucha, perca y mar ligero. 4,7★ con 62 valoraciones. **Contras:** La ficha lo orienta a agua dulce; el MAGSEALED ayuda, pero no es un carrete sellado IPX para sal pesada. Si lo vas a mojar todos los días en roca, mira el Cedros.

### 3. PENN Rival Longcast 7000

<!--PRODUCT_IMG:3-->

PENN Rival Longcast 7000

**Pros:** Un 7000 de lance largo con rodamientos sellados, bobina plana cónica para ganar metros y dos bobinas de repuesto de aluminio (0,23 mm / 300 m), más funda protectora EVA. Es el carrete para playa abierta y lance con plomo de verdad: capacidad y freno están pensados para eso. El pomo en T ayuda a recoger en largas tiradas. 4,4★ con 163 valoraciones. **Contras:** 180,52€ a precio de ficha, sin descuento. Y un 7000 no es un carrete para todo: en caña ligera o spinning de roca sobra peso y capacidad.

### 4. Okuma Cedros CJ-4000H

<!--PRODUCT_IMG:4-->

Okuma Cedros CJ-4000H

**Pros:** Un 4000 de agua salada con cuerpo Litecast, que según Okuma es un 15% más ligero que el de su competencia. La talla 4000 con recogida alta (H) es la que sirve para casi todo en costa: spinning, jigging ligero y surf con señuelo. 4,4★ con 121 valoraciones. **Contras:** Solo quedan 3 unidades y el precio es de ficha (143,36€, 0%). No es un chollo de derribo; es un carrete bueno a precio normal.

### 5. PENN Pursuit IV 2500

<!--PRODUCT_IMG:5-->

PENN Pursuit IV 2500

**Pros:** El PENN de entrada al agua salada: 44,99€, freno HT-100 y 4 rodamientos, en talla 2500 para spinning ligero desde orilla, kayak o espigón. 4,6★ con 728 valoraciones: es el carrete que más gente usa para empezar sin arruinarse. **Contras:** Precio de ficha, sin tachado. Y el freno HT-100 de esta gama no aguanta lo mismo que el de un Spinfisher; para peces grandes, sube de gama.

### 6. Shakespeare Cypry FS 40

<!--PRODUCT_IMG:6-->

Shakespeare Cypry FS 40

**Pros:** 39,99€ por un carrete de carpfishing con sistema freespool (bobina libre), pensado para dejar el cebo con el freno abierto y cerrar en el picado. La talla 40 es la polivalente para carpa y barbos en río. 4,3★ con 454 valoraciones. **Contras:** No es un carrete de spinning: el freespool y el peso lo hacen torpe para lanzar señuelos. Si no pescas a carpa, no es tu carrete.

### 7. Rapala Original Floating Minnow 9 cm

<!--PRODUCT_IMG:7-->

Rapala Original Floating Minnow 9 cm

**Pros:** El clásico de balsa: 13,88€ frente a 18,03€ (−23%), 9 cm, flotante y con anzuelos triples VMC. Es el señuelo que llevas siempre en la caja porque nada bien a cualquier velocidad y sirve para lucio, bass, trucha y lubina. 4,7★ con 2.733 valoraciones. **Contras:** Los triples VMC vienen afilados y son un incordio para soltar peces pequeños. En agua con mucha vegetación se engancha; para eso, mejor un vinilo weedless.

## Conclusión

Presupuesto ajustado: **Mitchell MX2 6000 (44,49€)** si pescas desde playa o barca, o **PENN Pursuit IV 2500 (44,99€)** si quieres un 2500 ligero para costa.

Calidad-precio real: **Daiwa Fuego LT 2500 XH (95,00€)**, el mejor carrete de la lista por peso y tecnología.

Lance largo: **PENN Rival Longcast 7000 (180,52€)**, con dos bobinas de repuesto y funda.

Agua salada polivalente: **Okuma Cedros CJ-4000H (143,36€)** mientras queden las 3 unidades.

Carpa: **Shakespeare Cypry FS 40 (39,99€)**.

Y el complemento de la caja: **Rapala Original Floating Minnow (13,88€)**.

## FAQ

### ¿Los descuentos son reales?

Sí. Los tres tachados de esta lista son los de la ficha: Mitchell MX2 6000 (69,99€ a 44,49€, −36%), Daiwa Fuego LT 2500 XH (117,78€ a 95,00€, −19%) y Rapala Original Floating Minnow (18,03€ a 13,88€, −23%). Los otros cuatro se publican a precio de ficha, sin porcentaje inventado.

### ¿Por qué no hay chollos de AliExpress esta semana?

Porque no hemos podido verificar los precios de ficha hoy: AliExpress nos bloqueó el acceso con un captcha por IP. Preferimos no publicar un precio que no hemos comprobado. Volverán cuando se puedan verificar.

### ¿Los precios pueden cambiar?

Sí. Están verificados el 10 de noviembre de 2026 contra la página de cada producto. Si algo se ha movido, el enlace y la ficha de PesCatch muestran el precio vigente.

### ¿Qué talla de carrete elijo para empezar en el mar?

Un 2500 para spinning ligero (Pursuit IV o Fuego LT) y un 6000-7000 si vas a lanzar plomo o pescar desde barca (MX2 6000 o Rival Longcast 7000). El 4000 del Cedros es el punto medio si quieres un solo carrete para casi todo.`

async function main() {
  const existing = await getPostBySlug(slug)
  if (existing) {
    console.log(`Ya existe el post ${slug} (${existing.status}). No se toca.`)
    return
  }

  const post = await createPost({
    title: '7 chollos de pesca de la semana (9-15 nov 2026): seis carretes comprobados y el Rapala al −23%',
    slug,
    excerpt: 'Los 7 chollos de la semana 46: Mitchell MX2 6000 al −36%, Daiwa Fuego LT 2500 XH al −19%, PENN Rival Longcast 7000, Okuma Cedros CJ-4000H, PENN Pursuit IV, Shakespeare Cypry FS y Rapala Original Floating al −23%. Precios verificados el 10 de noviembre.',
    content,
    featuredImage: 'https://m.media-amazon.com/images/I/61VKZbtiiRS._AC_SL1500_.jpg',
    author: 'PesCatch',
    category: 'Guias',
    tags: ['chollos', 'ofertas', 'descuentos', 'semana', 'carretes', 'penn', 'okuma', 'daiwa', 'mitchell', 'shakespeare', 'rapala'],
    relatedAsins: ['B0CDLY1JP7', 'B0CTKCDGJY', 'B08N643WG2', 'B08PPW1F5J', 'B096G9QM88', 'B01N9T27UW', 'B001NXCBVY'],
    status: 'draft',
    metaTitle: 'Chollos pesca semana 46: carretes y Rapala −23%',
    metaDescription: 'Mitchell MX2 6000 al −36%, Daiwa Fuego LT −19%, PENN Rival Longcast 7000, Okuma Cedros y Rapala Original −23%. Precios verificados.',
    canonicalUrl: '',
    focusKeyword: 'chollos pesca semana',
    publishedAt,
  })

  console.log(`Creado ${post.slug} (${post.status}, hidden=${post.hidden}, publishedAt=${post.publishedAt})`)
  console.log(`Longitud del contenido: ${post.content.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
