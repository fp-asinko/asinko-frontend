# Páginas de comunidad, activo y perfil — Requirements

> **Estado:** aprobado por el PO el 2026-10-07.
> **Fuente:** [`docs/references/ASINKO-requirements.pdf`](../../docs/references/ASINKO-requirements.pdf), sección "Páginas de comunidad, activo y perfil" (págs. 3 a 5), entregado por el PO. El "mockup" que menciona es el prototipo (`docs/references/prototype.html`): sus vistas de grupo, activo y perfil son la referencia del layout (`design.md`).
> **Decisiones con el PO (2026-10-07):**
>
> - Una sola spec: primero comunidad y activo; el perfil después.
> - URLs fijas en todos los idiomas.
> - Las menciones `$ # @` llevan a las páginas nuevas.
> - La moderación queda fuera de esta etapa.

## Objetivo

Que cada comunidad, activo y usuario tenga su página propia, con su contenido y la opción de sumarse. Las tres son una `Community` por debajo y comparten componentes, pero cada una tiene su ruta.

| Página    | URL                | `Community.type`                                |
| --------- | ------------------ | ----------------------------------------------- |
| Comunidad | `/hub/{slug}`      | `USER_PUBLIC`, `SYSTEM_CATEGORY` y `SYSTEM_GEO` |
| Activo    | `/asset/{symbol}`  | `SYSTEM_ASSET`                                  |
| Perfil    | `/user/{username}` | `PERSONAL_CHANNEL`                              |

El PDF asigna `/hub` a `USER_PUBLIC`, pero en la base de dev los grupos del sistema (`#macro`, `#crypto`) son `SYSTEM_CATEGORY`. Todo lo que no es activo ni canal personal va a `/hub`.

## User stories

- Como lector, quiero abrir la página de un grupo o de un activo y ver todo su contenido, para seguir una conversación sin el resto del feed.
- Como lector con cuenta, quiero unirme a un grupo (o seguir a un usuario), salir y marcarlo como favorito desde su página.
- Como lector, quiero tocar `$BTC`, `#defi` o `@maria` en cualquier contenido y llegar a su página.

## Criterios de aceptación

### Rutas e idiomas

- [x] **CP-01** Las rutas son las mismas en los tres idiomas, con el prefijo de idioma: `/en/hub/macro`, `/es/hub/macro`, `/pt/hub/macro`. Es una excepción a las rutas traducidas de `i18n.md`, que se documenta ahí.
- [x] **CP-02** El slug o símbolo de la URL se valida antes de pedir nada (`api-integration.md § Validar antes de la red`). Una comunidad que no existe muestra la página 404 traducida. Si el tipo no corresponde a la ruta (`/hub/BTC`), **redirige** con 308 a su ruta correcta (`/asset/BTC`), en el mismo idioma (decidido por el PO).
- [x] **CP-03** Cada página tiene metadata traducida (título, descripción, `og:*`), canonical propio por idioma y `hreflang` (`seo.md`).

### Común a comunidad y activo (y después, al perfil)

- [x] **CP-04** **Cabecera:** nombre (con su `#` o `$`), descripción, avatar (imagen o iniciales sobre su color de identidad), banner si existe y cantidad de miembros.
- [x] **CP-05** **Unirse / salir:**
  - Si no sos miembro: "Unirse" (`PUT /communities/{slug}/members/{userId}`), con el mismo comportamiento que el botón de las tarjetas (`community-first`).
  - Si sos miembro: "Salir" (`DELETE …`), **con confirmación** (`security.md § 7`).
  - Un `PRINCIPAL_MODERATOR` no puede salir (`403 CANNOT_LEAVE_AS_PRINCIPAL_MODERATOR`): se le explica en lugar de ofrecer el botón.
  - Sin sesión, el modal de cuenta.
- [x] **CP-06** **Favorito:** con sesión, marcar y desmarcar (`PUT/DELETE /communities/{slug}/favorite`), con `viewerIsFavorite` como estado inicial. Sin sesión, el modal de cuenta.
- [x] **CP-07** **Feed propio:**
  - `GET /feed/explore?community={slug}`, con las mismas tarjetas, filtros (Nuevos / Encuestas) y paginación que el Home.
  - Una comunidad sin contenido muestra un estado vacío.
  - Las tarjetas de esa página no repiten el botón Unirse del grupo, porque ya está en la cabecera.

### Comunidad — `/hub/{slug}`

- [x] **CP-08** Muestra las reglas (`rules`) y el link externo (`mainUrl`) cuando existen. El link sigue las reglas de links de usuarios (`security.md § 1`: solo http/https, `rel` completo, dominio visible).

### Activo — `/asset/{symbol}`

- [x] **CP-09** Se resuelve con `GET /communities/{SYMBOL}` (el slug es el símbolo). De ahí salen nombre, descripción, avatar (el logo), miembros, membresía y favorito.
- [x] **CP-10** **Sin datos de mercado:** el lugar del precio, la variación y el sentimiento muestra un estado vacío explícito ("Sin datos de mercado todavía"). Nunca valores inventados ni de ejemplo.

### Perfil — `/user/{username}` (segunda parte de esta spec)

> **Estado:** aprobada por el PO el 2026-10-07, sin marca visual para los datos de prueba (solo aparecen con mocks).
>
> **Decisiones del PO (2026-10-07)**, con la vista de perfil del prototipo como referencia:
>
> - Rating, tier y nombre visible: se proponen y se mockean, y se muestran cuando vienen.
> - Estadísticas: seguidores · acierto · racha.
> - "Ask" como Próximamente.
> - Dejar de seguir pide confirmación.

- [x] **CP-11** **Perfil** con `GET /profiles/{identifier}` y el canal personal (`GET /communities/{username}`), con la misma estructura de las otras páginas:
  - Banner, avatar redondo y título: el nombre visible si existe, y si no, `@usuario`. Con nombre visible, `@usuario` va debajo.
  - Junto al título: la marca de **verificado** o **institucional**, si viene. La etiqueta Creator/Partner y el rating quedan para después del MVP (backend, 2026-10-07).
  - La bio, si existe.
  - Estadísticas: **seguidores · acierto · racha**. La racha son tesis acertadas seguidas, no días.
  - Un botón **"Preguntarle a {nombre}"**, Próximamente.
  - Las reglas de su canal, si tiene, en el desplegable.
- [x] **CP-12** **Seguir:**
  - "Seguir" es unirse a su canal personal (CP-05).
  - Siguiendo, el botón dice "Siguiendo", y tocarlo pide confirmación para dejar de seguir.
  - ~~Sin estrella de favorito.~~ Con la estrella al lado de "Siguiendo", como un grupo (`specs/favorites` FV-03, PO 2026-10-28).
- **Compartir** (PO, 2026-10-28): las tres cabeceras (grupo, activo y perfil) llevan el botón de compartir al final de las acciones, con su nombre según el tipo ("Share group", "Share asset", "Share profile").
  - En tu propio perfil no hay acciones.
- [x] **CP-13** **Contenido:** el feed de su canal (CP-07). El historial de tesis (`GET /users/{userId}/theses`) entra con las tesis, en la fase 2.
- [x] **CP-20** **El nombre visible** (`displayName`, propuesta **P-011** en `proposals.md`): va en los mocks y se muestra cuando viene. **Tier y rating no se muestran:** el backend los dejó para después del MVP (2026-10-07). La reputación la dan el acierto y la racha de las estadísticas.
- [x] **CP-21** `@usuario` lleva a `/user/{username}`: en el cuerpo de los posts, en la cabecera de las tarjetas y en "Personas" de la columna izquierda.

### Menciones y enlaces

- [x] **CP-14** `$BTC` lleva a `/asset/BTC`, `#defi` a `/hub/defi` y `@maria` a `/user/maria` (hoy no tiene link). Vale en el cuerpo de los posts, en la cabecera de las tarjetas y en la columna izquierda (activos, personas, grupos y sugeridas).
- [x] **CP-15** El filtro del Home por comunidad (`/?community=`) sigue funcionando por URL, pero nada del sitio lleva a él.

### Calidad

- [x] **CP-16** Mobile first: a 360 px, sin scroll horizontal y con las acciones al alcance. Teclado y lector de pantalla. axe sin violaciones, en claro y oscuro.
- [x] **CP-17** Cada sección secundaria (miembros, reglas) degrada sola si su request falla. Si falla la comunidad, la página muestra `error.tsx` (`engineering-principles.md § Manejo de errores`).
- [x] **CP-18** El JS de primera carga de cada ruta nueva queda dentro del presupuesto y se suma a `e2e/performance.spec.ts`. El PO subió el presupuesto de 230 a 235 KB el 2026-10-07 (`seo.md`): el Home quedó en 230,6 KB y estas páginas en 232,0 KB.
- [x] **CP-19** Textos nuevos en en, es y pt.
- [x] **CP-22** **"Volver" lleva siempre al Home** (cambio de alcance, pedido del PO el 2026-10-10): en las páginas de comunidad, activo y perfil, "Volver" es un link al Home, vengas de donde vengas (antes volvía a la página anterior). El detalle de un post sigue volviendo a donde estabas (PD-01).

## Fuera de alcance

- **Moderación:** editar la comunidad (`PATCH /communities/{slug}`), cambiar roles y sacar miembros. Queda para una spec propia.
- **Datos de mercado del activo:** precio, variación, sentimiento y alertas de precio (falta el proveedor).
- **Historial de tesis** en el perfil: fase 2 (CP-13).
- **Lista de miembros:** solo si el mockup la pide (el PDF dice "si el diseño lo pide").
- **Crear una comunidad.**

## Preguntas resueltas (2026-10-07)

- [x] **Mockup:** es el prototipo; sus vistas de grupo, activo y perfil son la referencia.
- [x] **Tipo que no corresponde a la ruta:** redirección (CP-02).
- [x] **`GET /assets/{symbol}`:** el PDF está probablemente desactualizado (responde en `dev` y en Vercel, con precio en `null`). La página de activo igual no lo usa en esta etapa (CP-09, CP-10); la pregunta queda para el backend en `proposals.md`.

## Dependencias

- `community-first` (botón Unirse y su provider), `guest-experience` (modal de cuenta) y `feed-navigation` (feed con streaming).
- Backend en Vercel (`https://asinko-app-web.vercel.app`): comunidades, membresías, favoritos y feed por comunidad ya responden.
