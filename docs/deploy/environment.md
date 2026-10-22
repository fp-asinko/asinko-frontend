# Variables de entorno

> Qué variables usa `asinko-web`, cuáles hacen falta en cada ambiente y, en detalle, **cómo configurar el ambiente DEV** (la rama `develop`) en Vercel.
> Las valida el build con zod (`src/lib/env-schema.ts`, aplicado en `src/env.ts`). Si falta una obligatoria o una regla no se cumple, **el build falla** y dice cuál.

## Reglas generales

- **Nunca** se pegan valores reales en el repo, en un issue, en un chat ni en un prompt de IA ([`security.md`](../ai-guidelines/security.md)). Viven en las variables del proyecto de Vercel o en el gestor de secretos del equipo.
- Las `NEXT_PUBLIC_*` llegan al navegador: nunca un secreto con ese prefijo. Next las escribe en el código al compilar. El resto solo existen en el servidor.
- En Vercel, **cualquier cambio de una variable pide un redeploy** para aplicarse.
- `APP_ENV` es el que manda, no `NODE_ENV`: los deploys de Vercel corren siempre con `NODE_ENV=production`.

## Todas las variables

| Variable                 | Obligatoria | Qué es                                                                                                                                                                      |
| ------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_ENV`                | Sí          | `development`, `preview` o `production`. Decide si el sitio se indexa (solo en `production`) y si se permiten los mocks y el login de desarrollo (en `production`, no).     |
| `NEXT_PUBLIC_SITE_URL`   | Sí          | URL pública de ese deploy, sin barra al final. Canonical, `metadataBase`, sitemap e imágenes para compartir.                                                                |
| `API_BASE_URL`           | Sí          | URL base del backend `asinko-app`, sin `/api/v1`.                                                                                                                           |
| `API_MOCKS`              | No          | `true`, `missing` o `false` (por defecto `false`). Ver [`api-integration.md § Mocks`](../ai-guidelines/api-integration.md). Con `APP_ENV=production` tiene que ser `false`. |
| `API_TIMEOUT_MS`         | No          | Cuánto espera cada pedido al backend, en ms (1000 a 60000; por defecto 10000).                                                                                              |
| `SENTRY_DSN`             | No          | DSN de Sentry para el servidor. Sin él, Sentry queda apagado.                                                                                                               |
| `NEXT_PUBLIC_SENTRY_DSN` | No          | DSN de Sentry para el navegador (el mismo proyecto).                                                                                                                        |
| `SUPABASE_URL`           | No          | URL del proyecto Supabase **del backend**. Solo para el login de desarrollo.                                                                                                |
| `SUPABASE_ANON_KEY`      | No          | La anon key de ese proyecto (la pública, **nunca** la `service_role`). Solo para el login de desarrollo.                                                                    |
| `DEV_LOGIN_EMAIL`        | No          | Email de la cuenta de prueba del botón "Dev login". Prohibida con `APP_ENV=production`.                                                                                     |
| `DEV_LOGIN_PASSWORD`     | No          | Su contraseña. Prohibida con `APP_ENV=production`.                                                                                                                          |

El **login de desarrollo** necesita las cuatro (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DEV_LOGIN_EMAIL`, `DEV_LOGIN_PASSWORD`) y `APP_ENV` distinto de `production`. Con alguna en blanco, el botón no aparece y la app funciona igual, sin sesión.

## Ambiente DEV (`develop`): lo que hace falta hoy

Objetivo: el backend real de `dev` para todo lo que ya existe, y mocks solo para lo que el backend todavía no tiene (logros, widgets de los grupos, "abierto a", marcas), con el login de desarrollo para probar escrituras.

| Variable               | Valor en DEV                                                                               | ¿Secreto?                           |
| ---------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------- |
| `APP_ENV`              | `development`                                                                              | No                                  |
| `NEXT_PUBLIC_SITE_URL` | La URL del deploy de `develop` en Vercel (por ejemplo `https://asinko-web-dev.vercel.app`) | No                                  |
| `API_BASE_URL`         | `https://asinko-app-web.vercel.app`                                                        | No                                  |
| `API_MOCKS`            | `missing`                                                                                  | No                                  |
| `SUPABASE_URL`         | La `NEXT_PUBLIC_SUPABASE_URL` de `asinko-app` en su ambiente `dev`                         | No                                  |
| `SUPABASE_ANON_KEY`    | La `NEXT_PUBLIC_SUPABASE_ANON_KEY` de `asinko-app` en su ambiente `dev`                    | Pública, pero no se pega en el repo |
| `DEV_LOGIN_EMAIL`      | El email de la cuenta de prueba (hoy la que entra como **@qa_uno**)                        | Sí                                  |
| `DEV_LOGIN_PASSWORD`   | Su contraseña, desde el gestor de secretos del equipo                                      | **Sí**                              |

**No hacen falta en DEV:** `API_TIMEOUT_MS` (el default alcanza contra el backend en Vercel), `SENTRY_DSN` y `NEXT_PUBLIC_SENTRY_DSN` (opcionales; si se cargan, los errores de DEV llegan a Sentry).

La cuenta de prueba se crea en `asinko-app` (`https://asinko-app-web.vercel.app/login`) y tiene que terminar su onboarding (elegir el username). Es la misma que usa cada dev en su `.env.local`.

### Qué se ve con esta configuración

- Feed, comunidades, perfiles, activos, comentarios, votos, borradores y destacados: contra el backend real de `dev`.
- **Logros** y **widgets**: desde los mocks, con los usuarios y grupos reales (cada persona tiene una vitrina de ejemplo; cada grupo de `dev`, sus widgets). Lo que un moderador guarda en un widget vive en la memoria de esa instancia: puede perderse en un redeploy o no verse desde otro dispositivo, hasta la fase 3 del backend.
- **Dev login** en la barra superior: entra con la cuenta de prueba. Todo lo que escribe (posts, votos, perfil) va a la base de `dev`.
- El sitio no se indexa: `noindex` y `robots.txt` cerrado.

### Configuración del proyecto en Vercel

- **Node.js:** 24.x (Settings → General → Node.js Version). El repo pide `>=24 <25`.
- **Gestor de paquetes:** pnpm, tomado de `packageManager` (`pnpm@11.1.3`) con Corepack. Si Vercel usa otra versión, agregar la variable `ENABLE_EXPERIMENTAL_COREPACK=1`.
- **Build:** los comandos por defecto de Next (`pnpm install`, `pnpm build`). No hace falta token de Sentry: el build no sube source maps.
- **Rama:** `develop` como rama del ambiente DEV (Preview con dominio fijo, o un proyecto propio).
- Cargar las variables **en el ambiente que construye `develop`** (Preview, si DEV es un deploy de preview) y hacer un redeploy después de cada cambio.

### Cómo verificar que quedó bien

1. Abrir el deploy: el pie de la columna derecha dice **Version 0.1.0** y arriba aparece el botón **Dev login**.
2. **Dev login** → la barra muestra `@<usuario> · Dev logout`.
3. El perfil de esa cuenta muestra la tarjeta de **Logros**; un grupo como `#macro`, sus **widgets**.
4. Crear un post con imagen y verlo en su página. La imagen tiene que salir del Storage de Supabase de `dev`.
5. Si el build falla, el log de Vercel dice qué variable falta o qué regla no se cumple (por ejemplo `API_MOCKS must be false when APP_ENV is production`).

## Los otros ambientes

| Variable                               | QA (`staging`)                   | Producción (`main`)        |
| -------------------------------------- | -------------------------------- | -------------------------- |
| `APP_ENV`                              | `preview`                        | `production`               |
| `NEXT_PUBLIC_SITE_URL`                 | La URL de QA                     | El dominio final           |
| `API_BASE_URL`                         | El backend de QA                 | El backend de producción   |
| `API_MOCKS`                            | `missing`                        | `false` (obligatorio)      |
| `SUPABASE_*`, `DEV_LOGIN_*`            | Opcionales, con una cuenta de QA | **Nunca** (el build falla) |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Recomendadas                     | Recomendadas               |

Producción todavía no tiene login real ni la fase 3 del backend: logros y widgets no deberían publicarse ahí hasta entonces.
