# Propuestas de cambios al contrato

> Lo que el front necesita y el contrato de la API no tiene. Cada propuesta se mockea en `src/mocks/` con esta forma exacta (ver [`api-integration.md`](../../ai-guidelines/api-integration.md)) y se le pasa al backend para implementarla.
> Cuando el backend la implementa, se mueve al snapshot del contrato y se marca como resuelta acá.

## Formato

```
### P-NNN — Título corto
**Estado:** propuesta | acordada | implementada
**Endpoint:** MÉTODO /api/v1/...
**Motivo:** qué vista o flujo del front lo necesita.
**Cambio:** forma exacta (campos nuevos, request, response, errores).
```

## Propuestas

### P-001 — Menciones resueltas en la lectura de posts
**Estado:** propuesta
**Endpoint:** `GET /api/v1/posts/{id}`, `GET /api/v1/feed/following`, `GET /api/v1/feed/explore`
**Motivo:** el Home y el Detalle de post renderizan menciones `$ # @` como links. Hoy `entities` solo viene en la respuesta de `POST /posts`; sin eso, el front tendría que reparsear el texto y adivinar a qué entidad apunta cada mención.
**Cambio:** el recurso `Post` incluye siempre el mismo campo que ya devuelve `POST /posts`:

```
"entities": [{ "type": "TICKER" | "MENTION" | "COMMUNITY", "raw": string, "resolvedId": string, "position": [number, number] }]
```

### P-002 — Autenticación con Bearer en `/api/v1`
**Estado:** propuesta
**Endpoint:** todos los de `/api/v1`
**Motivo:** el front corre en otro dominio y reenvía la cookie de Supabase. El `proxy.ts` del backend puede refrescar la sesión con esa cookie y consumir el refresh token, dejando al usuario deslogueado (ver "Riesgo conocido" en `api-integration.md`).
**Cambio:** aceptar `Authorization: Bearer <access_token>` (validado con `supabase.auth.getUser(token)`) y excluir `/api/v1` del refresh de sesión del `proxy.ts`. Las cookies pueden seguir funcionando para la UI propia del backend.

### P-003 — Forma de respuesta del catálogo de activos

**Estado:** propuesta
**Endpoint:** `GET /api/v1/assets?q=`
**Motivo:** el autocompletado de `$` y el mock del front necesitan la forma exacta. E14 describe el endpoint pero no su respuesta.
**Cambio:** confirmar que responde la lista estándar del contrato, `{ "items": Asset[], "nextCursor": string | null }`, con el recurso `Asset` de E14. El mock del front ya asume esa forma.
