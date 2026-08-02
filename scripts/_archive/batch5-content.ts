import { getDb } from '../src/lib/db';

const batch: { pattern: string; review: string; specs: Record<string, string> }[] = [
  {
    pattern: 'Berkley Gulp! - Gusano de Arena',
    review: `Los Berkley Gulp! Gusano de Arena son vinilos biodegradables con atrayente natural, diseñados para la pesca en agua salada. A diferencia de los vinilos tradicionales, los Gulp! liberan feromonas y aminoácidos que estimulan el olfato y gusto de los peces, provocando que sujeten el señuelo más tiempo. El material biodegradable es una ventaja ecológica. Vienen en un bote hermético que mantiene el aroma. Son extremadamente efectivos para lubina, sargo, dorada y demás especies marinas. Imprescindibles en la caja de cualquier pescador de mar.`,
    specs: {
      'Marca': 'Berkley', 'Modelo': 'Gulp! Gusano de Arena',
      'Tipo': 'Vinilo biodegradable con atrayente',
      'Material': 'Polímero biodegradable + atrayente natural',
      'Medida': 'Varios tamaños', 'Color': 'Camuflaje natural',
      'Uso': 'Agua salada', 'Especies': 'Lubina, sargo, dorada',
      'Ventaja': 'Atrayente olfativo que provoca retención',
    }
  },
  {
    pattern: 'Berkley Sick Braid - Línea Trenzada 300m',
    review: `La Berkley Sick Braid es una trenza de 4 hebras de alta calidad de la marca Berkley, conocida por su excelente relación resistencia-diámetro. El perfil redondo y liso reduce el ruido al pasar por las guías y mejora la distancia de lance. Está fabricada en polietileno de alta densidad con un recubrimiento que la protege contra la abrasión y los rayos UV. La resistencia al nudo es superior a la media de las trenzas de su categoría. Una trenza fiable para spinning y baitcasting, tanto en agua dulce como salada.`,
    specs: {
      'Marca': 'Berkley', 'Modelo': 'Sick Braid', 'Hebras': '4',
      'Longitud': '300m', 'Diámetro': 'Varios (0.10-0.30mm)',
      'Material': 'Polietileno alta densidad (HDPE)',
      'Recubrimiento': 'Protección UV y abrasión',
      'Perfil': 'Redondo y liso', 'Resistencia nudo': 'Alta (~85%)',
      'Uso': 'Spinning, baitcasting, agua dulce y salada',
    }
  },
  {
    pattern: 'Botas de caucho Dee Calf',
    review: `Las botas de caucho Dee Calf son botas de agua de caña media, ideales para pesca en orillas fangosas, charcos, ríos y días de lluvia. El caucho natural es impermeable y flexible, ofreciendo comodidad durante largas jornadas. La suela antideslizante proporciona tracción en superficies mojadas y resbaladizas. Son ligeras para ser botas de agua y están disponibles en tallas 37-47. Un básico que ningún pescador debería faltar en su equipo, especialmente en invierno o para pesca en río.`,
    specs: {
      'Marca': 'Dee Calf', 'Tipo': 'Botas de agua caña media',
      'Material': 'Caucho natural', 'Suela': 'Antideslizante',
      'Tallas': '37-47 (hombre y mujer)',
      'Impermeable': 'Sí', 'Uso': 'Pesca orilla, lluvia, ríos',
      'Características': 'Ligeras, cómodas, flexibles',
    }
  },
  {
    pattern: 'CAPERLAN Fluorocarbono Soft - Sedal Pesca 100% 50m',
    review: `El Caperlan Fluorocarbono Soft es un sedal de fluorocarbono 100% de Decathlon, diseñado para bajos de línea y leader. El fluorocarbono es prácticamente invisible bajo el agua, lo que lo hace ideal para pescar especies recelosas como lubina, sargo o trucha en aguas claras. Su densidad hace que se hunda rápidamente, perfecto para presentar señuelos a profundidad. La resistencia a la abrasión es superior al nylon. Los 50m son suficientes para múltiples montajes.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Tipo': 'Fluorocarbono 100%',
      'Longitud': '50m', 'Diámetro': 'Varios (0.20-0.50mm)',
      'Visibilidad': 'Bajo el agua (casi invisible)',
      'Densidad': 'Alta (se hunde rápido)',
      'Resistencia': 'Alta abrasión', 'Uso': 'Bajos de línea, leader',
    }
  },
  {
    pattern: 'CAPERLAN Kit Caja Señuelos Vinilo BSF M SW',
    review: `El Caperlan Kit Caja Señuelos Vinilo BSF M SW es un pack de señuelos de vinilo para pesca en mar de Decathlon, presentado en una práctica caja organizadora. Incluye una selección de vinilos tipo gusano, camarón y pez en varios colores, ideales para lubina, sargo y dorada. Los vinilos son de calidad aceptable para su precio. La caja permite mantenerlos organizados y protegidos. Un kit práctico para empezar en la pesca a vinilo en mar sin tener que comprar varios paquetes sueltos.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'BSF M SW',
      'Tipo': 'Kit vinilos mar', 'Contenido': 'Gusano, camarón, pez (varios colores)',
      'Incluye': 'Caja organizadora', 'Uso': 'Agua salada',
      'Especies': 'Lubina, sargo, dorada',
      'Ideal para': 'Iniciación al vinilo en mar',
    }
  },
  {
    pattern: 'CAPERLAN Kit Cucharillas Giratorias Wero - Pack 5 uds',
    review: `El Caperlan Kit Cucharillas Giratorias Wero es un pack de 5 cucharillas de tipo spinner de Decathlon, diseñadas para la pesca de trucha y black bass. Cada cucharilla tiene un color y tamaño ligeramente diferente para adaptarse a distintas condiciones de luz y agua. La pala giratoria genera vibraciones y destellos que atraen a los depredadores. Vienen equipadas con anzuelo simple y pluma natural. Un pack económico para tener un surtido básico de spinners.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'Wero Pack 5 uds',
      'Tipo': 'Cucharilla giratoria (spinner)',
      'Colores': 'Variados (5 unidades)', 'Anzuelo': 'Simple con pluma',
      'Uso': 'Agua dulce', 'Especies': 'Trucha, black bass',
      'Ideal para': 'Iniciación, tener surtido básico',
    }
  },
  {
    pattern: 'CAPERLAN MTX4 Multicolor - Trenza 4 Heb 300m',
    review: `La Caperlan MTX4 Multicolor es una trenza de 4 hebras de Decathlon, diseñada para spinning y baitcasting donde se necesita sensibilidad y distancia de lance. Las 4 hebras ofrecen un buen equilibrio entre resistencia y suavidad. El color multicolor con cambios cada metro permite controlar la distancia de lance y detectar picadas con precisión. El perfil redondo reduce el ruido en las guías. Una trenza correcta para el día a día a un precio ajustado.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'MTX4 Multicolor',
      'Hebras': '4', 'Longitud': '300m',
      'Diámetro': 'Varios (0.10-0.30mm)',
      'Material': 'Polietileno alta densidad (HDPE)',
      'Color': 'Multicolor (cambios c/1m)',
      'Perfil': 'Redondo', 'Uso': 'Spinning, baitcasting',
    }
  },
  {
    pattern: 'CAPERLAN R100 3000',
    review: `El Caperlan R100 3000 es un carrete básico de Decathlon diseñado para pesca de depredadores en agua dulce. Con tamaño 3000, es perfecto para spinning ligero con líneas de 0.20-0.28mm. El freno delantero ofrece un ajuste básico pero funcional. El cuerpo de grafito mantiene el peso contenido. Los engranajes de acero proporcionan una transmisión aceptable para su precio. Un carrete económico para iniciarse o como equipo de respaldo.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'R100 3000',
      'Tamaño': '3000', 'Tipo': 'Spinning',
      'Material cuerpo': 'Grafito', 'Engranajes': 'Acero',
      'Rodamientos': '3+1', 'Freno': 'Delantero',
      'Capacidad (mono)': '~180m/0.25mm', 'Peso': '~280g',
      'Uso': 'Spinning básico, agua dulce',
    }
  },
  {
    pattern: 'CAPERLAN RFT 100 4000',
    review: `El Caperlan RFT 100 4000 es un carrete de spinning con freno trasero de Decathlon, ideal para pescadores que prefieren ajustar el freno rápidamente sin soltar la caña. El tamaño 4000 es versátil, válido para pesca en agua dulce y salada ligera. El freno trasero permite cambios de presión rápidos durante la pelea. El cuerpo de grafito es ligero. Un carrete funcional y sencillo para el que busca practicidad.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'RFT 100 4000',
      'Tamaño': '4000', 'Tipo': 'Spinning (freno trasero)',
      'Material cuerpo': 'Grafito', 'Rodamientos': '3+1',
      'Freno': 'Trasero', 'Capacidad (mono)': '~200m/0.30mm',
      'Peso': '~310g', 'Uso': 'Agua dulce y salada ligera',
    }
  },
  {
    pattern: 'CAPERLAN RFT Resist Fluo 250m',
    review: `El Caperlan RFT Resist Fluo 250m es un sedal de nylon monofilamento de Decathlon, diseñado para pesca en agua dulce con alta resistencia a la abrasión. El color fluo (fluorescente) facilita la visibilidad de la línea sobre el agua, ayudando a detectar picadas y controlar la deriva. La resistencia a los nudos es buena para un monofilamento de su precio. Los 250m proporcionan suficiente longitud para múltiples montajes o para carretes grandes.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'RFT Resist Fluo',
      'Tipo': 'Nylon monofilamento', 'Longitud': '250m',
      'Diámetro': 'Varios (0.25-0.50mm)',
      'Color': 'Fluorescente', 'Resistencia': 'Alta abrasión',
      'Uso': 'Agua dulce, pesca en fondo y flotador',
    }
  },
  {
    pattern: 'CAPERLAN Resifight FC X2',
    review: `El Caperlan Resifight FC X2 es un bajo de línea de fluorocarbono de Decathlon, diseñado para montajes de pesca a fondo y surfcasting. El fluorocarbono es casi invisible bajo el agua y ofrece alta resistencia a la abrasión contra rocas y conchas. Ideal para hacer montajes para sargo, dorada, lubina y breca en zonas rocosas. La presentación en bobina permite cortar la longitud deseada para cada montaje. Un básico para la caja de pesca de mar.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'Resifight FC X2',
      'Tipo': 'Bajo de línea fluorocarbono',
      'Longitud': 'Variable (bobina)', 'Diámetro': 'Varios',
      'Visibilidad': 'Bajo el agua (casi invisible)',
      'Resistencia': 'Alta abrasión', 'Uso': 'Surfcasting, pesca fondo',
      'Especies': 'Sargo, dorada, lubina, breca',
    }
  },
  {
    pattern: 'CAPERLAN Resist Cristal 250m',
    review: `El Caperlan Resist Cristal 250m es un sedal de nylon monofilamento transparente de Decathlon, el clásico sedal de toda la vida para pesca en agua dulce. Su color cristal (transparente) lo hace discreto bajo el agua. Ofrece un buen equilibrio entre elasticidad (absorbe tirones bruscos) y resistencia. Los 250m son suficientes para la mayoría de carretes. Un sedal polivalente y fiable para pesca con flotador, plomada o señuelos.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'Resist Cristal',
      'Tipo': 'Nylon monofilamento', 'Longitud': '250m',
      'Diámetro': 'Varios (0.20-0.50mm)', 'Color': 'Transparente (cristal)',
      'Elasticidad': 'Media', 'Uso': 'Agua dulce, pesca general',
    }
  },
  {
    pattern: 'CAPERLAN Resisurf Violeta - Sedal Surfcasting 250m',
    review: `El Caperlan Resisurf Violeta es un sedal de nylon monofilamento específico para surfcasting de Decathlon. El color violeta tiene la particularidad de ser visible para el pescador pero prácticamente invisible para los peces bajo el agua (el violeta se absorbe rápidamente en la columna de agua). La resistencia a la abrasión está optimizada para lances largos en playa. Los 250m son adecuados para carretes de surfcasting. Un sedal especializado a buen precio.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'Resisurf Violeta',
      'Tipo': 'Nylon monofilamento surfcasting',
      'Longitud': '250m', 'Diámetro': 'Varios (0.30-0.50mm)',
      'Color': 'Violeta (visible pescador, invisible peces)',
      'Resistencia': 'Alta abrasión', 'Uso': 'Surfcasting, playa',
    }
  },
  {
    pattern: 'CAPERLAN Saxton 110F',
    review: `El Caperlan Saxton 110F es un señuelo tipo minnow flotante de Decathlon, diseñado para spinning en agua dulce y salada. Con 11cm y acción flotante, es ideal para pescar en superficie y aguas someras. El diseño realista con colores naturales imita a peces forage como el rutilo o la sardina. El sistema de lastre interno permite lances largos. Equipado con anzuelos triples de calidad estándar. Un señuelo versátil para buscar lucio, black bass y lubina.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'Saxton 110F',
      'Tamaño': '11cm', 'Tipo': 'Minnow flotante',
      'Peso': '~14g', 'Profundidad': 'Superficie - 1m',
      'Flotabilidad': 'Flotante', 'Anzuelos': 'Triples (incluidos)',
      'Uso': 'Spinning agua dulce y salada',
      'Especies': 'Lucio, black bass, lubina',
    }
  },
  {
    pattern: 'CAPERLAN Sedal Pesca Line 4X4 250m',
    review: `El Caperlan Sedal Pesca Line 4X4 250m es una trenza de 4 hebras de Decathlon, diseñada para pesca de precisión donde la sensibilidad es clave. Las 4 hebras ofrecen un perfil redondo que reduce el rozamiento con las guías y mejora la distancia de lance. El color está disponible en varios tonos. La resistencia a la abrasión es correcta para su precio. Una trenza económica para spinning y baitcasting.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'Line 4X4',
      'Hebras': '4', 'Longitud': '250m',
      'Diámetro': 'Varios', 'Material': 'Polietileno alta densidad',
      'Perfil': 'Redondo', 'Uso': 'Spinning, baitcasting',
    }
  },
  {
    pattern: 'CAPERLAN TX4 Caqui - Hilo Trenzado 4 Tramos 150m',
    review: `El Caperlan TX4 Caqui es una trenza de 4 hebras de Decathlon en color caqui (verde militar), ideal para pesca en aguas claras donde se necesita discreción. Con 150m, es perfecta para carretes de spinning tamaño 1000-3000. El color caqui se camufla bien en aguas con vegetación o fondos oscuros. La trenza de 4 hebras ofrece buena sensibilidad y resistencia. Un formato práctico para pescadores que cambian de trenza con frecuencia.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'TX4 Caqui',
      'Hebras': '4', 'Longitud': '150m',
      'Color': 'Caqui (verde militar)', 'Diámetro': 'Varios',
      'Material': 'Polietileno alta densidad',
      'Uso': 'Spinning, aguas claras con vegetación',
    }
  },
  {
    pattern: 'CAPERLAN TX8 Gris - Hilo Trenzado 8 Hebras 150m',
    review: `El Caperlan TX8 Gris es una trenza de 8 hebras de Decathlon, diseñada para pescadores que buscan máxima suavidad y rendimiento. Las 8 hebras ofrecen un perfil más redondo y liso que las trenzas de 4 hebras, reduciendo el ruido y la fricción en las guías. El color gris es discreto en la mayoría de aguas. Los 150m son ideales para carretes pequeños. Una trenza de gama media-alta dentro del catálogo de Decathlon.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'TX8 Gris',
      'Hebras': '8', 'Longitud': '150m',
      'Color': 'Gris', 'Diámetro': 'Varios',
      'Material': 'Polietileno alta densidad',
      'Perfil': 'Redondo y liso (8 hebras)',
      'Uso': 'Spinning, baitcasting de precisión',
    }
  },
  {
    pattern: 'CAPERLAN TX8 Verde - Hilo Trenzado 8 Hebras 150m',
    review: `El Caperlan TX8 Verde es la versión en color verde de la trenza de 8 hebras de Decathlon. El color verde es ideal para aguas con vegetación o fondos oscuros donde se necesita camuflaje. Al igual que la versión gris, las 8 hebras ofrecen un perfil redondo y liso que minimiza el ruido en las guías y maximiza la distancia de lance. Una trenza de gran calidad para el pescador exigente.`,
    specs: {
      'Marca': 'Caperlan (Decathlon)', 'Modelo': 'TX8 Verde',
      'Hebras': '8', 'Longitud': '150m',
      'Color': 'Verde', 'Diámetro': 'Varios',
      'Material': 'Polietileno alta densidad',
      'Perfil': 'Redondo y liso (8 hebras)',
      'Uso': 'Spinning, aguas con vegetación',
    }
  },
  {
    pattern: 'El mini producto de carbono de viaje de fundición de cebo giratorio phishger',
    review: `La Phishger Mini Carbono Viaje es una caña telescópica ultraligera de la marca Phishger, diseñada para pescadores que necesitan una caña compacta para viajar. Se pliega hasta unos 40-50cm, cabiendo en cualquier mochila o maleta de avión. El blank de carbono 24T ofrece una acción rápida básica. Está diseñada tanto para spinning como para casting ligero. Incluye funda de transporte. Ideal como caña de viaje o de respaldo para explorar nuevas zonas sin llevar el equipo principal.`,
    specs: {
      'Marca': 'Phishger', 'Tipo': 'Caña telescópica viaje',
      'Material': 'Carbono 24T', 'Tramos': 'Telescópica (varios)',
      'Plegada': '~40-50cm', 'Uso': 'Spinning y casting ligero',
      'Incluye': 'Funda de transporte',
      'Ideal para': 'Viajes, mochila, avión',
    }
  },
  {
    pattern: 'Kit Señuelos Pesca 120 Piezas',
    review: `El Kit Señuelos Pesca 120 Piezas es un pack completo de señuelos y accesorios de pesca, ideal para principiantes o como lote de regalo. Incluye una gran variedad de señuelos: crankbaits, vinilos, spinners, cucharillas, anzuelos, plomos y emerillones, todo en una práctica caja organizadora de plástico. La calidad de los señuelos es básica, pero la variedad permite probar diferentes técnicas y descubrir qué funciona mejor en tu zona. Una forma económica de empezar.`,
    specs: {
      'Marca': 'Genérico', 'Modelo': 'Kit 120 piezas',
      'Contenido': 'Crankbaits, vinilos, spinners, cucharillas, anzuelos, plomos, emerillones',
      'Incluye': 'Caja organizadora de plástico',
      'Calidad': 'Básica', 'Uso': 'Agua dulce',
      'Ideal para': 'Principiantes, regalo, probar técnicas',
    }
  },
  {
    pattern: 'Rapala Original Floating Minnow 9cm',
    review: `El Rapala Original Floating Minnow 9cm es el señuelo más icónico de la historia de la pesca. Diseñado originalmente en 1936 por Lauri Rapala, este minnow flotante ha capturado más peces que ningún otro señuelo. Su acción de nado oscilante imita a la perfección a un pez herido. Flota en reposo y se sumerge al recoger, permitiendo sortear obstáculos con facilidad. Los colores realistas y el acabado de alta calidad son insuperables. Un señuelo que debería estar en toda caja de pesca.`,
    specs: {
      'Marca': 'Rapala', 'Modelo': 'Original Floating Minnow',
      'Tamaño': '9cm', 'Tipo': 'Minnow flotante',
      'Peso': '~10g', 'Profundidad': '1-2m',
      'Flotabilidad': 'Flotante', 'Acción': 'Nado oscilante (wobbling)',
      'Anzuelos': 'Triples VMC (incluidos)',
      'Uso': 'Spinning agua dulce y salada',
      'Especies': 'Lucio, bass, trucha, lubina',
    }
  },
  {
    pattern: 'TRUSCEND Señuelos Giratorios para Pesca con Jig',
    review: `Los Truscend Señuelos Giratorios (spinners) son cucharillas de tipo rooster tail con doble cuchilla, diseñadas para atraer depredadores mediante vibraciones y destellos. La doble cuchilla genera más turbulencia y ruido que un spinner convencional, ideal para aguas turbias o con mala visibilidad. Vienen en varios colores y tamaños para adaptarse a distintas especies y condiciones. Equipadas con anzuelos de calidad estándar. Efectivas para trucha, lubina, lucioperca y lucio.`,
    specs: {
      'Marca': 'Truscend', 'Tipo': 'Spinner doble cuchilla (rooster tail)',
      'Cuchillas': 'Doble (genera más vibración)',
      'Anzuelos': 'Estándar (incluidos)',
      'Uso': 'Agua dulce y salada',
      'Técnica': 'Recogida lineal con pausas',
      'Especies': 'Trucha, lubina, lucioperca, lucio',
    }
  },
  {
    pattern: 'YO-ZURI 3D Inshore Twitchbait 90mm Sardina',
    review: `El Yo-Zuri 3D Inshore Twitchbait 90mm Sardina es un señuelo de superficie tipo twitchbait de la prestigiosa marca japonesa Yo-Zuri, diseñado para la pesca de lubinas y depredadores marinos en superficie. Su diseño 3D con ojos realistas y acabado holográfico imita a la perfección a una sardina. La acción de nado con tirones (twitching) genera un movimiento errático que vuelve locos a los depredadores. Equipado con anzuelos de alta calidad. Un señuelo premium para pescadores exigentes.`,
    specs: {
      'Marca': 'Yo-Zuri', 'Modelo': '3D Inshore Twitchbait',
      'Tamaño': '90mm', 'Color': 'Sardina',
      'Tipo': 'Twitchbait (superficie)',
      'Peso': '~12g', 'Profundidad': 'Superficie',
      'Acabado': '3D holográfico', 'Anzuelos': 'Alta calidad (incluidos)',
      'Uso': 'Spinning mar, lubina', 'Técnica': 'Twitching (tirones)',
    }
  },
];

async function main() {
  const db = getDb();
  let total = 0;

  for (const item of batch) {
    const deals = await db.execute({
      sql: `SELECT d.id FROM deals d WHERE d.title LIKE ?`,
      args: [`%${item.pattern}%`],
    });

    if (deals.rows.length === 0) {
      // Try matching by product name
      const byProd = await db.execute({
        sql: `SELECT d.id FROM deals d INNER JOIN products p ON d.productId = p.id WHERE p.name LIKE ?`,
        args: [`%${item.pattern}%`],
      });
      if (byProd.rows.length === 0) {
        console.log(`❌ No matches: "${item.pattern.substring(0, 60)}..."`);
        continue;
      }
      for (const deal of byProd.rows) {
        await db.execute({
          sql: `UPDATE deals SET review = ?, technicalSpecs = ? WHERE id = ?`,
          args: [item.review, JSON.stringify(item.specs), deal.id],
        });
      }
      // Update product
      const prod = await db.execute({
        sql: `SELECT id FROM products WHERE name LIKE ?`,
        args: [`%${item.pattern}%`],
      });
      if (prod.rows.length > 0) {
        await db.execute({
          sql: `UPDATE products SET review = ?, specs = ?, description = ? WHERE id = ?`,
          args: [item.review, JSON.stringify(item.specs), item.review, prod.rows[0].id],
        });
      }
      total += byProd.rows.length;
      console.log(`✅ "${item.pattern.substring(0, 50)}..." — ${byProd.rows.length} deal(s) [via product]`);
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
      await db.execute({
        sql: `UPDATE products SET review = ?, specs = ?, description = ? WHERE id = ?`,
        args: [item.review, JSON.stringify(item.specs), item.review, products.rows[0].id],
      });
    }

    total += deals.rows.length;
    console.log(`✅ "${item.pattern.substring(0, 50)}..." — ${deals.rows.length} deal(s)`);
  }

  console.log(`\n✅ Batch 5 completa! ${batch.length} productos, ${total} deals.`);
}

main().catch(console.error);
