# Anuncios en los feeds y en el detalle — Design

## 1. Propuesta P-031 (`docs/references/api/proposals.md`)

El `Ad` sale de P-015, con dos cambios: el texto propio pasa a ser opcional (las piezas ya lo traen) y la imagen trae su tamaño, para reservar el lugar.

```json
{
  "id": "uuid",
  "advertiser": { "name": "AvaTrade", "logoUrl": "string | null" },
  "body": "string | null",
  "url": "https://…",
  "image": { "url": "string", "width": 1200, "height": 1500, "alt": "string" } | null
}
```

- **Feed:** un ítem más de la lista: `{ "kind": "AD", "content": Ad }`. Como dijo el backend, va donde él lo pone.
- **Detalle:** `GET /posts/{id}/comments` (el árbol, sin `?q`) suma `"ads": [{ "afterCommentId": "uuid | null", "ad": Ad }]`. `null` = debajo del post; si no, después de ese comentario en el orden de lectura (antes de sus respuestas). El backend decide las posiciones; el front las respeta. La búsqueda (`?q=`) no trae `ads`.

## 2. Contrato y mocks

- `src/lib/api/contract/ads.ts`: `adSchema`. En `content.ts`, `feedItemSchema` suma la rama `AD`, y `commentListSchema` suma `ads` opcional.
- `knownKinds` (`feed-api.ts`) suma `AD`.
- **Mocks** (`src/mocks/fixtures/ads.ts`): seis anuncios con las piezas en `public/mocks/ads/`.
  - Explore, Following y el contenido de un perfil ponen uno **después de cada 10 ítems** de cada página. _Cambio con el PO (2026-10-24): al azar en cada pedido, sin repetir el anterior, como los variaría un servidor de anuncios._
  - El árbol de comentarios pone uno con `afterCommentId: null` y uno después de cada 10 comentarios en orden de lectura, contando respuestas.

## 3. Dominio

```ts
export type AdItem = {
  kind: 'ad'
  id: string
  advertiser: string
  logoUrl: string | null
  body: string | null
  url: string
  domain: string
  image: { src: string; width: number; height: number; alt: string } | null
}
// FeedItem = PostItem | PollItem | AdItem
// CommentNode suma `ad?: AdItem` (el anuncio que va después de él).
// getCommentTree devuelve { comments, postAd }.
```

`toAdItem` descarta un anuncio cuyo link no sea `http(s)` (AD-06) y calcula el dominio con `URL`.

## 4. Componentes (Server Components: no suman JavaScript, AD-09)

- **`FeedAd`** (`features/feed/components/feed-ad.tsx`): un `<section aria-label="Ad: AvaTrade">`, con la cabecera chica, la imagen y "Learn more". La imagen va con `next/image` a su `width` y `height`, dentro de una caja `bg-surface`: `w-full h-auto max-h-135 object-contain md:max-h-none`. Reserva su lugar por su proporción antes de cargar. En el teléfono una alta se frena en 540 px, entera y centrada; desde `md` ocupa todo el ancho de la columna con el alto que pida su proporción (AD-03; _cambio del PO, 2026-10-26: en desktop el tope dejaba la pieza chica entre franjas grises_). _Cambio al implementar: con `w-auto` una imagen diferida medía 0×0 hasta cargar, y la página saltaba._
- **`CommentAd`**: con la forma de un comentario. La pieza va debajo de "Anunciante · Ad", al ancho del comentario, entera y hasta 320 px de alto. _Cambio al implementar: primero iba a la derecha, chica (128 px), y el texto que trae la pieza no se leía._
- **Dónde va cada uno:** `FeedItems` dibuja `FeedAd` para `kind: 'ad'`. `CommentTree` dibuja `CommentAd` después de un comentario con `ad`. `PostComments` dibuja el anuncio del post arriba del árbol.
- Textos en `ads.*`: `label` (Ad / Anuncio / Anúncio), `region` ("Ad: {advertiser}"), `cta` (Learn more / Más información / Saiba mais) y `ctaLabel`.

## 5. Imágenes

`public/mocks/ads/`, servidas desde el sitio: la CSP ya permite `img-src 'self'`. Son JPEG de 27 a 160 KB, y `next/image` las optimiza.
