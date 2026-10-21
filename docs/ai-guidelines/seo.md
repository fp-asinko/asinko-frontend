# SEO — Reglas técnicas

> Aplica a proyectos web con requerimientos de SEO. SEO no es un afterthought: se ejecuta desde el día 1.

## Reglas obligatorias para toda ruta nueva o migrada

1. **Redirect 301 mapeado** ANTES de mergear el PR (si hay migración de URLs).
2. **Canonical URL** apuntando siempre al dominio final de producción.
3. **Meta tags completos**: title, description, `og:*`, `twitter:card`.
4. **Schema.org** estructurado donde aplique (Product, Organization, BreadcrumbList, etc.).
5. **hreflang** para cada idioma + `x-default` (ver sección Multi-idioma).

## Sitemap

- Generado con `app/sitemap.ts` de Next.js, regenerado en cada build.
- Dividido por sección (`sitemap-news.xml`, `sitemap-products.xml`, etc.).
- Publicado en `/sitemap.xml` con índice.
- Notificado a las herramientas de webmaster post-deploy.

## robots.txt

- Generado con `app/robots.ts`, variando según el ambiente.
- Producción: `Allow: /` con referencia al sitemap.
- DEV y QA: `Disallow: /` completo (ver `security.md`).

## Core Web Vitals — gates de PR

Umbrales **bloqueantes**, no recomendaciones:

| Métrica | Umbral  | Medición         |
| ------- | ------- | ---------------- |
| LCP     | < 2.5s  | Lighthouse en CI |
| CLS     | < 0.1   | Lighthouse en CI |
| INP     | < 200ms | Lighthouse en CI |
| TTFB    | < 800ms | Edge / CDN       |

Para sitios de contenido estático: Lighthouse score global > 90 obligatorio.

Lighthouse corre con **perfil mobile** (el default): los umbrales se miden en mobile, no en desktop.

## Mobile first indexing

Google indexa y rankea usando la **versión mobile** de cada página. Por eso:

- El contenido, los datos estructurados y los meta tags deben ser **idénticos** en mobile y desktop. Nada que solo exista en desktop.
- Contenido oculto en mobile (acordeones, tabs) sigue siendo indexable, pero lo principal debe estar visible sin interacción.
- Ver reglas de implementación mobile first en `design-system.md`.

## Metadata en Next.js

- Meta tags con la Metadata API: `export const metadata` o `generateMetadata()` en cada `page.tsx`/`layout.tsx`. Nunca `<head>` manual.
- `metadataBase` definido en el layout raíz con el dominio de producción, para que canonical y `og:*` sean absolutos.
- Schema.org como `<script type="application/ld+json">` renderizado desde un Server Component.

## Multi-idioma

El sitio tiene varios idiomas (ver `i18n.md`). Para que cada versión rankee en su mercado:

- **`hreflang`** en cada página, apuntando a todas sus versiones de idioma + `x-default` apuntando a la versión en inglés (`en`, el idioma por defecto). Se genera con `alternates.languages` en `generateMetadata`.
- **Canonical auto-referencial por idioma**: `/en/products` tiene canonical a `/en/products`, no a la versión en inglés.
- **Metadata traducida**: title, description y `og:*` en el idioma de la página, con `og:locale` correcto.
- **URLs traducidas** (`/en/products`, `/es/productos`, `/pt/produtos`).
- **Sitemap** con `alternates.languages` en cada entrada.
- **Contenido realmente traducido**: una página en inglés con el cuerpo en español es contenido duplicado.

## Performance

Las reglas que sostienen los Core Web Vitals:

- **Fuentes** con `next/font`: autoalojadas, sin requests a terceros, con `display: swap` y subset mínimo.
- **Imágenes** con `next/image`: siempre con `width`/`height` o `fill` + `sizes` (evita CLS). La imagen del LCP con `priority`.
- **JavaScript del cliente al mínimo**: Server Components por defecto, `'use client'` solo en hojas (ver `structure.md`).
- **Carga diferida** con `next/dynamic` para componentes pesados que no se ven al cargar (modales, carruseles, mapas, editores).
- **Scripts de terceros** (analytics, chat, pixels) con `next/script` y `strategy="lazyOnload"` o `afterInteractive`, nunca bloqueantes.
- **Presupuesto de JS**: máximo **240 KB** (gzip) de JavaScript de primera carga por ruta. **Medido al cerrar `sidebar-fill` (2026-10-21): Home 227,0 KB; grupo 230,9 KB; activo 229,4 KB; perfil 231,7 KB; logros de un perfil 219,7 KB; detalle de post 230,9 KB; crear post 226,5 KB.** `FitList` (la columna izquierda) sumó 0,2 KB en todas. Quedan unos 8,3 KB en el perfil, la ruta más pesada. Lo nuevo y pesado va diferido (`next/dynamic`, `import()` o Server Actions que devuelven UI ya renderizada); el editor de posts, las sugerencias de menciones y las tarjetas al pasar el mouse se cargan al primer uso.
  - **Mensajes precompilados en el build** (`next.config.ts`, `experimental.messages.precompile` de next-intl): el navegador recibe el formateador sin el parser de ICU. −8 KB en todas las rutas, medido el 2026-10-19 (el perfil, de 239,6 a 231,5). Es una opción experimental de next-intl: al actualizarlo, se verifica que siga y se mide de nuevo.
  - **Zod viaja entero en el cliente:** con sus `locales`, unos 90 KB gzip, también desde `zod/mini` (Turbopack no los descarta). Un formulario con `zodResolver` va diferido; por eso el editor de la página de crear post se carga después de la página, con un esqueleto que guarda su lugar (medido en `submit-page`: 409 KB sin diferir).
  - **El layout importa sus componentes cliente por su ruta**, no por el `index` de un feature que también exporta páginas: Next carga en todas las rutas cada componente cliente alcanzable desde el layout (medido con `mention-preview`: +2,6 KB en el Home).
  - **Las páginas también importan su vista por su ruta** (`@/features/feed/components/home-feed`), no por el `index`: el `index` de `feed` exporta el Home, los feeds de comunidad y el detalle, y una página que lo importaba cargaba los componentes cliente de las tres (medido con `comment-threads`: −4,3 KB en el Home y en las páginas de comunidad).
  - **Cada carga diferida cuesta algo en todas las rutas:** Turbopack lista cada chunk diferido en un manifiesto que carga toda página (unos 0,1 a 0,2 KB por módulo, medido en 2026-10-08). Diferir sigue conviniendo para lo pesado, pero no para piezas de pocas líneas: ahí sale más caro que cargarlas.
  - **Un módulo compartido viaja entero:** Turbopack no descarta las exportaciones sin uso de un módulo que llega al cliente. Lo que solo usa un componente diferido va en su propio archivo (medido con `share-menu`: las marcas de WhatsApp y Telegram en `brand-marks.tsx`, que viaja con la ventana de cuenta, sumaban +0,8 KB en todas las rutas).
  - **Las columnas derechas importan `RightColumn` por su ruta**, no por el `index` del organismo, que también trae "Vistos recientemente" (solo del Home): −0,5 KB en el grupo, el activo, el perfil y el detalle (medido con `community-widgets`).
  - **Una columna derecha propia es otra entrada:** Turbopack arma cada `@right/<ruta>` aparte, y lo que comparte con la página viaja dos veces (medido con `profile-aside`: `ShareButton` en la tarjeta de la columna sumaba +1,2 KB al perfil; se movió a la cabecera, y la ruta propia cuesta +0,5 KB).
  - **Lo que una sola página necesita del shell, en esa página:** un componente cliente en el layout se carga en todas las rutas (medido con `submit-tools`: plegar la columna izquierda desde el shell sumaba +0,5 KB a todas). La página dibuja el control y el shell responde por CSS (`html:has([data-…])`).
  - **Las rutas de `next/og` cuestan algo en todas las rutas:** las imágenes para compartir (`opengraph-image`, `specs/share-preview`) no llegan al navegador, pero Turbopack suma helpers a su runtime compartido cuando el build las tiene (+0,45 KB, medido en 2026-10-11).
  - **Cómo se mide**: suma de todos los `<script src>` del HTML inicial de la ruta, comprimidos con gzip, contra el build de producción. Lo verifica un test e2e (`e2e/performance.spec.ts`) en cada PR.
  - **Por qué 240**: Next.js 16 + React 19 vacíos ya pesan ~175 KB medidos así (Turbopack y webpack por igual, medido en 2026-10). El margen es para el código propio.
  - **Historial:** 230 KB hasta el 2026-10-07. Lo subió el PO a 235 al cerrar `community-pages`: unirse, salir y favorito, la revisión 4 de las encuestas y el estado compartido de membresías lo llevaron a 230,6 KB sin código duplicado (medido por chunk), y la fase 1 todavía suma crear post y detalle. Lo subió el PO a 240 el 2026-10-08 con `mention-autocomplete`: el margen en las páginas de comunidad era 0,1 KB y la carga diferida de las sugerencias (para los comentarios) suma su entrada al manifiesto de todas las rutas; con 240 queda lugar para lo que resta de la fase 1.
  - Superarlo requiere justificación en el PR. Para encontrar qué pesa, `@next/bundle-analyzer`.
  - Lo que no hace falta al cargar (modales, paneles, SDKs opcionales) se carga diferido con `next/dynamic` o `import()`.

## Estático vs dinámico

- Usar generación estática (SSG / ISR con `revalidate`) para todo lo que no requiera interactividad: HTML servido desde CDN, óptimo para SEO.
- Usar renderizado dinámico solo cuando hay estado de servidor complejo o autenticación.
- Si una página dinámica puede convertirse a estática sin perder funcionalidad, debe convertirse.

## GEO (Generative Engine Optimization)

Para visibilidad en buscadores y LLMs:

- Contenido bien estructurado con jerarquía clara (H1 único, H2-H6 sin saltos de nivel).
- FAQ schemas en páginas con preguntas frecuentes.
- Datos estructurados Schema.org en todo el catálogo.
- Texto descriptivo claro y `alt text` adecuado en imágenes.
- URLs amigables y descriptivas (no IDs).
- Lenguaje natural, evitando jerga interna.

## Herramientas

| Herramienta                      | Uso                         |
| -------------------------------- | --------------------------- |
| Crawler (ej. Screaming Frog)     | Auditoría técnica completa  |
| Search Console / Webmaster tools | Monitoreo de indexación     |
| Lighthouse CI                    | Validación en pipeline      |
| Pa11y                            | Accesibilidad (impacta SEO) |
| Ahrefs / Semrush                 | Backlinks y rankings        |
