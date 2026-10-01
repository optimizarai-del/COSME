---
tags: [accenture, api, colas]
---
# 🔌 APIs y Colas
API = un mozo: llevás el pedido al servidor y te trae la respuesta. ← [[00 - Índice]]

## REST: URL (endpoint) + verbo
| Método | Para |
|---|---|
| `GET` | Leer |
| `POST` | Crear |
| `PUT` / `PATCH` | Modificar (todo / una parte) |
| `DELETE` | Borrar |

## Códigos
**2xx** bien (200 OK, 201 Created) · **4xx** culpa tuya (400 mal pedido, 401 sin clave, 403 sin permiso, 404 no existe, 429 demasiados pedidos) · **5xx** culpa del servidor (500).

## Partes del pedido
Headers (datos extra y clave) · query params (`?pais=AR`) · body (JSON que mandás).

## Autenticación
API Key · Bearer Token (`Authorization: Bearer ...`) · OAuth ("Entrar con Google"). ⚠️ Claves en **variables de entorno**, nunca en el código.

## Conceptos clave
- **Paginación**: los resultados vienen por páginas (page / offset+limit / cursor) → loop.
- **Rate limit**: máximo de pedidos por minuto. Si te pasás, recibís 429 → reintentar con **backoff exponencial** (1s, 2s, 4s…).
- **Webhook**: el otro sistema **te avisa** (POST a tu URL). Es el timbre del delivery, no llamarlo cada 5 minutos.
- **GraphQL**: vos elegís exactamente qué campos traer.

## Colas (RabbitMQ, Pulsar, Kafka, Pub/Sub) = fila del banco
- **Productor** manda mensajes → **consumidor** los procesa de a poco.
- **ACK**: "ya lo procesé, borralo". Sin ACK, el mensaje vuelve a la cola.
- **DLQ** (Dead Letter Queue): mensajes que fallaron varias veces van aparte.
- **Pub/Sub**: un mensaje llega a muchos suscriptores (como un grupo de WhatsApp).

Sigue en [[06 - Pipelines]].
