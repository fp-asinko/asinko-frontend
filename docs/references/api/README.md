# Contrato de la API (snapshot)

> **Copia de referencia**, no es la fuente de verdad. La fuente es el artifact [ASINKO Endpoint Spec](https://claude.ai/artifact/WHoBs9Vco9qbcuvS79rkZr), mantenido por el equipo de backend.
> Snapshot tomado el 2026-09-30. Si el artifact cambia, se actualiza esta carpeta en el mismo PR que adapta el front.

API REST implementada como route handlers de Next.js en `asinko-app/apps/web/src/app/api/v1/`, sobre Postgres (Prisma) y Supabase Auth. Cómo la consume este repo: ver [`api-integration.md`](../../ai-guidelines/api-integration.md).

## Convenciones (verificadas en el código del backend)

El `README.md` del contrato vive en el repo de docs del backend (`financeshowoff-design-docs/api/README.md`) y no está en el artifact. Lo siguiente sale del código de `asinko-app` (`src/lib/api/`):

- **Sesión**: cookies de Supabase (`@supabase/ssr`), validadas con `supabase.auth.getUser()`. No acepta `Authorization: Bearer`.
- **Error**: `{ "error": { "code": string, "message": string, ...extra } }`. `500` → `INTERNAL`; violación de unicidad → `409 CONFLICT`.
- **Lista**: `{ "items": T[], "nextCursor": string | null }`. Cursor opaco (base64 de `createdAt|id`), 20 por página.
- **404 siempre, nunca 403** cuando el recurso existe pero el viewer no lo puede ver.
- **`userId` explícito** en toda escritura, comparado contra la sesión (`403 USER_MISMATCH`). Escrituras de una cuenta borrada: `403 ACCOUNT_DELETED` (no está en el contrato).

## Dominios

| Archivo | Dominio | ¿Lo usa el MVP? | ¿Implementado? (2026-09-30) |
|---|---|---|---|
| [E01-identidad-y-cuenta.md](E01-identidad-y-cuenta.md) | Usuarios, perfil, follow, bloqueo | Sí: registro (`POST /users`) | ✅ |
| [E02-comunidades.md](E02-comunidades.md) | Comunidades y membresía | Sí | ❌ |
| [E03-posts-contenido-abierto.md](E03-posts-contenido-abierto.md) | Posts y encuestas | Sí | ❌ |
| [E04-feed-y-descubrimiento.md](E04-feed-y-descubrimiento.md) | Feed y búsqueda | Sí | ❌ |
| [E05-interaccion-social.md](E05-interaccion-social.md) | Votos y comentarios | Sí | ❌ |
| [E07-notificaciones-y-mensajeria.md](E07-notificaciones-y-mensajeria.md) | Notificaciones | No (fase 3) | ❌ |
| [E11-contenido-finanzas.md](E11-contenido-finanzas.md) | Tesis | No (fase 2) | ❌ (el motor de resolución existe en `apps/worker`) |
| [E12-track-record-y-reputacion.md](E12-track-record-y-reputacion.md) | Track record | No (fase 2) | ❌ |
| [E14-primitivas-financieras.md](E14-primitivas-financieras.md) | Activos, sentiment, alertas de precio | Parcial: autocompletar `$` (`GET /assets?q=`) | ❌ |

## Pendiente del backend

Los cambios de forma del contrato van en [`proposals.md`](proposals.md). Acá, lo que no es una forma nueva:

- [ ] Implementar E02, E03, E04, E05 y `GET /assets?q=` (E14). Mientras tanto, el front los mockea.
- [ ] URL base de la API por ambiente (dev/staging y prod).
- [ ] No hay endpoint de subida de imágenes. Si se sube directo a Supabase Storage: políticas del bucket (quién sube, tipos y tamaño permitidos).
- [ ] `body` de posts y comentarios es Markdown: confirmar qué subset se soporta.
