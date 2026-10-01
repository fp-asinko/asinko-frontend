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

| Métrica | Umbral | Medición |
|---|---|---|
| LCP | < 2.5s | Lighthouse en CI |
| CLS | < 0.1 | Lighthouse en CI |
| INP | < 200ms | Lighthouse en CI |
| TTFB | < 800ms | Edge / CDN |

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
- **Presupuesto de JS**: máximo **150 KB** (gzip) de JavaScript de primera carga por ruta. Se revisa con `@next/bundle-analyzer`; superarlo requiere justificación en el PR.

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

| Herramienta | Uso |
|---|---|
| Crawler (ej. Screaming Frog) | Auditoría técnica completa |
| Search Console / Webmaster tools | Monitoreo de indexación |
| Lighthouse CI | Validación en pipeline |
| Pa11y | Accesibilidad (impacta SEO) |
| Ahrefs / Semrush | Backlinks y rankings |
