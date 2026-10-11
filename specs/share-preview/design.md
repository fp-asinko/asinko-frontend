# Vista previa al compartir — Design

> Next 16: `opengraph-image.tsx` por segmento, con `ImageResponse` de `next/og` (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md`). Sin dependencias nuevas.

## 1. Archivos

- `src/app/[locale]/opengraph-image.tsx`: la imagen genérica (SP-04). Vale para todas las páginas del idioma que no tengan una propia.
- `src/app/[locale]/post/[id]/opengraph-image.tsx`: la del post (SP-01). Va en `post/[id]/` y no dentro de `[[...slug]]`, así vale para la URL con y sin slug.
- `src/features/feed/components/share-card.tsx`: el dibujo de la tarjeta del post (JSX con estilos en línea, lo único que entiende `ImageResponse`), sin datos ni red: recibe un DTO mínimo. Así se testea con Vitest.
- `src/lib/share-image/`: tamaño (1200 × 630), la carga de la fuente y los colores.

## 2. Fuente y colores

- **Figtree en TTF** en `src/assets/fonts/` (400 y 700, licencia OFL, la misma de `next/font`): `ImageResponse` no lee WOFF2. Se lee una vez con `readFile` al cargar el módulo.
- **Colores:** `ImageResponse` no lee variables CSS. Los valores del tema claro se copian en `src/lib/share-image/colors.ts`, con un test que los compara con `globals.css` para que no se desfasen.

## 3. Datos

- La imagen del post usa `getPost(id)`, la misma lectura pública de la página (los bots no tienen sesión). Si falla, el post está borrado o el id no es válido, dibuja la genérica (SP-06).
- El título se corta en el servidor (3 líneas, `lineClamp` de Satori, o un corte por caracteres si no alcanza).
- El avatar de la comunidad: iniciales sobre su tono de identidad (`identityIndex`). Las imágenes subidas por usuarios no se piden (SP-07).

## 4. Metadata

- `twitter.card` pasa a `summary_large_image` en el layout (SP-05).
- `alt` del post: su título (SP-02); el de la genérica, el lema traducido.
- El `openGraph` del post deja de pisar el del layout: se suma `siteName` (hoy se pierde al definir `openGraph` en la página).

## 5. Tests

- Unitarios: `ShareCard` con un título largo (corte), sin comunidad (canal personal), los números con el formato del idioma; los colores contra `globals.css`.
- E2E: el `<head>` del detalle trae `og:image`, `og:image:alt`, `twitter:card`; la URL de la imagen responde `200 image/png` de 1200 × 630; un post inexistente sigue respondiendo con la imagen genérica.
- Presupuesto de JS sin cambios.

## 6. Ajustes al implementar (2026-10-11)

- **La página nombra su imagen** (`shareImage` en `src/lib/share-image/share-metadata.ts`): una página que define su `openGraph` reemplaza entero el del layout, y con él la imagen de un segmento padre. El detalle del post apunta a la suya (`/{locale}/post/{id}/opengraph-image/card`) y comunidad, activo y perfil a la de la marca (`/{locale}/opengraph-image/brand`); las dos llevan `siteName` otra vez. El Home la hereda del archivo, sin código.
- **`generateImageMetadata`** da el `alt` de cada post (SP-02); el `alt` exportado es fijo. Por eso la URL termina en `/card` o `/brand`.
- **La imagen del post es dinámica** (`dynamic = 'force-dynamic'`): la lectura del post pasa por las cookies de la sesión y Next intentaba generarla estática (500).
- **El logo**: `ImageResponse` no corre hooks ni lee clases del tema, y `react-dom/server` no se permite en `app/`. Las formas del logo quedan como datos en `asinko-logo.tsx` (seis letras y el punto, sin los `clipPath` del prototipo, que solo redondeaban el punto: medido igual, píxel a píxel, salvo el suavizado de bordes), y `asinko-logo-svg.ts` (`server-only`) las escribe como SVG con los colores del tema claro.
- **`safeLocale`** sube a `src/i18n/safe-locale.ts` (lo usaban dos páginas y ahora las imágenes: regla de tres), fuera de `routing.ts`, que viaja al navegador.
- **X** lee `twitter:image`: Next lo agrega con la imagen del archivo, y la página lo nombra con `shareImage`.
- **Presupuesto (SP-08):** el navegador no carga nada nuevo, pero Turbopack suma unos helpers a su runtime compartido cuando el build tiene rutas de `next/og`: +0,45 KB en todas las rutas (medido quitando y poniendo las dos rutas de imagen). Detalle de post 238,9 KB de 240.
