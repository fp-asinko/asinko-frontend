# Propuestas de cambios al contrato

> Lo que el front necesita y el contrato de la API no tiene. Cada propuesta se mockea en `src/mocks/` con esta forma exacta (ver [`api-integration.md`](../../ai-guidelines/api-integration.md)) y se le pasa al backend para implementarla. Cuando el backend la implementa y el front la adopta, sale de este archivo (queda en el historial de git) y pasa al snapshot del contrato.

**Actualizado el 2026-10-21**, después de la respuesta del backend a `proposals6` ([`responses/2026-10-20-backend.md`](responses/2026-10-20-backend.md)). Lo implementado se adoptó (`specs/backend-answer-1020`) y salió de acá. Queda:

- **Pendiente ahora:** una pregunta sobre los slugs de los activos, y lo que espera una decisión de producto (P-026, P-023 y la fórmula de `best`, P-014).
- **Fase 3 del backend:** los logros (P-030) y los widgets de los grupos (P-028, P-029). En el front ya se ven, contra mocks; el backend los implementa más adelante.

**Verificado contra el deploy de `dev` el 2026-10-21** (`pnpm api:smoke` contra `https://asinko-app-web.vercel.app`): 10 de 10 en verde, solo lecturas, cada respuesta con el mismo esquema que usa el mock. Además de lo de antes:

- los destacados, "Participa en", los seguidores de una persona y los miembros de un grupo (P-017, P-025, P-027);
- la comunidad de un activo por su `linkedCommunity`.

Lo que necesita sesión está en [Por verificar con datos reales](#por-verificar-con-datos-reales).

## Adoptado por el front (sale de este archivo)

| Propuesta                       | Qué hizo el front                                                                                                  | Spec                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------- |
| P-001 menciones                 | Se muestran desde `entities` en posts y comentarios. El feed de lo que menciona algo no se hace (`overview.md`).   | `backend-answer-1013` |
| P-003 precios                   | La página del activo muestra el precio y la variación, "desactualizado" con su fecha, o "Sin datos de mercado".    | `backend-adoption`    |
| P-011 nombre visible            | El perfil se titula con él y se edita en "Editar perfil".                                                         | `profile-presentation` |
| P-012 contenido y comentarios   | La pestaña Posts usa `GET /users/{id}/content`; la pestaña Respuestas, `GET /users/{id}/comments`.               | `backend-adoption`    |
| P-013 imágenes                  | Subida por URL firmada (`POST /uploads/post-image`) e `imageAlt`.                                                  | `backend-answer-1013` |
| P-015 anuncios                  | Sin intercalado propio; el feed ignora los `kind` que no conoce, para cuando lleguen.                             | `backend-answer-1013` |
| P-016 post principal            | La columna "Tus intereses" muestra `topPost`.                                                                      | `backend-adoption`    |
| P-017 "lo seguís"               | Seguir / Siguiendo en cada fila de seguidores, seguidos y miembros, con su nombre visible.                        | `backend-answer-1020` |
| P-018 relacionadas              | Se mandan con `relatedCommunityIds` y se muestran como píldoras bajo el cuerpo; ya no van como menciones al final. | `backend-answer-1020` |
| P-019 a P-021, P-024 el perfil  | Titular, ciudad, links, banner, "Acerca de" de 2000 y la subida de foto y banner, contra el backend.             | `backend-answer-1020` |
| P-022 borradores                | Contra el backend, con sus relacionadas; se publican con `draftId`.                                                | `backend-answer-1020` |
| P-025 destacados                | La forma de `FeedItem` con `featuredAt`; también se destacan encuestas.                                           | `backend-answer-1020` |
| P-027 dónde publica             | "Participa en" contra el backend (cuenta también las tesis).                                                       | `backend-answer-1020` |
| Catálogo                        | Rutas y menciones con `.` y `/` (`BRK.B`, `XAU/USD`); la comunidad de un activo sale de `linkedCommunity`.       | `backend-answer-1020` |
| P-005 orden del feed            | Descartado por el backend (solo Following y Explore). El front no tenía Hot ni Top: no cambia nada.               | —                     |
| `GET /assets` paginado y huérfanas | Resueltos del lado del backend; el front no los usa todavía.                                                  | —                     |

## Pendientes, en orden de prioridad para el front

1. **Pregunta: slugs de las comunidades de activo.** La respuesta del 2026-10-20 dice que van en minúscula y sin barra (`tsla`, `brk-b`), pero las que ya existen en `dev` siguen en mayúscula (`BTC`, `AAPL`, `VOO`). ¿Se renombran? El front ya no deduce el slug del símbolo (usa `linkedCommunity.slug`), así que funciona de las dos maneras; lo preguntamos para que los links viejos sigan andando.
2. **P-026: "Abierto a"** y **P-023: marcas por comunidad.** Esperan la decisión de producto (respuesta del 2026-10-20). Los valores y la forma de abajo son lo que el front ya tiene hecho contra mocks; si cambian, se ajusta el mock.
3. **`best` de los comentarios (P-014).** Espera la fórmula. El front ya manda `sort=best`.

### P-026: "Abierto a"

**Estado:** propuesta (2026-10-19), mockeada (un `PATCH /users` con `openTo` va al mock). **Backend, 2026-10-20:** lo define producto con el equipo, incluida la lista de valores.

**Endpoint:** `PATCH /api/v1/users/{userId}`, el `User` y el `Profile`.

**Motivo:** "Tengo interés en…", como LinkedIn (`specs/profile-showcase`): para qué está disponible la persona. Valores fijos, para traducirlos y, más adelante, filtrar por ellos.

**Cambio:** `"openTo": string[]` con valores de `QUESTIONS`, `COLLABORATIONS`, `MENTORING`, `AMAS`, `COMMISSIONED_ANALYSIS`, sin repetir; `[]` lo borra. `422 INVALID_OPEN_TO` con otro valor o repetido.

### P-023: Marcas por comunidad

**Estado:** propuesta (2026-10-19), mockeada. **Backend, 2026-10-20:** lo define producto con el equipo (quién define las marcas y si los moderadores las editan). El `Draft` ya trae `tag`. El nombre del campo en el `Community` probablemente no sea `tags` (Explore ya lo usa para los temas): el front lo cambia en el mapper cuando se confirme.

**Endpoint:** el recurso `Community` (`GET /communities`, `GET /communities/{slug}`) y `POST /posts`.

**Motivo:** "Añadir marca" al crear un post, como el flair de Reddit (`specs/drafts-tags`): cada comunidad tiene sus marcas ("Análisis", "Noticia", "Pregunta"…) y el post lleva una, opcional, que se ve junto al título. El `Post` ya tiene `tag` y `POST /posts` lo acepta, pero no hay de dónde sacar las marcas de cada comunidad.

**Cambio:**

- `"tags": string[]` en el `Community`: hasta 20, de 1 a 24 caracteres; `[]` si no tiene. Las definen sus moderadores (más adelante, con `PATCH /communities`); mientras tanto, del seed.
- `POST /posts` con un `tag` que no está en las de su comunidad: `422 INVALID_TAG`.

### `best` de los comentarios (P-014)

**Estado:** el backend acepta `sort=best` y por ahora responde cronológico; la fórmula está en definición.

**Propuesta del front** (decisión del PO, 2026-10-08), la de Hacker News: `score / (horas desde createdAt + 2) ^ 1,5`, de mayor a menor; un comentario nuevo y votado sube, y uno viejo baja de a poco. El mock la usa. Reddit usa el intervalo de Wilson sobre votos a favor y en contra por separado, y el contrato solo tiene `score`. Si el backend prefiere otra (o guardar votos a favor y en contra para usar Wilson), el front no cambia: solo manda `sort=best`.

## Fase 3 del backend: solo visual en el front

Decisión del 2026-10-21: estas propuestas se implementan en el backend en una fase 3. Hasta entonces, el front las muestra con mocks (desarrollo y CI, `API_MOCKS=missing` o `true`): la forma de abajo es la que ya usa, y es lo que proponemos.

| Propuesta | Qué se ve en el front | Spec |
| --- | --- | --- |
| P-030 logros | La tarjeta "Logros" en la columna derecha del perfil y la página `/user/{username}/achievements`, con 16 logros en cuatro grupos | `profile-achievements` |
| P-028 widgets | Los widgets de un grupo en su columna derecha (Texto, Reglas, Botones, Comunidades, Imágenes y Calendario) y "Editar widgets" para sus moderadores | `community-widgets` |
| P-029 imágenes de un grupo | La subida de imágenes del widget de Imágenes | `community-widgets` |

### P-030: Logros del perfil

**Estado:** propuesta (2026-10-19), mockeada. **Fase 3 del backend** (2026-10-21).

**Endpoint:** `GET /api/v1/users/{userId}/achievements` (público).

**Motivo:** la vitrina de trofeos del perfil, como Reddit (`specs/profile-achievements`). Quién ganó qué tiene que decidirlo el backend: el front no ve todas las tesis, votos ni seguidores de una persona, y armarlo ahí sería compensar con lógica.

**Cambio:**

```jsonc
{
  "items": [
    { "code": "STREAK_3", "earnedAt": "2026-09-02T14:00:00Z", "level": null, "progress": null },
    { "code": "ANNIVERSARY", "earnedAt": "2026-10-01T00:00:00Z", "level": 1, "progress": null },
    // Solo con la sesión del dueño: los que faltan.
    { "code": "STREAK_5", "earnedAt": null, "level": null, "progress": { "current": 3, "target": 5 } },
  ],
}
```

- `code`, uno de 16:
  - tesis: `FIRST_THESIS`, `FIRST_CORRECT`, `STREAK_3`, `STREAK_5`, `STREAK_10` (acertadas seguidas), `RESOLVED_10` y `ACCURACY_70` (con 10 o más resueltas);
  - comunidad: `FIRST_POST`, `FIRST_COMMENT`, `POST_100_VOTES` (un post con 100 votos), `FOLLOWERS_100`, `GROUP_FOUNDER` y `GROUP_MODERATOR`;
  - antigüedad: `ANNIVERSARY` (`level` = años cumplidos, un solo ítem) y `FOUNDING_MEMBER` (se registró antes del lanzamiento: la fecha la define el backend);
  - `PROFILE_COMPLETE`: foto, titular, "Acerca de", ubicación, links, "Abierto a", banner y al menos un destacado.
- Un logro ganado no se pierde aunque después baje la racha o la precisión.
- `progress` en los que se miden (rachas, resueltas, votos del mejor post, seguidores, precisión en puntos, pasos del perfil); `null` en los de sí o no.
- Orden: los ganados del más nuevo al más viejo; después los que faltan, en el orden de la lista de arriba.
- Sin sesión o de otra persona: solo los ganados. Usuario inexistente, `404`.

### P-028: Widgets de un grupo

**Estado:** propuesta (2026-10-19), mockeada. **Fase 3 del backend** (2026-10-21).

**Endpoints:** `GET /api/v1/communities/{slug}/widgets` (público) y `PUT /api/v1/communities/{slug}/widgets` (solo moderadores).

**Motivo:** que un grupo se sienta como su página web (`specs/community-widgets`): el moderador arma la columna derecha con bloques, como los widgets de Reddit. "Detalles de la comunidad" va siempre primero y sale del `Community` (no es un widget).

**Cambio:**

```jsonc
// GET → { items: Widget[] }, en su orden
{ "id": "string", "type": "TEXT", "title": "Bienvenida", "body": "Markdown" }
{ "id": "…", "type": "RULES", "title": "Reglas", "rules": [{ "title": "…", "description": "…" }] }
{ "id": "…", "type": "BUTTONS", "title": "Links", "buttons": [{ "label": "Discord", "url": "https://…" }] }
{ "id": "…", "type": "COMMUNITIES", "title": "Relacionadas", "communities": [/* CommunitySummary + memberCount */] }
{ "id": "…", "type": "IMAGES", "title": "", "images": [{ "imageUrl": "…", "alt": "…", "linkUrl": null }] }
{ "id": "…", "type": "CALENDAR", "title": "Eventos", "events": [{ "title": "…", "startsAt": "ISO 8601", "endsAt": null, "allDay": false, "location": null, "url": null }] }
```

- `PUT` `{ userId, items: WidgetInput[] }` → `{ items: Widget[] }`: reemplaza la lista entera, en ese orden. `WidgetInput` es igual que `Widget`, con `id` opcional (sin él, es nuevo) y `communityIds: string[]` en lugar de `communities`.
- Límites:
  - hasta 20 widgets;
  - título de 1 a 50 caracteres (en Imágenes, opcional);
  - Texto: cuerpo de 1 a 5000 caracteres;
  - Reglas: de 1 a 15, título de hasta 100 y descripción de hasta 500;
  - Botones: de 1 a 10, texto de hasta 30;
  - Comunidades: de 1 a 10;
  - Imágenes: de 1 a 10, descripción de 1 a 300;
  - Eventos: de 1 a 20, título de hasta 100 y lugar de hasta 100.
- Un link de usuario (`url`, `linkUrl`) es `http(s)` o una ruta del sitio que empieza con `/` (nunca `//`).
- Errores:
  - `403 NOT_MODERATOR`, `403 USER_MISMATCH`;
  - `422 TOO_MANY_WIDGETS`;
  - `422 INVALID_WIDGET` con `index` (qué widget) y `field` (`title`, `body`, `rules`, `buttons`, `communityIds`, `images`, `events`, `type`), para que el front marque cuál.
- Una comunidad de la lista que ya no existe no viene en `communities`.

### P-029: Imágenes de un grupo

**Estado:** propuesta (2026-10-19), mockeada. **Fase 3 del backend** (2026-10-21).

**Endpoint:** `POST /api/v1/uploads/community-image` `{ userId, communityId, contentType, size }` → `{ uploadUrl, imageUrl, path }`.

**Motivo:** el widget de Imágenes (P-028). También sirve para el banner y el avatar del grupo cuando exista "Editar comunidad".

**Cambio:** el mismo flujo de URL firmada que `POST /uploads/post-image` (P-013): JPEG, PNG, WebP o GIF (nunca SVG), hasta 5 MB. Solo moderadores de esa comunidad (`403 NOT_MODERATOR`).

## Por verificar con datos reales

Lo que necesita sesión y no se probó contra el deploy (lo mismo que listó el backend el 2026-10-20):

- subir foto y banner (bucket `profile-images`) y que el perfil muestre la URL que devuelve `PATCH /users`;
- destacar y sacar destacados, también una encuesta;
- crear un post con relacionadas, y guardar, editar y publicar un borrador con `draftId`;
- seguir y dejar de seguir desde una fila de las listas.

## Formato de una propuesta

```
### P-NNN: Título corto
**Estado:** propuesta | acordada | implementada
**Endpoint:** MÉTODO /api/v1/...
**Motivo:** qué vista o flujo del front lo necesita.
**Cambio:** forma exacta (campos nuevos, request, response, errores).
```
