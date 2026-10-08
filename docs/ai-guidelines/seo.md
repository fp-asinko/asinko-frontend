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
- **Presupuesto de JS**: máximo **240 KB** (gzip) de JavaScript de primera carga por ruta. **Medido al cerrar `emoji-picker` (2026-10-08): Home y detalle de post 236,8 KB; páginas de comunidad, activo y perfil 238,5 KB.** Quedan 1,5 KB en las páginas de comunidad: lo próximo pesado va diferido o se revisa el tope con el PO. Lo nuevo y pesado va diferido (`next/dynamic`, `import()` o Server Actions que devuelven UI ya renderizada); el editor de posts, las sugerencias de menciones y las tarjetas al pasar el mouse se cargan al primer uso.
  - **El layout importa sus componentes cliente por su ruta**, no por el `index` de un feature que también exporta páginas: Next carga en todas las rutas cada componente cliente alcanzable desde el layout (medido con `mention-preview`: +2,6 KB en el Home).
  - **Cada carga diferida cuesta algo en todas las rutas:** Turbopack lista cada chunk diferido en un manifiesto que carga toda página (unos 0,1 a 0,2 KB por módulo, medido en 2026-10-08). Diferir sigue conviniendo para lo pesado, pero no para piezas de pocas líneas: ahí sale más caro que cargarlas.
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
