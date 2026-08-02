import { getDb } from '../src/lib/db';

interface ProductUpdate {
  namePattern: string;
  review: string;
  technicalSpecs: Record<string, string>;
}

const updates: ProductUpdate[] = [
  {
    namePattern: 'BUDEFO MAXIMUS',
    review: `La BUDEFO MAXIMUS es una caña de gama media-alta dentro del catálogo de AliExpress, diseñada para pescadores que buscan calidad profesional sin pagar precios de marcas premium. Su construcción en carbono 30T y las guías FUJI la sitúan por encima de las cañas básicas de fibra de vidrio, pero sin llegar al nivel de las Shimano o Daiwa de alta gama.

🔹 Puntos fuertes: Carbono 30T de alta resistencia con excelente relación peso-resistencia. Guías FUJI que reducen la fricción de la línea. Versatilidad de longitudes (1.68m a 3.2m) y potencias (ML/M/MH). Diseño telescópico para viaje que se pliega hasta ~60-70cm. Relación calidad-precio excelente: por 23-30€ combina carbono 30T + guías FUJI + acción rápida.

🔸 Limitaciones: No es una caña premium - no iguala la sensibilidad de Shimano Vengeance o Daiwa Ninja LT. Empuñadura de EVA estándar que puede resbalar en días de lluvia. Anillas no metálicas (no son cerámica SIC como en cañas >100€).

🔥 Valoración: 8.5/10 - Excelente para su rango de precio, ideal para pesca recreativa y viajes.`,
    technicalSpecs: {
      'Modelo': 'BUDEFO MAXIMUS',
      'Material': 'Carbono 30T',
      'Longitudes disponibles': '1.68m, 1.8m, 1.98m, 2.13m, 2.43m, 2.58m, 2.7m, 3.0m, 3.2m',
      'Potencia': 'ML (Medium-Light), M (Medium), MH (Medium-Heavy)',
      'Acción': 'Rápida (fast)',
      'Peso de lance': '3-18g (1.68m-1.98m) / 7-28g (1.98m) / 10-40g (2.13m) / 15-50g (2.43m-3.0m) / 20-70g (3.2m)',
      'Tramos': '2-4 (telescópica)',
      'Guías': 'FUJI (óxido de aluminio)',
      'Empuñadura': 'EVA',
      'Peso': '80g (1.8m) - 220g (3.2m)',
      'Uso': 'Spinning, baitcasting, agua dulce y salada',
    }
  },
  {
    namePattern: 'EVA',
    review: `La caja de pesca de EVA es un organizador todo-en-uno diseñado para pescadores que buscan practicidad y orden sin gastar mucho. Su diseño modular 3-en-1 la hace ideal para pesca ocasional, viajes y kayak.

🔹 Puntos fuertes: Material EVA de alta densidad impermeable, resistente a golpes y ligero (no se agrieta con el frío ni se deforma hasta 105°C). Diseño modular con 3 cajas apilables (44L totales) con compartimentos ajustables y tapa transparente. Impermeabilidad hermética y flotabilidad (no se hunde si cae al agua). Portabilidad: plegable, asa ergonómica, ~1.5kg total. Precio imbatible: 25-30€ vs 50-80€ en Amazon o Decathlon.

🔸 Limitaciones: No es indestructible - el EVA no aguanta golpes muy fuertes o mordiscos de peces grandes. Capacidad limitada para pesca profesional (>30 señuelos). Divisores de espuma pueden desprenderse con el tiempo. No incluye portacañas.

🔥 Valoración: 9/10 - Excelente para su rango de precio, ideal para pesca recreativa y viajes.`,
    technicalSpecs: {
      'Modelo': 'SAMOLLA Caja de Pesca EVA 3-en-1',
      'Material': 'EVA (etilvinilacetato) de alta densidad',
      'Color': 'Negro, verde, azul, dorado',
      'Dimensiones (apiladas)': '35 x 25 x 20 cm',
      'Peso total': '~1.5 kg (3 cajas)',
      'Capacidad total': '44L (26L + 12L + 6L)',
      'Impermeabilidad': 'Sí (sellado hermético)',
      'Flotabilidad': 'Sí (no se hunde)',
      'Resistencia térmica': '-20°C a 105°C',
      'Divisores': 'Espuma ajustable (incluidos)',
      'Tapa': 'Transparente',
      'Cierre': 'Cremallera + broches de seguridad',
      'Uso': 'Pesca agua dulce/salada, viaje, kayak, camping',
    }
  },
  {
    namePattern: 'Phishger (5-30g)',
    review: `La caña Phishger es una opción económica pero de calidad para pescadores que buscan versatilidad y portabilidad sin gastar mucho. Su carbono 30T y diseño telescópico la hacen perfecta para principiantes, pescadores urbanos y viajeros.

🔹 Puntos fuertes: Carbono 30T con equilibrio entre rigidez y flexibilidad. Diseño telescópico que se pliega a ~50-60cm con sistema de rosca antíholgura. Versatilidad: 1.8m-2.1m (5-25g) para ríos, 2.28m-2.4m (7-30g) para embalses o costa. Acción rápida (fast action) para lanzamientos precisos. Precio imbatible: 14-25€ frente a 40-60€ en Amazon o Decathlon. Guías de acero inoxidable que reducen fricción.

🔸 Limitaciones: No es una caña premium - no iguala la sensibilidad de Shimano Vengeance o Daiwa Ninja LT. Empuñadura básica de EVA que puede resbalar en días de lluvia. Conexiones telescópicas requieren limpieza tras cada uso. No incluye portacarretes.

🔥 Valoración: 8/10 - Excelente para su rango de precio, ideal para pesca recreativa y viajes.`,
    technicalSpecs: {
      'Modelo': 'Phishger Carbono 30T',
      'Material': 'Carbono 30T',
      'Longitudes disponibles': '1.8m, 2.1m, 2.28m, 2.4m',
      'Potencia': 'ML a M',
      'Acción': 'Rápida (fast)',
      'Peso de lance': '5-25g (1.8m-2.1m) / 7-30g (2.28m-2.4m)',
      'Tramos': '2-4 (telescópica)',
      'Guías': 'Acero inoxidable',
      'Empuñadura': 'EVA',
      'Peso': '90g (1.8m) - 150g (2.4m)',
      'Uso': 'Spinning, baitcasting, agua dulce y salada',
      'Incluye': 'Funda de tela (algunos modelos)',
    }
  },
  {
    namePattern: 'UPF 50+',
    review: `El sombrero de pesca con protección solar UPF 50+ es un accesorio esencial para pescadores que pasan largas horas bajo el sol. Su diseño específico para pesca lo hace ideal para costa, embarcación, verano y viajes.

🔹 Puntos fuertes: Protección UPF 50+ máxima certificada que bloquea más del 98% de rayos UVA y UVB (certificado AS/NZS 4399:1996). Ala ancha (7-8cm) que protege cuello y hombros. Cierre ajustable en la nuca que evita que se vuele. Material transpirable de poliéster con malla lateral para evitar calor excesivo. Resistente a agua salada, sudor y roces. Peso ligero (~100g) y secado rápido. Color neutro y talla única ajustable (56-62cm). Precio imbatible: 12-15€ vs 25-40€ en Decathlon.

🔸 Limitaciones: No es impermeable (resiste salpicaduras pero no lluvia intensa). Ala rígida que puede perder forma si se dobla bruscamente. Sin protección para la nariz (requiere crema solar adicional). No apto para vientos muy fuertes (>50 km/h).

🔥 Valoración: 9/10 - Excelente para su rango de precio, ideal para pesca y actividades al aire libre.`,
    technicalSpecs: {
      'Modelo': 'Sombrero pesca UPF 50+',
      'Material': '100% poliéster transpirable con malla lateral',
      'Protección solar': 'UPF 50+ (bloquea >98% UVA/UVB)',
      'Certificación': 'AS/NZS 4399:1996',
      'Color': 'Beige, verde militar',
      'Talla': 'Única ajustable (56-62 cm)',
      'Peso': '~100 g',
      'Ala': '7-8 cm de ancho',
      'Cierre': 'Cordón ajustable en nuca',
      'Transpirabilidad': 'Sí (malla lateral)',
      'Resistencia al agua': 'Salpicaduras (no impermeable)',
      'Secado': 'Rápido',
      'Plegable': 'Sí',
      'Uso': 'Pesca, playa, senderismo, viajes',
    }
  },
];

async function main() {
  const db = getDb();

  for (const update of updates) {
    // Find deals matching this product
    const deals = await db.execute({
      sql: `SELECT d.id, d.title, d.storeId FROM deals d
        INNER JOIN products p ON d.productId = p.id
        WHERE p.name LIKE ?`,
      args: [`%${update.namePattern}%`],
    });

    if (deals.rows.length === 0) {
      console.log(`❌ No deals found for pattern: "${update.namePattern}"`);
      continue;
    }

    console.log(`\n📌 Updating deals for "${update.namePattern}" (${deals.rows.length} deals):`);
    
    for (const deal of deals.rows) {
      const dealId = deal.id as string;
      const title = deal.title as string;
      const storeId = deal.storeId as string;

      await db.execute({
        sql: `UPDATE deals SET 
          review = ?, 
          technicalSpecs = ?,
          pros = ?,
          cons = ?
        WHERE id = ?`,
        args: [
          update.review,
          JSON.stringify(update.technicalSpecs),
          JSON.stringify([]),
          JSON.stringify([]),
          dealId,
        ],
      });

      console.log(`  ✅ ${title} (${storeId})`);
    }

    // Also update the products table
    const products = await db.execute({
      sql: `SELECT id, name FROM products WHERE name LIKE ?`,
      args: [`%${update.namePattern}%`],
    });

    if (products.rows.length > 0) {
      const productId = products.rows[0].id as string;
      await db.execute({
        sql: `UPDATE products SET 
          review = ?,
          specs = ?
        WHERE id = ?`,
        args: [
          update.review,
          JSON.stringify(update.technicalSpecs),
          productId,
        ],
      });
      // Also set description to be the review text so it's available if needed
      await db.execute({
        sql: `UPDATE products SET description = ? WHERE id = ?`,
        args: [update.review, productId],
      });
      console.log(`  ✅ Product "${products.rows[0].name}" updated`);
    }
  }

  console.log('\n✅ All deals and products updated!');
}

main().catch(console.error);
