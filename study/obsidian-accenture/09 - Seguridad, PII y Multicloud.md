---
tags: [accenture, seguridad, pii, cloud]
---
# 🔒 Seguridad, PII y Multicloud
← [[00 - Índice]]

## PII (Personally Identifiable Information = datos personales)
En RR.HH. hay **todo** sensible: DNI, sueldo, salud, evaluaciones.

**Mi regla de 4 (memorizala):**
1. **Enmascaro** antes de mandar al LLM (anonimizar: "Juan Pérez" → `<PERSONA_1>`).
2. **Mando el mínimo** necesario.
3. **Planes empresariales sin entrenamiento**: el proveedor no entrena con mis datos.
4. **No guardo PII en logs** (los registros del sistema).

**Presidio (frase senior):**
> "Uso Presidio de Microsoft: el Analyzer detecta PII con reglas y NLP (procesamiento de lenguaje), y el Anonymizer la reemplaza o enmascara antes de que el texto salga hacia el modelo."

Alternativas: Google Cloud DLP, AWS Comprehend.

## Contraseñas y secretos
**Nunca** van en un prompt. Van en un gestor de secretos:
- AWS Secrets Manager.
- GCP Secret Manager.
- Azure Key Vault.

## Permisos
- **Mínimo privilegio**: cada uno ve solo lo que necesita.
- En un chatbot de RR.HH., un empleado no puede ver datos de otro (permisos por rol, RBAC).

## Sesgo (bias) en IA de RR.HH.
- Un modelo de selección puede discriminar por género o edad.
- **Humano en el loop**: la IA sugiere, la persona decide.
- Auditar resultados por grupo y sacar las variables sensibles.

## Leyes que conviene nombrar
- **Ley 25.326** (Argentina, datos personales).
- **LGPD** (Brasil).
- **GDPR** (Europa).

## Multicloud: "¿Y si no hay Azure?"
| Necesidad | Azure | AWS | GCP |
|---|---|---|---|
| LLM | Azure OpenAI | Bedrock | Vertex AI |
| Data warehouse | Synapse | Redshift | BigQuery |
| Colas | Service Bus | SQS/SNS | Pub/Sub |
| Funciones serverless | Functions | Lambda | Cloud Functions |
| Secretos | Key Vault | Secrets Manager | Secret Manager |

> "Los conceptos son los mismos; cambia el nombre del servicio. Me adapto al stack del cliente."
