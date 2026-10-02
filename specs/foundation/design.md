# Foundation — Design

> **Spec:** `foundation` · **Rama:** `feature/foundation-project-setup` · **Estado:** ✅ aprobado (2026-10-01) — D-01 y D-02 aprobadas
> **Fase:** 2 de 3 (requirements → design → tasks) · Requirements: [requirements.md](requirements.md) ✅

Cómo se construye lo que pide `requirements.md`. Las referencias `F-NN` apuntan a sus criterios de aceptación. Las decisiones que necesitan aprobación explícita están marcadas **D-NN**.

## 1. Stack y versiones

| Pieza        | Versión           | Nota                                                   |
| ------------ | ----------------- | ------------------------------------------------------ |
| Node.js      | 24 LTS            | Igual que `asinko-app`. Fijada en `.nvmrc` y `engines` |
| pnpm         | 11                | `packageManager` en `package.json` (Corepack)          |
| Next.js      | 16.x (App Router) | Versión exacta en `package.json` (ver `libraries.md`)  |
| React        | 19.2              | Versión exacta                                         |
| TypeScript   | 5.x               | Estricto (F-02)                                        |
| Tailwind CSS | 4.x               | Tokens con `@theme inline`                             |
| shadcn/ui    | CLI `latest`      | Inicializado con Base UI, el default (F-16)            |

> Next.js 16 tiene cambios respecto de versiones anteriores (`proxy.ts`, sin `next lint`). Antes de escribir código de App Router se consulta la documentación de la versión instalada (`node_modules/next/dist/docs/`).

## 2. Árbol de archivos

Solo lo que crea este spec. Sigue `structure.md`.

```
.github/workflows/ci.yml
e2e/
├── fixtures/axe.ts                 # Helper de @axe-core/playwright
├── i18n.spec.ts                    # F-11, F-12, F-13
├── theme.spec.ts                   # F-19, F-20, F-21
├── shell.spec.ts                   # F-23, F-23b, F-26
├── errors.spec.ts                  # F-24
└── security-headers.spec.ts        # F-27, F-28, F-31
messages/{en,es,pt}.json
public/
specs/foundation/
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # <html lang>, providers, shell (F-13, F-23)
│   │   ├── page.tsx                # Home placeholder (el feed es del spec de Home)
│   │   ├── loading.tsx
│   │   ├── error.tsx               # F-25
│   │   ├── not-found.tsx           # F-24
│   │   └── [...rest]/page.tsx      # Llama a notFound() para URLs inexistentes con locale
│   ├── globals.css                 # Tokens iOS (F-17, F-18)
│   ├── global-error.tsx
│   ├── robots.ts                   # F-31
│   └── sitemap.ts
├── components/
│   ├── ui/                         # shadcn (Base UI) + asinko-logo.tsx
│   ├── molecules/
│   │   └── theme-toggle.tsx        # F-20, F-21
│   └── organisms/
│       ├── app-shell/              # Layout de 3 columnas (F-23)
│       ├── site-header/
│       ├── bottom-nav/
│       └── sidebar-left/
├── i18n/{routing,navigation,request}.ts
├── lib/
│   ├── api/                        # Cliente HTTP (sección 7)
│   ├── session.ts                  # Viewer actual (usuario demo con mocks, F-38)
│   ├── result.ts                   # ActionResult (engineering-principles.md)
│   └── utils.ts                    # cn()
├── mocks/                          # Sección 8
├── test/{setup.ts,render-with-intl.tsx}
├── env.ts                          # F-29, F-30
├── instrumentation.ts              # Sentry servidor (F-35)
├── instrumentation-client.ts       # Sentry cliente
└── proxy.ts                        # Locale + CSP (sección 5)
```

## 3. Layout de 3 columnas (F-23, F-23b, F-26)

Estructura de Reddit y del prototipo, mobile first:

| Ancho          | Columnas | Izquierda (comunidades)                             | Derecha (widgets) | Navegación     |
| -------------- | -------- | --------------------------------------------------- | ----------------- | -------------- |
| < 768px (base) | 1        | Panel que abre el botón de menú (`Sheet` de shadcn) | Oculta            | Barra inferior |
| `md` ≥ 768px   | 2        | Fija, 240px                                         | Oculta            | Barra superior |
| `lg` ≥ 1024px  | 3        | Fija, 240px                                         | Fija, 320px       | Barra superior |

- La columna central tiene un máximo de 680px y se centra, como en el prototipo.
- **El layout de `[locale]` arma lo global** (barra superior, columna izquierda, barra inferior). **Cada página decide su columna derecha** con el organismo `PageColumns`:

  ```tsx
  <PageColumns aside={<HomeWidgets />}>{/* contenido central */}</PageColumns>
  ```

  Sin `aside`, la columna central ocupa el espacio. Así la columna derecha cambia por vista sin parallel routes (KISS).

- Las columnas laterales son `sticky` bajo la barra superior y scrollean por separado.
- **Barras superior e inferior translúcidas** (skill `apple-design` §12): fondo semitransparente + `backdrop-filter: blur()`, con un borde superior sutil en vez de un divisor fuerte. Con `prefers-reduced-transparency: reduce` pasan a fondo sólido.
- La barra inferior respeta el área segura del iPhone (`env(safe-area-inset-bottom)`) y el layout usa `100dvh`, no `100vh` (skill `mobile-native`).
- Navegación: los ítems salen de un arreglo de configuración en el organismo. Este spec solo registra Home (F-23b); cada vista agrega el suyo. El ítem activo se marca con `aria-current="page"`.

## 4. Design system y tema

### Tokens de color (F-17) — D-01

Los colores de sistema de iOS en modo claro **no cumplen WCAG AA para texto** (4,5:1), que es obligatorio en `design-system.md`. Medido:

| Color iOS (claro)     | Contraste sobre blanco | ¿Texto AA? |
| --------------------- | ---------------------- | ---------- |
| systemBlue `#007AFF`  | 4,02                   | ❌         |
| secondaryLabel        | 3,44                   | ❌         |
| systemGreen `#34C759` | 2,22                   | ❌         |
| systemRed `#FF3B30`   | 3,55                   | ❌         |

Apple resuelve esto con las variantes de **alto contraste** de sus propios colores (las que usa iOS con "Aumentar contraste"). Propuesta:

- **Para texto y para el fondo de botones con texto encima: variante de alto contraste.**
- **Para íconos, bordes de foco y elementos no textuales: el color base de iOS**, que pide 3:1 y lo cumple (`#007AFF` sobre blanco: 4,02).

| Token                     | Uso                     | Claro                                                     | Oscuro                     |
| ------------------------- | ----------------------- | --------------------------------------------------------- | -------------------------- |
| `--background`            | Fondo de la app         | `#F2F2F7` (systemGroupedBackground)                       | `#000000`                  |
| `--card`                  | Tarjetas, columnas      | `#FFFFFF`                                                 | `#1C1C1E`                  |
| `--foreground`            | Texto principal (label) | `#000000`                                                 | `#FFFFFF`                  |
| `--muted-foreground`      | Texto secundario        | `rgb(60 60 67 / 0.76)` (alto contraste)                   | `rgb(235 235 245 / 0.6)`   |
| `--primary`               | Botón principal, links  | `#0040DD` (azul alto contraste)                           | `#409CFF` (alto contraste) |
| `--primary-foreground`    | Texto sobre `--primary` | `#FFFFFF`                                                 | `#000000`                  |
| `--ring` / `--tint`       | Foco, íconos activos    | `#007AFF`                                                 | `#0A84FF`                  |
| `--destructive`           | Errores, borrar         | `#D70015`                                                 | `#FF6961` (alto contraste) |
| `--success` / `--bullish` | Correcto, alcista       | `#1E7E34` (`#248A3D` de Apple da 4,40; oscurecido a 5,14) | `#30D158`                  |
| `--bearish`               | Bajista                 | `#D70015`                                                 | `#FF6961` (alto contraste) |
| `--warning`               | Avisos                  | `#C93400`                                                 | `#FF9F0A`                  |
| `--border`                | Separadores             | `rgb(60 60 67 / 0.29)`                                    | `rgb(84 84 88 / 0.65)`     |

- **Ajuste en T-09:** en oscuro, `#0A84FF` y `#FF453A` no llegan a 4,5:1 sobre fondos elevados (`#2C2C2E`: 3,82 y 4,09), así que el texto usa también las variantes de alto contraste (`#409CFF`, `#FF6961`); `#0A84FF` queda para foco e íconos (`--tint`).
- Los valores exactos se cargan en `:root` y `.dark` y se exponen en `@theme inline` (`design-system.md`).
- **Un test unitario verifica el contraste de cada par texto/fondo** de esta tabla: un token que baje de 4,5:1 (texto) o 3:1 (no texto) rompe el build.

> **D-01 — ✅ aprobada:** usar las variantes de alto contraste de Apple para texto y botones (cumple WCAG, sigue siendo la paleta de iOS) en lugar de `#007AFF` puro para todo (más fiel visualmente, incumple la guía de accesibilidad).

### Tipografía (F-18)

- Fuente del sistema: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. En Apple es SF Pro; no se descargan fuentes (cumple `seo.md`, cero requests).
- Escala en `rem` (respeta el tamaño de texto del usuario). Base 17px como iOS (`1.0625rem`) para el cuerpo; los inputs nunca bajan de 16px.
- Tracking por tamaño (skill `apple-design` §15): negativo en títulos grandes, levemente positivo en texto chico. Se definen como utilidades de tipografía (`text-title`, `text-body`, `text-caption`…), no por componente.

### Radios y profundidad

- `--radius: 0.75rem` (12px), cercano a las tarjetas de iOS; shadcn deriva `sm/md/lg/xl` de ese valor.
- Sombras suaves solo en elementos flotantes (sheets, popovers), no en tarjetas del feed.

### Tema claro/oscuro (F-19, F-20, F-21) — D-02

- **`next-themes`** con `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}` y `nonce` de la CSP. Su script inline evita el parpadeo del tema equivocado al cargar (F-20).
- `<html suppressHydrationWarning>` (lo pide la librería).
- `ThemeToggle` (molécula) usa el `Switch` de shadcn: con teclado, con nombre accesible traducido (`common.theme.toggle`) y anunciando el estado (`aria-checked`). Se renderiza recién al montar, para no mostrar un estado incorrecto.
- Ubicación: en la barra superior (F-23).

> **D-02 — ✅ aprobada:** sumar `next-themes` a `libraries.md`. Motivo: resolver el parpadeo de tema sin él implica un script inline propio + sincronización entre pestañas + manejo de CSP (más de las ~50 líneas del criterio). Es la opción que documenta shadcn; MIT, liviana.

### Logo

El wordmark de Asinko del prototipo pasa a `components/ui/asinko-logo.tsx` como SVG inline con `currentColor`, para que tome el color del tema. Lleva `aria-label` traducido. Es un átomo propio, no de shadcn: se documenta en `design-system.md` que `ui/` también aloja átomos de marca, con su test.

## 5. Proxy: locale + CSP (F-11, F-12, F-27, F-28)

`src/proxy.ts` hace, en orden:

1. Genera un **nonce** aleatorio por request.
2. Arma la CSP de `security.md` con ese nonce. En desarrollo agrega `'unsafe-eval'` (lo necesita React); en producción, nunca (F-28). Si hay DSN de Sentry, suma su dominio a `connect-src`.
3. Pasa el request a la middleware de **next-intl** (`createMiddleware(routing)`), que resuelve el locale y redirige (`/` → idioma del navegador o `/en`, F-12).
4. Sobre la respuesta, setea la CSP y el nonce para que Next los aplique a sus scripts.

- Matcher: todo salvo `api`, `_next`, archivos con extensión y prefetches (recomendación de Next para CSP).
- Los headers fijos (HSTS, nosniff, Referrer-Policy, Permissions-Policy) van en `next.config.ts` → `headers()`, que aplica también a los assets.

**Consecuencia: todas las páginas se renderizan en el servidor en cada request** (Next solo inyecta el nonce en render dinámico). Es esperable para una red social con feed personalizado, pero **contradice la sugerencia de `i18n.md` de `generateStaticParams` para rendering estático**. Se actualiza `i18n.md` en este PR: con CSP por nonce no se usa render estático; la excepción (páginas legales, landing) se evalúa en su spec.

> ✅ **Riesgo técnico resuelto (T-08):** el middleware de next-intl copia los headers del request que recibe y los reenvía al render (`NextResponse.next/rewrite({ request: { headers } })`). El proxy arma un `NextRequest` nuevo con la CSP y `x-nonce`, se lo pasa a next-intl y repite la CSP en la respuesta. Verificado contra el build de producción: todos los `<script>` llevan el nonce de la CSP y cada request genera uno nuevo. No hizo falta el plan B.

**Estilos — decisión de implementación:** la CSP separa `style-src-elem 'self' 'nonce-…'` (hojas y `<style>`, con nonce) de `style-src-attr 'unsafe-inline'`. Con un `style-src` único por nonce, el navegador ignora los atributos `style=""` del HTML del servidor, y Base UI los usa para posicionar paneles y popovers. Un atributo `style` no ejecuta código, así que el riesgo es bajo; los `<style>` siguen protegidos. `upgrade-insecure-requests` solo se envía si `NEXT_PUBLIC_SITE_URL` es https (en `http://localhost` rompería los e2e).

## 6. Variables de entorno (F-29, F-30, F-31)

`src/env.ts` con `@t3-oss/env-nextjs`. `.env.example` versionado con placeholders.

| Variable                                | Tipo                                       | Requerida    | Para qué                                    |
| --------------------------------------- | ------------------------------------------ | ------------ | ------------------------------------------- |
| `APP_ENV`                               | `development` \| `preview` \| `production` | Sí           | Indexación (F-31) y bloqueo de mocks (F-30) |
| `NEXT_PUBLIC_SITE_URL`                  | URL                                        | Sí           | `metadataBase`, canonical, sitemap          |
| `API_BASE_URL`                          | URL                                        | Sí           | Base de `asinko-app`                        |
| `API_MOCKS`                             | `true` \| `false` (default `false`)        | No           | Activa los mocks (sección 8)                |
| `NODE_ENV`                              | `development`                              | `production` | `test`                                      | Lo setea Next | Compartida; el proxy la usa para `'unsafe-eval'` solo en desarrollo |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | URL                                        | No           | Sin valor, Sentry queda apagado (F-35)      |

- Una regla del esquema hace fallar el build si `APP_ENV=production` y `API_MOCKS=true` (F-30).
- Se usa `APP_ENV` y no `NODE_ENV`, porque un deploy de preview también corre con `NODE_ENV=production` y no debe indexarse.
- `robots.ts`: `Disallow: /` salvo `APP_ENV=production` (F-31). El layout agrega `noindex` con la misma condición.

## 7. Cliente de la API (F-32, F-33, F-34)

> **Revisado después de T-16** (2026-10-01) al adoptar buenas prácticas de consumo de APIs. El detalle vigente está en `docs/ai-guidelines/api-integration.md § Cliente HTTP`; acá queda el resumen.

```
src/lib/api/
├── create-client.ts   # createApiClient(): fetch o mock, timeout, validación, clasificación de fallos
├── path.ts            # Patrones del contrato con :params, codificados (buildPath)
├── errors.ts          # ApiFailure (expected | unexpected), códigos, invalidInput, ApiRequestError
├── helpers.ts         # getOrThrow (contenido principal), keepValidItems (listas)
├── schemas.ts         # Envelope de error, lista paginada, 204
└── index.ts           # Instancia de la app: env, mocks y reporte a Sentry
```

- `import 'server-only'` (F-32). Cada respuesta se valida con zod (F-33).
- **El cliente nunca lanza por un request**: devuelve `ApiResult`. Los fallos inesperados (`NETWORK`, `TIMEOUT`, `HTTP` 5xx, `VALIDATION`) vuelven con `errorKey: api.errors.UNAVAILABLE` y se reportan a Sentry desde el propio cliente (F-34, F-35). Cada pantalla decide: `getOrThrow` para el contenido principal, error local para secciones secundarias.
- Rutas declaradas como patrones (`/api/v1/profiles/:identifier`) con `params` codificados; el endpoint se identifica por el patrón en errores y reportes, nunca por la URL concreta.
- **Sesión:** `src/lib/session.ts` expone `getViewer()`. Con mocks devuelve el usuario demo (F-38); sin mocks y sin login, `null`. Cuando llegue el login, solo cambia `getViewer()`.
- **Smoke tests** (`pnpm api:smoke`): validan el backend de desarrollo real contra los esquemas del contrato.

## 8. Mocks (F-36, F-37, F-38)

```
src/mocks/
├── handlers.ts       # registry: Map<'GET /api/v1/profiles/:identifier', handler>
├── demo-user.ts      # Usuario demo fijo (F-38)
├── fixtures/
│   └── profiles.ts   # Ejemplo: perfil del usuario demo
└── README.md         # Qué está mockeado y si es "contrato" o "propuesta"
```

- Cada ruta mockeada se registra con el mismo patrón de ruta que usa el cliente (no hace falta un matcher), su `schema` de respuesta, un `example` de request y, si el endpoint ya existe en el backend, un `liveExample` para los smoke tests. Un handler recibe `{ params, query, body }` y devuelve `{ status, body }`: puede simular errores (`404`, `422`) y paginación. Si necesita al usuario, lo pide a `getViewer()` como el resto del código. El cliente aplica a la respuesta del mock **la misma** validación y mapeo de errores que a la real.
- **Ejemplo incluido:** `GET /api/v1/profiles/{identifier}` (E01) con el perfil del usuario demo. Sirve para probar el mecanismo de punta a punta; los mocks de dominio los agrega cada vista.
- Las fixtures se tipan e importan con los mismos esquemas zod que valida el cliente. Un test recorre todas las fixtures y las parsea (F-37).
- Sin dependencias: matcher propio, menos de ~50 líneas (`libraries.md`).

## 9. Observabilidad (F-35)

- `@sentry/nextjs` con `instrumentation.ts` y `instrumentation-client.ts`, siguiendo la guía de la versión instalada.
- Se inicializa **solo si hay DSN**. `sendDefaultPii: false` y un `beforeSend` que elimina headers, cookies y query strings.
- La subida de source maps queda preparada pero inactiva hasta tener proyecto y token en CI.
- **En el navegador, Sentry se carga diferido y solo con DSN** (`instrumentation-client.ts` y `lib/observability/report-error.ts`, con `import()` dinámico). Sin DSN no suma JavaScript. Las variables públicas se leen de `env.client.ts`, sin zod. Medido en T-16: el SDK + zod sumaban ~148 KB gzip a la primera carga.
- Solo errores: sin tracing, sin Session Replay (privacidad y presupuesto de JS).

## 10. Errores y SEO base (F-24, F-25)

- `[locale]/not-found.tsx`: traducido, con link al Home. `[...rest]/page.tsx` llama a `notFound()` para que las URLs inexistentes dentro de un locale lleguen ahí.
- `[locale]/error.tsx` (Client Component): mensaje traducido + botón "Reintentar" (`retry()`, la API recomendada desde Next 16.2: vuelve a pedir los datos y re-renderiza), reporta a Sentry.
- `global-error.tsx`: último recurso, sin depender de traducciones (texto mínimo en inglés, es el único texto fijo permitido porque el layout raíz falló).
- `loading.tsx`: skeleton de la columna central con `Skeleton` de shadcn, mismas medidas que el layout final (sin CLS). **Vive en el grupo `[locale]/(main)/`, no en `[locale]/`**: un `loading` encima de `[...rest]` hace que la respuesta empiece a enviarse como 200 antes de `notFound()` (soft 404). Las vistas nuevas van dentro de `(main)`.
- **Limitación conocida (T-12):** el 404 responde con status 404 y `noindex`, y en el navegador se ve completo (shell + página traducida), pero **el HTML inicial es el documento de error de Next (`<html id="__next_error__">`) y el contenido se dibuja en el cliente**. Next lo advierte para layouts raíz con segmentos dinámicos (`[locale]`). Descartado: `not-found` en el segmento de `[...rest]`, `global-not-found` (experimental) y evitar `notFound()` en `i18n/request.ts`. Un proyecto recién creado con layout raíz estático sí renderiza el 404 en el servidor. Impacto bajo (página de error, sin efecto en SEO); se revisa si se reestructura el layout raíz o al actualizar Next/next-intl.
- Metadata en `[locale]/layout.tsx` con `generateMetadata`: `metadataBase`, título y descripción traducidos, `alternates.languages` con `x-default` → `en`, canonical por idioma (`seo.md`).

## 11. i18n (F-11 a F-15)

- `src/i18n/routing.ts`: `locales: ['en', 'es', 'pt']`, `defaultLocale: 'en'`, `localePrefix: 'always'`. `pathnames` se declara vacío y cada vista suma sus rutas traducidas.
- `messages/*.json` con los namespaces `common` (tema, navegación, logo), `errors` (páginas de error) y `api.errors` (códigos del backend). Las traducciones de `es` y `pt` son de UI básica; si alguna no está aprobada se marca `TODO(i18n)` en el PR.
- Test de paridad de claves: aplana los tres JSON y compara conjuntos (F-14).

## 12. Tooling (F-01 a F-07)

| Pieza         | Config                                                                                                                                                                                                                                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint (flat) | `eslint-config-next` (core-web-vitals + typescript) · `jsx-a11y` · `eslint-plugin-boundaries` con la tabla de `tooling.md` · `react/no-danger` · `no-restricted-imports` (`next/link`, `next/navigation` fuera de `src/i18n/`; `@radix-ui/*` en todo el proyecto) · `no-console` (permite `warn`/`error`) · `eslint-config-prettier` al final |
| Prettier      | La config de `tooling.md`                                                                                                                                                                                                                                                                                                                     |
| Lefthook      | `pre-commit`: ESLint + Prettier sobre staged · `commit-msg`: commitlint · `pre-push`: `typecheck` + `test`                                                                                                                                                                                                                                    |
| commitlint    | `@commitlint/config-conventional` con los tipos de `conventions.md`                                                                                                                                                                                                                                                                           |
| Vitest        | La config de `testing.md`, con `src/test/setup.ts`                                                                                                                                                                                                                                                                                            |
| Playwright    | Proyectos `mobile` (Pixel 7) y `desktop`, `webServer: pnpm build && pnpm start`, `@axe-core/playwright`                                                                                                                                                                                                                                       |
| VS Code       | `.vscode/extensions.json` y `settings.json` de `tooling.md`                                                                                                                                                                                                                                                                                   |

**F-04** se verifica con un test de lint: archivos de ejemplo que violan las reglas de capas (en `src/test/fixtures/boundaries/`, excluidos del build) y un test que corre ESLint sobre ellos y espera errores.

## 13. CI (F-39)

`.github/workflows/ci.yml` en push y PR a `develop`, `staging` y `main`:

1. Checkout + pnpm + Node 24 con caché.
2. `pnpm install --frozen-lockfile`
3. `format:check` → `lint` → `typecheck` → `test:coverage` → `build` → `test:e2e` (sube el trace de Playwright si falla).
4. En paralelo: escaneo de secretos (gitleaks) y `pnpm audit --audit-level high`.

El build de CI corre con `APP_ENV=preview`, `API_MOCKS=true` y URLs de placeholder: no necesita ningún secreto ni el backend.

## 14. Dependencias

Todas están en `libraries.md`, `testing.md` o `tooling.md`, salvo:

| Nueva                    | Para qué                                                    | Estado                     |
| ------------------------ | ----------------------------------------------------------- | -------------------------- |
| `next-themes`            | Tema sin parpadeo (sección 4)                               | **D-02**                   |
| `@axe-core/playwright`   | Mencionada en `testing.md` pero no en la tabla de librerías | Se agrega a `libraries.md` |
| gitleaks (GitHub Action) | Escaneo de secretos que pide `security.md`                  | Se agrega a `libraries.md` |

Animaciones: este spec no necesita springs ni gestos (el panel usa la transición de shadcn, con `motion-safe:`/`motion-reduce:`, F-22). `motion` se evalúa cuando una vista lo justifique.

## 15. Accesibilidad y performance

- Foco visible en todos los controles (`--ring` = systemBlue, 3:1 o más).
- Barra superior, columna izquierda y barra inferior son landmarks (`header`, `nav` con `aria-label`, `main`, `aside`).
- Un link "Saltar al contenido" como primer elemento enfocable.
- JS de cliente mínimo: solo `ThemeToggle`, el disparador del panel lateral y los providers son Client Components.
- `e2e/shell.spec.ts` verifica a 360px que `document.documentElement.scrollWidth <= 360` (F-26) y corre axe en Home, not-found y error.

## 16. Cambios a las guías en este PR

- `i18n.md`: render dinámico por la CSP con nonce (sección 5).
- `libraries.md`: `next-themes` (si se aprueba D-02), `@axe-core/playwright`, gitleaks.
- `design-system.md`: tokens iOS con la regla de alto contraste para texto (D-01), y que `ui/` aloja átomos de marca.
