# Navegación del feed sin esperas a ciegas — Design

> **Estado:** aprobado el 2026-10-05.

## 1. Por qué se congela

- Cambiar de pestaña cambia solo los `searchParams`. El segmento es el mismo, así que `loading.tsx` no se vuelve a mostrar, y Next no hace la transición hasta tener la página nueva.
- La página espera a `getFeed` (6 a 12 s) antes de mandar algo.

## 2. Streaming con un `Suspense` atado a los filtros (FN-01, FN-02, FN-05)

```tsx
// app/[locale]/(main)/page.tsx
const params = parseFeedParams(await searchParams) // instant
const viewer = await getViewer() // a cookie, instant
<FeedTop params={params} viewerName={viewer?.username ?? null} />
<Suspense key={feedKey(params)} fallback={<FeedListSkeleton />}>
  <FeedList params={params} viewer={viewer} />
</Suspense>
```

- **`FeedTop`:** composer, pestañas y filtros, sin el chip de comunidad. Es la parte de arriba de `FeedView` separada.
- **`FeedList`:** pide el feed y renderiza el chip de comunidad (en el mismo renglón de los filtros) y la lista. Conserva lo de `HomeFeed`: 404 para una comunidad inexistente, `getOrThrow` y "Following" sin sesión.
- **`key`** (`feed|filter|community`): cada combinación es otro `Suspense`. Por eso, al cambiar de pestaña se muestra el fallback de inmediato, y Next hace la transición en cuanto llega la parte de arriba, que es al instante.
- **`FeedListSkeleton`:**
  - Las tarjetas del `loading.tsx` actual (mismas medidas, sin CLS).
  - Un `role="status"` con "Loading…" (FN-03).
  - `loading.tsx` sigue para llegar desde otra ruta.
- **El chip de comunidad** va dentro de `FeedList`: aparece cuando llega el nombre. Al estar alineado a la derecha en el renglón de los filtros, no mueve nada al aparecer.
- **Comunidad inexistente:** se valida **antes** del `Suspense`, con `GET /communities/:slug` (la misma llamada que ya se hacía en paralelo). Así muestra la página "not found" sin esperar al feed, y el chip lleva el nombre correcto desde el principio. _Ajuste al implementar:_ el status ya era 200 con `noindex`, por el streaming del Home (`specs/home § 5`). Ese spec lo había decidido así, y este no lo cambia.

## 3. Caché del router (FN-04)

`next.config.ts`: `experimental: { staleTimes: { dynamic: 30 } }`, con el riesgo documentado en los requisitos.

## 4. P-009 (FN-07)

En `docs/references/api/proposals.md`:

- La medición.
- El pedido: armar `GET /feed/explore` (y `following`) con pocas consultas, con `include` y conteos agrupados en lugar de una consulta por ítem.
- La recomendación de desplegar el backend en la misma región que Supabase.

## 5. Tests

- **Unitarios:** `FeedTop` y `FeedListSkeleton`, y lo que pasa de `HomeFeed` a `FeedList`.
- **e2e (`e2e/feed-navigation.spec.ts`):** con una demora artificial en los mocks, el clic en "Polls" cambia la URL, marca el filtro y muestra el esqueleto antes de que lleguen los datos.
  - La demora se activa con un header que solo leen los mocks: `x-mock-delay`, que el test pone con `page.setExtraHTTPHeaders`.
  - Del lado de los mocks: una espera en `getFeed` cuando `API_MOCKS=true` y llega ese header, nunca en producción.
- **e2e:** `/en?community=nope` sigue siendo 404.
- **Presupuesto de JS.**

## 6. Ajustes de la implementación

- **El chip de comunidad tiene su propio `Suspense`** (reemplaza lo que decía § 2 sobre resolver la comunidad antes). Resolverla antes hacía esperar toda la página 1 a 2 s al tocar una comunidad, y eso no cumplía FN-01: lo marcó la revisión de UI.
  - Ahora `FilteredCommunity` va en el renglón de los filtros, con un hueco del mismo tamaño (`CommunityChipSkeleton`) mientras carga.
  - Una comunidad inexistente sigue mostrando la página "not found". El status ya era 200 con `noindex`, por el streaming del Home (`specs/home § 5`).
  - La lista no vuelve a pedir la comunidad (`communityResolved`).
- **`loading.tsx` reutiliza `FeedListSkeleton`:** un solo esqueleto, sin copias que se desincronicen.
- **e2e:** la demora del mock (`x-mock-delay`) también frena la consulta de la comunidad, como pasaría con el backend real.
- **Pendiente de verificar a mano:** que NVDA y VoiceOver anuncien el `role="status"` del esqueleto, que entra ya con texto. Es el mismo patrón que usaba `loading.tsx`.

## 7. Columna izquierda en streaming (FN-08)

- Cambiar de idioma cambia el segmento `[locale]` y re-renderiza el layout. El layout esperaba a `InterestsSidebar` (`GET /communities` y los intereses, ~2,7 s), y como `loading.tsx` vive dentro del layout, no había ninguna señal.
- `InterestsSidebar` va en un `Suspense` con `InterestsSkeleton` (filas del tamaño de las sugerencias). Sirve también para el panel ☰, que recibe el mismo nodo, y para la primera carga de cualquier página.
- La demora simulada (`mockDelay`) también frena la columna, y el e2e lo cubre.
