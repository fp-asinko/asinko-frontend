# El perfil como vidriera, como LinkedIn — Design

## 1. Contrato propuesto

**P-024 "Acerca de" de 2000.** `PATCH /api/v1/users/{userId}` acepta `bio` de hasta **2000** caracteres (hoy 160); `422 BIO_TOO_LONG` más allá. El campo no cambia de nombre.

**P-025 Destacados** (públicos para leer; escribir, solo el dueño: `userId` comparado con la sesión, `403 USER_MISMATCH`):

- `GET /api/v1/users/{userId}/featured` → `{ items: Featured[] }`, a lo sumo 3, del último destacado al primero.
- `Featured = { kind: "post", post: Post, featuredAt } | { kind: "thesis", thesis: Thesis, featuredAt }`. Lo borrado no viene.
- `POST /api/v1/users/{userId}/featured` `{ userId, kind, id }` → `201 { items }`. Si ya estaba, `200` igual. Con 3, `409 FEATURED_LIMIT`. Contenido de otra persona: `403 NOT_OWNER`. Inexistente o borrado: `404`.
- `DELETE /api/v1/users/{userId}/featured/{kind}/{id}?userId=` → `204` (también si no estaba).

**P-026 Abierto a.** `openTo: string[]` en el `User` y el `Profile`, editable en `PATCH /users`: valores de `QUESTIONS`, `COLLABORATIONS`, `MENTORING`, `AMAS`, `COMMISSIONED_ANALYSIS`, sin repetir; `[]` lo borra. `422 INVALID_OPEN_TO`.

Mocks (`kind: 'proposal'`, `implemented: false`):

- **Destacados:** en memoria, por usuario, con uno sembrado para la demo y otro para `maria` (que se vea en un perfil ajeno).
- **`PATCH /users`:** va al mock cuando trae `openTo`, o una `bio` de más de 160. Es lo mismo que hoy con los campos de P-019 (`when` mira el cuerpo); una bio corta sigue yendo al backend.

## 2. Front

### Contrato y datos

- `profileSchema`/`userSchema` suman `openTo` (opcional). `featuredSchema` (unión por `kind`).
- `ProfileDetails` suma `openTo: OpenTo[]`. Un valor desconocido se descarta, como los `kind` del feed.
- `features/communities/lib/featured-api.ts` (`server-only`): `getFeatured(userId)` mapea a `FeaturedItem`, un DTO mínimo:
  - post: `{ kind, id, title, path, community: { handle, path }, score, commentCount }`;
  - tesis: `{ kind, id, claim, state, community, asset }`.
  - También `featureAs` y `unfeatureAs`.
- Actions (`actions/featured.action.ts`): `featureContent({ kind, id })` y `unfeatureContent({ kind, id })`, con zod, sesión y `userId` de la sesión. `FEATURED_LIMIT` tiene su mensaje.
- `lib/checklist-cookie.ts`: la cookie `asinko-profile-checklist=hidden` (un año, `SameSite=Lax`). La página la lee con `cookies()`. Ocultar la tarjeta es una preferencia de ese navegador, no un dato de la cuenta. _Cambio con PS-13 y PS-14 (2026-10-19): la escribe el navegador (`writeChecklistHidden`), sin `httpOnly`: no es un dato sensible, y así Deshacer no espera al servidor y la ventana "Editar perfil" sabe si está oculta. Antes era una Server Action._

### Completa tu perfil (PS-01 a PS-03)

- `profileSteps(profile, featuredCount)` (`lib/profile-steps.ts`, puro, con tests) devuelve los 8 pasos con su estado. La tarjeta muestra el avance y las dos primeras sugerencias pendientes.
- `ProfileChecklist` es un Server Component, con su propio `EditProfileProvider` (otra ventana, como la de la cabecera). _Con PS-13: `HideableChecklist` (cliente) envuelve la tarjeta; la ✕ (`HideChecklistButton`) la cambia por la línea con Deshacer, que toma el foco (un ref y un efecto después del cambio); Deshacer devuelve la tarjeta y el foco a la ✕. PS-14: la ventana lee la cookie al abrirse y, oculta, muestra "Mostrar «Completa tu perfil»"; al tocarlo la borra, lo anuncia con `role="status"` y refresca la página detrás._ Los botones de los campos son `EditProfilePrompt` (ya existe, cliente) con el `field` del paso. `EditProfileField` suma `avatar`, `banner`, `bio`, `location` y `openTo`, y la ventana enfoca esa sección como hoy con `links`.

### Acerca de (PS-04)

- `BIO_MAX = 2000`. En la ventana, la bio pasa a `Textarea` (crece hasta 8 líneas) con el contador.
- En el perfil, el recorte de 3 líneas con "Ver más" es el patrón de `PostCard`: `line-clamp-3` y un `<details>` que lo abre (sin JavaScript). "Ver más" solo aparece si el texto pasa de unos 200 caracteres o tiene más de 3 saltos, igual que `isLong` en las tarjetas.

### Destacados (PS-05 a PS-08)

- `FeaturedSection` es un Server Component con un `<h2>` "Destacados" y `FeaturedCard` por ítem.
  - En el teléfono, una fila con `overflow-x-auto` y `snap-x` (tarjetas de 260 px).
  - Desde `md`, `grid-cols-3`.
  - La fila es una lista (`ul`); se recorre con Tab por sus links y no tiene scroll propio enfocable.
- **Menú "⋯"** (`FeatureMenu`):
  - El disparador es un botón chico (cliente) y el `DropdownMenu` se carga con `import()` al primer toque, como el orden de los comentarios (`comments-sort-menu`).
  - Recibe `{ kind, id, featured, full }`. Con 3 destacados, "Destacar" queda `aria-disabled` con el motivo.
  - Al elegir, llama a la action y después a `router.refresh()`: la página se vuelve a armar en el servidor con la sección y el estado de cada menú. Un `role="status"` anuncia "Destacado en tu perfil" o "Quitado de destacados".
- **Dónde va el menú:**
  - `PostCard` suma un slot `menu` a la derecha de la cabecera. `CommunityFeed`, con `author` igual al usuario (tu perfil), lo pasa con `featuredIds`.
  - `ThesisCard`, lo mismo en la lista de tesis.
  - En `FeaturedCard`, siempre con "Quitar".
  - "Cargar más" de esas listas recibe los ids por su action (los vuelve a pedir en el servidor si el autor es el usuario).
- La página pide los destacados **después** del perfil: necesita su id. Si fallan, la sección no aparece (es secundaria, `engineering-principles.md`).
- **Implementado así** (2026-10-19, por las reglas de dependencias: `feed` y `communities` no se importan entre sí y los organismos no llaman actions):
  - `components/organisms/featured` solo dibuja: `FeatureMenu` (el botón "⋯", con el menú diferido) lee un contexto, `FeaturedMenuContext`, con qué está destacado, si hay lugar y cómo cambiarlo. Sin contexto no dibuja nada, así las mismas tarjetas sirven en todos los feeds y en "Cargar más".
  - `communities/components/featured-scope.tsx` da ese contexto en tu perfil: llama a la action, hace `router.refresh()`, anuncia el resultado y muestra un error en un aviso fijo abajo que queda hasta cerrarlo (no hay `Toaster` montado y sumarlo pesaría en todas las rutas).
  - `PostCard` y `ThesisCard` reciben `menu` como booleano, no como slot: "Cargar más" arma las tarjetas en una action, y una función no viaja por ahí.
- Las encuestas no se destacan por ahora (P-025 habla de posts y tesis).

### Abierto a (PS-09, PS-10)

- `OPEN_TO = ['QUESTIONS', 'COLLABORATIONS', 'MENTORING', 'AMAS', 'COMMISSIONED_ANALYSIS']` (`open-to.constants.ts`).
- En la ventana es un grupo de casillas con forma de píldora (`role="group"` con su leyenda), cada una un `checkbox` real.
- En el perfil, `OpenToCard` va debajo de la presentación: un borde, el título "Abierto a" y una píldora `bg-muted` por opción. En tu perfil suma un lápiz (`EditProfilePrompt` con `field="openTo"`).

### Orden en el perfil

Banner, avatar, nombre, presentación, Acerca de, contadores, "Preguntar", **Abierto a**, **Completa tu perfil** (solo tuyo), **Destacados** y, después, las pestañas.

## 3. Presupuesto de JS

El perfil está en 238,3 KB y el límite es 240.

- Lo nuevo es de servidor, salvo el disparador del "⋯", que es un botón con estado. El menú se difiere: suma su entrada al manifiesto de todas las rutas, ~0,15 KB.
- La ventana "Editar perfil" ya se carga diferida.
- Si al medir pasa de 240, el disparador se arma como el de compartir (`ShareButton`): un solo módulo que carga el menú.

_Con PS-13 (2026-10-19): `HideableChecklist` es cliente y viaja en todos los perfiles: 239,3 → 239,9 KB. Lo próximo del perfil va diferido o recorta algo._

## 4. Tests

- **Unitarios:**
  - `profileSteps`;
  - los esquemas (bio de 2000, `openTo`);
  - `featured-api` contra los mocks;
  - las actions (sesión, `userId` de la sesión, el límite);
  - el mapper de `openTo`;
  - `ProfileChecklist`, `FeaturedCard`, `FeatureMenu`, `OpenToCard` y el "Ver más" de Acerca de;
  - la ventana con "Abierto a" y la bio larga.
- **E2E** (`e2e/profile-showcase.spec.ts`):
  - completar un paso desde la tarjeta y que el avance suba;
  - ocultarla;
  - destacar un post desde el "⋯", verlo en Destacados y quitarlo;
  - el límite de 3;
  - "Abierto a" guardado y visto por otro perfil;
  - "Ver más";
  - 360 px y axe en claro y oscuro;
  - presupuesto de JS.
