import { getDb } from '../src/lib/db';

const batch: { pattern: string; review: string; specs: Record<string, string> }[] = [
  {
    pattern: 'CAPERLAN RFT 500 5000',
    review: `El Caperlan RFT 500 5000 es un carrete de spinning de la marca Decathlon con freno trasero, diseñado para pescadores que buscan comodidad y rapidez en los ajustes de freno. El freno trasero permite regular la presión sin soltar la caña, ideal cuando se necesita reaccionar rápido ante una picada. El cuerpo de grafito es ligero y el tamaño 5000 ofrece buena capacidad para pesca en agua dulce y salada ligera. Los engranajes de metal proporcionan una transmisión aceptable para su precio. Un carrete funcional y fiable para el día a día.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'RFT 500 5000',
      'Tamaño': '5000', 'Tipo': 'Spinning (freno trasero)',
      'Material cuerpo': 'Grafito', 'Engranajes': 'Metal',
      'Rodamientos': '3+1', 'Capacidad (mono)': '~220m/0.35mm',
      'Freno': 'Trasero', 'Recogida por vuelta': '~80cm',
      'Peso': '~330g', 'Relación': '4.9:1',
      'Uso': 'Pesca agua dulce y salada ligera',
    }
  },
  {
    pattern: 'TRUSCEND Kit Señuelos Pesca 110 Piezas',
    review: `El Truscend Kit de Señuelos 110 Piezas es un pack completo ideal para pescadores que empiezan o para tener un surtido variado siempre disponible. Incluye crankbaits, vinilos, spinners, cucharillas, anzuelos, plomos y accesorios en una práctica caja organizadora. Los señuelos son de calidad aceptable para su precio, con colores y acabados que cumplen su función. La variedad permite probar diferentes técnicas sin invertir en señuelos individuales caros. Un pack muy recomendable para principiantes o como regalo.`,
    specs: {
      'Marca': 'Truscend', 'Modelo': 'Kit 110 piezas',
      'Contenido': 'Crankbaits, vinilos, spinners, cucharillas, anzuelos, plomos, accesorios',
      'Incluye': 'Caja organizadora de plástico',
      'Calidad anzuelos': 'Estándar', 'Uso': 'Agua dulce y salada',
      'Especies': 'Trucha, bass, lucioperca, lubina',
      'Ideal para': 'Principiantes, regalo, probar técnicas',
    }
  },
  {
    pattern: 'foolsGold Bolsa Aislante Grande',
    review: `La foolsGold Bolsa Aislante Grande es una bolsa isotérmica diseñada para transportar picadas y bebidas frías durante las jornadas de pesca. Con capacidad grande y color camuflaje, es perfecta para pasar el día en la playa, embalse o río sin preocuparse por la comida. El aislamiento térmico mantiene la comida y bebidas frías durante horas. El material exterior es resistente al agua y fácil de limpiar. Incluye asa de transporte y cremallera resistente. Un accesorio práctico que ningún pescador debería subestimar.`,
    specs: {
      'Marca': 'foolsGold', 'Modelo': 'Bolsa Aislante Grande',
      'Tipo': 'Bolsa isotérmica', 'Color': 'Camuflaje',
      'Material exterior': 'Poliéster resistente al agua',
      'Aislamiento': 'Espuma térmica', 'Cierre': 'Cremallera resistente',
      'Asa': 'De transporte', 'Uso': 'Transporte de comida y bebidas',
      'Ideal para': 'Jornadas de pesca, playa, embalse',
    }
  },
  {
    pattern: 'Xorus Patchinko 125 Nacre',
    review: `El Xorus Patchinko 125 Nacre es un señuelo de superficie tipo paseante (walk-the-dog) de la prestigiosa marca francesa Xorus, diseñado para la pesca de lubinas en superficie. Su forma alargada y perfil aerodinámico permite lances largos y precisos. Con 12.5cm, es ideal para buscar lubinas grandes en días de mar tranquila. El color Nacre (nácar) imita a los peces forage típicos del mediterráneo. Los anzuelos VMC de alta calidad vienen incluidos. Un señuelo top para los amantes de la pesca de superficie.`,
    specs: {
      'Marca': 'Xorus', 'Modelo': 'Patchinko 125', 'Tamaño': '12.5cm',
      'Tipo': 'Paseante (walk-the-dog)', 'Peso': '~22g',
      'Profundidad': 'Superficie', 'Color': 'Nacre (nácar)',
      'Anzuelos': 'VMC (incluidos)', 'Uso': 'Spinning lubina, superficie',
      'Técnica': 'Recogida con tirones laterales (walk-the-dog)',
    }
  },
  {
    pattern: 'CAPERLAN WXM 100 - Caña Spinning 2.10m 7-21g',
    review: `La Caperlan WXM 100 2.10m 7-21g es la versión de entrada de la serie WXM de Decathlon, ideal para pescadores que se inician en el spinning. Con 2.10m y potencia media, permite usar cucharillas de 7g a 21g con soltura. El blank de carbono ofrece una acción rápida básica pero funcional. Las guías de acero inoxidable cumplen su cometido. El portacarretes de aluminio roscado sujeta el carrete sin holguras. Una caña correcta para empezar sin arruinarse.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'WXM 100',
      'Longitud': '2.10m', 'Potencia': 'M (7-21g)', 'Acción': 'Rápida',
      'Tramos': '2', 'Material': 'Carbono',
      'Guías': 'Acero inoxidable', 'Portacarretes': 'Aluminio roscado',
      'Empuñadura': 'EVA', 'Peso': '~170g',
      'Uso': 'Spinning iniciación, ríos, embalses',
    }
  },
  {
    pattern: 'Sougayilang, Carrete de Pesca 13+1 rodamientos',
    review: `El Sougayilang Carrete de Pesca 13+1 rodamientos es un carrete spinning económico de la marca china, conocido por ofrecer muchas prestaciones a bajo precio. Los 13+1 rodamientos proporcionan una suavidad de rodaje sorprendente para su precio. El cuerpo de aluminio ligero y el carrete de repuesto de grafito incluido añaden valor. La relación de transmisión alta (6.2:1) permite recuperar línea rápidamente. Incluye bobina de aluminio CNC. Un carrete correcto para principiantes o como respaldo, aunque la durabilidad a largo plazo es limitada comparada con marcas establecidas.`,
    specs: {
      'Marca': 'Sougayilang', 'Tamaño': 'Varios (consultar)',
      'Tipo': 'Spinning', 'Material cuerpo': 'Aluminio',
      'Rodamientos': '13+1', 'Relación': '6.2:1',
      'Freno': 'Delantero', 'Incluye': 'Carrete de repuesto de grafito',
      'Bobina': 'Aluminio CNC', 'Uso': 'Agua dulce y salada ligera',
      'Ideal para': 'Principiantes, pesca recreativa',
    }
  },
  {
    pattern: 'CAPERLAN WXM 100 - Caña Spinning 1.80m ML 5-14g',
    review: `La Caperlan WXM 100 1.80m ML 5-14g es la versión ultraligera de la serie WXM de Decathlon, diseñada para pesca fina con señuelos ligeros. Su longitud corta (1.80m) la hace muy maniobrable en espacios reducidos como ríos pequeños o pesca desde kayak. La potencia ML (Medium-Light) y el rango 5-14g la hacen ideal para trucha, black bass pequeño y percasol con cucharillas ligeras, spinners y vinilos pequeños. Una caña divertida y económica para los amantes de la pesca ligera.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'WXM 100',
      'Longitud': '1.80m', 'Potencia': 'ML (5-14g)', 'Acción': 'Rápida',
      'Tramos': '2', 'Material': 'Carbono',
      'Guías': 'Acero inoxidable', 'Portacarretes': 'Aluminio roscado',
      'Empuñadura': 'EVA', 'Peso': '~140g',
      'Uso': 'Spinning ligero, trucha, ríos pequeños',
    }
  },
  {
    pattern: 'Shimano FX XT - Caña Spinning 2.10m 10-30g',
    review: `La Shimano FX XT 2.10m 10-30g es la caña de spinning de entrada de Shimano, perfecta para dar los primeros pasos con una marca de garantía. El blank de carbono de acción rápida ofrece un rendimiento básico pero fiable. La potencia 10-30g permite usar una amplia variedad de señuelos. Las guías de acero inoxidable con insertos de cerámica son correctas para su precio. El portacarretes de aluminio sujeta firmemente el carrete. Por el precio, ofrece la fiabilidad y servicio postventa de Shimano, algo que otras marcas económicas no pueden igualar.`,
    specs: {
      'Marca': 'Shimano', 'Modelo': 'FX XT', 'Longitud': '2.10m',
      'Potencia': '10-30g', 'Acción': 'Rápida', 'Tramos': '2',
      'Material': 'Carbono', 'Guías': 'Acero inoxidable + cerámica',
      'Portacarretes': 'Aluminio', 'Empuñadura': 'EVA', 'Peso': '~165g',
      'Uso': 'Spinning iniciación, agua dulce',
    }
  },
  {
    pattern: 'TRUSCEND señuelos de Pesca para Agua Dulce y Salada, Lifelike Swimbait',
    review: `Los Truscend Lifelike Swimbait son señuelos de vinilo realistas diseñados para imitar peces forage con un acabado muy detallado. Su cuerpo de vinilo blando con cola tipo paddle genera vibraciones y movimiento natural en el agua. El lastre interno permite lances largos y una caída lenta y controlada. Son señuelos muy versátiles: se pueden pescar a recogida lineal, con pausas o al fondo. Ideales para trucha, bass, lucioperca y lubina. Vienen en varios colores y tamaños en el pack.`,
    specs: {
      'Marca': 'Truscend', 'Modelo': 'Lifelike Swimbait',
      'Tipo': 'Vinilo (swimbait)', 'Material': 'Vinilo blando',
      'Cola': 'Paddle (genera vibraciones)', 'Lastre': 'Interno',
      'Anzuelos': 'BKK (incluidos)', 'Uso': 'Agua dulce y salada',
      'Técnicas': 'Recogida lineal, pausas, fondo',
      'Especies': 'Trucha, bass, lucioperca, lubina',
    }
  },
  {
    pattern: 'TRUSCEND Señuelos Popobait con Anzuelos BKK',
    review: `Los Truscend Popobait son señuelos de superficie tipo popper con anzuelos BKK de alta calidad. La boca cóncava genera salpicaduras y sonidos que imitan a un pez herido en superficie, atrayendo a los depredadores desde lejos. Incorporan un sistema de sonido interno (cámaras con bolas) que añade vibraciones adicionales. Son muy efectivos para lubina, lucio y black bass en días de actividad en superficie. Los anzuelos BKK son un plus importante, ya que son de los mejores del mercado.`,
    specs: {
      'Marca': 'Truscend', 'Modelo': 'Popobait',
      'Tipo': 'Popper (superficie)', 'Material': 'Plástico duro',
      'Sistema sonido': 'Cámaras con bolas', 'Anzuelos': 'BKK (alta calidad)',
      'Profundidad': 'Superficie', 'Uso': 'Agua dulce y salada',
      'Técnica': 'Recogida con tirones (popping)',
      'Especies': 'Lubina, lucio, black bass',
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
    console.log(`✅ "${item.pattern.replace(/\n/g, ' ')}" — ${deals.rows.length} deal(s)`);
  }

  console.log(`\n✅ Batch 4 completa! ${batch.length} productos, ${totalDeals} deals.`);
}

main().catch(console.error);
