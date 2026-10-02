# Home — Design

> **Spec:** `home` · **Rama:** `feature/home-feed` · **Estado:** ✅ aprobado (2026-10-02) — D-H1 aprobada
> **Fase:** 2 de 3 · Requirements: [requirements.md](requirements.md) ✅
> Valores medidos en el prototipo con el navegador (2026-10-02). Las decisiones que necesitan aprobación están marcadas **D-H**.

## 1. Restricción que guía el diseño: presupuesto de JavaScript

El Home hoy pesa **212 KB** de los **230 KB** permitidos (H-24): quedan ~18 KB. Por eso:

- **Las tarjetas, el Markdown y las menciones se renderizan en el servidor** (Server Components). No suman JavaScript.
- **Solo son Client Components las hojas interactivas**: votar, votar una encuesta, "Cargar más", el aviso "Próximamente", el panel mobile y el toggle de tema.
- "Cargar más" pide la página siguiente a una **Server Action que devuelve las tarjetas ya renderizadas** (RSC): el cliente no necesita el código de las tarjetas ni del Markdown.
- `e2e/performance.spec.ts` mide el Home en cada PR.

## 2. Sistema visual (H-01 a H-04)

Reemplaza los tokens iOS de `foundation` (su D-01 queda sin efecto). Mapeo de las variables del prototipo a los tokens semánticos de shadcn:

| Token                                | Uso                                                         | Claro (prototipo)         | Oscuro    |
| ------------------------------------ | ----------------------------------------------------------- | ------------------------- | --------- |
| `--background`                       | Fondo de la app                                             | `#FFFFFF`                 | `#111214` |
| `--surface` (nuevo)                  | Fondos secundarios: buscador, caja para publicar, hover     | `#F7F6F4`                 | `#1A1B1E` |
| `--muted` / `--accent`               | Fondos terciarios, chips                                    | `#F1F0ED`                 | `#26272B` |
| `--foreground` / `--card-foreground` | Texto principal                                             | `#17181A`                 | `#F4F4F2` |
| `--muted-foreground`                 | Texto secundario (12–13 px)                                 | `#5C5D60`                 | `#A6A7AA` |
| `--faint` (nuevo)                    | **Solo** íconos, separadores de texto (`·`) y texto ≥ 18 px | `#8A8B8E`                 | `#77787B` |
| `--primary`                          | Botón principal, pestaña activa, links                      | `#17181A` (monocromático) | `#F4F4F2` |
| `--primary-foreground`               | Texto sobre `--primary`                                     | `#FFFFFF`                 | `#111214` |
| `--border`                           | Bordes y divisores                                          | `#ECEBE7`                 | `#2E2F33` |
| `--border-strong` (nuevo)            | Bordes enfatizados                                          | `#D9D8D4`                 | `#3D3E43` |
| `--bullish` / `--success`            | Suba, correcto                                              | `#17853B`                 | `#3DBE6A` |
| `--bearish` / `--destructive`        | Baja, error                                                 | `#CE2C31`                 | `#FF6B6B` |
| `--interesting`                      | Sentimiento "interesante" (no texto chico)                  | `#8B5CF6`                 | `#A78BFA` |
| `--brand-dot` (nuevo)                | Solo el punto del logo                                      | `#155DE9`                 | `#4C8DFF` |
| `--ring`                             | Foco                                                        | `#17181A`                 | `#F4F4F2` |

- **Sin sombras**: `--shadow-*` en `none`; las capas se separan con borde, como el prototipo.
- **Radios**: `--radius-sm` 4 px, `--radius-md` 8 px, `--radius-lg` 12 px, `--radius-xl` 16 px, `rounded-full` para píldoras.
- **Barra superior translúcida**: `#FCFCFB` al 92% (claro) y `#111214` al 92% (oscuro), con el fallback de `prefers-reduced-transparency`.
- El modo oscuro del prototipo usa grises fríos de una versión anterior; se ajusta a grises neutros con la misma jerarquía.
- `tokens-contrast.test.ts` se actualiza con los pares nuevos. `--faint` y `--interesting` se testean como no-texto (3:1).

### Tipografía (H-02)

- **Figtree** con `next/font/google`, `display: swap`, subset `latin` y `latin-ext` (acentos de es/pt). `next/font` la descarga **en el build** y la sirve desde el propio sitio: el navegador no le pide nada a Google y la CSP (`font-src 'self'`) no cambia.
- Escala del prototipo como utilidades (reemplazan las de iOS):

| Utilidad          | Uso                                  | Medida                                  |
| ----------------- | ------------------------------------ | --------------------------------------- |
| `text-post-title` | Título de post, pregunta de encuesta | 17 px / 1.3, 700                        |
| `text-post-body`  | Cuerpo de post                       | 15 px / 1.55                            |
| `text-ui`         | Texto base de la interfaz            | 14 px / 1.5                             |
| `text-action`     | Pestañas, acciones, votos            | 13 px / 1.5, 600                        |
| `text-meta`       | Autor, tiempo, metadatos             | 12 px / 1.5                             |
| `text-section`    | Rótulos de sección ("TUS INTERESES") | 11 px, 700, mayúsculas, tracking 0.08em |

## 3. Estructura (H-05 a H-08, H-26)

### Layout

| Ancho          | Columnas                                                                    |
| -------------- | --------------------------------------------------------------------------- |
| < 768 px       | 1 (feed). Columna izquierda en el panel del menú. Barra inferior de 5 ítems |
| `md` ≥ 768 px  | Izquierda 260 px + centro                                                   |
| `lg` ≥ 1024 px | Izquierda 260 px + centro (máx. 780 px) + derecha 300 px                    |

- `AppShell` pasa a tener **las tres columnas**: izquierda (contenido que le pasa el layout), centro (la página) y derecha (vacía en el MVP, Q2; es un `div`, no un `aside`, para no anunciar una región vacía).
- El contenido de la columna izquierda lo arma el feature `interests` y el layout lo inyecta en `AppShell` (los organismos no conocen el negocio).

### Barra superior (H-05)

`[menú (mobile)] [logo] ······ [buscador 680×40 (md+) | 🔍 (mobile)] ······ [tokens] [🔔] [perfil] [tema]`

- Buscador, tokens, campana y perfil: **deshabilitados** (H-26).
- El toggle de tema se mantiene al final (no está en el prototipo, pero H-03 lo pide).

### Barra inferior (mobile)

Home · Buscar · Crear · Notif · Perfil (como el prototipo). Solo Home funciona; el resto, deshabilitados.

### Elementos deshabilitados (H-26)

Molécula **`ComingSoon`** (Client Component, ~1 KB):

- Envuelve un botón con `aria-disabled="true"` (no `disabled`, para que se pueda enfocar) y aspecto atenuado.
- Al activarlo (clic, tap o Enter/Espacio) muestra una burbuja "Próximamente" junto al elemento durante 2 s, anunciada con `role="status"`.
- Sin dependencias (no se usa `sonner` para esto: ~10 KB que no entran en el presupuesto).

## 4. Columna izquierda: "Tus intereses" (H-07)

Feature **`interests`**, Server Component. Cada sección es un `<details>` nativo abierto por defecto (plegable sin JavaScript), con el rótulo de sección y el chevron del prototipo.

| Sección       | Datos                                                                                                                                      | Endpoint                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Activos**   | Comunidades de activo donde soy miembro → su activo: símbolo, variación del día, precio desactualizado (H-21)                              | `GET /communities` (filtrando `viewerMembership`) + `GET /assets/:symbol` por cada una, en paralelo |
| **Personas**  | Usuarios que sigo: avatar o iniciales, usuario y precisión                                                                                 | `GET /users/:userId/following` (E01, implementado en el backend)                                    |
| **Grupos**    | Comunidades no-activo donde soy miembro: avatar, nombre, descripción como subtítulo (el contrato no trae el último post) y `MOD` si modero | `GET /communities` (filtrando `viewerMembership`)                                                   |
| **Sugeridas** | Comunidades donde no soy miembro, las 3 más grandes, con "Unirse" deshabilitado (unirse llega con el spec `communities`)                   | `GET /communities`                                                                                  |

- **Mosaico de activo**: grilla de 3 columnas, borde inferior de 3 px con el color de la variación, flecha ▲/▼ además del color (el color nunca es la única señal).
- **Limitación del contrato**: `GET /communities` no filtra por membresía, así que se filtra la primera página. Se propone **P-004** (`?member=true`) al backend.
- "Crear grupo" y los "ver más" de cada sección: deshabilitados (H-26).
- **Errores**: si falla una sección, solo esa muestra "No se pudo cargar" y el resto sigue (H-19).

## 5. Feed (H-09 a H-16)

### Estado en la URL

La página lee y valida con zod sus `searchParams`:

| Parámetro   | Valores                  | Default   | Efecto                                          |
| ----------- | ------------------------ | --------- | ----------------------------------------------- |
| `feed`      | `para-ti` \| `siguiendo` | `para-ti` | `GET /feed/explore` o `GET /feed/following`     |
| `filtro`    | `new` \| `polls`         | `new`     | `polls` muestra solo encuestas                  |
| `comunidad` | slug                     | —         | Filtra Explorar por comunidad (H-14, menciones) |

- Valores inválidos caen al default (nunca rompen la página).
- **Pestañas y filtros son links** (`<Link>` con `aria-current`), no un widget de pestañas ARIA: navegan y se pueden compartir. Sin JavaScript extra.
- Con `comunidad`, arriba del feed aparece un chip "#btc ✕" para quitar el filtro.
- **Filtro _Polls_**: el contrato no tiene filtro por tipo, así que se filtra la página recibida. Se propone **P-005** (`?kind=POLL`) al backend.

### Composición

```
<PageColumns>
  <ComposerPlaceholder />        // deshabilitada (H-09)
  <FeedTabs />                   // Para ti · Siguiendo · Live (deshabilitada)
  <FeedFilters />                // New · Polls
  <CommunityFilterChip />        // solo con ?comunidad
  <FeedList items nextCursor />  // borde #ECEBE7, radio 16, divisores entre ítems
    <PostCard /> | <PollCard />
    <LoadMore />                 // client
</PageColumns>
```

### `PostCard` (H-12), Server Component

```
[avatar 20px] usuario · precisión · #comunidad · hace 1 h            [tag]
Título (text-post-title)
Cuerpo (text-post-body, Markdown seguro, recortado a 6 líneas + "Ver más")
[imagen 16:9, radio 8] | [link: dominio ↗]
[💬 412]  [▲ 2.104 ▼]                                          [↗ Compartir]
```

- **Recorte de cuerpos largos** con CSS (`line-clamp`) + un `<details>` "Ver más" sin JavaScript.
- **Post borrado**: título y cuerpo atenuados con "[contenido eliminado]", sin votos ni imagen.
- **Post del sistema**: "Asinko" como autor, sin precisión.
- **Editado**: "· editado" en la línea del autor.
- **Imagen**: `next/image` con `sizes` del layout. Las SVG locales (mocks) van con `unoptimized`; las del backend (Supabase Storage) se agregan a `remotePatterns` cuando existan.
- **Link**: dominio visible y `rel="noopener noreferrer nofollow ugc"`, solo `http`/`https` (`security.md`).
- **Compartir**: deshabilitado (H-26).
- La tarjeta entera **no** es un link (el detalle de post es otro spec). El título lo será entonces.

### Markdown y menciones (H-14) — D-H1

- Se renderiza **en el servidor** con **`react-markdown`**, sin `rehype-raw` (nunca HTML crudo) y con lista blanca de elementos: párrafos, negrita, itálica, listas, links, código en línea y citas. Los títulos del Markdown se bajan a texto en negrita (la tarjeta ya tiene su título).
- **Menciones**: antes de parsear, cada `entity` (P-001) se reemplaza en el texto por un link con esquema propio (`asinko:ticker/<id>`, `asinko:community/<id>`, `asinko:user/<id>`), de atrás hacia adelante para no correr los offsets. El renderer de links los convierte:
  - `$BTC`: si el activo tiene comunidad, link a `/?comunidad=btc`; si no, destacado sin link.
  - `#defi`: link a `/?comunidad=defi`.
  - `@maria`: destacado (negrita), sin link.
- Estilo de mención del prototipo: negrita 800 y subrayado (`.post-inline-ticker`).

> **D-H1 — ✅ aprobada:** sumar **`react-markdown`** a `libraries.md`. Motivo: el `body` del contrato es Markdown y parsearlo bien a mano supera largamente las ~50 líneas del criterio. Al usarse solo en Server Components **no suma JavaScript al navegador**. Alternativa descartada: un parser propio (riesgo de casos borde y de seguridad).

### `PollCard` (H-13)

```
[avatar] pregunta (text-post-title)                         [▮ ENCUESTA]
[ opción 1 ················ 23% ]   ← barra de fondo proporcional al voto
[ opción 2 ················ 50% ] ✓ tu voto
1.787 votos · cierra en 4 días         [💬 45]
```

- Antes de votar (y sin resultados visibles): las opciones son botones. Al votar se muestran barras y porcentajes.
- `ON_VOTE` sin voto: sin porcentajes, "Vota para ver los resultados".
- Cerrada: sin botones, resultados finales.
- `PollVoting` es la hoja cliente (botones + barras), con `useOptimistic`.

### Votar (H-15)

- `VoteControl` (client): ▲ puntaje ▼, botones de 32 px dentro de la píldora de 136×38. `aria-pressed` en el voto activo; nombre accesible "Votar a favor" / "Votar en contra"; el puntaje con `aria-live="polite"`.
- Actualización optimista con `useOptimistic`; si la Server Action falla, se revierte y se avisa.
- **Server Actions** en `features/feed/actions/`:
  - `votePost(postId, value: 1 | -1 | null)` → `PUT /posts/:id/vote` (o `DELETE` con `null`), con `userId` de `getViewer()`.
  - `votePoll(pollId, optionId)` → `PUT /polls/:id/vote`.
  - Input validado con zod; devuelven `ActionResult`.
- Sin viewer (sin mocks y sin login): `UNAUTHENTICATED` → "Necesitas una cuenta para votar".
- **Mocks**: se agregan `PUT`/`DELETE /posts/:id/vote` y `PUT /polls/:id/vote`. No persisten (cada recarga vuelve al estado de las fixtures), lo cual se documenta.

### Paginación (H-16)

- La primera página (20 ítems) viene del servidor.
- `LoadMore` (client): cuando el botón "Cargar más" entra en pantalla (`IntersectionObserver`) o se presiona, llama a la Server Action `loadMoreFeed({ feed, filtro, comunidad, cursor })`, que devuelve **las tarjetas ya renderizadas** (RSC) y el `nextCursor` siguiente. Sin más páginas, el botón desaparece.
- El botón queda siempre visible y usable con teclado (respaldo accesible del scroll infinito).

> ⚠️ **Riesgo a verificar en la primera tarea del feed:** que una Server Action devuelva elementos JSX ya renderizados. La serialización de los valores de retorno lo permite (`use-cache.md` de Next: "you can return JSX elements"), pero hay que probarlo con Next 16.3. **Plan B:** paginación por URL (`?cursor=`), donde "Cargar más" navega a la página siguiente renderizada en el servidor. Pierde el scroll infinito pero no suma JavaScript. Si hace falta el plan B, se consulta antes.

## 6. Feature y archivos

> Ajuste en T-03: el avatar es una molécula propia renderizada en el servidor (`user-avatar`) en lugar del `avatar` de shadcn, que es un Client Component: no suma JavaScript.

```
src/features/feed/
├── components/   composer-placeholder, feed-tabs, feed-filters, community-filter-chip,
│                 feed-list, post-card, poll-card, poll-voting (client), vote-control (client),
│                 load-more (client), post-markdown, feed-empty
├── actions/      vote-post.action.ts, vote-poll.action.ts, load-more-feed.action.ts
├── lib/          feed-api.ts (getFeed, getPost…), mappers.ts, mentions.ts
├── schemas/      feed-params.schema.ts, vote.schema.ts
├── feed.types.ts (FeedItem, PostItem, PollItem, Mention…)
└── index.ts

src/features/interests/
├── components/   interests-sidebar, asset-tiles, people-list, group-list, suggested-communities,
│                 sidebar-section
├── lib/          interests-api.ts, mappers.ts
├── interests.types.ts
└── index.ts

src/components/
├── molecules/    user-avatar (servidor: imagen o iniciales), coming-soon, delta (variación con flecha y color)
└── organisms/app-shell/   site-header (rehecho), bottom-nav (5 ítems), app-shell (3 columnas)
```

- **Mappers** (`api-integration.md`): esquema crudo del contrato (`@/lib/api/contract`) → tipos de dominio. Ejemplo: `PostItem` lleva `author`, `community` (slug y nombre, resueltos con la lista de comunidades), `publishedAt`, `body` ya con las menciones marcadas, `score`, `viewerVote`, `media`.
- El feed resuelve el slug y nombre de cada comunidad con `GET /communities` (el `Post` del contrato solo trae `communityId`). Limitación anotada para el backend como parte de P-004.
- Ítems inválidos del feed: `keepValidItems` (H-20).
- `features/feed` y `features/interests` no se importan entre sí (`structure.md`); lo común (tipos de usuario o de comunidad) vive en `@/lib/api/contract`.

## 7. Estados (H-17 a H-21)

| Caso                                | Qué se ve                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| Cargando                            | `(main)/loading.tsx`: composer + pestañas + 3 tarjetas skeleton con las medidas reales |
| _Siguiendo_ vacío                   | Estado vacío: "Todavía no sigues comunidades" + link a _Para ti_                       |
| _Polls_ sin resultados en la página | "No hay encuestas en lo cargado" + "Cargar más" si hay más páginas                     |
| Falla el feed                       | `getOrThrow` → `error.tsx` con "Reintentar"                                            |
| Falla una sección lateral           | Solo esa sección: "No se pudo cargar"                                                  |
| Ítem inválido                       | Se descarta y se reporta                                                               |
| Precio desactualizado               | Mosaico con "desactualizado" y la hora del último precio                               |
| `NOT_FOUND` en `?comunidad`         | Feed vacío con "No existe esa comunidad" y el chip para quitar el filtro               |

## 8. i18n (H-22)

- Namespaces nuevos: `feed` (pestañas, filtros, tarjetas, estados, votos) e `interests` (secciones).
- Fechas relativas con `getFormatter().relativeTime(fecha, ahora)`; números compactos con `notation: 'compact'` (12,4 mil / 12.4K / 12,4 mil).
- Los textos de los usuarios (posts, comentarios) no se traducen.

## 9. Accesibilidad (H-23)

- Cada ítem del feed es un `<article aria-labelledby>` con su título como heading (`h2`; el `h1` de la página es "Inicio", visualmente oculto porque el prototipo no muestra un título).
- Pestañas y filtros: `nav` con `aria-label` y `aria-current="page"` en el activo.
- Votos: botones con nombre accesible y `aria-pressed`; puntaje con `aria-live`.
- Encuesta: grupo con `role="group"` y la pregunta como nombre; cada opción, un botón con su porcentaje en el nombre accesible cuando hay resultados.
- Áreas táctiles: botones de voto de 32 px dentro de una píldora de 38 px (el área efectiva cumple 24 px); acciones principales ≥ 44 px en mobile.
- axe sin violaciones en Home, _Siguiendo_ y con filtro.

## 10. Mocks y propuestas al backend

| #                 | Qué                                                                                 | Por qué                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| P-001             | `entities` en la lectura de posts                                                   | Menciones (ya existía)                                                                   |
| P-003             | Forma de la respuesta del catálogo de activos                                       | Ya existía                                                                               |
| **P-004** (nueva) | `GET /communities?member=true` y comunidad resumida (`slug`, `name`) en cada `Post` | Columna "Tus intereses" y la línea de autor de cada post sin pedir todas las comunidades |
| **P-005** (nueva) | `GET /feed/*?kind=POLL` y orden `sort=hot\|new\|top`                                | Filtro _Polls_ y, más adelante, _Hot_ / _Top_                                            |

Cambios en `src/mocks/`:

- `GET /users/:userId/following` (E01) para "Personas".
- `PUT`/`DELETE /posts/:id/vote` y `PUT /polls/:id/vote` (E03/E05).
- El usuario demo pasa a ser miembro también de `eth` y `sol` (más mosaicos de activos) y **moderador** de `trading-on-chain` (para ver el `MOD`).

## 11. Cambios en otras guías y specs

- `design-system.md` y `overview.md § Estilo`: el sistema visual pasa a ser el del prototipo (monocromático, Figtree, sin sombras). De la skill `apple-design` queda el criterio de movimiento e interacción, no la paleta.
- `specs/foundation/design.md`: D-01 y la tipografía del sistema (F-17, F-18) quedan reemplazadas por este spec; se anota ahí.
- `libraries.md`: `react-markdown` (si se aprueba D-H1).
- `proposals.md`: P-004 y P-005.
