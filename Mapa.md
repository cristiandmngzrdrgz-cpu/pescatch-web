---
tags: [vault/mapa, vault/index]
---

# PesCatch.es — Mapa del proyecto

> Mapa central del vault. Navegación rápida a todas las secciones.

---

## Estado del proyecto

```dataview
TABLE objetivo, duracion, file.cday as fecha
FROM #sesion
SORT file.cday DESC
LIMIT 5
```

## Blog — Calendario editorial

```dataview
TABLE status, category, fecha-publicacion as publicado
FROM #blog/post
SORT status ASC, fecha-publicacion DESC
```

## Investigación SEO

```dataview
TABLE keyword, volumen, dificultad
FROM #keyword
SORT volumen DESC
```

## Productos — ASINs investigados

```dataview
TABLE marca, categoria, precio-amazon, status
FROM #producto
SORT status ASC, fecha-investigacion DESC
```

---

## Contexto del proyecto

- [[_Contexto/estado-actual|Estado actual]]
- [[_Contexto/decisiones|Decisiones de arquitectura]]
- [[_Contexto/arquitectura|Arquitectura del proyecto]]
- [[_Contexto/roadmap|Roadmap y planificación]]
- [[_Contexto/SEO|SEO on-page]]

## Features

- [[_Features/README|Catálogo de features]]
- [[_Features/Alertas de Precio|Alertas de precio]]
- [[_Features/Newsletter|Newsletter semanal]]
- [[_Features/Comparador de Precios|Comparador de precios]]

## Scraping & Discover

- [[_Scraping/Discover Pipeline|Pipeline de descubrimiento]]
- [[_Scraping/AliExpress|Scraper AliExpress]]

## Investigación

- [[_Investigacion/competidores|Competidores]]
- [[_Investigacion/palabras-clave|Palabras clave SEO]]
- [[_Investigacion/tendencias|Tendencias del sector]]

## Blog

- [[_Blog/calendario|Calendario editorial]]
- [[_Blog/ideas|Ideas para el blog]]

## Productos

- [[Productos/inventario-scraping|Inventario y scraping]]

## Sesiones

- [[Sesiones/2026-06-30-fundacion|Fundación del vault]]
- [[Sesiones/2026-06-30-code-review|Code Review y Refactor (41 fixes)]]

---

## ⚡ Quick start

- Para empezar una sesión: leer [[_Contexto/estado-actual]]
- Roadmap: [[_Contexto/roadmap]]
- Último pipeline: [[_Scraping/Discover Pipeline]]
