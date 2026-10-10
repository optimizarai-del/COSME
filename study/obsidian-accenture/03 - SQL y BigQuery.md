---
tags: [accenture, sql, bigquery]
---
# 🗄️ SQL y BigQuery
SQL = idioma para hacerle preguntas a tablas. BigQuery = la base de Google Cloud para tablas gigantes. ← [[00 - Índice]]

## Consulta base (orden de escritura)
```sql
SELECT pais, SUM(precio) AS total   -- qué columnas (AS = alias)
FROM ventas                          -- de qué tabla
WHERE precio > 0                     -- filtra FILAS
GROUP BY pais                        -- agrupa (tabla dinámica)
HAVING SUM(precio) > 1000            -- filtra GRUPOS
ORDER BY total DESC                  -- ordena (DESC mayor→menor)
LIMIT 10;                            -- máximo de filas
```
- Toda columna del SELECT fuera de una función → va en el GROUP BY.
- Filtros: `IN ('AR','UY')` · `BETWEEN 10 AND 50` · `LIKE 'Ana%'` · `IS NULL` (nunca `= NULL`).
- Agregaciones: `COUNT` `SUM` `AVG` `MAX` `MIN`.

## JOINs (unir tablas, como BUSCARV)
| Tipo | Trae |
|---|---|
| `INNER JOIN` | Solo filas con pareja en ambas |
| `LEFT JOIN` | Todo lo de la izquierda + lo que coincida (si no, NULL) ⭐ el más usado |
| `FULL JOIN` | Todo de ambas |

## Herramientas pro
- **CASE WHEN** = el IF de SQL: `CASE WHEN precio>100 THEN 'Caro' ELSE 'Barato' END`
- **CTE (`WITH x AS (...)`)** = pasos con nombre, como receta.
- **Window functions** = calculan mirando otras filas **sin agrupar**:
  - `ROW_NUMBER() / RANK() OVER (PARTITION BY pais ORDER BY precio DESC)`: ranking dentro de cada país.
  - `LAG` / `LEAD`: fila anterior / siguiente.
  - `SUM(x) OVER (ORDER BY fecha)`: acumulado.
  - 💡 "Última compra por cliente" → `ROW_NUMBER()` y quedarte con el 1.

## BigQuery específico
- Tabla: `` `proyecto.dataset.tabla` `` (con backticks).
- **Se paga por bytes leídos** → evitar `SELECT *`.
- **Particionado** (por fecha) y **clustering** (por columna) → lee menos = más rápido y barato.
- **UNNEST** = desarma una lista (ARRAY) dentro de una celda en filas.
