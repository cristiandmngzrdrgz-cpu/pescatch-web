# Auditoría de precios del blog — 2026-11-12

Generada con `scripts/audit-blog-prices.ts` (dry-run por defecto, `--apply` para escribir).

**Resumen:** 200 productos en 34 posts publicados — 65 OK, 29 requieren revisión de prosa, 34 con precio de BD sin refrescar, 11 con deal muerto y 61 sin deal en la BD.

## Aplicado hoy (6 cambios en 4 posts)

Solo se aplicaron cambios seguros: deals vivos, precio refrescado hoy y sin mención del precio viejo en la prosa.

| Post | Producto | Antes | Ahora |
|---|---|---|---|
| lubina-desde-costa-otono-equipo-senuelos-2026 | Daiwa Ninja X Spin | 0★ | 4.7★ |
| chollos-pesca-semana-42-2026 | Mitchell MX2 — Carrete agua salada | 4.3★ | 4.5★ |
| chollos-pesca-semana-42-2026 | DAM Xtherm — Traje térmico invierno | 4.6★ | 4.5★ |
| chollos-pesca-semana-42-2026 | Realure 3 señuelos — Multiarticulados lucio | 4.2★ | 4★ |
| mejores-carretes-surfcasting-2026 | Mitchell MX2 (agua salada) | 4.4★ | 4.5★ |
| mejores-senuelos-spinning-2026 | Rapala Original Floating Minnow 9cm | 12.86 € | 13.88 € |

## Revisión manual: precio en prosa o cambio >10 % (29)

No se tocaron para no dejar la card y el texto con precios distintos. Requieren reescribir la prosa y, si cambia el descuento, el porcentaje.

| Post | Producto | Post | BD | Motivo |
|---|---|---|---|---|
| lubina-desde-costa-otono-equipo-senuelos-2026 | Rapala Original Floating 9 cm | 12.55 € | 13.88 € | delta 11% |
| chollos-pesca-semana-44-2026 | Navis traje de lluvia — chaqueta y peto | 79 € | 89 € | delta 13% |
| chollos-pesca-semana-43-2026 | PENN Surfblaster III | 99.99 € | 89.99 € | delta 10% |
| chollos-pesca-semana-43-2026 | Rapala Original Floating Minnow 9 cm | 12.62 € | 13.88 € | precio en prosa |
| chollos-pesca-semana-42-2026 | HAWKERS Carbon One — Gafas polarizadas | 22.49 € | 24.95 € | delta 11% |
| chollos-pesca-semana-42-2026 | Polaroid PLD 7005/S — Polarizadas clásicas | 32.9 € | 29.2 € | delta 11% |
| chollos-pesca-semana-42-2026 | Mitchell MX3 Pro — Carrete spinning lucio | 49.99 € | 43.08 € | delta 14% |
| equipo-feeder-barato-2026 | Daiwa Triforce Target Feeder — Caña de feeder | 39.9 € | 51 € | delta 28% |
| mejor-ropa-impermeable-pesca-2026 | Navis Marine Traje de Lluvia PU | 71 € | 89 € | delta 25% |
| mejor-ropa-impermeable-pesca-2026 | Sombrero UPF 50+ Ala Ancha Impermeable | 29 € | 29.98 € | precio en prosa |
| mejor-ropa-impermeable-pesca-2026 | Botas Dee Calf Caucho Caña Media | 16 € | 17.55 € | precio en prosa |
| mejores-cajas-mochilas-pesca-2026 | MATEIN Mochila Pesca Impermeable 45L | 45 € | 39.99 € | delta 11% |
| mejores-senuelos-eging-baratos-2026 | Rapala Original Floating Minnow 9cm | 12.55 € | 13.88 € | delta 11% |
| mejores-senuelos-eging-baratos-2026 | Vicloon Kits de Señuelos Artificiales Goma 10-12cm | 14.99 € | 15.49 € | precio en prosa |
| mejores-carretes-spinning-menos-100-euros | Daiwa Ninja 23 LT 3000C | 55 € | 57 € | precio en prosa |
| mejores-carretes-spinning-menos-100-euros | Mitchell Mx1 4000 | 28 € | 24.49 € | delta 13% |
| equipo-surfcasting-barato-2026 | PENN Surfblaster III | 129 € | 89.99 € | delta 30% |
| equipo-surfcasting-barato-2026 | Mitchell MX2 (agua salada) | 44 € | 44.49 € | precio en prosa |
| mejores-carretes-surfcasting-2026 | PENN Surfblaster III | 142 € | 89.99 € | delta 37% |
| kit-completo-empezar-pescar-2026 | Shimano FX 2500 — Carrete Spinning para empezar | 24.73 € | 28.59 € | delta 16% |
| kit-completo-empezar-pescar-2026 | Vicloon Kit de 21 señuelos para spinning | 14.99 € | 15.49 € | precio en prosa |
| kit-completo-empezar-pescar-2026 | Rapala Original Floating Minnow 9cm | 12.55 € | 13.88 € | delta 11% |
| mejores-senuelos-spinning-2026 | Realure Juego de 3 señuelos multiarticulados | 13.99 € | 11.99 € | delta 14% |
| mejores-gafas-sol-polarizadas-pescar-2026 | HAWKERS Carbon One Gafas de Sol | 22 € | 24.95 € | delta 13% |
| mejores-gafas-sol-polarizadas-pescar-2026 | Polaroid PLD 7005/S Flexi Temples | 29 € | 29.2 € | precio en prosa |
| mejores-gafas-sol-polarizadas-pescar-2026 | Lamicall Polarizadas 22g UV400 | 26 € | 26.99 € | precio en prosa |
| mejores-gafas-sol-polarizadas-pescar-2026 | GQUEEN Polarizadas de Madera UV400 | 16 € | 16.99 € | precio en prosa |
| mejores-gafas-sol-polarizadas-pescar-2026 | Cressi Rio Sunglasses Polarizadas | 21 € | 22.35 € | precio en prosa |
| mejores-gafas-sol-polarizadas-pescar-2026 | Hifot Polarizadas Deportivas UV400 | 11 € | 15.99 € | delta 45% |

## Precio de BD sin refrescar hoy (34)

El último `price_history` es anterior a hoy, así que el precio de la BD puede estar desfasado. No se aplicó nada. Revisar cuando el refresh de Amazon funcione.

| Post | Producto | Post | BD | Historial |
|---|---|---|---|---|
| mejores-carretes-agua-salada-2026 | PENN Wrath II | 60.72 € | 68.61 € | 2026-11-11 |
| mejores-carretes-agua-salada-2026 | Shimano Socorro SW 10000 | 118.71 € | 126 € | 2026-11-11 |
| mejores-carretes-agua-salada-2026 | Shimano Saragosa SW A | 252.95 € | 289 € | 2026-11-11 |
| mejores-carretes-agua-salada-2026 | Okuma Komodo SS | 308.79 € | 310.39 € | 2026-11-11 |
| chollos-pesca-semana-45-2026 | Okuma Komodo SS | 308.79 € | 310.39 € | 2026-11-11 |
| chollos-pesca-semana-45-2026 | PENN Wrath II | 60.72 € | 68.61 € | 2026-11-11 |
| lubina-desde-costa-otono-equipo-senuelos-2026 | Shimano FX XT 2,40 m 10-30 g | 20.99 € | 30.63 € | 2026-11-11 |
| chollos-pesca-semana-44-2026 | Okuma Convector con contador | 123.99 € | 122.8 € | 2026-11-11 |
| chollos-pesca-semana-44-2026 | Okuma Magda Pro Line Counter | 83.87 € | 83.72 € | 2026-11-11 |
| chollos-pesca-semana-44-2026 | Okuma Trout Rod | 51.92 € | 55.72 € | 2026-11-11 |
| chollos-pesca-semana-42-2026 | Goture Xceed — Caña anillas Fuji 4 tramos | 35.59 € | 51.39 € | 2026-11-10 |
| chollos-pesca-semana-42-2026 | KUAISHA carbono 7-25g — Caña spinning | 26.07 € | 35.79 € | 2026-11-10 |
| chollos-pesca-semana-42-2026 | JSFUN telescópica — Caña de viaje | 14.95 € | 18.99 € | 2026-11-10 |
| equipo-feeder-barato-2026 | Okuma XP Carbonite Baitfeeder — Freno libre barato | 31.77 € | 35.04 € | 2026-11-11 |
| equipo-feeder-barato-2026 | Soporte de caña para silla — Sesiones cómodas | 16.19 € | 17.99 € | 2026-11-10 |
| mejor-hilo-trenzado-pesca-2026 | Shimano Kairiki 8 150m Amarillo — Trenzado 8 hebras | 19.95 € | 19.99 € | 2026-11-11 |
| mejor-hilo-trenzado-pesca-2026 | Shimano Kairiki 8 150m Verde Mantis — Trenzado 8 hebras | 19.95 € | 20.8 € | 2026-11-11 |
| mejor-ropa-impermeable-pesca-2026 | Bassdash Astro Guantes Alta Resistencia | 13.07 € | 18.19 € | 2026-11-10 |
| 5-canas-menos-60-euros-2026-chollos-reales | Caña Goture VNOBLE 1.8-2.7m ML 4-22g | 16.58 € | 21.19 € | 2026-11-10 |
| 5-canas-menos-60-euros-2026-chollos-reales | Caña Profesional Barco 1.55-1.70m Casting/Jigging | 21.78 € | 31.19 € | 2026-11-10 |
| 5-canas-menos-60-euros-2026-chollos-reales | Sougayilang Combo 1.8m 2 Tramos MH 8KG | 36.18 € | 54.69 € | 2026-11-10 |
| 5-canas-menos-60-euros-2026-chollos-reales | Caña 3.3-3.9m 4 Tramos 30-200g Carbono 40T | 40.67 € | 63.99 € | 2026-11-10 |
| 5-canas-menos-60-euros-2026-chollos-reales | BIUTIFU BIGFISH 3.0-4.5m Surfcasting Carbono T800 | 56.69 € | 58.69 € | 2026-11-10 |
| mejores-cajas-mochilas-pesca-2026 | Daiwa Carryall 40L Carpfishing Barco | 39 € | 39.99 € | 2026-11-11 |
| chollos-pesca-menos-25-euros-2026 | Caña Goture VNOBLE 24T - Spinning/Casting 4-22g | 17.78 € | 21.19 € | 2026-11-10 |
| chollos-pesca-menos-25-euros-2026 | DAIWA Ninja 23 LT 2500 XH | 23.84 € | 55 € | 2026-11-10 |
| chollos-pesca-menos-25-euros-2026 | Cuchara Vertical 3D 60g-200g - Jig de Metal | 5.06 € | 4.19 € | 2026-11-10 |
| chollos-pesca-menos-25-euros-2026 | Grasa ZORILYNX 100g para Carretes - Lubricante Impermeable | 4.49 € | 5.09 € | 2026-11-10 |
| chollos-pesca-menos-25-euros-2026 | Soporte Ajustable para Caña de Pescar (silla/orilla) | 15.13 € | 17.99 € | 2026-11-10 |
| equipo-surfcasting-barato-2026 | Cañas BIUTIFU BIGFISH Surfcasting | 56.69 € | 58.69 € | 2026-11-10 |
| equipo-surfcasting-barato-2026 | Caña telescópica de carbono 2.1-4.5m | 30 € | 41.99 € | 2026-11-10 |
| equipo-surfcasting-barato-2026 | Soporte ajustable para caña | 15.13 € | 17.99 € | 2026-11-10 |
| mejores-senuelos-spinning-2026 | Señuelo Minnow biónico ojos 3D (5 uds) | 9.29 € | 9.99 € | 2026-11-10 |
| mejores-senuelos-spinning-2026 | cucharillas metálicas FISH KING | 2.73 € | 3.29 € | 2026-11-10 |

## Deals muertos (11)

El producto del post apunta a un deal que ya no está publicado o está sin stock. Hay que sustituirlo o retirar la card.

| Post | Producto | Precio post | Precio BD |
|---|---|---|---|
| mejores-carretes-carpfishing-menos-100-2026 | Lineaeffe Free Carp 60 | 29.78 € | 29.78 € |
| chollos-pesca-semana-44-2026 | Daiwa 23BG SW 4000 | 196.69 € | 202.52 € |
| chollos-pesca-semana-44-2026 | Daiwa Prorex X LT | 92.41 € | 92.41 € |
| chollos-pesca-semana-43-2026 | Shimano FX XT 2,10 m 10-30 g | 20.99 € | 20.99 € |
| equipo-feeder-barato-2026 | Shimano Baitrunner ST 2500-4000 FB — El original | 66.37 € | 66.2 € |
| mejor-ropa-impermeable-pesca-2026 | Vadeador Impermeable 3 Capas Transpirable | 68.39 € | 68.39 € |
| mejores-carretes-spinning-menos-100-euros | Daiwa Crossfire 26 LT 2500 XH | 32 € | 32 € |
| mejores-carretes-surfcasting-2026 | Shimano Ultegra 14000 XSE | 188.7 € | 186.46 € |
| mejores-carretes-surfcasting-2026 | Daiwa Ninja 23 LT 6000 | 52.65 € | 52.65 € |
| mejores-carretes-surfcasting-2026 | Daiwa Joinus 5000 | 30.2 € | 30.14 € |
| mejores-senuelos-spinning-2026 | YO-ZURI Crystal Deep Diver 110 | 13.86 € | 13.86 € |

## Productos sin deal en la BD (61)

El post recomienda un producto que no existe como deal publicado (ficha borrada o nunca publicada). El botón "Ver en PesCatch" ya se oculta solo, pero el CTA de compra sigue apuntando a la tienda.

| Post | Producto | Precio post |
|---|---|---|
| pesca-pulpo-eging-polpara-tecnicas-equipo-2026 | Daiwa Emeraldas Air AGS 83M | 369 € |
| pesca-pulpo-eging-polpara-tecnicas-equipo-2026 | Hart Bloody Ika 83 | 189.04 € |
| pesca-pulpo-eging-polpara-tecnicas-equipo-2026 | Daiwa Legalis Squid 83M | 80.9 € |
| pesca-pulpo-eging-polpara-tecnicas-equipo-2026 | Kali Kunnan Aruki Japan Egi 2.40 m | 201.22 € |
| pesca-pulpo-eging-polpara-tecnicas-equipo-2026 | Shimano Beastmaster Tataki 80H | 77.34 € |
| pesca-dorada-guia-completa-2026 | Daiwa Crosscast Surf 33 423H | 105 € |
| pesca-dorada-guia-completa-2026 | Shimano Vengeance DX Surf 420 | 49.99 € |
| pesca-dorada-guia-completa-2026 | Penn Tidal X Híbrida Sensitip 4,20 m 100-300 g | 176.35 € |
| pesca-dorada-guia-completa-2026 | Daiwa Legalis Seabass 902HFS | 74.07 € |
| pesca-dorada-guia-completa-2026 | Hart Bloody Marine UL 84 | 161.94 € |
| mejor-carrete-spinning-100-2026 | Mitchell Mx1 4000 | ? € |
| mejor-carrete-spinning-100-2026 | Daiwa Crossfire 26 LT 2500 XH | ? € |
| mejor-carrete-spinning-100-2026 | Shimano Sienna FG 4000 | ? € |
| mejor-carrete-spinning-100-2026 | Daiwa Ninja 23 LT 3000C | ? € |
| mejor-carrete-spinning-100-2026 | Daiwa Revros LT 2500 | ? € |
| mejor-carrete-spinning-100-2026 | Shimano Sahara FJ 2500 | ? € |
| mejores-cajas-mochilas-pesca-2026 | Plano 3450 Stowaway Doble Cara 9,99€ | 9.99 € |
| mejores-cajas-mochilas-pesca-2026 | Plano EDGE 3600 Standard 29,99€ | 29.99 € |
| mejores-cajas-mochilas-pesca-2026 | Flambeau Outdoors 6381TB Clásica | 26.19 € |
| mejor-fluorocarbono-2026 | Berkley Sick Fluorocarbon Leader | 9.99 € |
| mejores-poteras-egi-calamar-2026 | Yamashita Egi Oh K 3.5 | 13.99 € |
| mejores-poteras-egi-calamar-2026 | Seika Pro Egi 3.5 | 9.99 € |
| mejores-poteras-egi-calamar-2026 | Daiwa Emeraldas Peak Type S 3.5 | 22.99 € |
| mejores-poteras-egi-calamar-2026 | Hart Absolut Egi 3.5 | 11.99 € |
| mejores-poteras-egi-calamar-2026 | Yamashita Naory Egi Oh Live 3.5 | 17.99 € |
| mejores-carretes-spinning-menos-100-euros | Shimano Nasci 3000 | 90 € |
| mejores-canas-surfcasting-baratas | Daiwa Crosscast Surf 33 | 75 € |
| mejores-canas-surfcasting-baratas | PENN Squadron IV Surf | 85 € |
| mejores-canas-surfcasting-baratas | Daiwa Ninja Surf SCW | 65 € |
| mejores-canas-surfcasting-baratas | Shimano Ultegra XR Surf | 355 € |
| mejores-canas-surfcasting-baratas | Mitchell Adventure 2 | 25 € |
| kit-completo-empezar-pescar-2026 | Rapala-Mini alicates multiusos para pesca | 5.99 € |
| mejores-carretes-baratos-aliexpress-2026 | Carrete de Pesca Lurekiller de Alta Velocidad, Totalmente Metálico, 4000/5000/6000/10000, con Placa de Hierro para Pesca en Barco, Mar y Surf - Carrete Giratorio Resistente | 21.81 € |
| mejores-carretes-baratos-aliexpress-2026 | Carrete de Pesca Giratorio Sellado 9+1BB, Relación 5.2:1, Tamaños 1000/2000/3000/4000/5000/6000, Arrastre Máximo 15kg | 39.24 € |
| mejores-carretes-baratos-aliexpress-2026 | Carrete de pesca giratorio Noeby 3000 4000 5000 6000 arrastre máximo 25kg carrete de aluminio de fundición larga 5,2: 1 carretes de pesca con engranaje de aleación de Zinc | 60.04 € |
| mejores-carretes-baratos-aliexpress-2026 | Carrete de Pesca con Freno Magnético Electrónico, Venta al por Mayor, Carrete de Baitcasting de 5ª Generación con Sistema de Alarma de Freno Antirretorno de Alta Gama | 39.87 € |
| mejores-carretes-baratos-aliexpress-2026 | Carrete de Pesca Giratorio de Largo Alcance CAZULO para Pesca en Playa y Agua Salada, Resistente a la Corrosión y al Agua de Mar, Tamaños 8000 a 12000 | 45.89 € |
| mejores-carretes-spinning-calidad-precio-2026 | Shimano FX 2500 | 20.5 € |
| mejores-carretes-spinning-calidad-precio-2026 | Tsurinoya FS PRO FRANCIS 2000 | 54.39 € |
| mejores-carretes-spinning-calidad-precio-2026 | KastKing Sharky III 3000 | 58.69 € |
| mejores-canas-surfcasting-2026 | Shimano Ultegra XR Surf Tubular 4.50m | ? € |
| mejores-canas-surfcasting-2026 | Daiwa Crosscast Surf 33 453 H | ? € |
| mejores-canas-surfcasting-2026 | PENN Squadron IV Carbono 24T | ? € |
| mejores-canas-surfcasting-2026 | Daiwa Shorecast Surf-S | ? € |
| mejores-canas-surfcasting-2026 | Mitchell Adventure 2 Surf 3.9m | ? € |
| mejores-kits-senuelos-empezar-2026 | Savage Gear Perch Academy Kit | 21.99 € |
| mejores-kits-senuelos-empezar-2026 | Berkley PowerBait Pro Pack | 14.99 € |
| mejores-kits-senuelos-empezar-2026 | Abu Garcia Lure Kit | 8.99 € |
| mejores-kits-senuelos-empezar-2026 | Savage Gear Gravity Stick Kit | 40.61 € |
| mejores-kits-senuelos-empezar-2026 | Savage Gear LRF Mini Sandeel Kit | 16.99 € |
| mejores-canas-spinning-2026 | Daiwa Morethan Branzino AGS | ? € |
| mejores-canas-spinning-2026 | Shimano Dialuna Inshore 86M | ? € |
| mejores-canas-spinning-2026 | Hart Bloody Marine UL 84 | ? € |
| mejores-canas-spinning-2026 | Daiwa Legalis Seabass 902HFS | ? € |
| mejores-canas-spinning-2026 | Daiwa Ninja Spinning | ? € |
| shimano-vs-daiwa-mejores-carretes-spinning | Shimano Sienna 4000 FG | ? € |
| shimano-vs-daiwa-mejores-carretes-spinning | Daiwa Ninja LT 23 4000-C | ? € |
| shimano-vs-daiwa-mejores-carretes-spinning | Shimano Catana FE 4000 HG | ? € |
| shimano-vs-daiwa-mejores-carretes-spinning | Daiwa Laguna LT 4000 | ? € |
| shimano-vs-daiwa-mejores-carretes-spinning | Shimano Sedona FJ 4000 | ? € |
| shimano-vs-daiwa-mejores-carretes-spinning | Daiwa Exceler LT 4000-CP | ? € |
