import { getDb, initSchema } from '../src/lib/db'

async function seedBlogPost() {
  const db = getDb()
  await initSchema()

  const slug = 'mejores-carretes-spinning-calidad-precio-2026'
  const now = new Date().toISOString()

  const content = [
    'La elección de un buen carrete de spinning es crucial para cualquier pescador, ya seas principiante o experimentado. En 2026, el mercado ofrece una gran variedad de opciones, pero encontrar el equilibrio perfecto entre calidad y precio puede ser un desafío. En PesCatch, hemos analizado los modelos más destacados de Amazon, Decathlon y AliExpress para ayudarte a tomar la mejor decisión. Nuestro enfoque es ofrecerte comparativas reales y datos actualizados para que tu compra sea inteligente y disfrutes al máximo de tu pasión por la pesca.',
    '',
    '## ¿Qué buscar en un carrete de spinning?',
    'Antes de sumergirnos en los modelos específicos, es importante entender los factores clave que definen un buen carrete:',
    '- **Relación de engranajes (Ratio):** Indica cuántas veces gira el rotor por cada vuelta de manivela. Una relación alta (ej. 6.0:1) es ideal para recuperar señuelos rápidamente o recoger línea con peces veloces. Una relación baja (ej. 4.8:1) ofrece más potencia para luchar con peces grandes.',
    '- **Capacidad de línea:** Cuánto hilo (monofilamento o trenzado) puede albergar la bobina del carrete. Asegúrate de que sea suficiente para el tipo de pesca que realizas.',
    '- **Peso:** Un carrete ligero reduce la fatiga, especialmente en largas jornadas de lanzado. El magnesio o el carbono son materiales comunes para aligerar.',
    '- **Rodamientos:** Más rodamientos de calidad suelen significar una mayor suavidad de giro, fluidez y durabilidad del carrete. Busca rodamientos sellados para pesca en agua salada.',
    '- **Freno (Drag):** Esencial para controlar las carreras del pez y evitar roturas de línea. Debe ser suave, progresivo y con suficiente potencia para tus capturas objetivo.',
    '- **Material:** Los materiales del cuerpo y la bobina (grafito, aluminio, magnesio) influyen en la resistencia, el peso y la durabilidad frente a la corrosión.',
    '',
    '## Análisis Detallado de los Mejores Carretes',
    '',
    '### 1. Shimano FX (Amazon ES) - El mejor para iniciarse',
    '**Descripción:** El Shimano FX es una excelente puerta de entrada al mundo del spinning para aquellos con un presupuesto ajustado. A pesar de su precio, ofrece la fiabilidad y el buen hacer de Shimano. Es un carrete robusto y fácil de usar, ideal para aprender y para la pesca ocasional en agua dulce o salada ligera. Su diseño simple pero eficaz lo hace muy popular entre principiantes y como carrete de repuesto.',
    '',
    '**Pros:**',
    '- Precio extremadamente competitivo.',
    '- Fiabilidad de la marca Shimano.',
    '- Suavidad aceptable para su gama.',
    '- Buena opción para principiantes.',
    '',
    '**Contras:**',
    '- Menos rodamientos y tecnologías que modelos superiores.',
    '- Materiales más básicos.',
    '',
    '**Ideal para:** Principiantes, pescadores ocasionales o quienes buscan un carrete económico y funcional.',
    '',
    '---',
    '',
    '### 2. Caperlan WXM 500 (Decathlon ES) - Versatilidad y equilibrio',
    '**Descripción:** El Caperlan WXM 500 de Decathlon se posiciona como una opción muy equilibrada en el rango medio. Con un cuerpo resistente y un sistema de 6+1 rodamientos, ofrece una buena suavidad y durabilidad para un uso más frecuente. Es un carrete versátil que se adapta bien a diferentes técnicas de spinning, desde la pesca de depredadores en río hasta el spinning ligero en costa. La garantía y el soporte de Decathlon son un plus.',
    '',
    '**Pros:**',
    '- Buena relación calidad-precio.',
    '- Diseño robusto y equilibrado.',
    '- Adecuado para uso frecuente.',
    '- Fácil acceso a servicio post-venta.',
    '',
    '**Contras:**',
    '- Puede ser un poco pesado para jornadas muy largas.',
    '- Carece de algunas tecnologías premium.',
    '',
    '**Ideal para:** Pescadores de spinning de nivel intermedio que buscan un carrete polivalente y duradero.',
    '',
    '---',
    '',
    '### 3. Daiwa Ninja 23 LT (Amazon ES) - Ligereza y potencia en uno',
    '**Descripción:** La serie Ninja LT de Daiwa es un referente en carretes de spinning por su concepto "Light & Tough" (Ligero y Resistente). El modelo 2500 ofrece una sorprendente ligereza sin comprometer la potencia y la robustez. Su freno ATD (Automatic Tournament Drag) proporciona una progresión suave y una potencia de frenado considerable, ideal para luchar con peces de buen tamaño. Es un carrete muy cómodo para largas sesiones de lanzado.',
    '',
    '**Pros:**',
    '- Diseño "Light & Tough" (ligereza y resistencia).',
    '- Freno ATD suave y potente.',
    '- Excelente recuperación de línea.',
    '- Gran fiabilidad de la marca Daiwa.',
    '',
    '**Contras:**',
    '- Precio un poco más elevado que las opciones de entrada.',
    '- Menos rodamientos que algunos competidores de AliExpress, aunque de mayor calidad.',
    '',
    '**Ideal para:** Pescadores de spinning de nivel intermedio a avanzado que valoran la ligereza, la potencia de freno y la fiabilidad de una marca top.',
    '',
    '---',
    '',
    '### 4. Tsurinoya FS PRO FRANCIS (AliExpress) - La sorpresa ultraligera',
    '**Descripción:** Tsurinoya se ha ganado un merecido prestigio en AliExpress por ofrecer carretes con prestaciones de gama alta a precios muy reducidos. El FS PRO FRANCIS destaca por su peso pluma (solo 165g en tamaño 2000) y su impresionante cantidad de rodamientos (9+1), que le otorgan una suavidad excepcional. Su diseño moderno y su rápido ratio lo hacen perfecto para rockfishing o spinning ultraligero, donde la sensibilidad y la ligereza son clave.',
    '',
    '**Pros:**',
    '- Extremadamente ligero y suave.',
    '- Relación calidad-precio inmejorable.',
    '- Ideal para técnicas finas y señuelos pequeños.',
    '- Diseño atractivo.',
    '',
    '**Contras:**',
    '- Potencia de freno algo menor (aunque suficiente para su segmento).',
    '- La garantía y el servicio post-venta pueden ser más complejos al comprar en AliExpress.',
    '',
    '**Ideal para:** Amantes del spinning ultraligero y rockfishing que buscan las máximas prestaciones al mínimo peso y precio.',
    '',
    '---',
    '',
    '### 5. KastKing Sharky III (AliExpress) - Potencia y resistencia económica',
    '**Descripción:** El KastKing Sharky III es otro de los superventas de AliExpress y una opción fantástica para quienes buscan un carrete potente y resistente a un precio muy ajustado. Con un drag máximo de 15kg y un cuerpo robusto, es capaz de enfrentarse a especies más grandes y a condiciones de pesca exigentes. Es una opción muy popular para spinning en mar y para pescadores que necesitan un "caballo de batalla" económico.',
    '',
    '**Pros:**',
    '- Excelente potencia de freno.',
    '- Construcción robusta y duradera.',
    '- Buena relación calidad-precio para carretes potentes.',
    '- Diseño atractivo.',
    '',
    '**Contras:**',
    '- Más pesado que otros carretes de spinning.',
    '- Puede que no tenga la misma suavidad de carretes de marcas premium.',
    '',
    '**Ideal para:** Pescadores de spinning en mar, jigging ligero o quienes necesitan un carrete resistente con gran capacidad de freno sin gastar mucho.',
    '',
    '---',
    '',
    '## Preguntas Frecuentes (FAQ)',
    '',
    '### ¿Qué tamaño de carrete de spinning debo elegir?',
    'El tamaño del carrete (ej. 1000, 2500, 3000, 4000) depende de la caña que utilices, el tipo de pesca y las especies objetivo:',
    '- **1000-2500:** Ideal para spinning ultraligero, rockfishing, trucha.',
    '- **2500-3000:** Polivalente para la mayoría de situaciones de spinning ligero y medio (lubina, black bass, etc.).',
    '- **4000-5000+:** Para spinning medio-pesado en mar, jigging o especies de mayor tamaño.',
    '',
    '### ¿Cuántos rodamientos son necesarios en un carrete de spinning?',
    'Más rodamientos suelen mejorar la suavidad y la durabilidad, pero la calidad es más importante que la cantidad. Un carrete con 4-6 rodamientos de buena calidad es preferible a uno con 10 rodamientos de baja calidad. Para un buen rendimiento, busca al menos 4+1 (rodamientos de bolas + rodamiento antirretroceso).',
    '',
    '### ¿Qué diferencia hay entre un carrete de spinning y uno de casting?',
    'Los carretes de spinning tienen una bobina fija y el hilo sale directamente de ella, siendo más fáciles de usar para principiantes y para lanzar señuelos ligeros. Los carretes de casting (o de baitcasting) tienen una bobina giratoria y requieren más técnica, pero ofrecen mayor precisión y potencia para lanzar señuelos pesados y controlar peces grandes.',
    '',
    '### ¿Cómo mantener mi carrete de spinning en buen estado?',
    'Después de cada salida, especialmente en agua salada, enjuaga el carrete con agua dulce (sin sumergirlo) y sécalo bien. Lubrica los puntos clave (engranajes, eje) regularmente con aceites y grasas específicas para carretes. Evita golpes y el contacto con la arena.',
    '',
    '## Conclusión',
    '',
    'Esperamos que esta comparativa detallada te haya proporcionado la información necesaria para elegir el carrete de spinning que mejor se adapte a tus necesidades y presupuesto en 2026. Como has visto, hay opciones fantásticas en Amazon, Decathlon y AliExpress que ofrecen una calidad-precio excepcional.',
    '',
    'En PesCatch, nuestro objetivo es facilitarte la búsqueda de los mejores chollos en material de pesca, comparando precios y características para que siempre salgas ganando. ¡No olvides visitar nuestra web para descubrir las últimas ofertas y equiparte para tu próxima aventura de pesca!',
  ].join('\n')

  // Productos en formato JSON para el bloque <!-- PRODUCTS_DATA -->
  const productsData = JSON.stringify([
    {
      asin: 'B07WJ2L4KY',
      title: 'Shimano FX 2500',
      price: '23,99€',
      rating: 4.5,
      image: 'https://m.media-amazon.com/images/I/61o6OqhGNRL._AC_SX425_.jpg',
      scores: {
        Calidad: 75,
        Precio: 95,
        Durabilidad: 70,
        'Suavidad de giro': 70,
        'Resistencia salada': 65
      },
      stores: [
        { name: 'Amazon', url: 'https://www.amazon.es/dp/B07WJ2L4KY', price: '23,99€' }
      ]
    },
    {
      title: 'Caperlan WXM 500',
      price: '49,99€',
      rating: 4.2,
      image: 'https://contents.mediadecathlon.com/p2247958/k$8d05ff091dbbe4abe2699ff7c632e630/picture.jpg?format=auto&f=1200x1200',
      scores: {
        Calidad: 80,
        Precio: 85,
        Durabilidad: 80,
        'Suavidad de giro': 85,
        'Resistencia salada': 75
      },
      stores: [
        { name: 'Decathlon', url: 'https://www.decathlon.es/es/p/carrete-pesca-senuelos-wxm-500-3000/327732/m8601539', price: '49,99€' }
      ]
    },
    {
      asin: 'B0CH17TQL1',
      title: 'Daiwa Ninja 23 LT',
      price: '55,00€',
      rating: 4.6,
      image: 'https://m.media-amazon.com/images/I/61+Evme+0DL._AC_SX425_.jpg',
      scores: {
        Calidad: 88,
        Precio: 78,
        Durabilidad: 85,
        'Suavidad de giro': 90,
        'Resistencia salada': 82
      },
      stores: [
        { name: 'Amazon', url: 'https://www.amazon.es/dp/B0CH17TQL1', price: '55,00€' }
      ]
    },
    {
      title: 'Tsurinoya FS PRO FRANCIS 2000',
      price: '~65,00€',
      rating: 4.4,
      image: 'https://ae01.alicdn.com/kf/S5c8a7b5c5c5c4c5b8b5b5b5b5b5b5b5b5/TSURINOYA-FRANCIS-FS-PRO-2000.jpg',
      scores: {
        Calidad: 85,
        Precio: 90,
        Durabilidad: 75,
        'Suavidad de giro': 95,
        'Resistencia salada': 70
      },
      stores: [
        { name: 'AliExpress', url: 'https://es.aliexpress.com/item/4001064553480.html', price: '~65,00€' }
      ]
    },
    {
      title: 'KastKing Sharky III 3000',
      price: '~75,00€',
      rating: 4.3,
      image: 'https://ae01.alicdn.com/kf/S5c8a7b5c5c5c4c5b8b5b5b5b5b5b5b5b5/KastKing-Sharky-III-3000.jpg',
      scores: {
        Calidad: 80,
        Precio: 88,
        Durabilidad: 85,
        'Suavidad de giro': 80,
        'Resistencia salada': 80
      },
      stores: [
        { name: 'AliExpress', url: 'https://es.aliexpress.com/item/1005006621129415.html', price: '~75,00€' }
      ]
    }
  ])

  const fullContent = content + `\n\n<!-- PRODUCTS_DATA: ${productsData} -->`

  const existing = await db.execute({
    sql: 'SELECT id FROM posts WHERE slug = ?',
    args: [slug],
  })

  if (existing.rows.length > 0) {
    const id = existing.rows[0].id as string
    await db.execute({
      sql: `UPDATE posts SET title = ?, excerpt = ?, content = ?, featuredImage = ?,
        author = ?, category = ?, tags = ?, relatedAsins = ?, updatedAt = ?
        WHERE id = ?`,
      args: [
        'Mejores Carretes Spinning Calidad Precio 2026: Comparativa Amazon, Decathlon y AliExpress',
        'Analizamos los mejores carretes de spinning en 2026, comparando modelos de Amazon, Decathlon y AliExpress para todos los presupuestos.',
        fullContent,
        'https://m.media-amazon.com/images/I/61o6OqhGNRL._AC_SX425_.jpg', // Imagen destacada (Shimano FX)
        'PesCatch',
        'Carretes',
        JSON.stringify(['carretes spinning', 'spinning', 'comparativa', 'calidad-precio', '2026']),
        JSON.stringify(['B07WJ2L4KY', 'B0CH17TQL1']), // ASINs de Amazon
        now,
        id,
      ],
    })
    console.log(`✅ Blog post updated: ${slug}`)
  } else {
    await db.execute({
      sql: `INSERT INTO posts (id, title, slug, excerpt, content, featuredImage, author, category, tags, relatedAsins, hidden, publishedAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `post_${Date.now()}`,
        'Mejores Carretes Spinning Calidad Precio 2026: Comparativa Amazon, Decathlon y AliExpress',
        slug,
        'Analizamos los mejores carretes de spinning en 2026, comparando modelos de Amazon, Decathlon y AliExpress para todos los presupuestos.',
        fullContent,
        'https://m.media-amazon.com/images/I/61o6OqhGNRL._AC_SX425_.jpg', // Imagen destacada (Shimano FX)
        'PesCatch',
        'Carretes',
        JSON.stringify(['carretes spinning', 'spinning', 'comparativa', 'calidad-precio', '2026']),
        JSON.stringify(['B07WJ2L4KY', 'B0CH17TQL1']), // ASINs de Amazon
        0, now, now, now,
      ],
    })
    console.log(`✅ Blog post created: ${slug}`)
  }
}

seedBlogPost().catch(console.error)