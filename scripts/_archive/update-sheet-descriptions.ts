import { readAllRows, updateRowByIndex } from '../src/lib/sync/google-sheets-client';

const updates: { nameMatch: string; description: string }[] = [
  {
    nameMatch: 'BUDEFO MAXIMUS',
    description: `### Análisis: Caña BUDEFO MAXIMUS (1.8m-3.0m, Carbono 30T, Spinning/Baitcasting)

#### ¿Para quién es esta caña?
La **BUDEFO MAXIMUS** es una caña de **gama media-alta** dentro del catálogo de AliExpress, diseñada para pescadores que buscan **calidad profesional sin pagar precios de marcas premium**. Su construcción en **carbono 30T** y las **guías FUJI** la sitúan por encima de las cañas básicas de fibra de vidrio, pero sin llegar al nivel de las Shimano o Daiwa de alta gama. Es ideal para:
- **Pescadores intermedios** que quieren dar el salto a equipos más técnicos.
- **Viajeros y pescadores de costa**: su diseño telescópico (2-4 tramos) la hace fácil de transportar en mochila o coche.
- **Técnicas de spinning y baitcasting**: gracias a su acción rápida y potencia ajustable (ML/M/MH), sirve tanto para señuelos ligeros (3-18g) como para capturas más exigentes (15-50g).

#### Puntos fuertes
1. **Carbono 30T de alta resistencia**: ofrece una **excelente relación peso-resistencia**, permitiendo lanzamientos precisos sin fatiga. Similar a cañas de gama media de Okuma o Penn, pero con un precio un 30-40% inferior.
2. **Guías FUJI**: reducen la fricción de la línea y evitan el desgaste prematuro. En cañas de este rango de precio, es raro encontrar guías de esta marca.
3. **Versatilidad de longitudes y potencias**: desde 1.68m (3-28g) para ríos hasta 3.0m (20-70g) para surfcasting ligero.
4. **Diseño telescópico para viaje**: se pliega hasta ~60-70cm, ocupando poco espacio.
5. **Relación calidad-precio**: por 23-30€, combina carbono 30T + guías FUJI + acción rápida. En Amazon o Decathlon, un equipo similar costaría 50-80€.

#### Limitaciones
- No es una caña "premium": no iguala la sensibilidad de modelos como la Shimano Vengeance o Daiwa Ninja LT.
- Empuñadura de EVA estándar: en días de lluvia puede resbalar.
- Anillas no metálicas: aunque son FUJI, no son de cerámica SIC (como en cañas >100€).

#### Conclusión
✅ **Sí, si buscas** una caña versátil con calidad profesional a precio ajustado, para viajar (telescópica) o probar técnicas nuevas.
❌ **No, si** pescarás especies muy grandes (>5kg), necesitas máxima sensibilidad o prefieres marcas reconocidas con mejor servicio postventa.

**Valoración: 8.5/10**`
  },
  {
    nameMatch: 'EVA',
    description: `### Análisis: Caja de pesca EVA (3 piezas, impermeable, organizador de aparejos)

#### ¿Para quién es esta caja?
La **caja de pesca de EVA** es un **organizador todo-en-uno** diseñado para pescadores que buscan **practicidad y orden** sin gastar mucho. Ideal para:
- **Pescadores ocasionales y de fin de semana** que necesitan llevar lo esencial sin complicaciones.
- **Viajeros y pescadores de costa**: diseño plegable y ligero.
- **Principiantes**: precio asequible (25-30€) y versatilidad.
- **Pescadores de kayak o embarcación**: el material EVA flota, no se hunde.

#### Puntos fuertes
1. **Material EVA de alta densidad**: impermeable, resistente a golpes y ligero. No se agrieta con el frío ni se deforma con el calor (soporta hasta 105°C).
2. **Diseño modular 3-en-1**: 3 cajas apilables (pequeña, mediana, grande) con compartimentos ajustables y tapa transparente.
3. **Impermeabilidad y flotabilidad**: sellado hermético que evita entrada de agua, arena o polvo.
4. **Capacidad total de 44 litros**: grande (26L) para carretes/ropa, mediana para señuelos, pequeña para accesorios.
5. **Portabilidad**: plegable, asa ergonómica, ~1.5kg total.
6. **Relación calidad-precio**: 25-30€ vs 50-80€ en Amazon o Decathlon.

#### Limitaciones
- No es indestructible: el EVA no aguanta mordiscos de peces grandes o golpes muy fuertes.
- Capacidad limitada para pesca profesional (>30 señuelos se queda corta).
- Divisores de espuma pueden desprenderse con el tiempo.
- No incluye portacañas.

#### Conclusión
✅ **Sí, si buscas** una caja versátil, impermeable y modular para organizar aparejos sin gastar mucho. Ideal para pesca recreativa y viajes.
❌ **No, si** necesitas máxima resistencia, llevas mucho equipo o prefieres marcas reconocidas (Plano, Flambeau).

**Valoración: 9/10**`
  },
  {
    nameMatch: 'Phishger (5-30g)',
    description: `### Análisis: Caña Phishger (Carbono 30T, 5-30g, Spinning/Casting)

#### ¿Para quién es esta caña?
La **caña Phishger** es una opción económica pero de calidad para pescadores que buscan versatilidad y portabilidad sin gastar mucho. Ideal para:
- **Principiantes** que quieren probar spinning o baitcasting.
- **Pescadores urbanos**: diseño telescópico (2-4 tramos) perfecto para transporte público o avión.
- **Pescadores de río y embalse**: acción rápida y potencia media (5-30g) para truchas, black bass y luciopercas.
- **Viajeros**: plegada mide ~50-60cm y pesa ~100-150g.

#### Puntos fuertes
1. **Carbono 30T**: equilibrio entre rigidez y flexibilidad. Superior al carbono 24T de cañas baratas.
2. **Diseño telescópico**: se pliega a ~50-60cm, sistema de rosca que evita holguras.
3. **Versatilidad**: 1.8m-2.1m (5-25g) para ríos, 2.28m-2.4m (7-30g) para embalses o costa.
4. **Acción rápida (fast action)**: lanzamientos precisos, mejor sensibilidad y control de señuelos.
5. **Relación calidad-precio**: 14-25€ por carbono 30T + acción rápida + telescópica. En Amazon o Decathlon costaría 40-60€.
6. **Guías de acero inoxidable**: reducen fricción de la línea.

#### Limitaciones
- No es una caña "premium": no iguala la sensibilidad de Shimano Vengeance o Daiwa Ninja LT.
- Empuñadura básica de EVA: puede resbalar en días de lluvia.
- Conexiones telescópicas requieren limpieza tras cada uso.
- No incluye portacarretes.

#### Conclusión
✅ **Sí, si buscas** una caña versátil con calidad decente a precio ajustado, para viajar o probar técnicas nuevas.
❌ **No, si** pescarás especies muy grandes (>5kg), necesitas máxima sensibilidad o prefieres marcas reconocidas.

**Valoración: 8/10**`
  },
  {
    nameMatch: 'UPF 50+',
    description: `### Análisis: Sombrero de pesca con protección solar UPF 50+ (Amazon)

#### ¿Para quién es este sombrero?
El **sombrero de pesca con protección solar UPF 50+** es un accesorio esencial para pescadores que pasan largas horas bajo el sol. Ideal para:
- **Pesca en costa, playa o embarcación**: exposición máxima a rayos UV.
- **Pesca en verano o zonas tropicales**: evita insolaciones y quemaduras.
- **Pescadores con piel sensible** o que quieren prevenir el envejecimiento prematuro.
- **Viajeros**: también para senderismo, playa o actividades al aire libre.

#### Puntos fuertes
1. **Protección UPF 50+ (máxima certificación)**: bloquea más del 98% de rayos UVA y UVB. Certificado AS/NZS 4399:1996 (estándar australiano, el más estricto).
2. **Diseño específico para pesca**: ala ancha (7-8 cm) protege cuello y hombros, cierre ajustable en la nuca, material transpirable con malla lateral.
3. **Materiales resistentes**: poliéster 100% resistente a agua salada, sudor y roces. Peso ligero (~100g). Secado rápido.
4. **Versatilidad**: color neutro, talla única ajustable (56-62 cm), plegable.
5. **Relación calidad-precio**: 12-15€ vs 25-40€ en Decathlon o tiendas especializadas.

#### Limitaciones
- No es impermeable: resiste salpicaduras pero no lluvia intensa.
- Ala rígida pero flexible: puede perder forma si se dobla bruscamente.
- Sin protección para la nariz: se recomienda crema solar adicional.
- No apto para vientos muy fuertes (>50 km/h).

#### Conclusión
✅ **Sí, si buscas** protección solar máxima (UPF 50+), diseño específico para pesca, portabilidad y precio asequible.
❌ **No, si** necesitas impermeabilidad, protección para vientos fuertes o prefieres marcas reconocidas con garantía extendida.

**Valoración: 9/10**`
  },
];

async function main() {
  const { headers, rows } = await readAllRows();
  const descCol = headers.indexOf('description');
  if (descCol === -1) throw new Error('Column "description" not found in sheet');

  console.log(`Found ${rows.length} rows in sheet. Description column index: ${descCol}`);

  for (const update of updates) {
    let found = false;

    for (let i = 0; i < rows.length; i++) {
      const name = (rows[i][headers.indexOf('name')] || '').toString();
      if (name.toLowerCase().includes(update.nameMatch.toLowerCase())) {
        console.log(`✅ Updating row ${i + 2}: "${name}"`);
        await updateRowByIndex(i, 'description', update.description);
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`❌ No match found for: "${update.nameMatch}"`);
    }
  }

  console.log('\n✅ Sheet descriptions updated! Now run: npm run sync');
}

main().catch(console.error);
