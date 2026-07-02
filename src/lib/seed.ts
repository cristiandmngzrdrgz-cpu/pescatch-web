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
        votesUp, votesDown, featured, hidden, commission,
        ean, asin,
        publishedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        deal.featured ? 1 : 0, deal.hidden ? 1 : 0, deal.commission || 0,
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

  // No pisar un post que ya existe: si el admin lo editó desde /admin/blog,
  // ese contenido es la fuente de verdad. El seed solo crea posts que faltan.
  const existing = await db.execute({ sql: 'SELECT id FROM posts WHERE slug = ?', args: [slug] })
  if (existing.rows.length > 0) return

  const now = new Date().toISOString()
  const fullContent = content + `\n\n<!-- PRODUCTS_DATA: ${productsData} -->`

  await db.execute({
    sql: `INSERT INTO posts (id, title, slug, excerpt, content, featuredImage, author, category, tags, relatedAsins, hidden, publishedAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      0, now, now, now,
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
      '## Para los que tienen prisa',
      '',
      '**Daiwa Morethan Branzino AGS** es la mejor caña de spinning del mercado sin discusión. Si buscas calidad-precio, el **Hart Bloody Marine UL** te sorprenderá. Para empezar con garantías, el **Daiwa Legalis Seabass** es imbatible en su rango. Y si tu presupuesto es ajustado, el **Daiwa Ninja Spinning** cumple sobradamente.',
      '',
      '---',
      '',
    '## 1. Daiwa Morethan Branzino AGS — La mejor en general',
    '',
    '<!--PRODUCT_IMG:1-->',
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
      '<!--PRODUCT_IMG:2-->',
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
      '<!--PRODUCT_IMG:3-->',
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
      '<!--PRODUCT_IMG:4-->',
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
      '<!--PRODUCT_IMG:5-->',
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
      { asin: 'B077RLWCBR', title: 'Daiwa Morethan Branzino AGS', price: '651€', rating: 4.8, image: 'https://m.media-amazon.com/images/I/51ksaDREYxL._AC_SL1500_.jpg', scores: { Construcción: 98, Sensibilidad: 99, Ligereza: 98, 'Calidad/Precio': 60, 'Resistencia salada': 95 } },
      { asin: 'B0BRBVJ91D', title: 'Shimano Dialuna Inshore S100MH', price: '349€', rating: 4.6, image: 'https://m.media-amazon.com/images/I/518nI9fTCTL._AC_SL1500_.jpg', scores: { Construcción: 90, Sensibilidad: 88, Ligereza: 85, 'Calidad/Precio': 75, 'Resistencia salada': 92 } },
      { asin: 'B08VHVLWJP', title: 'Hart Bloody Marine UL 84', price: '159€', rating: 4.5, image: 'https://m.media-amazon.com/images/I/41zBaYJP2PL._AC_SL1500_.jpg', scores: { Construcción: 82, Sensibilidad: 88, Ligereza: 90, 'Calidad/Precio': 95, 'Resistencia salada': 78 } },
      { asin: 'B09812WXBY', title: 'Daiwa Legalis Seabass 902HFS', price: '99€', rating: 4.3, image: 'https://m.media-amazon.com/images/I/41lfh2S0dvL._AC_SL1500_.jpg', scores: { Construcción: 78, Sensibilidad: 72, Ligereza: 70, 'Calidad/Precio': 88, 'Resistencia salada': 80 } },
      { asin: 'B096W4WKXB', title: 'Daiwa Ninja Spinning', price: '49€', rating: 4.0, image: 'https://m.media-amazon.com/images/I/31YqdNKFenL._AC_SL1500_.jpg', scores: { Construcción: 65, Sensibilidad: 55, Ligereza: 72, 'Calidad/Precio': 92, 'Resistencia salada': 60 } },
    ]),
    ['B077RLWCBR', 'B0BRBVJ91D', 'B08VHVLWJP', 'B09812WXBY', 'B096W4WKXB'],
  )

  await seedKitsPost()
  await seedSurfcastingPost()
  await seedCarretesPost()
}

async function seedSurfcastingPost() {
  await seedPost(
    'mejores-canas-surfcasting-2026',
    'Las 5 mejores cañas de surfcasting calidad-precio en 2026',
    'Comparamos los mejores modelos de 2026: Shimano Ultegra XR Surf, Daiwa Crosscast Surf 33, PENN Squadron IV, Daiwa Ninja Surf SCW y Mitchell Adventure 2.',
    'Cañas',
    ['cañas surfcasting', 'surfcasting', 'cañas pesca', 'guias compra'],
    [
      'Elegir una caña de surfcasting no es lo mismo que comprar una caña de spinning. Llevo años probando cañas en la playa, y estas son las que recomendaría a un amigo según su presupuesto.',
      '',
      '## Para los que tienen prisa',
      '',
      'La **Shimano Ultegra XR Surf** es lo mejor que puedes comprar. La **Daiwa Crosscast Surf 33** es la mejor calidad-precio. La **PENN Squadron IV** es una moderna de carbono 24T. Si empiezas, el **Mitchell Adventure 2** te saca del apuro por 25€.',
      '',
      '---',
      '',
      '## 1. Shimano Ultegra XR Surf — La mejor sin discusión', '', '<!--PRODUCT_IMG:1-->', '',
      'La **Shimano Ultegra XR Surf** está fabricada en carbono de alta gama con Hi-Power X y Spiral X Plus.',
      '',
      '- **Precio:** ~355€ | **Longitud:** 4.50m | **Acción:** hasta 250g',
      '- Ideal para surfcasting de potencia media y pesada',
      '- Lo mejor: Sensibilidad brutal, construcción premium',
      '',
      '---',
      '',
      '## 2. Daiwa Crosscast Surf 33 423H — La mejor calidad-precio', '', '<!--PRODUCT_IMG:2-->', '',
      'Por poco más de 100€ tienes un blank de carbono ligero y sensible.',
      '',
      '- **Precio:** ~108€ | **Longitud:** 4.20m | **Acción:** 100-225g',
      '- Ideal para surfcasting general en playa y roca',
      '- Lo mejor: Precio imbatible, construcción sólida',
      '',
      '---',
      '',
      '## 3. PENN Squadron IV Spin — La sorpresa en carbono 24T', '', '<!--PRODUCT_IMG:3-->', '',
      'Fabricada con carbono 24T, ofrece rigidez y ligereza que no esperas en este rango de precio.',
      '',
      '- **Precio:** 86-110€ | **Longitud:** 3.05m - 4.20m | **Carbono 24T**',
      '- Ideal para spinning pesado y surfcasting ligero',
      '- Lo mejor: Carbono 24T a buen precio, versatilidad',
      '',
      '---',
      '',
      '## 4. Daiwa Ninja Surf SCW 420 — La telescópica de toda la vida', '', '<!--PRODUCT_IMG:4-->', '',
      'Por unos 125€ recibes una caña de 4.20m que se guarda en poco espacio.',
      '',
      '- **Precio:** ~125€ | **Longitud:** 4.20m | **Telescópica**',
      '- Ideal para surfcasting de playa con cebo',
      '- Lo mejor: Portabilidad, precio contenido',
      '',
      '---',
      '',
      '## 5. Mitchell Adventure 2 Surf — La más barata que funciona', '', '<!--PRODUCT_IMG:5-->', '',
      'Por 25-35€ tienes una caña de vidrio compuesto que lanza, clava y recoge peces.',
      '',
      '- **Precio:** 24-55€ | **Longitud:** 3.9m / 4.2m | **Vidrio compuesto**',
      '- #1 bestseller en cañas de surf fishing de Amazon',
      '- Ideal para iniciación y pescadores ocasionales',
      '- Lo mejor: Precio imbatible',
      '',
      '---',
      '',
      '## Cómo elegir tu caña de surfcasting',
      '',
      '### 1. Define tu presupuesto',
      'Con menos de 50€ tienes opciones funcionales. De 80-130€ encuentras calidad-precio excelente.',
      '',
      '### 2. Longitud adecuada',
      'Para playas abiertas busca 4.20m o más. Para roca, 3.5-3.9m.',
      '',
      '### 3. Material del blank',
      'El carbono es más ligero y sensible. El vidrio compuesto es más barato y resistente.',
      '',
      '---',
      '',
      '## Veredicto final',
      '',
      'La **Daiwa Crosscast Surf 33** es mi recomendación para el 90% de los pescadores. Por 108€ tienes una caña de carbono que compite con modelos del doble de precio.',
    ].join('\n'),
    JSON.stringify([
      { asin: 'B0F4XJ85B4', title: 'Shimano Ultegra XR Surf Tubular 4.50m', price: '~355€', rating: 5.0, image: 'https://m.media-amazon.com/images/I/412vINaBcEL._AC_SL1500_.jpg', scores: { Construcción: 95, Sensibilidad: 95, Ligereza: 92, 'Calidad/Precio': 65, 'Resistencia salada': 95 } },
      { asin: 'B098131M93', title: 'Daiwa Crosscast Surf 33 423H', price: '~108€', rating: 4.7, image: 'https://m.media-amazon.com/images/I/4120fFTOrzL._AC_SL1500_.jpg', scores: { Construcción: 80, Sensibilidad: 78, Ligereza: 75, 'Calidad/Precio': 90, 'Resistencia salada': 80 } },
      { asin: 'B0FYFMKZXZ', title: 'PENN Squadron IV Carbono 24T', price: '86-110€', rating: 5.0, image: 'https://m.media-amazon.com/images/I/41sU7nzwDUL._AC_SL1500_.jpg', scores: { Construcción: 82, Sensibilidad: 80, Ligereza: 78, 'Calidad/Precio': 82, 'Resistencia salada': 85 } },
      { asin: 'B0844Y3MNW', title: 'Daiwa Ninja Surf SCW 420', price: '~125€', rating: 4.3, image: 'https://m.media-amazon.com/images/I/41+EnSD8WGL._AC_SL1500_.jpg', scores: { Construcción: 72, Sensibilidad: 68, Ligereza: 65, 'Calidad/Precio': 85, 'Resistencia salada': 75 } },
      { asin: 'B09TTPSLZN', title: 'Mitchell Adventure 2 Surf 3.9m', price: '24-55€', rating: 4.0, image: 'https://m.media-amazon.com/images/I/41V-tJAPmUL._AC_SL1500_.jpg', scores: { Construcción: 60, Sensibilidad: 50, Ligereza: 55, 'Calidad/Precio': 95, 'Resistencia salada': 70 } },
    ]),
    ['B0F4XJ85B4', 'B098131M93', 'B0FYFMKZXZ', 'B0844Y3MNW', 'B09TTPSLZN'],
  )
}

async function seedCarretesPost() {
  await seedPost(
    'mejores-carretes-spinning-calidad-precio-2026',
    'Los 5 mejores carretes de spinning calidad-precio en 2026',
    'Comparamos los carretes más vendidos: Mitchell Mx1, Daiwa Crossfire, Shimano Sienna, Daiwa Ninja LT y Shimano Stradic FL. Guía de compra con precios y pros.',
    'Carretes',
    ['carretes spinning', 'carretes pesca', 'spinning', 'guias compra'],
    [
      'Elegir un carrete de spinning sin arruinarte es posible. Hemos comparado los modelos más vendidos del mercado español.',
      '',
      '## Para los que tienen prisa',
      '',
      '**Daiwa Ninja 23 LT 3000C** es el mejor carrete calidad-precio de 2026. Si el presupuesto es ajustado, el **Mitchell Mx1** cumple de sobra. Y el **Shimano Stradic FL** es una inversión que dura toda la vida.',
      '',
      '---',
      '',
      '## 1. Mitchell Mx1 4000 — El más barato que funciona', '', '<!--PRODUCT_IMG:1-->', '',
      'El carrete de spinning más vendido en Amazon España. Cuesta menos de 30€ y funciona.',
      '',
      '- **Precio:** ~28€ | **Rodamientos:** 5+1 | **Peso:** 280g',
      '- Ideal para iniciación y pesca ocasional',
      '- Lo mejor: Precio imbatible, #1 en ventas',
      '',
      '---',
      '',
      '## 2. Daiwa Crossfire 26 LT 2500 XH — Entrada a la calidad Daiwa', '', '<!--PRODUCT_IMG:2-->', '',
      'Por unos 32€ recibes un carrete con tecnología LT (Light & Tough). Perfecto para spinning ligero.',
      '',
      '- **Precio:** ~32€ | **Rodamientos:** 5+1 | **Peso:** 240g',
      '- Ideal para spinning ligero en costa',
      '- Lo mejor: Marca fiable, ligereza, precio contenido',
      '',
      '---',
      '',
      '## 3. Shimano Sienna FG 4000 — El clásico que nunca falla', '', '<!--PRODUCT_IMG:3-->', '',
      'Por unos 39€ tienes la calidad de construcción japonesa. Fiable y reparable.',
      '',
      '- **Precio:** ~39€ | **Rodamientos:** 3+1 | **Peso:** 360g',
      '- Ideal para pesca variada en costa',
      '- Lo mejor: Fiabilidad Shimano, reparable',
      '',
      '---',
      '',
      '## 4. Daiwa Ninja 23 LT 3000C — El rey calidad-precio', '', '<!--PRODUCT_IMG:4-->', '',
      'Por unos 55€ recibes tecnología LT, 5+1 rodamientos y solo 225g. El mejor carrete por menos de 60€.',
      '',
      '- **Precio:** ~55€ | **Rodamientos:** 5+1 | **Peso:** 225g',
      '- Ideal para spinning medio y surfcasting ligero',
      '- Lo mejor: Calidad-precio insuperable',
      '',
      '---',
      '',
      '## 5. Shimano Stradic FL 2500 — Gama alta que dura toda la vida', '', '<!--PRODUCT_IMG:5-->', '',
      'Por unos 180€ recibes cuerpo de magnesio, 8+1 rodamientos y CoreProtect. El único carrete que comprarás en años.',
      '',
      '- **Precio:** ~180€ | **Rodamientos:** 8+1 | **Peso:** 225g',
      '- Ideal para spinning exigente y agua salada',
      '- Lo mejor: Construcción premium, suavidad, durabilidad',
      '',
      '---',
      '',
      '## Cómo elegir tu carrete de spinning',
      '',
      'Con menos de 30€ tienes opciones funcionales. De 30-60€ encuentras calidad-precio excelente. A partir de 150€ entras en gama alta.',
      '',
      '---',
      '',
      '## Veredicto final',
      '',
      'La **Daiwa Ninja 23 LT 3000C** es mi recomendación para el 80% de los pescadores. Por 55€ recibes un carrete ligero, suave y fiable.',
    ].join('\n'),
    JSON.stringify([
      { asin: 'B09DGRP6VD', title: 'Mitchell Mx1 4000', price: '28€', rating: 4.1, image: 'https://m.media-amazon.com/images/I/812hiRdK1TL._AC_SL1500_.jpg', scores: { Construcción: 68, Suavidad: 62, Ligereza: 55, 'Calidad/Precio': 95, 'Resistencia salada': 55 } },
      { asin: 'B0G44JWB24', title: 'Daiwa Crossfire 26 LT 2500 XH', price: '32€', rating: 4.2, image: 'https://m.media-amazon.com/images/I/71FxUpWyhPL._AC_SL1500_.jpg', scores: { Construcción: 70, Suavidad: 68, Ligereza: 72, 'Calidad/Precio': 92, 'Resistencia salada': 62 } },
      { asin: 'B0873PQW96', title: 'Shimano Sienna FG 4000', price: '39€', rating: 4.3, image: 'https://m.media-amazon.com/images/I/61lpfbpSZQL._AC_SL1500_.jpg', scores: { Construcción: 78, Suavidad: 72, Ligereza: 58, 'Calidad/Precio': 88, 'Resistencia salada': 65 } },
      { asin: 'B0CH15QHMD', title: 'Daiwa Ninja 23 LT 3000C', price: '55€', rating: 4.5, image: 'https://m.media-amazon.com/images/I/61+Evme+0DL._AC_SL1500_.jpg', scores: { Construcción: 85, Suavidad: 85, Ligereza: 92, 'Calidad/Precio': 96, 'Resistencia salada': 75 } },
      { asin: 'B07V2PLT9S', title: 'Shimano Stradic FL 2500', price: '180€', rating: 4.7, image: 'https://m.media-amazon.com/images/I/61jLxxVsYrL._AC_SL1500_.jpg', scores: { Construcción: 95, Suavidad: 96, Ligereza: 94, 'Calidad/Precio': 70, 'Resistencia salada': 92 } },
    ]),
    ['B09DGRP6VD', 'B0G44JWB24', 'B0873PQW96', 'B0CH15QHMD', 'B07V2PLT9S'],
  )
}

async function seedKitsPost() {
  const content = [
    'Llegas a la tienda de pesca, ves la pared de señuelos y te entra un agobio — colores, formas, tamaños, marcas. No sabes ni por dónde empezar. Normal. Llevo años viendo a gente comprar señuelos que no necesita porque no tenía un plan. Este artículo es ese plan.',
    '',
    'Aquí no vas a encontrar señuelos de 30€ que solo usan los pros. Esto es lo que realmente necesita un pescador que empieza: una selección de kits y sets que cubren todo lo básico sin vaciar la cartera.',
    '',
    '## Para los que tienen prisa',
    '',
    'Si solo vas a comprar un kit, que sea el **Savage Gear Perch Academy Kit**. Lleva señuelos de calidad para empezar a pescar depredadores. Si ya tienes alguna caña y buscas completar, el **Berkley PowerBait Pro Pack** te da los vinilos más pescadores del mercado. Y si vas justo de presupuesto, el **Savage Gear Sandeel Kit** te saca del apuro por poco más de 10€.',
    '',
    '---',
    '',
'## 1. Savage Gear Perch Academy Kit — El kit perfecto para empezar con los depredadores',
    '',
    '<!--PRODUCT_IMG:1-->',
    '',
    'El **Savage Gear Perch Academy Kit** es la mejor puerta de entrada a la pesca con señuelos. Viene con una selección de vinilos Cannibal Shad, Fat T-Tail Minnow y Pro Grub en varios tamaños (5-9cm), cada uno con una acción de nado realista. Incluye también cabezas plomadas y una caja organizadora.',

    'Los señuelos no son relleno — son los mismos diseños de la gama profesional de Savage Gear. El kit está pensado para pescar lubina, perca, lucioperca y cualquier depredador de agua dulce y salada. Los vinilos trabajan bien a media agua y arrastrando por el fondo.',

    '- **Contenido:** Cannibal Shad, Fat T-Tail Minnow, Pro Grub, cabezas plomadas, caja',
    '- **Especies:** Lubina, perca, lucioperca, black bass, serrátidos',
    '- **Tamaños:** 5-9cm',
    '- **Lo mejor:** Calidad Savage Gear a precio de kit de iniciación',

    'El kit ideal si empiezas de cero y quieres señuelos de calidad sin pagar precio de gama profesional.',

    '---',

    '## 2. Berkley PowerBait Pro Pack — Los vinilos que nadie se atreve a ignorar',
    '',
    '<!--PRODUCT_IMG:2-->',
    '',
    'Berkley no necesita presentación. El **PowerBait Pro Pack** es un set de vinilos con el famoso potenciador PowerBait, un compuesto que libera aromas y sabe a comida de verdad para los peces. No es marketing — he visto doradas que escupían otros vinilos y se zampaban estos.',

    'El pack trae una selección de PowerBait en varios colores y tamaños. También incluye cabezas plomadas Jighead con anzuelo de calidad que no se oxidan a la primera. Funcionan especialmente bien en fondo rocoso y zonas de piedra.',

    'Para pescar a media agua o arrastrando por el fondo, son letales. El olor PowerBait hace que el pez confíe más y ataque con decisión, especialmente en aguas claras donde los vinilos normales pasan desapercibidos.',

    '- **Contenido:** 12-15 vinilos PowerBait, cabezas plomadas, caja',
    '- **Especies:** Lubina, dorada, sargo, besugo, perca',
    '- **Colores:** Camarón natural, perlado blanco, chartreuse, negro/azul',
    '- **Lo mejor:** El olor PowerBait marca la diferencia en agua clara',

    'El complemento perfecto para tu caja de señuelos. Si solo pescas con vinilos, este pack te da lo mejor de lo mejor.',

    '---',

    '## 3. Abu Garcia Lure Kit — El pack de señuelos duros para empezar',
    '',
    '<!--PRODUCT_IMG:3-->',
    '',
    '**Abu Garcia** es sinónimo de calidad en el mundo de la pesca, y su **Lure Kit** es un pack de señuelos duros ideal para el que empieza. Incluye una selección de crankbaits, spinners y cucharillas en varios colores y tamaños, listos para usar desde el minuto uno.',

    'Los señuelos vienen con anzuelos de calidad que aguantan bien el agua salada y una acción de nado probada que funciona con lubina, trucha y black bass. Especialmente recomendado para pescar en río y embalse.',

    'Tener esto en la caja de pesca significa que tienes señuelos duros listos para cualquier situación. Para el que empieza, es la forma más fácil de probar la pesca con señuelos sin tener que comprar 10 productos sueltos.',

    '- **Contenido:** Crankbaits, spinners, cucharillas, caja',
    '- **Usos:** Spinning en río, embalse y costa',
    '- **Especies:** Trucha, black bass, lubina, lucio',
    '- **Lo mejor:** Calidad Abu Garcia a buen precio',

    'El pack de duros perfecto para complementar tus vinilos. Con esto y los PowerBait tienes la caja completa.',

    '---',

    '## 4. Savage Gear Gravity Stick Mini Kit — Señuelos blandos de alta precisión',
    '',
    '<!--PRODUCT_IMG:4-->',
    '',
    'El **Savage Gear Gravity Stick Mini Kit** es un set de vinilos de perfil delgado con alta gravedad, diseñados para llegar rápido al fondo y mantener la posición en corrientes. Ideales para pescar en profundidad con técnica de drop shot o finesse.',

    'Los Gravity Stick tienen una acción sutil pero efectiva, con un diseño que imita a pequeños peces heridos. Incluyen sonajeros internos que atraen a los depredadores desde lejos. Cada vinilo viene con su cabeza plomada correspondiente.',

    'Funcionan de maravilla en fondos rocosos y zonas de piedra donde los señuelos más voluminosos se enganchan. Para pescar a media agua o en profundidad, son una opción letal que todo pescador debería tener.',

    '- **Contenido:** 6 Gravity Stick, cabezas plomadas, sonajeros',
    '- **Especies:** Lubina, lucioperca, perca, black bass',
    '- **Técnica:** Drop shot, finesse, vertical',
    '- **Lo mejor:** Acción sutil que los peces no pueden resistir',

    'Perfecto para cuando los peces están recelosos y necesitas algo más sutil que un vinilo tradicional.',

    '---',

    '## 5. Savage Gear Sandeel Kit — La opción económica para agua salada',
    '',
    '<!--PRODUCT_IMG:5-->',
    '',
    'El **Savage Gear Sandeel Kit** es el kit de señuelos para agua salada más equilibrado en precio-calidad. Incluye señuelos de cola de pala y babosa de 10 y 11cm, con cabezas plomadas, diseñados específicamente para pescar en mar.',

    'Los Sandeel imitan a los lanzones y peces forraje del Mediterráneo con un realismo sorprendente. El material es suave pero resistente, con sal impregnada para que el pez no los suelte fácilmente. Vienen en una bolsa resellable.',

    'Combinados con las cabezas plomadas incluidas, tienes un equipo completísimo para pescar lubina, dorada y anjova en costa por menos de 15€. La relación calidad-precio es difícil de superar.',

    '- **Contenido:** 8 señuelos Sandeel, cabezas plomadas, bolsa',
    '- **Especies:** Lubina, dorada, anjova, palometón',
    '- **Tamaños:** 10-11cm',
    '- **Lo mejor:** Precio imbatible para un kit de agua salada',

    'La opción perfecta para probar la pesca con vinilos en el mar sin gastar casi nada. Si luego te enganchas, ya invertirás en algo mejor.',
    '',
    '---',
    '',
    '## Cómo elegir tu primer kit de señuelos',
    '',
'### 1. Define qué tipo de pesca vas a hacer',
    'Si pescas principalmente desde costa con una caña de spinning de acción ligera, los vinilos (Berkley o Savage Gear Perch Academy) son tu mejor opción. Si tiras más a río o embalse, los señuelos duros del Abu Garcia Lure Kit te darán más juego. El Savage Gear Sandeel es ideal si pescas en el mar.',

    '### 2. El kit completo vs. el especializado',
    'Ninguno de estos kits te da un poco de todo — cada uno está especializado en un tipo de pesca. La combinación más inteligente para un principiante: Berkley PowerBait Pro Pack (vinilos) + Abu Garcia Lure Kit (duros). Con eso pescas cualquier cosa en cualquier sitio.',

    '### 3. Prioriza la calidad desde el principio',
    'A estos precios, no esperes anzuelos de titanio ni materiales milagro. Pero los cinco kits que recomendamos tienen una calidad más que suficiente para empezar y durar toda la temporada. Cuando pierdas tu primer señuelo en una roca (te pasará), apreciarás no haber pagado 25€ por él.',

    '### 4. La caja importa',
    'Los kits Savage Gear y Berkley vienen con caja organizadora. Abu Garcia y Gravity Stick vienen en pack o bolsa. Si puedes, prioriza los que traen caja — mantener los señuelos ordenados y sin enredos es más importante de lo que parece cuando estás en la playa con luz baja.',

    '### 5. Piensa en el agua donde vas a pescar',
    'Si pescas en el mar, el Savage Gear Sandeel Kit está diseñado específicamente para agua salada. Si pescas en río o embalse, el Abu Garcia Lure Kit te cubre. Para agua dulce y salada indistintamente, el Berkley PowerBait funciona en ambos.',
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
    'Para empezar, pueden servir, pero el problema no es el señuelo en sí, sino los anzuelos. Los señuelos baratos traen anzuelos que se oxidan, se doblan o no pinchan bien. Y perder un pez por un anzuelo malo es la mayor frustración para un principiante. Mejor pagar un poco más por kits de marca como los de esta guía (Savage Gear, Berkley o Abu Garcia).',
    '',
    '### ¿Cada cuánto debo cambiar los vinilos?',
    'Los vinilos duran entre 5 y 15 salidas dependiendo de la calidad del material y del fondo donde pesques. Los Berkley PowerBait duran más porque el material es más denso. Cuando veas que se rasgan con facilidad o pierden la forma, es hora de cambiarlos. Los kits traen suficientes para varios meses.',
    '',
    '---',
    '',
    '## Veredicto final',
    '',
    'Si empiezas de cero, la combinación **Berkley PowerBait Pro Pack + Abu Garcia Lure Kit** te da vinilos y duros de calidad por menos de 40€. Con eso puedes pescar lubinas, truchas, black bass y serrátidos durante meses sin tener que comprar nada más.',
    '',
    'Si ya tienes algo de material y quieres especializarte, el **Savage Gear Perch Academy Kit** es la mejor inversión en vinilos variados, y el **Savage Gear Gravity Stick Mini Kit** te abre la puerta a la pesca finesse sin pagar precios de gama alta.',
    '',
    'Y si tu presupuesto es muy ajustado, el **Savage Gear Sandeel Kit** te saca adelante por menos de 15€. No será lo mejor del mercado, pero pescar, pesca.',
    '',
    'Al final, el mejor kit es el que te lleva a la playa a probarlo. De nada sirve tener el mejor material del mundo si se queda en casa.',
  ].join('\n')

  const productsData = JSON.stringify([
    { title: 'Savage Gear Perch Academy Kit', rating: 4.6, image: 'https://m.media-amazon.com/images/I/71r0yNvrRZL._AC_SL1500_.jpg', scores: { Variedad: 92, Calidad: 88, Precio: 85, 'Para empezar': 95, Durabilidad: 82 }, stores: [{ name: 'Amazon', url: 'https://www.amazon.es/dp/B0BK5XR9QF', price: '25€' }] },
    { title: 'Berkley PowerBait Pro Pack', rating: 4.7, image: 'https://m.media-amazon.com/images/I/91jk3-f7pxL._AC_SL1500_.jpg', scores: { Variedad: 78, Calidad: 96, Precio: 90, 'Para empezar': 88, Durabilidad: 92 }, stores: [{ name: 'Amazon', url: 'https://www.amazon.es/dp/B0047OQI8I', price: '15€' }] },
    { title: 'Abu Garcia Lure Kit', rating: 4.4, image: 'https://m.media-amazon.com/images/I/619M+uZRgdL._AC_SL1500_.jpg', scores: { Variedad: 85, Calidad: 84, Precio: 82, 'Para empezar': 90, Durabilidad: 86 }, stores: [{ name: 'Amazon', url: 'https://www.amazon.es/dp/B0092PV8MS', price: '24€' }] },
    { title: 'Savage Gear Gravity Stick Mini Kit', rating: 4.5, image: 'https://m.media-amazon.com/images/I/61hVSCPwIzL._AC_SL1500_.jpg', scores: { Variedad: 72, Calidad: 90, Precio: 88, 'Para empezar': 80, Durabilidad: 88 }, stores: [{ name: 'Amazon', url: 'https://www.amazon.es/dp/B0B4QNRP49', price: '17€' }] },
    { title: 'Savage Gear Sandeel Kit', rating: 4.3, image: 'https://m.media-amazon.com/images/I/71BwKE+TXrL._AC_SL1500_.jpg', scores: { Variedad: 70, Calidad: 86, Precio: 95, 'Para empezar': 85, Durabilidad: 84 }, stores: [{ name: 'Amazon', url: 'https://www.amazon.es/dp/B077JM564T', price: '14€' }] },
  ])

  await seedPost(
    'mejores-kits-senuelos-empezar-2026',
    'Los 5 mejores kits de señuelos para empezar a pescar en 2026',
    '¿No sabes qué señuelos comprar para empezar a pescar? Analizamos los mejores kits de señuelos para principiantes: Savage Gear Perch Academy, Berkley PowerBait, Abu Garcia, Savage Gear Gravity Stick y Sandeel Kit. Guía de compra con precios, pros y contras.',
    'Señuelos',
    ['kits señuelos', 'señuelos pesca', 'principiantes', 'guias compra', 'vinilos pesca'],
    content,
    productsData,
    ['B0BK5XR9QF', 'B0047OQI8I', 'B0092PV8MS', 'B0B4QNRP49', 'B077JM564T'],
  )
}
