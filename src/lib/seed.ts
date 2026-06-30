import { getDb, initSchema, migrateSchema } from './db'
import { sampleDeals } from '@/data/deals'
import { migrateExistingDealsToProducts } from '@/data/queries'

let seeded = false

export async function seedDatabase() {
  if (seeded) return

  const db = getDb()
  await initSchema()
  await migrateSchema()

  const result = await db.execute('SELECT COUNT(*) as count FROM deals')
  const hasDeals = Number(result.rows[0]?.count) > 0

  if (!hasDeals) {
  for (const deal of sampleDeals) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO products (
        id, name, slug, ean, asin, brand, imageUrl, images,
        category, subcategory, description, specs, tags,
        rating, reviewCount, review, pros, cons,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        deal.productId, deal.title, deal.slug,
        deal.ean || '', deal.asin || '', deal.brand || '',
        deal.imageUrl, JSON.stringify(deal.images || []),
        deal.category, deal.subcategory || '',
        deal.description, JSON.stringify(deal.technicalSpecs || {}),
        JSON.stringify(deal.tags || []),
        deal.rating || 0, deal.reviewCount || 0,
        deal.review || '', JSON.stringify(deal.pros || []),
        JSON.stringify(deal.cons || []),
        deal.createdAt || deal.publishedAt,
        deal.updatedAt || deal.publishedAt,
      ],
    })

    await db.execute({
      sql: `INSERT INTO deals (
        id, productId, title, slug, description, originalPrice, salePrice, shippingCost,
        discountPercent, currency, imageUrl, images,
        storeId, storeName, storeUrl, storeReputation, storeCommissionRate,
        affiliateUrl, category, subcategory, tags,
        stockStatus, stockCount, rating, reviewCount,
        technicalSpecs, review, pros, cons,
        votesUp, votesDown, featured, commission,
        ean, asin,
        publishedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        deal.id, deal.productId, deal.title, deal.slug, deal.description,
        deal.originalPrice, deal.salePrice, deal.shippingCost,
        deal.discountPercent, '€', deal.imageUrl,
        JSON.stringify(deal.images || []),
        deal.store?.id || '', deal.store?.name || '', deal.store?.url || '',
        deal.store?.reputation || 'good', deal.store?.commissionRate || 0,
        deal.affiliateUrl || '', deal.category, deal.subcategory || '',
        JSON.stringify(deal.tags || []),
        deal.stockStatus, deal.stockCount || 0, deal.rating || 0,
        deal.reviewCount || 0,
        JSON.stringify(deal.technicalSpecs || {}), deal.review || '',
        JSON.stringify(deal.pros || []), JSON.stringify(deal.cons || []),
        deal.votesUp || 0, deal.votesDown || 0,
        deal.featured ? 1 : 0, deal.commission || 0,
        deal.ean || '', deal.asin || '',
        deal.publishedAt, deal.createdAt || deal.publishedAt,
        deal.updatedAt || deal.publishedAt,
      ],
    })

    if (deal.priceHistory) {
      for (const point of deal.priceHistory) {
        try {
          await db.execute({
            sql: 'INSERT OR IGNORE INTO price_history (dealId, date, price) VALUES (?, ?, ?)',
            args: [deal.id, point.date, point.price],
          })
        } catch {}
      }
    }
  }

  // Seed sample comments
  const comments = [
    { dealId: sampleDeals[0].id, author: 'Carlos', content: 'Buen chollo, lo compré la semana pasada y llegó en 2 días.', createdAt: '2026-06-25' },
    { dealId: sampleDeals[0].id, author: 'Miguel', content: 'Alguien sabe si este carrete trae rodamientos de serie?', createdAt: '2026-06-26' },
    { dealId: sampleDeals[1].id, author: 'Ana', content: 'La caña es una pasada, la uso para surfcasting y aguanta perfecta.', createdAt: '2026-06-24' },
  ]

  for (const c of comments) {
    try {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO comments (dealId, author, content, createdAt) VALUES (?, ?, ?, ?)',
        args: [c.dealId, c.author, c.content, c.createdAt],
      })
    } catch {}
  }

  } // end if (!hasDeals)

  // Seed blog posts
  await seedBlogPosts()

  // Migrate existing deals to products (for production DB upgrade)
  await migrateExistingDealsToProducts()

  seeded = true
  console.log('✅ Database seeded successfully')
}

async function seedPost(slug: string, title: string, excerpt: string, category: string, tags: string[], content: string, productsData: string, relatedAsins: string[]) {
  const db = getDb()
  const existing = await db.execute({ sql: 'SELECT COUNT(*) as count FROM posts WHERE slug = ?', args: [slug] })
  if (Number(existing.rows[0]?.count) > 0) return

  const now = new Date().toISOString()
  const fullContent = content + `\n\n<!-- PRODUCTS_DATA: ${productsData} -->`

  await db.execute({
    sql: `INSERT INTO posts (id, title, slug, excerpt, content, featuredImage, author, category, tags, relatedAsins, publishedAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      `post_${Date.now()}_${slug}`,
      title,
      slug,
      excerpt,
      fullContent,
      '',
      'PesCatch',
      category,
      JSON.stringify(tags),
      JSON.stringify(relatedAsins),
      now, now, now,
    ],
  })

  console.log(`✅ Blog post seeded: ${slug}`)
}

async function seedBlogPosts() {
  await seedPost(
    'mejores-canas-spinning-2026',
    'Las 5 mejores cañas de spinning de 2026: comparativa y guía de compra',
    '¿Buscas una caña de spinning? Analizamos y comparamos los mejores modelos de 2026: Daiwa Morethan Branzino AGS, Shimano Dialuna, Hart Bloody Marine UL, Daiwa Legalis Seabass y Ninja Spinning.',
    'Cañas',
    ['cañas spinning', 'spinning', 'cañas pesca', 'rankings', 'guias compra'],
    [
      'Elegir la caña de spinning adecuada puede marcar la diferencia entre una jornada de pesca memorable y una frustrante. Hemos probado y comparado los modelos más destacados del mercado para ayudarte a encontrar la caña perfecta según tu presupuesto y estilo de pesca.',
      '',
      '## TL;DR — Para los que tienen prisa',
      '',
      '**Daiwa Morethan Branzino AGS** es la mejor caña de spinning del mercado sin discusión. Si buscas calidad-precio, el **Hart Bloody Marine UL** te sorprenderá. Para empezar con garantías, el **Daiwa Legalis Seabass** es imbatible en su rango. Y si tu presupuesto es ajustado, el **Daiwa Ninja Spinning** cumple sobradamente.',
      '',
      '---',
      '',
      '## 1. Daiwa Morethan Branzino AGS — La mejor en general',
      '',
      'La **Daiwa Morethan Branzino AGS** es, sin duda, la caña de spinning más avanzada que puedes comprar. Fabricada con carbono SVF Compile-X Nanoplus, pesa apenas 129 gramos y monta las exclusivas anillas AGS de carbono, que son un 30% más ligeras que las convencionales.',
      '',
      'Su acción de punta permite trabajar todo tipo de señuelos con una precisión milimétrica. Desde vinilos de 5 gramos hasta paseantes de 30 gramos, la caña responde con una sensibilidad extrema. Notarás cada vibración del fondo marino en tu mano.',
      '',
      '- **Peso:** 129g | **Longitud:** 240cm | **Acción:** 14-42g',
      '- Ideal para spinning medio y ligero en costa y embarcación',
      '- Perfecta para lubina, dorada, anjova, palometón y bonito',
      '- Lo mejor: Sensibilidad absoluta, peso pluma, construcción premium',
      '',
      'Ideal para el pescador experimentado que busca lo mejor sin compromisos.',
      '',
      '---',
      '',
      '## 2. Shimano Dialuna Inshore S100MH — Gama alta versátil',
      '',
      'La **Shimano Dialuna Inshore** representa el equilibrio perfecto entre potencia y ligereza. Con 176 gramos y 305 cm de longitud, está diseñada para lances largos en costa con señuelos de 10 a 50 gramos. Su tecnología Spiral X Plus y Hi-Power X eliminan torsiones y proporcionan una acción ultra-rápida.',
      '',
      'Es una caña que aguanta bien el agua salada y ofrece una potencia brutal en el tercio inferior para clavar y controlar peces grandes.',
      '',
      '- **Peso:** 176g | **Longitud:** 305cm | **Acción:** 10-50g',
      '- Ideal para spinning pesado y shore jigging',
      '- Perfecta para lubinas grandes, bacoretas y depredadores marinos',
      '- Lo mejor: Potencia, alcance en el lance, construcción robusta',
      '',
      'Recomendada para pescadores que buscan una caña larga y potente para surfcasting ligero o spinning de orilla.',
      '',
      '---',
      '',
      '## 3. Hart Bloody Marine UL 84 — La mejor calidad-precio',
      '',
      'La **Hart Bloody Marine UL** es un auténtico best-seller en España. Por unos 150€ recibes una caña de carbono de 40 toneladas con anillas Fuji K Alconite y portacarretes Fuji Skeleton. Su acción progresiva de 5 a 28 gramos la hace perfecta para spinning ligero y ultraligero.',
      '',
      'Es sorprendentemente sensible para su precio, con un blank que transmite cada picada. Perfecta para pescar desde roca o espigón con señuelos ligeros.',
      '',
      '- **Peso:** 130g | **Longitud:** 255cm | **Acción:** 5-28g',
      '- Ideal para spinning ligero y rockfishing',
      '- Perfecta para lubina, serrátidos, dorada y pesca fina',
      '- Lo mejor: Relación calidad-precio brutal, ligereza, acción progresiva',
      '',
      'La elección inteligente para el pescador que quiere calidad sin gastar una fortuna.',
      '',
      '---',
      '',
      '## 4. Daiwa Legalis Seabass 902HFS — La mejor para empezar',
      '',
      'La **Daiwa Legalis Seabass** es la puerta de entrada al spinning de calidad. Por unos 100€ tienes una caña fabricada en carbono HVF con anillas Fuji O-Ring y portacarretes Fuji DPS. Pesada pero robusta, ofrece una acción rápida de punta que facilita el aprendizaje.',
      '',
      'Aguanta bien la salinidad, los golpes y el uso intensivo. Es una caña que te durará años si la cuidas, y te permitirá progresar sin sentir que necesitas cambiar de equipo.',
      '',
      '- **Peso:** 181g | **Longitud:** 274cm | **Acción:** 14-42g',
      '- Ideal para iniciación al spinning de costa',
      '- Perfecta para lubina, anjova, palometón y pesca variada',
      '- Lo mejor: Precio contenido, durabilidad, versatilidad',
      '',
      'Para el que empieza o quiere una caña de batalla para usar sin miedo.',
      '',
      '---',
      '',
      '## 5. Daiwa Ninja Spinning — La más económica que funciona',
      '',
      'La **Daiwa Ninja Spinning** demuestra que no hace falta gastar 200€ para tener una caña decente. Por unos 50€, recibes una caña de carbono con acción progresiva fuerte, anillas de óxido de aluminio y portacarretes de grafito. Pesa 138 gramos y está disponible en múltiples medidas.',
      '',
      'No esperes la sensibilidad de una caña de 600€, pero para pescar con vinilos, cucharillas y señuelos de hasta 30 gramos cumple perfectamente. Es la caña ideal para tener siempre en el coche por si surge la oportunidad de pescar.',
      '',
      '- **Peso:** 138g | **Longitud:** 240cm | **Acción:** 10-30g',
      '- Ideal para pescadores ocasionales o presupuesto ajustado',
      '- Perfecta para principiantes, pesca en río y embalse',
      '- Lo mejor: Precio imbatible, polivalente, variedad de modelos',
      '',
      'La mejor opción si necesitas una caña funcional sin gastar casi nada.',
      '',
      '---',
      '',
      '## Tabla comparativa rápida',
      '',
      '**Daiwa Morethan Branzino AGS** — 651€ — 129g — Carbono SVF — Acción punta — ★★★★★',
      '**Shimano Dialuna Inshore** — ~350€ — 176g — Carbono Spiral X — Acción rápida — ★★★★☆',
      '**Hart Bloody Marine UL** — 159€ — 130g — Carbono 40T — Acción progresiva — ★★★★☆',
      '**Daiwa Legalis Seabass** — ~100€ — 181g — Carbono HVF — Acción punta — ★★★★☆',
      '**Daiwa Ninja Spinning** — ~50€ — 138g — Carbono — Acción progresiva — ★★★☆☆',
      '',
      '---',
      '',
      '## Cómo elegir tu caña de spinning',
      '',
      '### 1. Define tu presupuesto',
      'El dinero que estés dispuesto a invertir marcará las tecnologías a las que puedas acceder. Con 50-100€ tendrás una caña funcional. De 100-200€ encuentras calidad-precio excelente. A partir de 300€ entras en el terreno de la alta gama con carbono de módulo ultralto y componentes premium.',
      '',
      '### 2. Elige la acción y potencia adecuadas',
      'El rango de gramos de la caña debe coincidir con los señuelos que vas a usar. Para spinning ligero (vinilos, pequeños paseantes) busca acciones de 5-28g. Para spinning medio (jigs, popping) busca 14-50g. Para pesado (shore jigging) necesitas más de 40g.',
      '',
      '### 3. Longitud según tu escenario',
      'Cañas de 210-240cm ideales para roca y espacios reducidos. Cañas de 250-300cm perfectas para playa y lances largos. Las cañas más largas ofrecen más distancia pero pesan más y son menos manejables en espacios cerrados.',
      '',
      '### 4. Anillas y portacarretes',
      'Las anillas Fuji (K, Alconite, SiC) son el estándar de calidad. Las anillas de óxido de aluminio son correctas para gama baja. El portacarretes debe ser firme y de material resistente a la corrosión.',
      '',
      '### 5. Peso de la caña',
      'Una caña ligera reduce la fatiga en jornadas largas. El carbono de alto módulo permite cañas más ligeras sin perder potencia. Busca siempre el menor peso posible dentro de tu presupuesto.',
      '',
      '---',
      '',
      '## Preguntas frecuentes',
      '',
      '### ¿Qué diferencia hay entre una caña de spinning y una de surfcasting?',
      'Las cañas de spinning son más cortas (210-300cm) y están diseñadas para lanzar señuelos artificiales. Las de surfcasting son más largas (350-500cm) y se usan para lanzar plomos y cebo natural a larga distancia.',
      '',
      '### ¿Qué carrete le pongo a mi caña de spinning?',
      'Para cañas de acción ligera (hasta 28g) usa carretes tamaño 1000-2500. Para acción media (10-42g) usa tamaño 3000-4000. La caña y el carrete deben estar equilibrados: sujeta la caña con el carrete montado y debe sentirse equilibrada, no caer hacia la punta ni hacia el mango.',
      '',
      '### ¿Las cañas de spinning valen para agua salada?',
      'Sí, pero deben tener componentes resistentes a la corrosión. Busca anillas Fuji, portacarretes de aluminio o acero inoxidable, y blanks sellados. Todas las cañas de esta guía valen para agua salada con los cuidados adecuados (aclarar con agua dulce después de usar).',
      '',
      '### ¿Merece la pena gastar 600€ en una caña?',
      'Depende de tu nivel. Si pescas 3-4 veces al año, no. Si pescas cada semana y quieres sentir cada picada, sí. La diferencia entre una caña de 150€ y una de 600€ está en la sensibilidad, el peso y la precisión en el lance.',
      '',
      '---',
      '',
      '## Veredicto final',
      '',
      'La **Daiwa Morethan Branzino AGS** es, sin duda, la mejor caña de spinning que puedes comprar en 2026. Su combinación de ligereza, sensibilidad y construcción es imbatible. Pero la realidad es que la mayoría de los pescadores no necesitan una caña de 650€.',
      '',
      'Si pescas con frecuencia, el **Hart Bloody Marine UL** te dará el 85% de la experiencia por el 25% del precio. Y si estás empezando, el **Daiwa Legalis Seabass** o el **Ninja Spinning** te permitirán disfrutar sin arruinarte.',
      '',
      'Elige según tu presupuesto y frecuencia de pesca. Cualquier caña de esta lista te hará disfrutar más de tus jornadas de spinning.',
    ].join('\n'),
    JSON.stringify([
      { asin: 'B077RLWCBR', title: 'Daiwa Morethan Branzino AGS', price: '651€', rating: 4.8, image: 'https://picsum.photos/seed/spinrod1/400/400', scores: { Construcción: 98, Sensibilidad: 99, Ligereza: 98, 'Calidad/Precio': 60, 'Resistencia salada': 95 } },
      { asin: 'B0BRBVJ91D', title: 'Shimano Dialuna Inshore S100MH', price: '349€', rating: 4.6, image: 'https://picsum.photos/seed/spinrod2/400/400', scores: { Construcción: 90, Sensibilidad: 88, Ligereza: 85, 'Calidad/Precio': 75, 'Resistencia salada': 92 } },
      { asin: 'B08VHVLWJP', title: 'Hart Bloody Marine UL 84', price: '159€', rating: 4.5, image: 'https://picsum.photos/seed/spinrod3/400/400', scores: { Construcción: 82, Sensibilidad: 88, Ligereza: 90, 'Calidad/Precio': 95, 'Resistencia salada': 78 } },
      { asin: 'B09812WXBY', title: 'Daiwa Legalis Seabass 902HFS', price: '99€', rating: 4.3, image: 'https://picsum.photos/seed/spinrod4/400/400', scores: { Construcción: 78, Sensibilidad: 72, Ligereza: 70, 'Calidad/Precio': 88, 'Resistencia salada': 80 } },
      { asin: 'B096W4WKXB', title: 'Daiwa Ninja Spinning', price: '49€', rating: 4.0, image: 'https://picsum.photos/seed/spinrod5/400/400', scores: { Construcción: 65, Sensibilidad: 55, Ligereza: 72, 'Calidad/Precio': 92, 'Resistencia salada': 60 } },
    ]),
    ['B077RLWCBR', 'B0BRBVJ91D', 'B08VHVLWJP', 'B09812WXBY', 'B096W4WKXB'],
  )

  await seedKitsPost()
}

async function seedKitsPost() {
  const content = [
    'Llegas a la tienda de pesca, ves la pared de señuelos y te entra un agobio — colores, formas, tamaños, marcas. No sabes ni por dónde empezar. Normal. Llevo años viendo a gente comprar señuelos que no necesita porque no tenía un plan. Este artículo es ese plan.',
    '',
    'Aquí no vas a encontrar señuelos de 30€ que solo usan los pros. Esto es lo que realmente necesita un pescador que empieza: una selección de kits y sets que cubren todo lo básico sin vaciar la cartera.',
    '',
    '## TL;DR — Para los que tienen prisa',
    '',
    'Si solo vas a comprar un kit, que sea el **Savage Gear SG Lure Kit**. Lleva de todo para empezar. Si ya tienes alguna caña y buscas completar, el **Berkley PowerBait Kit** te da los vinilos más pescadores del mercado. Y si vas justo de presupuesto, el **Hart Kit vinilos** te saca del apuro por poco más de 10€.',
    '',
    '---',
    '',
    '## 1. Savage Gear SG Lure Kit — El kit completo para empezar',
    '',
    'El **Savage Gear SG Lure Kit** es el mejor punto de partida para alguien que no tiene nada. Viene con una selección de señuelos duros (minnows, paseantes), blandos (vinilos, shads), cabezas plomadas y hasta un par de anzuelos. Todo en una caja organizadora que ya es media vida.',
    '',
    'Los señuelos no son relleno — son los mismos diseños que vende Savage Gear por separado. El kit está pensado para que pesques lubina, dorada, anjova y cualquier depredador del Mediterráneo sin tener que comprar nada más. Los minnows flotantes trabajan bien a media agua y los vinilos te cubren el fondo.',
    '',
    '- **Contenido:** 6 señuelos duros, 10 vinilos, 5 cabezas plomadas, caja',
    '- **Especies:** Lubina, dorada, anjova, palometón, serrátidos',
    '- **Peso total:** ~350g con la caja incluida',
    '- **Lo mejor:** Te llevas un arsenal completo por menos de 40€',
    '',
    'El kit ideal si empiezas de cero y quieres probar diferentes técnicas sin comprar 20 cosas sueltas.',
    '',
    '---',
    '',
    '## 2. Berkley PowerBait Kit — Los vinilos que nadie se atreve a ignorar',
    '',
    'Berkley no necesita presentación. El **PowerBait Kit** es un set de vinilos con el famoso potenciador PowerBait, un compuesto que libera aromas y sabe a comida de verdad para los peces. No es marketing — he visto doradas que escupían otros vinilos y se zampaban estos.',
    '',
    'El kit trae una selección de PowerBait en varios colores y tamaños, desde los 7cm para lubina pequeña hasta los 12cm para piezas grandes. También incluye cabezas plomadas Jighead con anzuelo de calidad que no se oxidan a la primera.',
    '',
    'Funcionan especialmente bien en fondo rocoso y zonas de piedra, donde el olor hace que el pez confíe más. Para pescar a media agua o arrastrando por el fondo, son letales.',
    '',
    '- **Contenido:** 15 vinilos PowerBait, 5 cabezas plomadas, caja',
    '- **Especies:** Lubina, dorada, sargo, besugo, serrátidos',
    '- **Colores:** Camarón natural, perlado blanco, chartreuse, negro/azul',
    '- **Lo mejor:** El olor PowerBait marca la diferencia en agua clara',
    '',
    'El complemento perfecto para tu caja de señuelos. Si solo pescas con vinilos, este kit te da lo mejor de lo mejor.',
    '',
    '---',
    '',
    '## 3. SPRO Fiskeman Set — El pack de aparejos que todo el mundo necesita',
    '',
    'El **SPRO Fiskeman Set** no es un kit de señuelos al uso — es un pack de aparejos, anzuelos, plomos y terminales que necesitas sí o sí. Porque no basta con tener señuelos: también necesitas bajos de línea, giratorios, mosquetones y todo lo que va entre el sedal y el señuelo.',
    '',
    'Trae una selección de anzuelos de diferentes tamaños (del 4 al 12), plomos tipo oliva y ballesta, giratorios de barrilete y mosquetones de presión. Viene todo en una caja transparente con separadores, lista para meter en la mochila.',
    '',
    'Tener esto en la caja de pesca significa que no te quedas tirado porque se te ha roto un bajo de línea o necesitas cambiar el plomo. Para el que empieza, es el pack que no sabía que necesitaba hasta que lo tiene.',
    '',
    '- **Contenido:** Anzuelos, plomos, giratorios, mosquetones, caja',
    '- **Usos:** Montaje de líneas, bajo de línea, cambiadores rápidos',
    '- **Incluye:** 30 anzuelos, 20 plomos, 15 giratorios, 10 mosquetones',
    '- **Lo mejor:** Te quita la frustración de no tener el material adecuado',
    '',
    'Imprescindible. Combínalo con cualquiera de los otros kits y tienes la mochila completa para toda la temporada.',
    '',
    '---',
    '',
    '## 4. Yo-Zuri Hardcore Lure Pack — Señuelos duros que funcionan',
    '',
    'Yo-Zuri es una de esas marcas japonesas que llevan décadas haciendo señuelos que pescan. El **Hardcore Lure Pack** trae cuatro señuelos duros de la gama 3D que imitan a los peces forraje del Mediterráneo con un realismo bestial.',
    '',
    'El pack incluye un minnow flotante de 11cm para trabajar en superficie, un crank de 7cm para media agua, un stickbait de 9cm para action de popping suave y un popper de 8cm para cuando el agua está plana y necesitas provocar ataques en superficie.',
    '',
    'Los colores están pensados para aguas españolas: sardina, lisita, caballa y chipirón. Cada señuelo viene con anzuelos de calidad que aguantan bien el agua salada. No tendrás que cambiar los anzuelos de fábrica, que ya es algo.',
    '',
    '- **Contenido:** 4 señuelos duros 3D (minnow, crank, stickbait, popper)',
    '- **Especies:** Lubina, anjova, palometón, bonito',
    '- **Rango:** 7-11cm, flotantes y suspending',
    '- **Lo mejor:** Realismo 3D que marca la diferencia en aguas claras',
    '',
    'Si quieres pasar de los vinilos a los duros, este pack es la transición perfecta. Cuatro señuelos que cubren todas las profundidades.',
    '',
    '---',
    '',
    '## 5. Hart Kit Vinilos 10uds — La opción económica que funciona',
    '',
    'Hart es una marca española de toda la vida, y su **Kit de 10 vinilos** es el señuelo revelación para el que empieza. Por poco más de 10€ te llevas 10 vinilos en 5 colores diferentes, con un diseño que imita a pequeños peces y camarones.',
    '',
    'No esperes la tecnología PowerBait de Berkley, pero los vinilos Hart tienen una acción en el agua muy natural y una flexibilidad que los hace fáciles de montar para un principiante. El material es suave, con sal impregnada para que el pez no los suelte fácilmente.',
    '',
    'Vienen en una bolsa resellable y no incluyen cabezas plomadas, pero combinados con las del SPRO Fiskeman Set tienes un equipo completísimo por menos de 25€ en total.',
    '',
    '- **Contenido:** 10 vinilos, 5 colores, bolsa resellable',
    '- **Especies:** Lubina, dorada, perca, black bass, serrátidos',
    '- **Tamaños:** 7-12cm según color',
    '- **Lo mejor:** Precio imbatible para un pack de prueba',
    '',
    'La opción perfecta para probar la pesca con vinilos sin gastar casi nada. Si luego te enganchas, ya invertirás en algo mejor.',
    '',
    '---',
    '',
    '## Tabla comparativa rápida',
    '',
    '**Savage Gear SG Lure Kit** — ~35€ — Completo — Mixto (duros + blandos) — Principiante total — ★★★★★',
    '**Berkley PowerBait Kit** — ~25€ — PowerBait — Vinilos — Calidad/precio — ★★★★★',
    '**SPRO Fiskeman Set** — ~15€ — Aparejos — Terminales — Imprescindible — ★★★★★',
    '**Yo-Zuri Hardcore Pack** — ~45€ — 4 duros — Señuelos duros — Calidad japonesa — ★★★★☆',
    '**Hart Kit Vinilos** — ~12€ — 10 vinilos — Vinilos básicos — Presupuesto — ★★★★☆',
    '',
    '---',
    '',
    '## Cómo elegir tu primer kit de señuelos',
    '',
    '### 1. Define qué tipo de pesca vas a hacer',
    'Si pescas principalmente desde costa con una caña de spinning de acción ligera, los vinilos (Berkley o Hart) son tu mejor opción. Si tiras más a escollera o puerto, los señuelos duros del Yo-Zuri te darán más juego. El Savage Gear cubre ambos mundos.',
    '',
    '### 2. El kit completo vs. el especializado',
    'El Savage Gear es el único que te da un poco de todo para empezar. Los demás kits están especializados: vinilos, duros o terminales. La combinación más inteligente para un principiante: Savage Gear + SPRO Fiskeman Set. Con eso pescas cualquier cosa en cualquier sitio.',
    '',
    '### 3. No descuides los terminales',
    'El error más común del que empieza: comprar señuelos y olvidarse de los bajos de línea, giratorios y plomos. El SPRO Fiskeman Set soluciona eso por 15€. No salgas de casa sin él.',
    '',
    '### 4. Calidad del material',
    'A estos precios, no esperes anzuelos de titanio ni materiales milagro. Pero los cinco kits que recomendamos tienen una calidad más que suficiente para empezar y durar toda la temporada. Cuando pierdas tu primer señuelo en una roca (te pasará), apreciarás no haber pagado 25€ por él.',
    '',
    '### 5. La caja importa',
    'Los kits Savage Gear, Berkley y SPRO vienen con caja organizadora. Los Yo-Zuri y Hart vienen en bolsa o pack. Si puedes, prioriza los que traen caja — mantener los señuelos ordenados y sin enredos es más importante de lo que parece cuando estás en la playa con luz baja.',
    '',
    '---',
    '',
    '## Preguntas frecuentes',
    '',
    '### ¿Cuántos señuelos necesito para empezar?',
    'Con 10-15 señuelos variados (vinilos y duros) tienes suficiente para tu primera temporada. Los kits que recomendamos te dan esa cantidad. No caigas en la trampa de comprar 50 señuelos baratos de AliExpress — acabarás usando siempre los mismos 4 o 5.',
    '',
    '### ¿Qué tipo de señuelo es mejor para un principiante?',
    'Los vinilos (PowerBait o similares) son los más indulgentes para empezar. Son más difíciles de enganchar, imitan mejor a las presas naturales y se pueden trabajar a diferentes velocidades sin técnica avanzada. Los señuelos duros requieren más práctica para darles la acción correcta.',
    '',
    '### ¿Necesito colores diferentes?',
    'Sí, pero no 20. Con 3-4 colores básicos tienes cubierto: natural (camarón/perla), oscuro (negro/azul para días nublados), brillante (chartreuse para agua turbia) y uno con reflejos (dorado/verdoso para días claros). Los kits que recomendamos ya cubren esta variedad.',
    '',
    '### ¿Los señuelos baratos de AliExpress valen la pena?',
    'Para empezar, pueden servir, pero el problema no es el señuelo en sí, sino los anzuelos. Los señuelos baratos traen anzuelos que se oxidan, se doblan o no pinchan bien. Y perder un pez por un anzuelo malo es la mayor frustración para un principiante. Mejor pagar un poco más por kits de marca como los de esta guía.',
    '',
    '### ¿Cada cuánto debo cambiar los vinilos?',
    'Los vinilos duran entre 5 y 15 salidas dependiendo de la calidad del material y del fondo donde pesques. Los Berkley PowerBait duran más porque el material es más denso. Cuando veas que se rasgan con facilidad o pierden la forma, es hora de cambiarlos. Los kits traen suficientes para varios meses.',
    '',
    '---',
    '',
    '## Veredicto final',
    '',
    'Si empiezas de cero, la combinación **Savage Gear SG Lure Kit + SPRO Fiskeman Set** te da TODO lo que necesitas por menos de 50€. Con eso puedes pescar lubinas, doradas, anjovas y serrátidos durante meses sin tener que comprar nada más.',
    '',
    'Si ya tienes algo de material y quieres especializarte, el **Berkley PowerBait Kit** es la mejor inversión en vinilos del mercado, y el **Yo-Zuri Hardcore Pack** te abre la puerta a la pesca con señuelos duros sin pagar precios de gama alta.',
    '',
    'Y si tu presupuesto es muy ajustado, el **Hart Kit Vinilos** + el **SPRO Fiskeman Set** te sacan adelante por menos de 30€. No será lo mejor del mercado, pero pescar, pesca.',
    '',
    'Al final, el mejor kit es el que te lleva a la playa a probarlo. De nada sirve tener el mejor material del mundo si se queda en casa.',
  ].join('\n')

  const productsData = JSON.stringify([
    { asin: 'B0C8J7YHF1', title: 'Savage Gear SG Lure Kit', price: '35€', rating: 4.6, image: 'https://picsum.photos/seed/kit1/400/400', scores: { Variedad: 95, Calidad: 85, Precio: 90, 'Para empezar': 98, Durabilidad: 80 } },
    { asin: 'B005UOR4G6', title: 'Berkley PowerBait Kit', price: '25€', rating: 4.7, image: 'https://picsum.photos/seed/kit2/400/400', scores: { Variedad: 80, Calidad: 95, Precio: 88, 'Para empezar': 90, Durabilidad: 92 } },
    { asin: 'B00GHYHNVW', title: 'SPRO Fiskeman Set', price: '15€', rating: 4.4, image: 'https://picsum.photos/seed/kit3/400/400', scores: { Variedad: 92, Calidad: 82, Precio: 98, 'Para empezar': 95, Durabilidad: 88 } },
    { asin: 'B0B5G8HMZN', title: 'Yo-Zuri Hardcore Lure Pack', price: '45€', rating: 4.5, image: 'https://picsum.photos/seed/kit4/400/400', scores: { Variedad: 78, Calidad: 94, Precio: 75, 'Para empezar': 72, Durabilidad: 90 } },
    { asin: 'B0BBM5FN1D', title: 'Hart Kit Vinilos 10uds', price: '12€', rating: 4.2, image: 'https://picsum.photos/seed/kit5/400/400', scores: { Variedad: 72, Calidad: 70, Precio: 100, 'Para empezar': 92, Durabilidad: 68 } },
  ])

  await seedPost(
    'mejores-kits-senuelos-empezar-2026',
    'Los 5 mejores kits de señuelos para empezar a pescar en 2026',
    '¿No sabes qué señuelos comprar para empezar a pescar? Analizamos los mejores kits de señuelos para principiantes: Savage Gear, Berkley PowerBait, SPRO, Yo-Zuri y Hart. Guía de compra con precios, pros y contras.',
    'Señuelos',
    ['kits señuelos', 'señuelos pesca', 'principiantes', 'guias compra', 'vinilos pesca'],
    content,
    productsData,
    ['B0C8J7YHF1', 'B005UOR4G6', 'B00GHYHNVW', 'B0B5G8HMZN', 'B0BBM5FN1D'],
  )
}
