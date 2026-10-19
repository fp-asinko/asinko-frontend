# Logros en el perfil — Design

## 1. Contrato propuesto (P-030)

`GET /api/v1/users/{userId}/achievements` (público). El backend decide qué está ganado; con la sesión del dueño suma los que faltan.

```jsonc
{
  "items": [
    { "code": "STREAK_3", "earnedAt": "2026-09-02T14:00:00Z", "level": null, "progress": null },
    { "code": "ANNIVERSARY", "earnedAt": "2026-10-01T00:00:00Z", "level": 1, "progress": null },
    // Solo si el viewer es el dueño: los que faltan, con progreso cuando se mide.
    {
      "code": "STREAK_5",
      "earnedAt": null,
      "level": null,
      "progress": { "current": 3, "target": 5 },
    },
    { "code": "FOUNDING_MEMBER", "earnedAt": null, "level": null, "progress": null },
  ],
}
```

- `code`: uno de los 16 de AC-01 (`FIRST_THESIS`, `FIRST_CORRECT`, `STREAK_3`, `STREAK_5`, `STREAK_10`, `RESOLVED_10`, `ACCURACY_70`, `FIRST_POST`, `FIRST_COMMENT`, `POST_100_VOTES`, `FOLLOWERS_100`, `GROUP_FOUNDER`, `GROUP_MODERATOR`, `ANNIVERSARY`, `FOUNDING_MEMBER`, `PROFILE_COMPLETE`). Un código que el front no conoce se descarta y se reporta (`keepValidItems`): el backend puede sumar logros antes que el front.
- `level`: solo `ANNIVERSARY`, los años (el último cumplido). Es un único ítem.
- `progress`: `{ current, target }` en los que se miden (rachas, resueltas, votos, seguidores, precisión en puntos y perfil en pasos); `null` en los de sí o no.
- Orden: los ganados del más nuevo al más viejo; después los que faltan, en el orden del catálogo.
- `404` si el usuario no existe. Sin sesión o de otra persona: solo los ganados.

Mock (`kind: 'proposal'`, `implemented: false`): el usuario demo con ganados y faltantes de cada grupo; @maria y @federico con algunos ganados; el resto, ninguno. Los que faltan, solo si el viewer es el dueño.

## 2. Front

### Datos

- `achievementSchema` en `src/lib/api/contract/achievements.ts` (con `ACHIEVEMENT_CODES`), la lista acepta ítems desconocidos.
- `features/communities/lib/achievements-api.ts` (`server-only`, `cache` de React: la página y su columna piden lo mismo): `getAchievements(userId)` → `Achievement[] | null` (`null` si falla: la tarjeta muestra un error local, es secundaria).
- `Achievement` (dominio): `{ code, group, earnedAt: string | null, level: number | null, progress: { current, target } | null }`. El grupo y el orden del catálogo salen de `ACHIEVEMENT_CATALOG` en el feature (código → grupo e ícono de `lucide-react`).

### Componentes (Server Components, `communities`)

- `AchievementBadge`: el ícono en un círculo, `bg-muted` con `text-foreground` si está ganado; si falta, borde punteado `border-border-strong`, `text-faint` en el ícono (solo ícono, `--faint` no va en texto chico) y el nombre en `text-muted-foreground`. Sin colores nuevos: el sistema es monocromático (`design-system.md § Tokens`).
- `AchievementsCard` (columna derecha y mobile): título con la cantidad, los 4 últimos en una grilla de 4 (ícono y nombre debajo, en `type-caption`) y "Ver todos". Sin `HoverCard` ni `title`: sumaría JavaScript o no llegaría al teclado y al tacto; la descripción vive en la lista completa.
- `AchievementsList` (la página): los cuatro grupos con `<h2>`, cada logro en un `<li>` con ícono, nombre (`<h3>`), descripción, fecha (`<time>`, con `getFormatter`) o progreso (`role="progressbar"` con `aria-valuetext` "2 de 3", como "Completa tu perfil").

### Rutas

- `app/[locale]/user/[username]/achievements/page.tsx`: lee el perfil (`getProfileDetails`, ya en `cache`) y los logros; `notFound()` si no existe. `generateMetadata` con título "Logros de {nombre}", canonical y `alternates`. El shell y su columna: `@right/user/[username]/achievements/page.tsx` con la tarjeta de reputación.
- La columna del perfil (`@right/user/[username]/page.tsx`) suma `AchievementsCard` después de `ProfileCard`. En la página, dentro del `div lg:hidden` de PA-03.
- El sitemap no lista perfiles hoy: la página nueva tampoco.

### Mensajes

`communities.achievements`: `title`, `count`, `seeAll`, `empty`, `closest`, `locked`, `earnedOn`, `progress`, `groups.*`, y por código `items.<CODE>.name` y `items.<CODE>.description` (`ANNIVERSARY` con plural ICU por años). Ningún namespace nuevo en `CLIENT_NAMESPACES`: todo es de servidor.

## 3. Presupuesto de JS

El perfil está en 239,9 KB. Todo es de servidor e importado por su ruta (no por el `index` del feature): la primera carga no debe moverse. La página nueva usa el shell y nada cliente propio. Si el build muestra que algo sube, se recorta antes de seguir.

## 4. Accesibilidad

- Cada logro es un ítem de lista con su nombre como texto; el ícono es `aria-hidden`.
- Bloqueado: el texto "Bloqueado" (visible en la lista, `sr-only` en la tarjeta) y el progreso en texto, nunca solo el gris (AC-09).
- "Ver todos" es un link con el nombre accesible completo ("Ver todos los logros de {nombre}").

## 5. Tests

- **Unitarios:** el mock (ganados y faltantes según el viewer, 404); `achievements-api` (mapper, códigos desconocidos descartados); `AchievementsCard` (4 últimos, vacío en tu perfil con el más cercano, nada en otro perfil, error); `AchievementsList` (grupos, orden, bloqueados solo propios, progreso); `AchievementBadge`.
- **E2E** (`e2e/profile-achievements.spec.ts`): la tarjeta en desktop y en el teléfono; Ver todos → la página con sus grupos; tu perfil con bloqueados y otro sin ellos; 404; axe en claro y oscuro a 360 px; el perfil y la página nueva en `performance.spec.ts`.
