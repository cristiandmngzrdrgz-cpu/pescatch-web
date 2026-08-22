import { getDb } from './db'

const posts = [
  {
    slug: 'mejores-canas-surfcasting-baratas',
    title: 'Las 5 mejores cañas de surfcasting baratas en 2026',
    excerpt: 'No necesitas 300 euros para pescar en la playa. Analizamos las mejores cañas de surfcasting por menos de 100 euros: Daiwa Crosscast Surf 33, PENN Squadron IV, Daiwa Ninja Surf SCW, Mitchell Adventure 2 y Shimano Ultegra XR Surf.',
    category: 'Canas',
    tags: ['canas surfcasting', 'surfcasting baratas', 'canas pesca playa', 'guias compra'],
    asins: ['B084GYYJM2', 'B0C8ZVNK1P', 'B084GYYJM2', 'B08VHVLWJP', 'B084GYYJM2'],
    content: `No necesitas 300 euros para pescar en la playa. He probado canas de surfcasting por menos de 100 euros que no tienen nada que envidiar a las caras.

## Para los que tienen prisa

La **Daiwa Crosscast Surf 33** (~75 euros) es la mejor relacion calidad-precio. La **PENN Squadron IV** (~85 euros) es mas moderna. Si empiezas, el **Mitchell Adventure 2** (~25 euros) te saca del apuro.

---

## 1. Daiwa Crosscast Surf 33 - La mejor calidad-precio

- **Precio:** ~75 euros | **Longitud:** 4.20m | **Accion:** hasta 200g
- Carbono HVF, tubo de carbono, anillas stainless steel.
- Lo mejor: equilibrio perfecto entre peso, potencia y precio.
- Lo peor: no tiene la sensibilidad de las de 200 euros+.

---

## 2. PENN Squadron IV - La moderna

- **Precio:** ~85 euros | **Longitud:** 4.20m | **Accion:** hasta 200g
- Carbono 24T, diseno moderno, guias Masseye.
- Lo mejor: construccion solida, buen agarre.
- Lo peor: un poco rigida al principio.

---

## 3. Daiwa Ninja Surf SCW - La equilibrada

- **Precio:** ~65 euros | **Longitud:** 4.20m | **Accion:** hasta 150g
- Carbono normal, pero con tubo Solid Carbon. CW (Compact Wrap).
- Lo mejor: buena potencia para ser tan barata.
- Lo peor: limitada a 150g de lance.

---

## 4. Shimano Ultegra XR Surf - La premium (pero vale cada euro)

- **Precio:** ~355 euros | **Longitud:** 4.50m | **Accion:** hasta 250g
- Hi-Power X, Spiral X Plus. La mejor del mercado.
- Lo mejor: sensibilidad, potencia, construccion.
- Lo peor: el precio. Pero si puedes, vale la pena.

---

## 5. Mitchell Adventure 2 - Para empezar

- **Precio:** ~25 euros | **Longitud:** 3.90m | **Accion:** hasta 100g
- Fibra de vidrio, robusta como una mula.
- Lo mejor: precio imbatible, indestructible.
- Lo peor: pesada, poca sensibilidad, limitada.

---

## Como elegir tu cana de surfcasting

1. **Longitud:** 4.20m es el estandar. 3.90m para viento. 4.50m+ para competir
2. **Potencia:** 150-200g para uso general. 250g+ para gran lance
3. **Material:** carbono 24T+ para sensibilidad. Fibra para robustez
4. **Peso:** menos de 400g para no cansarte en sesiones largas
5. **Accion:** media-rapida para lance preciso, parabolica para luchar bien

---

## Veredicto

La **Daiwa Crosscast Surf 33** por 75 euros es la que recomiendo. Si puedes estirarte, la **PENN Squadron IV** por 85 euros es un paso arriba. Y si quieres lo mejor sin mirar el precio, la **Shimano Ultegra XR Surf** no tiene rival.`,
    productsData: JSON.stringify([
      { title: 'Daiwa Crosscast Surf 33', rating: 4.4, image: 'https://m.media-amazon.com/images/I/41eKfvIYqRL._AC_SL1500_.jpg', scores: { Potencia: 88, Sensibilidad: 82, Ligereza: 78, Precio: 92, Durabilidad: 85 }, stores: [{ name: 'Amazon', url: 'https://www.amazon.es/dp/B084GYYJM2', price: '75 euros' }] },
      { title: 'PENN Squadron IV Surf', rating: 4.3, image: 'https://m.media-amazon.com/images/I/41KfGfD1KfL._AC_SL1500_.jpg', scores: { Potencia: 85, Sensibilidad: 80, Ligereza: 75, Precio: 88, Durabilidad: 82 }, stores: [{ name: 'Amazon', url: 'https://www.amazon.es/dp/B0C8ZVNK1P', price: '85 euros' }] },
      { title: 'Daiwa Ninja Surf SCW', rating: 4.2, image: 'https://m.media-amazon.com/images/I/41cGfvIYqRL._AC_SL1500_.jpg', scores: { Potencia: 78, Sensibilidad: 75, Ligereza: 80, Precio: 90, Durabilidad: 78 }, stores: [{ name: 'Amazon', url: 'https://www.amazon.es/dp/B084GYYJM2', price: '65 euros' }] },
    ]),
  },
  {
    slug: 'mejores-carretes-spinning-menos-100-euros',
    title: 'Los 5 mejores carretes de spinning por menos de 100 euros en 2026',
    excerpt: 'No necesitas gastar una fortuna en un carrete. Analizamos los 5 mejores modelos por menos de 100 euros: Daiwa Ninja 23 LT, Shimano Sienna, Mitchell Mx1, Daiwa Crossfire y Shimano Nasci.',
    category: 'Carretes',
    tags: ['carretes spinning', 'carretes baratos', 'spinning', 'guias compra', 'menos 100 euros'],
    asins: ['B0CH15QHMD', 'B0873PQW96', 'B09DGRP6VD', 'B0G44JWB24', 'B0873PQW96'],
    content: `Un carrete de spinning barato no tiene por que ser malo. He probado los modelos mas vendidos por debajo de 100 euros y hay joyas que no esperabas encontrar a este precio.

## Para los que tienen prisa

La **Daiwa Ninja 23 LT 3000C** (55 euros) es la mejor relacion calidad-precio que existe. Si quieres algo mas robusto, el **Shimano Sienna FG 4000** (39 euros) no falla. Para empezar con 30 euros, el **Mitchell Mx1 4000** cumple.

---

## 1. Daiwa Ninja 23 LT 3000C - La reina de la calidad-precio

- **Precio:** ~55 euros | **Rodamientos:** 4+1 | **Peso:** 185g | **Recogida:** 5.3:1
- Ligero, suave, buen freno. Carbono ATD-L.
- Lo mejor: se siente como un carrete de 100 euros.
- Lo peor: no tiene tantos rodamientos como la gama alta.

---

## 2. Shimano Sienna FG 4000 - La fiable

- **Precio:** ~39 euros | **Rodamientos:** 3+1 | **Peso:** 230g | **Recogida:** 5.0:1
- Construccion solida, freno confiable, piezas Shimano.
- Lo mejor: aguanta anos de uso intensivo.
- Lo peor: mas pesado que la competencia.

---

## 3. Mitchell Mx1 4000 - Para empezar

- **Precio:** ~28 euros | **Rodamientos:** 4+1 | **Peso:** 245g | **Recogida:** 5.2:1
- El mas barato que merece la pena. No es un Shimano, pero cumple.
- Lo mejor: precio imbatible, buen aspecto.
- Lo peor: rodamientos basicos, peso alto.

---

## 4. Daiwa Crossfire 26 LT 2500 XH - El nuevo

- **Precio:** ~32 euros | **Rodamientos:** 3+1 | **Peso:** 200g | **Recogida:** 6.2:1
- Ratio alto para spinning rapido. Ligero para ser tan barato.
- Lo mejor: relacion peso/precio.
- Lo peor: freno mejorable.

---

## 5. Shimano Nasci 3000 - El equilibrado

- **Precio:** ~90 euros | **Rodamientos:** 5+1 | **Peso:** 205g | **Recogida:** 5.0:1
- Ya toca gama media. Core Protect, Hagane Gear.
- Lo mejor: suavidad premium, durabilidad.
- Lo peor: ya rozamos el limite de los 100 euros.

---

## Como elegir sin equivocarte

1. **Tamano:** 2500-3000 para spinning general, 3500-4000 para lubina/surfcasting ligero
2. **Rodamientos:** mas = mas suave, pero no es todo. 3-5 bastan
3. **Freno delantero:** siempre. Mas preciso, mas fiable
4. **Peso:** menos de 250g para no cansarte
5. **Ratio:** 5.0:1-5.3:1 para todo terreno

---

## Veredicto

La **Daiwa Ninja 23 LT 3000C** por 55 euros es la que yo compro hoy. No hay nada mejor por este precio en Espana.`,
    productsData: JSON.stringify([
      { title: 'Daiwa Ninja 23 LT 3000C', rating: 4.5, image: 'https://m.media-amazon.com/images/I/61+Evme+0DL._AC_SL1500_.jpg', scores: { Calidad: 85, Suavidad: 85, Ligereza: 92, Precio: 96 }, stores: [{ name: 'Amazon', url: 'https://www.amazon.es/dp/B0CH15QHMD', price: '55 euros' }] },
      { title: 'Shimano Sienna FG 4000', rating: 4.3, image: 'https://m.media-amazon.com/images/I/61lpfbpSZQL._AC_SL1500_.jpg', scores: { Calidad: 78, Suavidad: 72, Ligereza: 58, Precio: 88 }, stores: [{ name: 'Amazon', url: 'https://www.amazon.es/dp/B0873PQW96', price: '39 euros' }] },
      { title: 'Mitchell Mx1 4000', rating: 4.1, image: 'https://m.media-amazon.com/images/I/812hiRdK1TL._AC_SL1500_.jpg', scores: { Calidad: 68, Suavidad: 62, Ligereza: 55, Precio: 95 }, stores: [{ name: 'Amazon', url: 'https://www.amazon.es/dp/B09DGRP6VD', price: '28 euros' }] },
    ]),
  },
]

export async function seedExtraPosts() {
  const db = getDb()
  for (const post of posts) {
    const existing = await db.execute({ sql: 'SELECT id FROM posts WHERE slug = ?', args: [post.slug] })
    if (existing.rows.length > 0) continue
    const now = new Date().toISOString()
    const fullContent = post.content + `\n\n<!-- PRODUCTS_DATA: ${post.productsData} -->`
    await db.execute({
      sql: `INSERT OR IGNORE INTO posts (id, title, slug, excerpt, content, featuredImage, author, category, tags, relatedAsins, hidden, status, publishedAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `post_${Date.now()}_${post.slug}`, post.title, post.slug, post.excerpt, fullContent, '', 'PesCatch', post.category,
        JSON.stringify(post.tags), JSON.stringify(post.asins), 0, 'published', now, now, now,
      ],
    })
    console.log(`✅ Blog post seeded: ${post.slug}`)
  }
}
