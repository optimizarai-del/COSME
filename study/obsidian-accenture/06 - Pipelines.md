---
tags: [accenture, pipelines, gcp]
---
# 🏭 Pipelines de datos
Cadena de montaje: los datos entran, se limpian y salen listos. ← [[00 - Índice]]

- **ETL**: Extraer → Transformar → Cargar (cocinar antes de guardar).
- **ELT**: Extraer → Cargar crudo → Transformar en BigQuery con SQL (lo moderno).
- **Data warehouse**: base para análisis (BigQuery). **Data lake**: todo crudo (Cloud Storage).

| | Batch (por lotes) | Streaming (tiempo real) |
|---|---|---|
| Cuándo | Cada tanto (hora/noche) | Apenas llega el dato |
| Analogía | Colectivo | Taxi |
| Ejemplo | Reporte diario | Fraude con tarjeta |

## Apache Beam + Dataflow
- **Beam** = la receta (el código). **Dataflow** = la cocina de Google que la ejecuta y escala sola.
- **PCollection** = los datos que viajan. **PTransform** = cada paso.
```python
(p | "Leer" >> beam.io.ReadFromText("x.csv")
   | "Filtrar" >> beam.Filter(lambda f: ...)
   | "Guardar" >> beam.io.WriteToText("out"))
```
`|` conecta pasos · `>>` le pone nombre · `Map` aplica a cada uno · `Filter` se queda con algunos · `lambda` = función de una línea.

## Flujo streaming típico en GCP
App → **Pub/Sub** (cola) → **Dataflow** (procesa) → **BigQuery** (guarda)

## Idempotencia = botón del ascensor
Correrlo 1 o 10 veces da lo mismo, así no se duplican datos al reintentar. Se logra con un ID único + **upsert/MERGE** (insertar si no existe, actualizar si existe).

**Orquestación**: el director que decide qué paso corre y cuándo (Airflow / Cloud Composer).
