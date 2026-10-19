# El grupo como una página web: banner ancho y widgets, como Reddit — Design

## 1. Contrato propuesto

**P-028 Widgets de un grupo.**

- `GET /api/v1/communities/{slug}/widgets` (público) → `{ items: Widget[] }`, en su orden.
- `PUT /api/v1/communities/{slug}/widgets` `{ userId, items: WidgetInput[] }` → `{ items: Widget[] }`.
  - Reemplaza la lista entera, como el "Guardar" de Reddit.
  - Solo moderadores: `403 NOT_MODERATOR`, y `403 USER_MISMATCH` si el `userId` no es el de la sesión.
  - Hasta 20 widgets: `422 TOO_MANY_WIDGETS`. Un widget inválido da `422 INVALID_WIDGET` con `index` (cuál) y `field`.
- `Widget = { id, type, title, ...según el tipo }`. `WidgetInput` es igual, con `id` opcional (sin él, es nuevo).

| Tipo          | Campos                                                                                                    | Límites                                      |
| ------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `TEXT`        | `title`, `body` (Markdown)                                                                                | título 1-50, cuerpo 1-5000                   |
| `RULES`       | `title`, `rules: [{ title, description }]`                                                                | 1-15 reglas; título 1-100, descripción 0-500 |
| `BUTTONS`     | `title`, `buttons: [{ label, url }]`                                                                      | 1-10; texto 1-30; URL `http(s)` o ruta `/…`  |
| `COMMUNITIES` | `title`, `communityIds: string[]` → la respuesta trae `communities: CommunitySummary[]` con `memberCount` | 1-10                                         |
| `IMAGES`      | `title` (opcional), `images: [{ imageUrl, alt, linkUrl }]`                                                | 1-10; `alt` 1-300; link opcional             |
| `CALENDAR`    | `title`, `events: [{ title, startsAt, endsAt, allDay, location, url }]`                                   | 1-20; título 1-100; lugar 0-100; ISO 8601    |

En todos los tipos, el título va de 1 a 50 caracteres. La comunidad de un `COMMUNITIES` que ya no existe no viene.

**P-029 Imágenes de un grupo.** `POST /api/v1/uploads/community-image` `{ userId, communityId, contentType, size }` → `{ uploadUrl, imageUrl, path }`.

- Es el mismo flujo de URL firmada que `post-image` (P-013): JPEG, PNG, WebP o GIF, nunca SVG, hasta 5 MB.
- Solo moderadores de esa comunidad.

**Mocks** (`kind: 'proposal'`, `implemented: false`):

- Widgets en memoria, por comunidad. `#trading-on-chain` (que la demo modera) trae uno de cada tipo y `#macro` dos, para ver los de un grupo ajeno.
- La subida, como la del perfil.

## 2. Front

### Shell: el banner a lo ancho (CW-01)

- **Implementado sin slot `@hero`** (cambio al implementar, 2026-10-19). Un slot dejaba el `<h1>` del grupo fuera de `<main>`: "Saltar al contenido" se lo salteaba.
- **Grilla del shell:** la fila centro + derecha es una grilla de dos columnas (`minmax(0, 780px)` y `300px`) y dos filas.
- **Con hero:** si la página trae un `PageHero` (`data-hero`), `<main>` pasa a ser un `subgrid` que ocupa las dos columnas. El hero toma la primera fila entera y `PageColumns` el centro de la segunda. La columna derecha (`aside`, de primer nivel, `sticky`) empieza en la segunda fila, debajo del banner.
- **Sin hero:** las dos columnas ocupan las dos filas, como antes. Por debajo de `lg` no hay grilla.
- **En la página del grupo:** `hub/[slug]` dibuja `PageHero` con `CommunityHeader` y, debajo, `PageColumns` con el resto.

### La columna derecha de cada página (CW-02, CW-03)

- `RightColumn` deja de traer Season Tokens y "Vistos recientemente" por su cuenta: recibe su contenido. El Home los pone (`@right/page.tsx`); `default` y el catch-all quedan con el pie solo.
- Rutas nuevas de `@right`:
  - `hub/[slug]`: los widgets del grupo.
  - `post/[id]/[[...slug]]`: los widgets del grupo del post, si es un grupo; si es un canal personal o un activo, su tarjeta o su ficha.
  - `asset/[symbol]`: la ficha del activo (los datos de mercado de hoy, `AssetMarket`).
- El perfil pierde "Vistos recientemente".

### Widgets (CW-05 a CW-07)

- `features/communities`:
  - `lib/widgets-api.ts` (`server-only`, con `cache`): `getWidgets(slug)` y `saveWidgetsAs(userId, slug, items)`.
  - Mappers a tipos de dominio (`CommunityWidget`, unión por `type`). Cada link pasa por `safeLink` (`http(s)` o ruta interna) y cada imagen por `allowedImageUrl`.
  - Componentes de servidor: `CommunityWidgets` (la lista) y uno por tipo (`TextWidget` con `PostMarkdown`, `RulesWidget` con `<details>` por regla, `ButtonsWidget`, `CommunitiesWidget` con `JoinButton`, `ImagesWidget`, `CalendarWidget`). Además `CommunityAbout` (Detalles).
  - Cada widget es una `section` con su `h2`, en una tarjeta como la del perfil.
- **Imágenes:** una fila con `scroll-snap` (una por vez, se pasan con el dedo o con la barra), con "1 de 3" por imagen. Sin JavaScript.
- **Calendario:** las fechas se formatean en el servidor. Como la zona horaria de quien mira no se conoce ahí, la fecha va en un `<time>` y una hoja cliente chica (`LocalTime`) la reescribe en la zona del navegador. Sin JavaScript, se ve en UTC con "UTC".
- **Por debajo de `lg` (CW-04):** `Collapsible` "Acerca de la comunidad" debajo de la cabecera, con los mismos componentes. Reemplaza el desplegable de reglas y web de hoy (`CommunityDetails`) en los grupos.

### Editar widgets (CW-08 a CW-13)

- `EditWidgetsButton` (cliente, solo si `viewerMembership` es `MODERATOR` o `PRINCIPAL_MODERATOR`), en la cabecera del grupo (`CommunityHeader` recibe `moderation`). Abre `EditWidgetsDialog`, cargado con `next/dynamic` al primer uso. Va en la cabecera y no en la columna: la columna (`@right`) es otra entrada de Turbopack, y un componente cliente en las dos viaja dos veces (medido: grupo 240,4 KB → 239,1).
- La ventana tiene dos vistas en el mismo `Dialog`: la lista y el formulario de un widget. El estado es un borrador local de la lista entera, y "Guardar" la manda con `saveWidgets` (action).
  - La lista usa `useReducer` con las acciones `add`, `update`, `move`, `remove`.
  - Los formularios usan `react-hook-form` + zod, un esquema por tipo (`widget.schema.ts`), validados al volver a la lista y otra vez en la action.
- **Ordenar (Q4):**
  - El arrastre es propio, con pointer events (mouse y dedo), sobre la lista: al mover un ítem por encima del centro del vecino, se intercambian. Son unas 60 líneas, sin librería, por el criterio de `libraries.md`.
  - **Subir** y **Bajar** son botones en cada fila, y un `role="status"` anuncia la nueva posición.
- **Lista de comunidades:** un buscador propio (campo + resultados con "+"), con su action `findWidgetCommunities` (`GET /communities?search=`, sin canales personales). _Cambio al implementar:_ subir `CommunityPicker` de `composer` a `organisms` arrastraba sus filtros y su caché, que acá no hacen falta.
- **Imágenes:** se preparan con `prepareImage` y se suben **al elegirlas** con `uploadSignedImage` a P-029, como la imagen de un post. Mientras suben, "Listo" y Guardar esperan. _Cambio al implementar:_ subirlas al volver a la lista dejaba la vista previa sin URL para `next/image`.
- **Calendario:** `datetime-local` nativo (el teléfono abre su selector), convertido a ISO con la zona del navegador; "todo el día" usa `date`.
- **Errores:**
  - `422 INVALID_WIDGET` marca el widget de la lista (`index`) y su campo.
  - `403 NOT_MODERATOR` da un mensaje general.
  - Lo escrito queda.
- **Después de guardar:** `router.refresh()` y se anuncia "Widgets guardados".

## 3. Presupuesto de JS

- Grupo 237,3 KB, detalle 238,3 KB y activo 237,3 KB, sobre 240.
- Todo lo que se ve es de servidor, salvo:
  - `EditWidgetsButton`, que es chico y solo se dibuja para moderadores (el módulo viaja igual: se mide);
  - `LocalTime`;
  - el `Collapsible` del teléfono, que ya viaja en el grupo.
- La ventana se difiere.
- `@hero` es otra entrada de Turbopack, como `@right` (`seo.md`): se mide. Si algo pasa de 240, se mueve o se difiere antes de cerrar.

## 4. Tests

- **Unitarios:**
  - mocks y esquemas, con un caso por tipo y sus límites;
  - `widgets-api` contra los mocks;
  - la action (sesión, `userId`, `NOT_MODERATOR`, `INVALID_WIDGET` con `index`);
  - cada widget (con sus estados: sin eventos, una regla con o sin descripción, link externo con dominio);
  - el reductor de la lista;
  - el arrastre (pointer events en jsdom) y las flechas;
  - cada formulario;
  - la ventana (agregar, editar, ordenar, eliminar con confirmación, cancelar con cambios, error del servidor);
  - `LocalTime`.
- **E2E** (`e2e/community-widgets.spec.ts`):
  - banner a lo ancho en desktop;
  - columna derecha en Home, grupo, post, activo, perfil y 404;
  - widgets de `#macro` como visitante;
  - en `#trading-on-chain`: agregar un Texto, ordenarlo con flechas, guardar y verlo; arrastrar (desktop); eliminar;
  - el desplegable en el teléfono;
  - 360 px y axe en claro y oscuro, con la ventana abierta;
  - presupuesto de JS.
