import { getDb } from '../src/lib/db';

interface BatchUpdate {
  productNamePattern: string;
  review: string;
  technicalSpecs: Record<string, string>;
}

const batch: BatchUpdate[] = [
  {
    productNamePattern: 'SHIMANO Ultegra 14000 XSE',
    review: `El Shimano Ultegra 14000 XSE es un carrete de surfcasting de gama alta, diseñado para lanzamientos de larga distancia con máxima suavidad. Incorpora el sistema Aero Wrap II que distribuye el sedal de forma uniforme, eliminando los problemas de nudos y enganches típicos del surfcasting. Su cuerpo de aluminio y engranajes de metal HAGANE garantizan una durabilidad excepcional incluso en condiciones de uso intensivo en agua salada. El sistema de freno X-Touch ofrece una regulación milimétrica para domar capturas grandes sin sustos. Relación calidad-precio excelente para un carrete de este nivel.`,
    technicalSpecs: {
      'Marca': 'Shimano',
      'Modelo': 'Ultegra 14000 XSE',
      'Tamaño': '14000',
      'Tipo': 'Surfcasting',
      'Material cuerpo': 'Aluminio (HAGANE)',
      'Engranajes': 'Metal HAGANE',
      'Rodamientos': '5+1',
      'Capacidad (PE)': '~300m de 0.35mm',
      'Recogida por vuelta': '~105cm',
      'Freno': 'X-Touch (delantero)',
      'Sistema línea': 'Aero Wrap II',
      'Peso': '~595g',
      'Uso': 'Surfcasting, pesca en playa',
    }
  },
  {
    productNamePattern: 'Shimano Stradic FL 2500',
    review: `El Shimano Stradic FL 2500 es uno de los carretes spinning más icónicos de gama media-alta. Representa el equilibrio perfecto entre ligereza, suavidad y durabilidad. Incorpora la tecnología HAGANE (cuerpo y engranajes de metal) que proporciona una transmisión ultrasuave y resistente al desgaste. El sistema MicroModule Gear II ofrece un engranaje principal casi perfecto para una recuperación sedosa. Su freno X-Protect es resistente al agua, ideal para pesca en agua dulce y salada. Un carrete que dura años con mantenimiento básico.`,
    technicalSpecs: {
      'Marca': 'Shimano',
      'Modelo': 'Stradic FL 2500',
      'Tamaño': '2500',
      'Tipo': 'Spinning',
      'Material cuerpo': 'Aluminio HAGANE',
      'Engranajes': 'HAGANE + MicroModule II',
      'Rodamientos': '9+1',
      'Capacidad (mono)': '200m/0.25mm',
      'Recogida por vuelta': '~79cm',
      'Freno': 'X-Protect (delantero)',
      'Peso': '~225g',
      'Relación': '5.1:1',
      'Uso': 'Spinning agua dulce y salada',
    }
  },
  {
    productNamePattern: 'Penn Spinfisher VI 5500',
    review: `El Penn Spinfisher VI 5500 es el carrete de referencia para pesca en agua salada. Su fama se debe al sistema de sellado IPX5 que protege los engranajes y rodamientos del agua salada, arena y suciedad. Es prácticamente a prueba de destrucción — ideal para surfcasting, pesca desde embarcación y especie grande. El sistema de freno HT-100 ofrece una potencia de frenada suave y constante. El cuerpo de metal y el eje de acero inoxidable lo hacen extremadamente resistente. Puede parecer pesado comparado con carretes modernos, pero su durabilidad es legendaria.`,
    technicalSpecs: {
      'Marca': 'Penn',
      'Modelo': 'Spinfisher VI 5500',
      'Tamaño': '5500',
      'Tipo': 'Spinning (saltwater)',
      'Material cuerpo': 'Metal (aluminio fundido)',
      'Sellado': 'IPX5 (resistente agua salada)',
      'Rodamientos': '5+1 (sellados)',
      'Capacidad (mono)': '~300m/0.40mm',
      'Freno': 'HT-100 (delantero)',
      'Peso': '~595g',
      'Relación': '4.2:1',
      'Eje': 'Acero inoxidable',
      'Uso': 'Surfcasting, embarcación, especie grande',
    }
  },
  {
    productNamePattern: 'DAIWA Legalis SB 902',
    review: `La Daiwa Legalis SB 902 es una caña de spinning especializada para lubina, con 2.73m de longitud y potencia 14-42g. Es la compañera ideal para pescar en costa y espigones, ofreciendo un equilibrio perfecto entre distancia de lance y sensibilidad. El blank de carbono HVF (High Volume Fiber) de Daiwa proporciona una acción rápida y reactiva, perfecta para trabajar señuelos como paseantes, poppers y jerkbaits. Las guías K-Guides reducen el enredamiento de la línea y facilitan lances largos. Una caña muy polivalente dentro de su segmento.`,
    technicalSpecs: {
      'Marca': 'Daiwa',
      'Modelo': 'Legalis SB 902',
      'Longitud': '2.73m (9\'0")',
      'Potencia': '14-42g',
      'Acción': 'Rápida (fast)',
      'Tramos': '2',
      'Material': 'Carbono HVF',
      'Guías': 'K-Guides',
      'Portacarretes': 'Aluminio (Daiwa)',
      'Empuñadura': 'EVA',
      'Peso': '~215g',
      'Uso': 'Spinning lubina, costa, espigones',
    }
  },
  {
    productNamePattern: 'DAIWA Ninja 23 LT 6000',
    review: `El Daiwa Ninja 23 LT 6000 es un carrete de gama media pensado para pesca en mar. Forma parte de la renovada serie Ninja LT de Daiwa, que incorpora el cuerpo Zaion (polímero de carbono) ultraligero sin sacrificar resistencia. Con tamaño 6000 tiene capacidad suficiente para enfrentarse a lubinas, sargos, doradas y incluso atunes pequeños. El sistema de freno ATD (Automatic Tournament Drag) proporciona una presión constante y progresiva. El ratio de recogida alto permite trabajar señuelos rápidos y recuperar línea rápidamente.`,
    technicalSpecs: {
      'Marca': 'Daiwa',
      'Modelo': 'Ninja 23 LT 6000',
      'Tamaño': '6000',
      'Tipo': 'Spinning',
      'Material cuerpo': 'Zaion (polímero carbono)',
      'Engranajes': 'Metal (Digigear)',
      'Rodamientos': '5+1',
      'Capacidad (PE)': '~300m/0.30mm',
      'Freno': 'ATD (delantero)',
      'Recogida por vuelta': '~95cm',
      'Peso': '~295g',
      'Relación': '5.3:1',
      'Uso': 'Pesca mar, surfcasting ligero',
    }
  },
  {
    productNamePattern: 'DAIWA Ninja 23 LT 4000 C',
    review: `El Daiwa Ninja 23 LT 4000 C es la versión compacta del popular Ninja LT, ideal para spinning en agua dulce y salada ligera. Su cuerpo Zaion ultraligero lo convierte en uno de los carretes más ligeros de su categoría, permitiendo jornadas largas sin fatiga. El sistema Digigear de engranajes de metal proporciona una transmisión suave y duradera. El freno ATD ofrece una respuesta progresiva que evita roturas de línea en las picadas más violentas. Perfecto para pesca de lubina, bass, trucha grande y lucioperca.`,
    technicalSpecs: {
      'Marca': 'Daiwa',
      'Modelo': 'Ninja 23 LT 4000 C',
      'Tamaño': '4000C (compacto)',
      'Tipo': 'Spinning',
      'Material cuerpo': 'Zaion (polímero carbono)',
      'Engranajes': 'Digigear (metal)',
      'Rodamientos': '5+1',
      'Capacidad (mono)': '~200m/0.30mm',
      'Freno': 'ATD (delantero)',
      'Recogida por vuelta': '~85cm',
      'Peso': '~260g',
      'Relación': '5.3:1',
      'Uso': 'Spinning agua dulce y salada ligera',
    }
  },
  {
    productNamePattern: 'OKUMA Altera Spin - Caña Spinning 2.40m 7-28g',
    review: `La Okuma Altera Spin 2.40m (8') es una caña de spinning versátil y equilibrada, ideal para pesca en embalses y costa ligera. Su blank de carbono de respuesta rápida permite lanzar señuelos de 7 a 28 gramos con precisión. La acción de punta sensible detecta picadas sutiles mientras el tramo medio-alto proporciona la potencia necesaria para clavar el anzuelo. Las guías de acero inoxidable con insertos de óxido de aluminio reducen la fricción y alargan la vida de la línea. Un clásico para pescadores que buscan una caña polivalente a buen precio.`,
    technicalSpecs: {
      'Marca': 'Okuma',
      'Modelo': 'Altera Spin',
      'Longitud': '2.40m (8\')',
      'Potencia': '7-28g',
      'Acción': 'Rápida (fast)',
      'Tramos': '2',
      'Material': 'Carbono',
      'Guías': 'Acero inoxidable + óxido aluminio',
      'Portacarretes': 'Aluminio',
      'Empuñadura': 'EVA con pintado de hilo',
      'Peso': '~185g',
      'Uso': 'Spinning embalses, costa ligera',
    }
  },
  {
    productNamePattern: 'DAIWA Ninja 23 LT 2500 XH',
    review: `El Daiwa Ninja 23 LT 2500 XH es la versión de perfil bajo del Ninja LT, ideal para spinning ligero en ríos y embalses. Su cuerpo Zaion lo hace extremadamente ligero (~240g), perfecto para jornadas largas lanzando cucharillas, vinilos y señuelos ligeros. El sistema de freno ATD proporciona una presión suave y progresiva, ideal para líneas finas. La relación de recogida XH (extra high) permite trabajar señuelos rápidos y recuperar línea a gran velocidad. Un carrete muy equilibrado para su precio.`,
    technicalSpecs: {
      'Marca': 'Daiwa',
      'Modelo': 'Ninja 23 LT 2500 XH',
      'Tamaño': '2500 XH',
      'Tipo': 'Spinning',
      'Material cuerpo': 'Zaion (polímero carbono)',
      'Engranajes': 'Digigear (metal)',
      'Rodamientos': '5+1',
      'Capacidad (mono)': '~180m/0.25mm',
      'Freno': 'ATD (delantero)',
      'Recogida por vuelta': '~90cm',
      'Peso': '~240g',
      'Relación': '5.8:1',
      'Uso': 'Spinning ligero, ríos, embalses',
    }
  },
  {
    productNamePattern: 'DAIWA 23 Ninja LT Carrete Spinning 3000C',
    review: `El Daiwa 23 Ninja LT 3000C es el equilibrio perfecto entre tamaño y potencia. Con cuerpo Zaion y engranajes Digigear de metal, ofrece una suavidad de rodaje impropia de su precio. El tamaño 3000C es el más versátil de la gama: suficientemente grande para pesca en mar ligera y suficientemente compacto para pesca en río. El freno ATD permite ajustar la presión con precisión para líneas de 0.20 a 0.35mm. Un carrete que recomendaría a cualquier pescador que quiera un equipo fiable sin gastar una fortuna.`,
    technicalSpecs: {
      'Marca': 'Daiwa',
      'Modelo': 'Ninja 23 LT 3000C',
      'Tamaño': '3000C (compacto)',
      'Tipo': 'Spinning',
      'Material cuerpo': 'Zaion (polímero carbono)',
      'Engranajes': 'Digigear (metal)',
      'Rodamientos': '5+1',
      'Capacidad (mono)': '~200m/0.28mm',
      'Freno': 'ATD (delantero)',
      'Recogida por vuelta': '~80cm',
      'Peso': '~250g',
      'Relación': '5.3:1',
      'Uso': 'Spinning versátil, agua dulce y salada',
    }
  },
  {
    productNamePattern: 'SHIMANO Vengeance CX - Caña Spinning 2.40m 10-35g',
    review: `La Shimano Vengeance CX 2.40m es una caña de spinning de gama media con excelente relación calidad-precio. El blank de carbono de respuesta rápida permite lanzar señuelos de 10 a 35 gramos con precisión y distancia. La acción progresiva ofrece sensibilidad en la punta para detectar picadas y potencia en el tramo medio para clavar con firmeza. Las guías Fuji de óxido de aluminio reducen la fricción y el desgaste de la línea. El portacarretes de rosca de aluminio garantiza un agarre firme del carrete sin holguras. Una caña muy equilibrada para pesca de depredadores en embalses y costa.`,
    technicalSpecs: {
      'Marca': 'Shimano',
      'Modelo': 'Vengeance CX',
      'Longitud': '2.40m',
      'Potencia': '10-35g',
      'Acción': 'Rápida progresiva',
      'Tramos': '2',
      'Material': 'Carbono',
      'Guías': 'Fuji (óxido aluminio)',
      'Portacarretes': 'Aluminio roscado',
      'Empuñadura': 'EVA',
      'Peso': '~195g',
      'Uso': 'Spinning depredadores, embalses, costa',
    }
  },
];

async function main() {
  const db = getDb();

  for (const item of batch) {
    // Find all deals matching this product pattern
    const deals = await db.execute({
      sql: `SELECT d.id, d.title, d.storeId, p.name as productName
        FROM deals d
        INNER JOIN products p ON d.productId = p.id
        WHERE p.name LIKE ? OR d.title LIKE ?
        GROUP BY d.id`,
      args: [`%${item.productNamePattern}%`, `%${item.productNamePattern}%`],
    });

    if (deals.rows.length === 0) {
      console.log(`❌ No matches: "${item.productNamePattern}"`);
      continue;
    }

    console.log(`\n📌 "${item.productNamePattern}" (${deals.rows.length} deals):`);

    for (const deal of deals.rows) {
      const dealId = deal.id as string;
      await db.execute({
        sql: `UPDATE deals SET review = ?, technicalSpecs = ? WHERE id = ?`,
        args: [item.review, JSON.stringify(item.technicalSpecs), dealId],
      });
    }

    // Update products table too
    const products = await db.execute({
      sql: `SELECT id, name FROM products WHERE name LIKE ?`,
      args: [`%${item.productNamePattern}%`],
    });

    if (products.rows.length > 0) {
      const productId = products.rows[0].id as string;
      await db.execute({
        sql: `UPDATE products SET review = ?, specs = ?, description = ? WHERE id = ?`,
        args: [item.review, JSON.stringify(item.technicalSpecs), item.review, productId],
      });
      console.log(`   ✅ Product + ${deals.rows.length} deal(s) updated`);
    }
  }

  console.log('\n✅ Batch 1 completa!');
}

main().catch(console.error);
