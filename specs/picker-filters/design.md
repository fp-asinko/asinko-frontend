# Filtros del selector de comunidad — Design

## 1. Datos

- `CommunityKind = 'all' | 'groups' | 'assets'` en `composer.types.ts`.
- `searchCommunities(search, kind)` (Server Action) valida `kind` con zod (`z.enum`) y lo pasa a `listCommunityOptions(username, search, kind)`.
- `listCommunityOptions`:
  - `assets`: pide `type=SYSTEM_ASSET` al backend (con `mine=true` o `search`), así la página de 20 trae solo activos.
  - `groups`: el contrato filtra por **un** tipo y los grupos son tres (`SYSTEM_GEO`, `SYSTEM_CATEGORY`, `USER_PUBLIC`): se pide sin `type` y se descartan los activos en el servidor. Una búsqueda que traiga 20 activos podría dejar la lista corta; con el catálogo de hoy (5 comunidades de activos) no pasa. Si pasa, se propone al backend aceptar varios `type`.
  - "Tu perfil" (el canal propio) solo con `all` (PF-04): con `groups` o `assets` ni se pide.
- Sin cambio de contrato ni de mocks: el mock de `GET /communities` ya filtra por `type`.

## 2. El símbolo en la búsqueda (PF-03)

Una función pura `readSearch(text)` en `features/composer/lib/picker-search.ts`: `'$bt'` → `{ kind: 'assets', search: 'bt' }`, `'#mac'` → `{ kind: 'groups', search: 'mac' }`, cualquier otra → `{ kind: null, search }`. En el selector:

- Al escribir, si el texto empieza con símbolo, el chip pasa a ese tipo; si antes lo había puesto un símbolo y ya no está, vuelve a **Todo**. Un chip elegido a mano no lo pisa un texto sin símbolo.
- Al tocar un chip con un símbolo escrito, el símbolo se quita del input (el texto que queda es la búsqueda).
- Cada vez que se abre, vuelve a **Todo** y pide la lista inicial (PF-01).
- Cada cambio de chip o de búsqueda pide de nuevo (la clave de lo pedido pasa a ser `kind + search`), con el mismo retraso de 250 ms al escribir e inmediato al tocar un chip.
- **Sin espera al cambiar de chip** (pedido del PO, 2026-10-16: "tiene lag"): las respuestas se guardan por `kind + search` mientras el selector vive, y volver a una es inmediato, sin pedir. Un chip sin respuesta todavía se muestra al instante filtrando la de **Todo** con la misma búsqueda (por el símbolo del handle) y la respuesta del servidor la completa.

## 3. UI

- `CommunityPicker` suma, entre `ComboboxInput` y la lista, un `div role="group" aria-label={t('filter')}` con tres `button type="button" aria-pressed`. Estilo de las pestañas del perfil (`profile-tabs.tsx`): píldora con borde, la activa negra (`bg-primary text-primary-foreground`), 28 px de alto.
- Los chips no cierran el panel ni le quitan el foco: `onMouseDown` con `preventDefault` para que la búsqueda no pierda el foco al tocarlos con el mouse; con teclado se llega por Tab.
- `ComboboxEmpty`: `t('emptyGroups')` / `t('emptyAssets')` según el chip (PF-05).
- Mensajes nuevos en `composer.community`: `filter`, `kinds.all|groups|assets`, `emptyGroups`, `emptyAssets`.

## 4. Tests

- `picker-search.test.ts`: los símbolos, mayúsculas, solo el símbolo (`'$'` → assets, búsqueda vacía), espacios.
- `composer-api` (`listCommunityOptions`): `assets` manda `type=SYSTEM_ASSET` y no pide el canal; `groups` descarta activos y no pide el canal; `all` como hoy.
- `search-communities.action`: rechaza un `kind` inválido.
- `community-picker.test.tsx`: los chips piden con su tipo; `$bt` activa Activos y busca "bt"; borrar el símbolo vuelve a Todo; tocar Comunidades con `$bt` escrito deja "bt"; el vacío por tipo.
- E2E (`e2e/submit-page.spec.ts`): Activos deja solo `$`; escribir `#` deja solo grupos; los chips con Tab desde la búsqueda, sin cerrar la lista; al volver a abrir, Todo; axe con los chips a 360 px en claro y oscuro.
