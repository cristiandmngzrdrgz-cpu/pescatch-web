# PesCatch.es — Mapa del proyecto

## Estado actual

```dataview
TABLE file.mtime as "Modificado", status as "Estado"
FROM "Sesiones"
SORT file.mtime DESC
LIMIT 5
```

## Decisiones pendientes

```dataview
LIST
FROM "_Contexto"
WHERE status = "pendiente"
```

## Artículos en progreso

```dataview
TABLE file.mtime as "Modificado"
FROM "_Blog"
SORT file.mtime DESC
```

## Productos investigados

```dataview
TABLE asin as "ASIN", ean as "EAN"
FROM "Productos"
```
