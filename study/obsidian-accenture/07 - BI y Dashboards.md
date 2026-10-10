---
tags: [accenture, bi, dashboards]
---
# 📊 BI y Dashboards
BI (Business Intelligence) = convertir datos en decisiones. ← [[00 - Índice]]

- **KPI** = el número que dice si vamos bien (ventas, conversión, churn = abandono, ticket promedio). Necesita objetivo + comparación + dueño.
- **Dimensión** = por qué cortás (país, mes) → `GROUP BY`. **Métrica** = qué medís (ventas) → `SUM()`. Ejemplo: "**Ventas** por **país**".

## Qué gráfico usar
| Mostrar | Gráfico |
|---|---|
| Comparar categorías | Barras |
| Evolución en el tiempo | Líneas |
| Partes de un total (2 a 5) | Torta |
| Un número clave | Scorecard |
| Relación entre 2 números | Dispersión |
| Datos por lugar | Mapa |
| Detalle | Tabla |

⚠️ Errores comunes: tortas con muchas porciones, 3D, demasiados colores, barras que no empiezan en 0.

## Dashboard = un diario
KPIs arriba → tendencias en el medio → detalle abajo + filtros. Menos es más.

| | Looker Studio | Tableau |
|---|---|---|
| De | Google (gratis) | Salesforce (pago) |
| Fuerte en | BigQuery, Sheets, GA | Análisis visual potente |

Glosario: fuente de datos · campo calculado (fórmula) · filtro/control · drill-down (clic para ver detalle) · blending (unir fuentes).
