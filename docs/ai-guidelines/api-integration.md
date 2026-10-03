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

| Variable                        | Dónde              | Para qué                                                   |
| ------------------------------- | ------------------ | ---------------------------------------------------------- |
| `API_BASE_URL`                  | Servidor           | URL base de `asinko-app` por ambiente (sin `NEXT_PUBLIC_`) |
| `NEXT_PUBLIC_SUPABASE_URL`      | Cliente y servidor | Mismo proyecto Supabase que el backend                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente y servidor | Key pública; la protección real son las políticas RLS      |

Todas validadas en `src/env.ts` (ver `libraries.md`). **Nunca** usar la `service_role` key de Supabase en este repo.

## Cliente HTTP

Un único cliente en `src/lib/api/` (`import 'server-only'`) que todos los features usan desde su `lib/`. Principio: **el front no confía en el backend**. Toda respuesta se valida, todo fallo vuelve como resultado tipado y ningún secreto ni dato personal cruza al navegador o a los logs.

```ts
const result = await apiRequest({
  method: 'GET',
  path: '/api/v1/profiles/:identifier', // patrón del contrato
  params: { identifier: username }, // el cliente los codifica
  schema: rawProfileSchema, // forma cruda del backend, obligatoria
})
```

- **Rutas como patrones del contrato con parámetros con nombre.** El cliente codifica cada valor (`encodeURIComponent`): un `../`, `?` o `#` en un username o slug nunca cambia la ruta. TypeScript exige exactamente los parámetros que pide el patrón. Nunca se arma un path concatenando strings.
- **Validación de cada respuesta con zod** (obligatoria). Si no cumple el esquema es un fallo `VALIDATION` (cambió el contrato): se reportan los campos que fallaron, nunca sus valores.
- **Timeout de 10 s** en cada request (`API_TIMEOUT_MS`, de 1 a 60 s). Subirlo solo en desarrollo contra un backend lento (por ejemplo, el backend local contra una base en otro continente); nunca para esconder una API lenta en producción.
- **Nunca lanza por el resultado de un request**: siempre devuelve `ApiResult` (ver Errores). Solo lanza ante un bug propio, como un parámetro de ruta faltante.
- **El endpoint se identifica por su patrón** (`GET /api/v1/profiles/:identifier`) en errores y reportes, nunca por la URL concreta: puede llevar un username, un email o un id.

### Por feature: esquema crudo + mapper

Cada feature define en su `lib/`:

1. El **esquema crudo**: la forma real que devuelve el backend.
2. Un **mapper** a un **tipo de dominio** propio, con los nombres y la forma que necesita la UI.

La UI solo conoce tipos de dominio. Si el backend renombra un campo o cambia un formato, se ajusta el mapper y nada más. De paso, el mapper deja solo los campos que la UI usa: a los Client Components nunca les llega la respuesta completa (`security.md`).

### Validar antes de la red

Los parámetros con formato conocido (ids, slugs, cursores) se validan con zod en la función del feature **antes** de llamar a la API. Si no cumplen, se devuelve `invalidInput(endpoint)` sin gastar un request.

### Listas: degradación elegante

En listados (feed, comunidades), un ítem mal formado no tira abajo la lista: el esquema de la lista acepta ítems desconocidos y `keepValidItems(items, itemSchema, endpoint)` se queda con los válidos y **reporta a Sentry cuántos descartó y qué campos fallaron**. Descartar en silencio ocultaría que cambió el contrato.

### Formato del backend

| Caso          | Forma                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Error         | `{ "error": { "code": string, "message": string, ...extra } }` (ej. `retryAfter` en 429) |
| Lista         | `{ "items": T[], "nextCursor": string                                                    | null }`, cursor opaco, 20 ítems por página |
| Sin contenido | `204` sin body                                                                           |

### Errores

Todo fallo vuelve como `{ ok: false, kind, code, errorKey, endpoint, status? }`. `errorKey` es la clave de traducción que muestra la UI.

| `kind`       | Status / causa                           | `code`                                                               | `errorKey`                                           | ¿Se reporta?        |
| ------------ | ---------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- | ------------------- |
| `expected`   | `401`, `403`, `404`, `409`, `422`, `429` | El del backend (`NOT_FOUND`, `USER_MISMATCH`…) o derivado del status | `api.errors.<CODE>` (o `UNKNOWN` si no lo conocemos) | No                  |
| `unexpected` | `5xx`                                    | `HTTP`                                                               | `api.errors.UNAVAILABLE`                             | Sí, automáticamente |
| `unexpected` | Sin conexión                             | `NETWORK`                                                            | `api.errors.UNAVAILABLE`                             | Sí                  |
| `unexpected` | Más de 10 s                              | `TIMEOUT`                                                            | `api.errors.UNAVAILABLE`                             | Sí                  |
| `unexpected` | 2xx que no cumple el esquema             | `VALIDATION`                                                         | `api.errors.UNAVAILABLE`                             | Sí, con los campos  |

Qué hace cada pantalla (`engineering-principles.md § Manejo de errores`):

- **Contenido principal**: `getOrThrow(result)` → `error.tsx`. Un `NOT_FOUND` → `notFound()`.
- **Secciones secundarias**: estado de error local; el resto de la página sigue.
- **Server Actions**: devuelven `ActionResult` con el `errorKey`.
- `401`: sin login todavía, la UI muestra que la acción requiere una cuenta. Cuando exista, redirige al login con `?next=` relativo (`security.md`).

El `message` del backend **nunca llega a la UI** (viene en español y es para debug).

### Smoke tests contra el backend real

`pnpm api:smoke` llama al backend de desarrollo (`API_SMOKE_BASE_URL`, por defecto `asinko-app` en `http://localhost:3001`) con el `liveExample` de cada mock de tipo "contrato" y valida la respuesta con **el mismo esquema** que usa el mock. Detecta cuándo el backend y nuestro contrato se separaron. Solo en desarrollo: nunca en el CI normal ni contra producción.

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

En el **cliente HTTP**, no en los features. `API_MOCKS` tiene tres valores:

| Valor     | Qué se mockea                                                         | Para qué                                           |
| --------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| `false`   | Nada: todo va al backend                                              | Producción y desarrollo contra el backend completo |
| `missing` | Solo las rutas que el backend todavía no tiene (`implemented: false`) | Desarrollo con el backend real (hoy: activos, E14) |
| `true`    | Todas las rutas registradas, con el usuario demo como sesión          | CI y desarrollo sin backend                        |

Cuando una ruta se mockea, el cliente la responde desde `src/mocks/` en vez de llamar a la red:

- Todo el resto del camino corre igual que con datos reales: validación zod, mapeo de errores, `ActionResult`. Pasar a datos reales es **apagar el mock de esa ruta**, sin tocar el feature.
- **Mock por endpoint**, no todo o nada. Lo que el backend ya tiene (hoy, E01) va siempre contra la API real.
- `src/env.ts` **rechaza `API_MOCKS` distinto de `false` en producción**: el build falla.
- Cada ruta declara `implemented`: si el backend ya la tiene (rama `dev` de `asinko-app`). Al implementarse una ruta en el backend, se marca `implemented: true` y deja de mockearse con `missing`.
- El usuario demo (`getViewer`) existe solo con `true`: con el backend real, las escrituras piden login.
- Sin librería de mocking: un registro de rutas (`src/mocks/handlers.ts`) que el cliente consulta antes de ir a la red (menos de ~50 líneas, ver criterio en `libraries.md`).
- **El cliente aplica a la respuesta del mock la misma validación y el mismo mapeo de errores** que a la real: un mock también prueba ese camino.

```
src/mocks/
├── handlers.ts          # MOCK_ROUTES: método, ruta con :params, kind, schema, example y handler
├── match.ts             # Compara método + ruta y extrae los params
├── demo-user.ts         # Usuario demo (sesión mientras no hay login)
├── fixtures/            # Datos de ejemplo, uno por recurso (posts.ts, communities.ts…)
└── README.md            # Qué está mockeado y por qué (contrato sin implementar o propuesta)
```

### Reglas

- **Los mocks respetan el contrato.** Cada ruta declara el `schema` de su respuesta y un `example` de request; `src/mocks/fixtures.test.ts` ejecuta cada handler con su ejemplo y valida la respuesta. Un mock que no pasa el esquema rompe los tests.
- **Los mocks simulan también los errores** (`401`, `404`, `422`…) y la paginación con `nextCursor`, no solo el camino feliz.
- Dos tipos de mock, y siempre se sabe cuál es cuál:

  | Tipo          | Qué es                                                                  | Dónde se documenta                                                  |
  | ------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
  | **Contrato**  | El endpoint está en `docs/references/api/` pero no está implementado    | Nada extra: el contrato ya lo describe                              |
  | **Propuesta** | El front necesita algo que el contrato no tiene (un campo, un endpoint) | `docs/references/api/proposals.md`, con la forma exacta y el motivo |

- `proposals.md` es lo que se le pasa al backend. Cuando el backend lo implementa, la propuesta pasa al snapshot del contrato y se apaga el mock.

## Contrato

- El snapshot en `docs/references/api/` se actualiza en el **mismo PR** que adapta el front a un cambio del backend.
- Si el front necesita algo que el contrato no tiene (un campo, un endpoint), se escribe en `docs/references/api/proposals.md` y se mockea (ver arriba). **No se compensa** con lógica en el front (por ejemplo, reparsear menciones que el backend ya resuelve).
- En los tests, el cliente HTTP se mockea en el borde (las funciones de `features/<feature>/lib/`), con fixtures que respetan el contrato (ver `testing.md`).
