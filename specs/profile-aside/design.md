# La columna derecha del perfil, como Reddit — Design

## 1. Contrato propuesto

**P-027 Dónde publica una persona.** `GET /api/v1/users/{userId}/active-communities?days=90&limit=20` (público):

- `{ items: [{ community: CommunitySummary, postCount: number }] }`, de más posts a menos (empate: el último publicado primero).
- Solo posts (y encuestas) no borrados de los últimos `days` días (1 a 365, por defecto 90). `limit` va de 1 a 20 (por defecto 5).
- `404` si el usuario no existe.

Mock (`kind: 'proposal'`, `implemented: false`): cuenta los posts y encuestas de los fixtures y los creados en el proceso, por comunidad, con fecha de publicación dentro de los últimos 90 días.

## 2. Front

- **Contrato:** `activeCommunitiesSchema` (la lista acepta ítems desconocidos y se queda con los válidos, `keepValidItems`).
- **Datos:**
  - `ProfileDetails` suma `points`.
  - `lib/active-communities-api.ts` (`server-only`): `getActiveCommunities(userId)` devuelve `ActiveCommunity[]` (`{ handle, path, avatarUrl, colorKey, kind, postCount }`), o `[]` si falla (es secundario).
  - `getProfileDetails` y `getActiveCommunities` van envueltos en `cache` de React: la página y su columna derecha los piden en el mismo request y salen una sola vez.
- **Componentes (Server Components, `communities`):**
  - `ProfileCard`: la cabecera (foto chica y nombre), la grilla de números (`<dl>`) y `ActiveCommunities`.
  - `ActiveCommunities`: las 5 primeras en una lista y el resto en un `<details>` "Ver todas (N)".
- **Rutas:**
  - `app/[locale]/@right/user/[username]/page.tsx` arma la columna del perfil: `ProfileCard`, "Vistos recientemente" y el pie. Un perfil inexistente cae en el `notFound` de la página: la columna no dibuja nada.
  - En la página, la misma `ProfileCard` dentro de un `div` `lg:hidden`, después del encabezado (PA-03). En desktop la de la página no se ve (`display: none`, tampoco para lectores de pantalla) y en el teléfono no existe la columna.
- **`ProfileStats`:** queda con seguidores y seguidos (PA-02). La racha y la precisión salen de ahí.
- **Compartir:** `ShareButton` como en un comentario (sin la ventana de un post: el perfil no tiene imagen para compartir todavía), en la fila de acciones de `CommunityHeader`. En la tarjeta de la columna derecha viajaba duplicado: +1,2 KB en el perfil, medido.

## 3. Presupuesto de JS

Todo lo nuevo es de servidor. `ShareButton` ya viaja en todas las rutas con un feed. El perfil está en 238,5 KB: no debería moverse.

## 4. Tests

- **Unitarios:**
  - el mock;
  - `active-communities-api` contra los mocks;
  - el mapper (`points`);
  - `ProfileCard` (números, sin tesis resueltas, compartir);
  - `ActiveCommunities` (5 y "Ver todas", vacía);
  - `ProfileStats` sin racha.
- **E2E** (`e2e/profile-aside.spec.ts`):
  - la tarjeta en la columna derecha en desktop y en la página en el teléfono, con sus números;
  - "Participa en" con links y "Ver todas";
  - compartir copia el link en desktop;
  - 360 px y axe en claro y oscuro;
  - presupuesto de JS.
