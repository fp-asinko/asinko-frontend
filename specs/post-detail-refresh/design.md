# Detalle de post, segunda vuelta — Design

## 1. Volver (PD-01)

- `BackButton` pasa de `features/communities/components` a `components/molecules/back-button` (lo usan las páginas de comunidad y el detalle; los features no se importan entre sí). Dos variantes con `cva`: `overlay` (la de hoy, sobre el banner) y `plain` (nueva: círculo de 44 px `bg-muted`, solo la flecha, `aria-label` "Volver").
- En el detalle, a la izquierda de la cabecera del post (`PostCard` variante `detail`, que recibe el botón como `leading`).

## 2. La caja de comentario (PD-02)

- `CommentComposer` (solo para comentar el post; las respuestas no cambian) arranca **cerrado**: un `textarea` de una fila, `rounded-full`, 44 px, `border-input`, con el placeholder "Únete a la conversación". No es un botón que se reemplaza por un campo: es el mismo campo, así el foco y lo escrito no se pierden y no hay salto.
- **Abierto** (`focus` o texto escrito): `rounded-2xl`, `min-h-24`, y aparecen Cancelar y Comentar debajo, con la animación de alto de `specs/home-motion`. Cancelar vacía y cierra. Al perder el foco sin texto, se cierra.
- Las menciones (`MentionField`) siguen funcionando igual.

## 3. Orden y búsqueda

### Contrato (propuesta P-014, mockeada)

- `GET /api/v1/posts/:id/comments?sort=best|top|new|old` ordena el primer nivel y las respuestas de cada uno. Sin `sort`, `best`.
  - `best`: puntaje con decaimiento por antigüedad (Q1). `top`: puntaje. `new` y `old`: fecha.
- `GET /api/v1/posts/:id/comments?q=texto` (2 a 100 caracteres, sin distinguir mayúsculas ni acentos): los comentarios que coinciden, de cualquier nivel, en una lista plana (`replies: []`), del más relevante al menos.
- El mock (`src/mocks/handlers.ts`) implementa los dos con el árbol de los fixtures; `fixtures.test.ts` prueba orden y búsqueda contra el esquema.

### Front

- `getCommentTree(postId, { sort })` y `searchComments(postId, q)` en `features/feed/lib/comments-api.ts`. Los parámetros se validan con zod (`commentsQuerySchema`: `sort` del enum con `best` por defecto, `q` recortado de 2 a 100) **antes** de la red.
- La página lee `searchParams` y se los pasa a `PostComments`. Cambiar el orden o buscar navega (el servidor renderiza la lista): el título y la caja se quedan y la lista muestra su esqueleto en su `Suspense` (con `key` por orden y búsqueda).
- **Ordenar** (`CommentsSort`, cliente): "Ordenar por: Mejores ▾". El botón es liviano y el `DropdownMenu` de shadcn (Base UI) se descarga al primer uso, como el menú "⋯" (`comments-sort-menu.tsx`). Cada opción (`DropdownMenuRadioItem`, la actual con ✓ y `aria-checked`) navega con el router a `?sort=` (Mejores, sin parámetro), sin mover el scroll y sin `?q=`.
- **Buscar** (`CommentsSearch`, cliente): un `<form role="search">` que al enviarse navega con el router localizado a `?q=` (sin `next/form`: el router ya está en el sitio y no suma JS), `input type="search"` con lupa, `name="q"`, `aria-label` "Buscar comentarios", píldora de 40 px (32 desde `md`) y hasta 240 px de ancho, al lado del orden. Vacío, vuelve a todos los comentarios. Mientras hay una búsqueda, "Ordenar por" no se muestra: los resultados van por relevancia.
- **Resultados** (`CommentSearchResults`, servidor): "N resultados para «texto»", un link "Ver todos los comentarios" (la misma página sin `?q=`) y cada coincidencia como un comentario sin respuestas ni botón de responder. El cuerpo va como texto plano (el Markdown reducido a texto, como los extractos de las tarjetas) y cada aparición de lo buscado en `<mark>` con `font-bold` y sin fondo de color (monocromo, `design-system.md`). La cantidad se anuncia en una región `role="status"` que queda en la sección, fuera del `Suspense` (`Announce`): una región que llega ya con su texto no siempre se lee.

## 4. Anuncios (PD-07 a PD-10)

### Contrato (propuesta P-015, mockeada)

```ts
// GET /api/v1/ads?placement=comments  →  { items: Ad[] }
type Ad = {
  id: string
  advertiser: { name: string; logoUrl: string | null }
  body: string // texto plano, hasta 280
  url: string // destino http(s)
  imageUrl: string | null
}
```

- Esquema crudo + mapper a `CommentAd` (con `domain`, y `url` solo si es http(s): si no, el anuncio se descarta). `keepValidItems` para la lista.

### Dónde va

- `withAds(nodes, ads, every = 10)` (función pura en `features/feed/lib/`, con tests): recorre el árbol en el orden de lectura (el mismo que se muestra) y, después del comentario 10, 20, 30…, inserta un anuncio **como el siguiente elemento de lectura**: si ese comentario tiene respuestas a la vista, el anuncio va antes que ellas (con la sangría de las respuestas); si no, después del comentario, en su nivel. Cuenta solo lo que se ve: las respuestas plegadas (desde el nivel 4) no cuentan.
- Los anuncios rotan: el anuncio `i` del árbol es `ads[i % ads.length]`. Sin anuncios (o si fallan), el árbol queda igual.
- No hay anuncios en los resultados de búsqueda.

### Cómo se ve (`CommentAd`, servidor)

- La estructura del comentario: el logo (avatar redondo de 20 px), "**Anunciante** · Anuncio", el texto, y una fila con la píldora con borde "Más información" (link) y el dominio en gris. La imagen, si hay, a la derecha del texto: 96 px de ancho en mobile y 128 px desde `sm` (a todo el ancho, en un teléfono, pesaba más que los comentarios).
- Una `<section>` con nombre "Anuncio: {anunciante}" (dentro de un `<li>` cuando va al nivel del comentario): el lector de pantalla dice que es un anuncio antes que el contenido (PD-10), y cada anuncio tiene su nombre. No un `<aside>`: varios landmarks "complementary" anidados en `main` y con el mismo nombre son ruido (axe, `landmark-complementary-is-top-level` y `landmark-unique`).
- Link: `target="_blank"`, `rel="sponsored noopener noreferrer"`; la imagen con `next/image` desde el dominio de imágenes permitido (`allowedImageUrl`), o sin imagen.

### Dentro del post y en los feeds (PD-15, PD-16)

- `getAds(placement)` (`lib/ads-api.ts`, `cache` de React: el post y sus comentarios comparten un pedido). La propuesta P-015 suma `placement=feed`.
- **Dentro del post:** `PostAd` (servidor, en su `Suspense` sin fallback) entre la tarjeta del detalle y los comentarios, con `CommentAd` y el primer anuncio. `withAds` arranca la rotación de los comentarios en el segundo (`first = 1`), así no se repite el de arriba.
- **Feeds:** `FeedItems` recibe los anuncios y su `offset` (cuántos posts hubo antes) y suma un `<li>` con `FeedAd` después de cada posición múltiplo de 10. La primera página la piden `HomeFeed` y `CommunityFeed` (con los anuncios en paralelo); "Cargar más" le pasa a su action el total ya mostrado (`offset`, validado) y la action pide los anuncios y arma la página igual. El anuncio `n` del feed es `ads[n % ads.length]`.
- **`FeedAd`** (servidor): la tarjeta de un post. Logo de 40 px (como el avatar de grupo), anunciante en negrita · "Anuncio", el texto (`type-post-body`), la imagen a todo el ancho con borde y radio 16 (como la de un post) y la fila con "Más información" (píldora con borde) y el dominio. Una `section` con nombre "Anuncio: {anunciante}", el link con `rel="sponsored noopener noreferrer"` en otra pestaña.

## 5. Mensajes

`postDetail.back`, `postDetail.join` ("Únete a la conversación"), `postDetail.sort.*` (etiqueta y las cuatro opciones), `postDetail.search.*` (etiqueta, resultados con plural, sin resultados, ver todos) y `postDetail.ad.*` ("Anuncio", "Más información"). Lo que usa el cliente (orden, caja) en `CLIENT_NAMESPACES`.

## 6. Performance

- Nuevo en el cliente: el botón de orden (el menú de Base UI se descarga al primer toque), el campo de búsqueda, la caja que se pliega y `Announce`. Resultados y anuncios son del servidor. **Medido al cerrar (2026-10-08):** Home y detalle 236,0 KB (antes 234,6), páginas de comunidad, activo y perfil 237,7 KB (antes 236,1), contra 240.

## 7. Tests

- Unitarios: `commentsQuerySchema`, `withAds` (cada 10, antes de las respuestas, plegadas no cuentan, rotación, sin anuncios), el mapper de anuncios (esquemas inválidos, link no http), `BackButton` (dos variantes, destino), `CommentComposer` (cerrada, abierta, vuelve a cerrarse vacía, conserva lo escrito), `CommentsSort` (opción actual, links), `CommentAd` y `CommentSearchResults` (sync), y el mock (orden, búsqueda).
- E2E (mobile y desktop): volver desde el Home, la caja que se abre y se cierra, ordenar por Nuevos (el orden cambia y queda en la URL), buscar con y sin resultados, el anuncio después del comentario 10 con su link seguro, 360 px y axe en claro y oscuro. Presupuesto de JS.
