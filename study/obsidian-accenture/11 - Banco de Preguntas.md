---
tags: [accenture, entrevista, flashcards]
---
# 🎤 Banco de Preguntas
#flashcards
← [[00 - Índice]] · Formato `pregunta::respuesta`, compatible con el plugin *Spaced Repetition* de Obsidian (repaso espaciado: te muestra más seguido lo que olvidás).

## Presentación (memorizar)
> "Soy un perfil híbrido: tengo base técnica en Python, SQL, APIs e IA generativa, y experiencia llevando proyectos de punta a punta. Mi fuerte es traducir un problema de negocio en algo que el equipo pueda construir, y destrabar a los devs cuando se traban."

## Liderazgo
¿Cómo ayudás a un junior trabado?::Pregunto qué probó, lo guío con preguntas, pair programming si hace falta y documentamos lo aprendido.
¿Cómo hacés code review?::Primero que resuelva el problema, después legibilidad, después performance/seguridad. Explico el porqué y separo lo bloqueante de lo opcional.
¿Cómo debuggeás un error difícil?::Reproducir → aislar → hipótesis de a una → arreglar + test → post-mortem.
¿Qué hacés si piden algo para ayer?::Negocio alcance, no calidad: entrego A y B ahora, C en la próxima iteración.
¿Cómo arrancás un proyecto nuevo?::Problema con el stakeholder → MVP → backlog priorizado → sprints cortos → demos frecuentes.

## IA y RR.HH.
3 casos de IA en RR.HH.::1) Chatbot de políticas con RAG. 2) Resumen/clasificación de CVs con humano en el loop. 3) Análisis de encuestas de clima por tema y sentimiento.
¿Qué es RAG?::Buscar pedazos relevantes de tus documentos, meterlos en el prompt y que el LLM responda con esa info (examen a libro abierto).
¿Cómo protegés datos personales con un LLM?::Enmascaro (Presidio), mando lo mínimo, plan empresarial sin entrenamiento, sin PII en logs.
¿Cuándo NO usarías IA?::Cuando una regla simple alcanza, cuando el error es muy caro (sueldos/despidos) o cuando no hay datos de calidad.
¿Cómo reducís alucinaciones?::Darle los datos (RAG), "si no sabés decilo", temperatura baja, citar fuentes y validar con código.
¿Cómo evitás sesgo en selección?::Humano en el loop, sacar variables sensibles, auditar resultados por grupo.
¿Build vs buy?::Comprar si es commodity; construir si es diferencial o hay datos sensibles que no pueden salir.

## Técnico
Diferencia WHERE vs HAVING::WHERE filtra filas antes de agrupar; HAVING filtra grupos después del GROUP BY.
INNER vs LEFT JOIN::INNER trae solo los que coinciden en ambas; LEFT trae todo de la izquierda aunque no tenga pareja (con NULL).
¿Qué es una window function?::Calcula mirando otras filas sin colapsarlas, ej. ROW_NUMBER() OVER (PARTITION BY area ORDER BY sueldo DESC).
¿Cómo bajás costos en BigQuery?::No usar SELECT *, filtrar por partición (fecha), clustering y previsualizar los bytes que va a leer.
ETL vs ELT::ETL transforma antes de cargar; ELT carga crudo y transforma adentro del warehouse (lo típico en BigQuery).
¿Qué es idempotencia?::Correr algo 2 veces da el mismo resultado que 1 vez (MERGE/upsert en vez de INSERT).
¿Qué hacés ante un 429?::Reintento con backoff exponencial (1s, 2s, 4s...) y respeto el rate limit.
Webhook vs polling::Webhook: el sistema te avisa. Polling: vos preguntás cada X tiempo (más lento y costoso).
¿Para qué una cola de mensajes?::Desacoplar sistemas y absorber picos: el productor deja mensajes y el consumidor los procesa a su ritmo; ACK confirma y DLQ guarda los fallidos.
¿Qué es n8n y cuándo no usarlo?::Orquestador visual de flujos; no lo uso para volúmenes enormes o lógica muy compleja, ahí va código o un pipeline.
¿Cómo elegís un gráfico?::Tendencia → líneas; comparar categorías → barras; KPI → número grande; relación → dispersión. Evitar torta con muchas categorías.

## 💻 Live coding probable (practicá en voz alta)
**SQL 1: empleados con más de 2 licencias en el último año**
```sql
SELECT empleado_id, COUNT(*) AS licencias
FROM licencias
WHERE fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR)
GROUP BY empleado_id
HAVING COUNT(*) > 2;
```

**SQL 2: el sueldo más alto por área (window function)**
```sql
SELECT * FROM (
  SELECT area, nombre, sueldo,
         ROW_NUMBER() OVER (PARTITION BY area ORDER BY sueldo DESC) AS rn
  FROM empleados
) AS t
WHERE rn = 1;
```

**SQL 3: empleados sin evaluación (LEFT JOIN + NULL)**
```sql
SELECT e.id, e.nombre
FROM empleados e
LEFT JOIN evaluaciones ev ON ev.empleado_id = e.id
WHERE ev.id IS NULL;
```

**Python 1: rotación (attrition) por área con pandas**
```python
import pandas as pd
df = pd.read_csv("empleados.csv")
rotacion = df.groupby("area")["se_fue"].mean().sort_values(ascending=False)
```

**Python 2: API paginada con reintento**
```python
import requests, time

def traer_todo(url, token):
    datos, pagina = [], 1
    while True:
        for intento in range(5):
            r = requests.get(url, params={"page": pagina},
                             headers={"Authorization": f"Bearer {token}"})
            if r.status_code != 429:
                break
            time.sleep(2 ** intento)  # backoff exponencial
        r.raise_for_status()
        items = r.json()["items"]
        if not items:
            return datos
        datos.extend(items)
        pagina += 1
```

## 🏗️ Diseño de sistema: "Armá un chatbot de RR.HH."
1. **Aclarar:** ¿cuántos usuarios? ¿qué documentos? ¿qué idioma? ¿qué sistemas hay que integrar?
2. **Ingesta:** documentos → chunking → embeddings → base vectorial.
3. **Consulta:** pregunta → buscar chunks → prompt con contexto → LLM → respuesta **con fuente citada**.
4. **Seguridad:** permisos por rol, PII enmascarada, logs sin datos sensibles ([[09 - Seguridad, PII y Multicloud]]).
5. **Calidad:** set de preguntas de prueba, medir aciertos y feedback del usuario (👍/👎).
6. **MVP primero:** una política (por ejemplo vacaciones), validar y después escalar.

## 🇬🇧 En inglés (por si cambian de idioma)
- *"I'm a hybrid profile: technical background in Python, SQL, APIs and generative AI, plus experience leading projects end to end."*
- *"When a junior gets stuck, I first ask what they've tried, guide them with questions, pair program if needed, and we document what we learned."*
- *"I'd start with an MVP, validate it with the business, and then scale."*
- *"Could you clarify the expected volume / users?"* (para ganar tiempo)

## 🆘 Si me quedo en blanco
1. **Pregunta aclaratoria** (queda senior): "¿Para cuántos usuarios sería?"
2. **Pensar en voz alta:** "Lo encararía así: primero..., después...".
3. **Honestidad:** "Eso puntual no lo usé, pero lo resolvería así... y lo validaría con...". Nunca inventar.
4. **Volver a tu terreno:** "En un caso parecido hicimos...".

## Preguntas para hacerles al final
- ¿Qué stack usan hoy y en qué etapa se traban más los proyectos?
- ¿Cuántos devs serían y de qué nivel?
- ¿Cómo se mide el éxito del puesto a los 6 meses?
