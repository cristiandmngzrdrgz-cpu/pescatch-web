import { getDb } from '../src/lib/db';

const batch: { pattern: string; review: string; specs: Record<string, string> }[] = [
  {
    pattern: 'CAPERLAN WXM 500 - Caña Spinning 2.20m M 7-21g',
    review: `La Caperlan WXM 500 2.20m M 7-21g es la versión de potencia media de la serie WXM de Decathlon, diseñada para spinning versátil con señuelos ligeros y medianos. Con 2.20m y acción M (Medium), es ideal para cucharillas, vinilos medianos y pequeños jerkbaits. El blank de carbono ofrece una acción rápida con buena sensibilidad en la punta. Es perfecta para pesca en ríos y embalses donde se necesita precisión sin renunciar a distancia de lance. Una caña equilibrada para el pescador que busca la combinación ideal entre ligereza y potencia.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'WXM 500', 'Longitud': '2.20m',
      'Potencia': 'M (7-21g)', 'Acción': 'Rápida', 'Tramos': '2',
      'Material': 'Carbono', 'Guías': 'Acero inoxidable + cerámica',
      'Portacarretes': 'Aluminio roscado', 'Empuñadura': 'EVA', 'Peso': '~190g',
      'Uso': 'Spinning versátil, ríos, embalses',
    }
  },
  {
    pattern: 'MITCHELL Premium Pro 6000',
    review: `El Mitchell Premium Pro 6000 Black Gold es un carrete de gama media con un acabado negro y dorado muy llamativo. Está diseñado para pesca exigente en agua dulce y salada ligera. Los engranajes de acero inoxidable de alta resistencia proporcionan una transmisión suave y duradera. El freno delantero multidiscos ofrece una progresividad excelente para domar capturas grandes. El cuerpo de grafito mantiene el peso contenido. Una opción interesante para pescadores que buscan un carrete fiable con estilo.`,
    specs: {
      'Marca': 'Mitchell', 'Modelo': 'Premium Pro 6000', 'Tamaño': '6000',
      'Tipo': 'Spinning', 'Material cuerpo': 'Grafito',
      'Engranajes': 'Acero inoxidable', 'Rodamientos': '5+1',
      'Capacidad (mono)': '~250m/0.35mm', 'Freno': 'Delantero multidiscos',
      'Recogida por vuelta': '~85cm', 'Peso': '~360g', 'Relación': '5.1:1',
      'Uso': 'Pesca agua dulce y salada ligera',
    }
  },
  {
    pattern: 'Daiwa Sweepfire Spin',
    review: `La Daiwa Sweepfire Spin 2.10m 10-30g es una caña de spinning de gama básica de Daiwa, perfecta para iniciarse en la pesca a spinning. El blank de carbono ofrece una acción rápida y respuesta aceptable para su precio. La potencia 10-30g permite usar una gran variedad de señuelos: cucharillas, vinilos, jerkbaits pequeños y spinners. Las guías de acero inoxidable cumplen su función sin problemas. El portacarretes de aluminio sujeta firmemente el carrete. Una caña correcta para empezar sin gastar mucho.`,
    specs: {
      'Marca': 'Daiwa', 'Modelo': 'Sweepfire Spin', 'Longitud': '2.10m',
      'Potencia': '10-30g', 'Acción': 'Rápida', 'Tramos': '2',
      'Material': 'Carbono', 'Guías': 'Acero inoxidable',
      'Portacarretes': 'Aluminio', 'Empuñadura': 'EVA', 'Peso': '~175g',
      'Uso': 'Spinning básico, ríos, embalses',
    }
  },
  {
    pattern: 'Abu Garcia Tormentor2',
    review: `La Abu Garcia Tormentor2 2.40m 10-30g es una caña de spinning de la reconocida marca sueca, diseñada para pesca de depredadores como lucioperca, black bass y lubina. El blank de carbono de acción rápida ofrece buena sensibilidad para detectar picadas y potencia para clavar con firmeza. Las guías de acero inoxidable con insertos de óxido de aluminio reducen la fricción. El portacarretes de aluminio roscado asegura un montaje firme. Abu Garcia es sinónimo de calidad, y esta caña mantiene el estándar de la marca a un precio contenido.`,
    specs: {
      'Marca': 'Abu Garcia', 'Modelo': 'Tormentor2', 'Longitud': '2.40m',
      'Potencia': '10-30g', 'Acción': 'Rápida', 'Tramos': '2',
      'Material': 'Carbono', 'Guías': 'Acero inoxidable + óxido aluminio',
      'Portacarretes': 'Aluminio roscado', 'Empuñadura': 'EVA', 'Peso': '~195g',
      'Uso': 'Spinning depredadores, embalses, costa',
    }
  },
  {
    pattern: 'CAPERLAN MTX8 Multicolor - Trenza 8 Tramos 300m',
    review: `La Caperlan MTX8 Multicolor es una trenza de 8 hebras de la marca Decathlon, diseñada para pesca de precisión donde se necesita máxima sensibilidad. Las 8 hebras ofrecen una superficie más redonda y lisa que las trenzas de 4 hebras, reduciendo el ruido al pasar por las guías y mejorando la distancia de lance. El perfil redondo también evita que se entierre en el carrete. Los cambios de color cada metro facilitan el control de la distancia de lance y la detección de picadas. Una trenza muy equilibrada para su precio.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'MTX8 Multicolor',
      'Hebras': '8', 'Longitud': '300m', 'Diámetro': 'Disponible 0.10-0.30mm',
      'Material': 'Polietileno de alta densidad (HDPE)', 'Color': 'Multicolor (cambios c/1m)',
      'Perfil': 'Redondo (8 hebras)', 'Resistencia': 'Alta (nudo ~85%)',
      'Uso': 'Spinning, baitcasting, surfcasting',
    }
  },
  {
    pattern: 'Abu Garcia Cardinal X',
    review: `El Abu Garcia Cardinal X 2500 es un carrete de spinning de gama media de Abu Garcia, conocido por su fiabilidad y suavidad. Incorpora el sistema de freno delantero de Abu con discos de fibra de carbono que ofrecen una presión constante y progresiva. El cuerpo de grafito es ligero pero resistente. Los engranajes de acero inoxidable proporcionan una transmisión duradera. El tamaño 2500 es perfecto para spinning ligero con líneas de 0.20-0.28mm. Un carrete muy correcto para el pescador que busca calidad sueca sin pagar precios premium.`,
    specs: {
      'Marca': 'Abu Garcia', 'Modelo': 'Cardinal X 2500', 'Tamaño': '2500',
      'Tipo': 'Spinning', 'Material cuerpo': 'Grafito',
      'Engranajes': 'Acero inoxidable', 'Rodamientos': '5+1',
      'Capacidad (mono)': '~180m/0.25mm', 'Freno': 'Delantero (carbono)',
      'Recogida por vuelta': '~75cm', 'Peso': '~255g', 'Relación': '5.2:1',
      'Uso': 'Spinning ligero, ríos, embalses',
    }
  },
  {
    pattern: 'RAGOT Raglou 5,5cm',
    review: `El Ragot Raglou 5,5cm es un señuelo de superficie tipo popper diseñado para la pesca de lubinas, sargos y otros depredadores marinos. Su forma cóncava en la boca genera un sonido característico de gorgoteo y salpicaduras que atrae a los depredadores desde lejos. Los colores realistas y el acabado de alta calidad son señas de identidad de Ragot, marca francesa especializada en señuelos. Equipado con anzuelos VMC de alta calidad. Ideal para pescar en superficie en días de calma.`,
    specs: {
      'Marca': 'Ragot', 'Modelo': 'Raglou', 'Tamaño': '5.5cm',
      'Tipo': 'Popper (superficie)', 'Peso': '~7g', 'Profundidad': 'Superficie (0-30cm)',
      'Anzuelos': 'VMC (incluidos)', 'Uso': 'Spinning mar, lubina, sargo',
      'Técnica': 'Recogida con tirones (popping)',
    }
  },
  {
    pattern: 'WILLIAMSON Excited Bird 13cm',
    review: `El Williamson Excited Bird 13cm es un excitador de curricán diseñado para crear una cortina de burbujas y ruido que atrae a los depredadores hacia los señuelos principales. Su diseño con hélice delantera y trasera genera turbulencias y vibraciones que imitan a un banco de peces en superficie. Es ideal para usar en tándem con señuelos de curricán como rapalas o con cebos naturales. Muy efectivo para atún, bonito, lubina y dorada. Un imprescindible en la caja de cualquier pescador de curricán.`,
    specs: {
      'Marca': 'Williamson', 'Modelo': 'Excited Bird', 'Tamaño': '13cm',
      'Tipo': 'Excitador curricán', 'Peso': '~25g', 'Profundidad': 'Superficie',
      'Hélices': 'Delantera + trasera', 'Uso': 'Curricán mar, atún, bonito, lubina',
      'Técnica': 'Curricán con tándem de señuelos',
    }
  },
  {
    pattern: 'YO-ZURI Crystal Deep Diver 110',
    review: `El Yo-Zuri Crystal Deep Diver 110 es un señuelo de profundidad media de la prestigiosa marca japonesa Yo-Zuri, conocido por su acción de nado realista y su acabado crystal reflectante. Diseñado para alcanzar profundidades de 3-5 metros, es ideal para explorar capas de agua donde se esconden los grandes depredadores. El sistema de labio largo y cuerpo aerodinámico permite lances largos y precisos. Los anzuelos incluidos son de alta calidad. Un señuelo muy efectivo para lucios, black bass y luciopercas en embalses.`,
    specs: {
      'Marca': 'Yo-Zuri', 'Modelo': 'Crystal Deep Diver 110', 'Tamaño': '110mm',
      'Tipo': 'Crankbait (profundidad media)', 'Peso': '~14g',
      'Profundidad': '3-5m', 'Acción': 'Nado tipo wobbling',
      'Anzuelos': 'Incluidos (alta calidad)', 'Uso': 'Spinning embalses, lucio, bass, lucioperca',
      'Técnica': 'Recogida lineal con pausas',
    }
  },
  {
    pattern: 'Abu Garcia Devil 562UL',
    review: `La Abu Garcia Devil 562UL es una caña de spinning ultraligera de la marca sueca, diseñada para pesca fina con señuelos muy ligeros. Con 1.98m (6'6") y acción UL (Ultra Light), es perfecta para trucha, black bass pequeño y percasol con cucharillas de 2-8g, vinilos pequeños y spinners diminutos. La acción de punta extra sensible permite detectar las picadas más sutiles. Ideal para pesca en ríos pequeños, arroyos de montaña y embalses de agua fría. Una caña muy divertida para los amantes de la pesca ligera.`,
    specs: {
      'Marca': 'Abu Garcia', 'Modelo': 'Devil 562UL', 'Longitud': '1.98m (6\'6")',
      'Potencia': 'UL (Ultra Light)', 'Acción': 'Rápida/sensible', 'Tramos': '2',
      'Material': 'Carbono', 'Guías': 'Acero inoxidable',
      'Portacarretes': 'Aluminio', 'Empuñadura': 'EVA', 'Peso': '~120g',
      'Uso': 'Ultraligero, trucha, ríos pequeños',
    }
  },
];

async function main() {
  const db = getDb();
  let totalDeals = 0;

  for (const item of batch) {
    const deals = await db.execute({
      sql: `SELECT d.id FROM deals d WHERE d.title LIKE ?`,
      args: [`%${item.pattern}%`],
    });

    if (deals.rows.length === 0) {
      console.log(`❌ No matches: "${item.pattern}"`);
      continue;
    }

    for (const deal of deals.rows) {
      await db.execute({
        sql: `UPDATE deals SET review = ?, technicalSpecs = ? WHERE id = ?`,
        args: [item.review, JSON.stringify(item.specs), deal.id],
      });
    }

    const products = await db.execute({
      sql: `SELECT id FROM products WHERE name LIKE ?`,
      args: [`%${item.pattern}%`],
    });

    if (products.rows.length > 0) {
      const pid = products.rows[0].id as string;
      await db.execute({
        sql: `UPDATE products SET review = ?, specs = ?, description = ? WHERE id = ?`,
        args: [item.review, JSON.stringify(item.specs), item.review, pid],
      });
    }

    totalDeals += deals.rows.length;
    console.log(`✅ "${item.pattern}" — ${deals.rows.length} deal(s)`);
  }

  console.log(`\n✅ Batch 3 completa! ${batch.length} productos, ${totalDeals} deals.`);
}

main().catch(console.error);
