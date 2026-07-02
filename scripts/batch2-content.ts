import { getDb } from '../src/lib/db';

const batch: { pattern: string; review: string; specs: Record<string, string> }[] = [
  {
    pattern: 'CAPERLAN Ilicium 500',
    review: `La Caperlan Ilicium 500 es una caña de spinning de la marca blanca de Decathlon, diseñada para pesca de depredadores en agua dulce y salada ligera. Con 2.70m de longitud y potencia 10-35g, es ideal para pescar en embalses, ríos grandes y costa desde espigones. El blank de carbono ofrece una acción rápida con buena sensibilidad en la punta para detectar picadas sutiles. Las guías de acero inoxidable con insertos de cerámica reducen la fricción. El portacarretes de aluminio roscado sujeta el carrete firmemente. Relación calidad-precio muy ajustada para una caña de este segmento, especialmente si eres pescador ocasional o estás empezando.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)',
      'Modelo': 'Ilicium 500',
      'Longitud': '2.70m',
      'Potencia': '10-35g',
      'Acción': 'Rápida',
      'Tramos': '2',
      'Material': 'Carbono',
      'Guías': 'Acero inoxidable + cerámica',
      'Portacarretes': 'Aluminio roscado',
      'Empuñadura': 'EVA',
      'Peso': '~210g',
      'Uso': 'Spinning depredadores, embalses, costa',
    }
  },
  {
    pattern: 'MITCHELL Avocet Bronze 6000',
    review: `El Mitchell Avocet Bronze 6000 es un carrete de carpfishing de gama básica, ideal para pescadores que se inician en la carpfishing o que buscan un equipo de respaldo fiable. Cuenta con un cuerpo de grafito ligero y resistente, y un sistema de freno delantero suave y progresivo. El tamaño 6000 ofrece buena capacidad de línea para lances largos con boilies y pellets. El sistema de pickup automático facilita el montaje. No esperes la suavidad de un carrete premium, pero por su precio cumple sobradamente.`,
    specs: {
      'Marca': 'Mitchell',
      'Modelo': 'Avocet Bronze 6000',
      'Tamaño': '6000',
      'Tipo': 'Spinning / Carpfishing',
      'Material cuerpo': 'Grafito',
      'Rodamientos': '3+1',
      'Capacidad (mono)': '~250m/0.35mm',
      'Freno': 'Delantero (suave y progresivo)',
      'Recogida por vuelta': '~85cm',
      'Peso': '~350g',
      'Relación': '5.1:1',
      'Uso': 'Carpfishing, pesca en fondo',
    }
  },
  {
    pattern: 'DAIWA Joinus 5000',
    review: `El Daiwa Joinus 5000 es un carrete de pesca marina de gama básica, perfecto para iniciarse en la pesca en mar sin invertir mucho. Su cuerpo de grafito mantiene el peso contenido (~340g) para un tamaño 5000. El sistema de freno trasero permite ajustar la presión rápidamente durante la pelea. Los engranajes de metal proporcionan durabilidad básica para uso en agua salada, aunque requiere enjuague tras cada salida. Es la opción económica de Daiwa para pesca en costa, espigones y embarcación ligera.`,
    specs: {
      'Marca': 'Daiwa',
      'Modelo': 'Joinus 5000',
      'Tamaño': '5000',
      'Tipo': 'Spinning',
      'Material cuerpo': 'Grafito',
      'Engranajes': 'Metal',
      'Rodamientos': '3+1',
      'Capacidad (mono)': '~220m/0.35mm',
      'Freno': 'Trasero',
      'Recogida por vuelta': '~80cm',
      'Peso': '~340g',
      'Relación': '4.9:1',
      'Uso': 'Pesca marina básica, costa, espigones',
    }
  },
  {
    pattern: 'OKUMA Altera Spin 8\'0" 240cm 7-28g',
    review: `La Okuma Altera Spin 8'0" 240cm 7-28g es la versión comercializada en Decathlon de la popular caña Okuma Altera Spin. Con 2.40m y potencia 7-28g, es una caña polivalente perfecta para spinning en embalses y costa ligera. El blank de carbono ofrece una acción rápida y sensible, permitiendo trabajar señuelos desde cucharillas de 7g hasta jerkbaits de 28g. Las guías de acero inoxidable con insertos de óxido de aluminio reducen la fricción. Una caña muy equilibrada para el pescador que busca una sola caña para多种 técnicas.`,
    specs: {
      'Marca': 'Okuma',
      'Modelo': 'Altera Spin 8\'',
      'Longitud': '2.40m (8\')',
      'Potencia': '7-28g',
      'Acción': 'Rápida',
      'Tramos': '2',
      'Material': 'Carbono',
      'Guías': 'Acero inoxidable + óxido aluminio',
      'Portacarretes': 'Aluminio roscado',
      'Empuñadura': 'EVA con pintado de hilo',
      'Peso': '~185g',
      'Uso': 'Spinning embalses, costa ligera',
    }
  },
  {
    pattern: 'SHIMANO Sienna FG 4000',
    review: `El Shimano Sienna FG 4000 es un carrete de spinning de gama básica de Shimano, ideal para pescadores principiantes o como equipo de respaldo. A pesar de su precio económico, incorpora el sistema de freno delantero de Shimano (smooth drag) que ofrece una presión constante y suave. El cuerpo de XT-7 (polímero de alta resistencia) es ligero pero resistente a golpes y corrosión. Los engranajes de metal proporcionan una transmisión decente para su precio. Es el carrete de entrada perfecto al mundo Shimano.`,
    specs: {
      'Marca': 'Shimano',
      'Modelo': 'Sienna FG 4000',
      'Tamaño': '4000',
      'Tipo': 'Spinning',
      'Material cuerpo': 'XT-7 (polímero)',
      'Engranajes': 'Metal',
      'Rodamientos': '3+1',
      'Capacidad (mono)': '~200m/0.30mm',
      'Freno': 'Delantero (Shimano drag)',
      'Recogida por vuelta': '~78cm',
      'Peso': '~285g',
      'Relación': '5.0:1',
      'Uso': 'Spinning principiantes, agua dulce',
    }
  },
  {
    pattern: 'DAIWA Crossfire 26 LT 2500 XH',
    review: `El Daiwa Crossfire 26 LT 2500 XH es un carrete de spinning de gama básica de Daiwa, ideal para iniciarse en el spinning ligero. Incorpora el cuerpo Zaion (polímero de carbono) típico de los LT de Daiwa, lo que lo hace sorprendentemente ligero (~235g) para su precio. Los engranajes Digigear de metal proporcionan una transmisión suave. La recogida XH (extra high) permite recuperar línea rápidamente, ideal para trabajar señuelos de superficie. Un carrete muy recomendable para empezar sin gastar mucho.`,
    specs: {
      'Marca': 'Daiwa',
      'Modelo': 'Crossfire 26 LT 2500 XH',
      'Tamaño': '2500 XH',
      'Tipo': 'Spinning',
      'Material cuerpo': 'Zaion (polímero carbono)',
      'Engranajes': 'Digigear (metal)',
      'Rodamientos': '3+1',
      'Capacidad (mono)': '~180m/0.25mm',
      'Freno': 'Delantero',
      'Recogida por vuelta': '~88cm',
      'Peso': '~235g',
      'Relación': '5.6:1',
      'Uso': 'Spinning ligero, ríos, embalses',
    }
  },
  {
    pattern: 'Mitchell Mx1 - Carrete Spinning 4000',
    review: `El Mitchell Mx1 es un carrete de spinning de gama media-baja con una excelente relación calidad-precio. Su cuerpo de grafito ligero y los engranajes de acero inoxidable ofrecen una transmisión suave y duradera. El sistema de freno delantero proporcionado por Mitchell es conocido por su progresividad, permitiendo ajustes finos durante la pelea. El tamaño 4000 es el más versátil de la gama, válido tanto para spinning en agua dulce como para pesca en costa ligera. Un carrete fiable para el día a día.`,
    specs: {
      'Marca': 'Mitchell',
      'Modelo': 'Mx1 4000',
      'Tamaño': '4000',
      'Tipo': 'Spinning',
      'Material cuerpo': 'Grafito',
      'Engranajes': 'Acero inoxidable',
      'Rodamientos': '5+1',
      'Capacidad (mono)': '~200m/0.30mm',
      'Freno': 'Delantero',
      'Recogida por vuelta': '~80cm',
      'Peso': '~290g',
      'Relación': '5.2:1',
      'Uso': 'Spinning agua dulce y salada ligera',
    }
  },
  {
    pattern: 'OKUMA Altera Spin 6\' 180cm 5-20g',
    review: `La Okuma Altera Spin 6' 180cm 5-20g es la versión corta de la popular serie Altera Spin de Okuma, diseñada para pesca en espacios reducidos como ríos pequeños, arroyos o pesca desde kayak. Con solo 1.80m, es extremadamente maniobrable y permite lances precisos en zonas con vegetación. La potencia 5-20g la hace ideal para trucha, black bass y lucioperca con señuelos ligeros (cucharillas pequeñas, vinilos, spinners). El blank de carbono ofrece buena sensibilidad para detectar picadas. Perfecta como segunda caña para viajes o para pescadores que priorizan la comodidad.`,
    specs: {
      'Marca': 'Okuma',
      'Modelo': 'Altera Spin 6\'',
      'Longitud': '1.80m (6\')',
      'Potencia': '5-20g',
      'Acción': 'Rápida',
      'Tramos': '2',
      'Material': 'Carbono',
      'Guías': 'Acero inoxidable + óxido aluminio',
      'Portacarretes': 'Aluminio roscado',
      'Empuñadura': 'EVA',
      'Peso': '~140g',
      'Uso': 'Spinning ríos, kayak, espacios reducidos',
    }
  },
  {
    pattern: 'CAPERLAN WXM 500 - Caña Spinning 2.40m MH 10-30g',
    review: `La Caperlan WXM 500 2.40m MH 10-30g es una caña de spinning de la línea media de Decathlon, diseñada para pesca de depredadores con señuelos medianos. La potencia MH (Medium-Heavy) permite lanzar jerkbaits, poppers y vinilos grandes de hasta 30g con control. El blank de carbono de acción rápida ofrece buen equilibrio entre sensibilidad y potencia. Las guías de acero inoxidable con insertos de cerámica están bien distribuidas para una acción de blank uniforme. Una caña fiable para el pescador que busca una herramienta polivalente sin complicaciones.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)',
      'Modelo': 'WXM 500',
      'Longitud': '2.40m',
      'Potencia': 'MH (10-30g)',
      'Acción': 'Rápida',
      'Tramos': '2',
      'Material': 'Carbono',
      'Guías': 'Acero inoxidable + cerámica',
      'Portacarretes': 'Aluminio roscado',
      'Empuñadura': 'EVA',
      'Peso': '~200g',
      'Uso': 'Spinning depredadores, embalses, costa',
    }
  },
  {
    pattern: 'CAPERLAN WXM 500 - Caña Spinning 2.10m MH 10-30g',
    review: `La Caperlan WXM 500 2.10m MH 10-30g es la versión compacta de la WXM 500 de Decathlon, ideal para pesca en espacios reducidos o para pescadores que prefieren cañas más cortas y manejables. Con 2.10m y potencia MH, permite trabajar señuelos de 10 a 30 gramos con control y precisión. El blank de carbono ofrece una acción rápida con buena respuesta. Es perfecta para pesca desde kayak, embarcación neumática o en ríos con vegetación en las orillas. Más maniobrable que la versión de 2.40m, sacrificando algo de distancia de lance.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)',
      'Modelo': 'WXM 500',
      'Longitud': '2.10m',
      'Potencia': 'MH (10-30g)',
      'Acción': 'Rápida',
      'Tramos': '2',
      'Material': 'Carbono',
      'Guías': 'Acero inoxidable + cerámica',
      'Portacarretes': 'Aluminio roscado',
      'Empuñadura': 'EVA',
      'Peso': '~180g',
      'Uso': 'Spinning kayak, embarcación, ríos',
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

    // Update products table too
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

  console.log(`\n✅ Batch 2 completa! ${batch.length} productos, ${totalDeals} deals.`);
}

main().catch(console.error);
