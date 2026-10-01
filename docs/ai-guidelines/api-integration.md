# Integración con el backend

> `asinko-web` (este repo) es **solo el frontend**. El backend es [`asinko-app`](https://github.com/eceraolo/asinko-app): API REST en `/api/v1`, Postgres con Prisma y autenticación con Supabase. Este repo **no accede a la base de datos** ni usa Prisma.

## Arquitectura

```
Navegador ──► asinko-web (Next.js)  ──HTTP──►  asinko-app /api/v1  ──►  Supabase (Postgres + Auth)
              Server Components                 route handlers
              Server Actions
```

- **El navegador nunca llama a la API directo.** Todas las llamadas salen del servidor de `asinko-web`: Server Components para leer, Server Actions para escribir (ver `security.md`).
- El contrato vive en [`docs/references/api/`](../references/api/README.md) (snapshot del contrato del backend).

## Configuración

| Variable | Dónde | Para qué |
|---|---|---|
| `API_BASE_URL` | Servidor | URL base de `asinko-app` por ambiente (sin `NEXT_PUBLIC_`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente y servidor | Mismo proyecto Supabase que el backend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente y servidor | Key pública; la protección real son las políticas RLS |

Todas validadas en `src/env.ts` (ver `libraries.md`). **Nunca** usar la `service_role` key de Supabase en este repo.

## Cliente HTTP

Un único cliente en `src/lib/api/` (`import 'server-only'`) que todos los features usan desde su `lib/`:

- Arma la URL con `API_BASE_URL` y reenvía la sesión (ver abajo).
- **Valida cada respuesta con zod.** Si la respuesta no matchea el esquema, es un error inesperado: se lanza y lo reporta Sentry.
- Traduce los errores del backend a resultados tipados (ver tabla).

### Formato del backend

| Caso | Forma |
|---|---|
| Error | `{ "error": { "code": string, "message": string, ...extra } }` (ej. `retryAfter` en 429) |
| Lista | `{ "items": T[], "nextCursor": string \| null }`, cursor opaco, 20 ítems por página |
| Sin contenido | `204` sin body |

### Errores

| Status | Código típico | Cómo lo trata el front |
|---|---|---|
| `401` | `UNAUTHENTICATED` | Redirige al login (con `?next=` relativo, ver `security.md`) |
| `403` | `USER_MISMATCH`, `ACCOUNT_DELETED`, … | Error esperable: clave de traducción por código |
| `404` | `NOT_FOUND` | `notFound()` de Next. El backend devuelve 404 también cuando el recurso existe pero no es visible |
| `409` / `422` / `429` | `USERNAME_TAKEN`, `SLUG_TAKEN`, … | Error esperable: `ActionResult` con clave de traducción (ver `engineering-principles.md`) |
| `5xx` o red | — | Error inesperado: se lanza, lo captura `error.tsx` |

- El `message` del backend **no se muestra** al usuario (viene en español y es para debug). Se muestra la traducción del `code`.
- Un `code` desconocido cae en un mensaje genérico traducido.

## Sesión

- El login se hace contra **el mismo proyecto Supabase** que usa el backend, con `@supabase/ssr` en este repo.
- El backend lee la sesión **de las cookies de Supabase** (`getUser()`). El servidor de `asinko-web` reenvía el header `Cookie` de la sesión en cada llamada autenticada.
- `src/proxy.ts` refresca la sesión **antes** de que cualquier página o action llame a la API, así lo que se reenvía siempre tiene un access token vigente. Convive con la lógica de locale de next-intl y la CSP (ver `i18n.md` y `security.md`).

> ⚠️ **Riesgo conocido: rotación del refresh token.** El `proxy.ts` del backend también intenta refrescar la sesión. Si recibe un access token vencido, consume el refresh token reenviado y el `Set-Cookie` nuevo le llega al servidor de `asinko-web`, no al navegador: la sesión del usuario muere. Mitigación actual: refrescar siempre en nuestro `proxy.ts` antes de reenviar. **Solución pedida al backend:** aceptar `Authorization: Bearer <access_token>` en `/api/v1` y no refrescar en las rutas de la API. Hasta que eso exista, el diseño de auth lo trata como restricción.

## `userId` explícito

Toda escritura del backend exige `userId` en el body, path o query, y lo compara contra la sesión (`403 USER_MISMATCH`).

- El `userId` **siempre sale de la sesión en el servidor** (Server Action), nunca de un campo que mande el cliente.
- Nunca se expone en formularios ocultos ni se lee de `searchParams`.

## Mocks (mientras el backend no está completo)

El front no espera al backend: lo que falta se mockea **acá**, con la forma que queremos que tenga, y esa forma se le propone al backend.

### Dónde se mockea

En el **cliente HTTP**, no en los features. Con `API_MOCKS=true`, el cliente responde ciertas rutas desde `src/mocks/` en vez de llamar a la red:

- Todo el resto del camino corre igual que con datos reales: validación zod, mapeo de errores, `ActionResult`. Pasar a datos reales es **apagar el mock de esa ruta**, sin tocar el feature.
- **Mock por endpoint**, no todo o nada. Lo que el backend ya tiene (hoy, E01) va siempre contra la API real.
- `src/env.ts` **rechaza `API_MOCKS=true` en producción**: el build falla.
- Sin librería de mocking: es un mapa `método + ruta → handler` dentro del cliente (menos de ~50 líneas, ver criterio en `libraries.md`).

```
src/mocks/
├── handlers.ts          # Mapa método + ruta → handler, y qué rutas están mockeadas
├── fixtures/            # Datos de ejemplo, uno por recurso (posts.ts, communities.ts…)
└── README.md            # Qué está mockeado y por qué (contrato sin implementar o propuesta)
```

### Reglas

- **Los mocks respetan el contrato.** Las fixtures se validan con los mismos esquemas zod que las respuestas reales: un mock que no pasa el esquema rompe los tests.
- **Los mocks simulan también los errores** (`401`, `404`, `422`…) y la paginación con `nextCursor`, no solo el camino feliz.
- Dos tipos de mock, y siempre se sabe cuál es cuál:

  | Tipo | Qué es | Dónde se documenta |
  |---|---|---|
  | **Contrato** | El endpoint está en `docs/references/api/` pero no está implementado | Nada extra: el contrato ya lo describe |
  | **Propuesta** | El front necesita algo que el contrato no tiene (un campo, un endpoint) | `docs/references/api/proposals.md`, con la forma exacta y el motivo |

- `proposals.md` es lo que se le pasa al backend. Cuando el backend lo implementa, la propuesta pasa al snapshot del contrato y se apaga el mock.

## Contrato

- El snapshot en `docs/references/api/` se actualiza en el **mismo PR** que adapta el front a un cambio del backend.
- Si el front necesita algo que el contrato no tiene (un campo, un endpoint), se escribe en `docs/references/api/proposals.md` y se mockea (ver arriba). **No se compensa** con lógica en el front (por ejemplo, reparsear menciones que el backend ya resuelve).
- En los tests, el cliente HTTP se mockea en el borde (las funciones de `features/<feature>/lib/`), con fixtures que respetan el contrato (ver `testing.md`).
