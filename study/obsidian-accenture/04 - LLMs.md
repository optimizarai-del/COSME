---
tags: [accenture, llm, ia]
---
# 🤖 LLMs
LLM (Large Language Model) = IA que predice la siguiente palabra. Ej: Claude, GPT, Gemini. ← [[00 - Índice]]

- **Token**: pedacito de texto (~4 letras). Se paga por token.
- **Ventana de contexto**: cuánto texto "ve" de una vez.
- **Roles**: `system` (instrucciones generales) · `user` (la pregunta) · `assistant` (la respuesta).
- **Temperature**: baja (0–0.3) = predecible, ideal para JSON/clasificar; alta (0.7–1) = creativo.

## Prompt engineering (saber pedir)
1. Rol ("Sos analista senior").
2. Contexto.
3. Tarea clara.
4. Formato de salida (ej. JSON).
5. Ejemplos (few-shot = con pocos ejemplos; zero-shot = sin ejemplos).
6. "Pensá paso a paso" (chain of thought).

## Alucinaciones
El modelo inventa con seguridad. Cómo reducirlas: darle los datos, "si no sabés decilo", bajar la temperatura, validar con código.

## RAG = examen a libro abierto
Retrieval-Augmented Generation:
1. **Buscar** pedazos relevantes de tus docs.
2. **Meterlos** en el prompt.
3. **Generar** la respuesta.

Piezas:
- **Embedding**: texto convertido a números que representan su significado.
- **Base vectorial**: busca los más parecidos (Pinecone, pgvector).
- **Chunking**: cortar documentos en pedazos.

Salida estructurada → pedir **JSON** para que el código la lea.
