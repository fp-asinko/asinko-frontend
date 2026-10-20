# API — E03 Posts y contenido abierto

**Spec:** `product/specs/E03-posts-contenido-abierto.md` · **Schema:** `Content`, `Post`, `Poll`, `PollOption`, `PollVote` (`plan/schema-v1.prisma`)

---

## Recurso `Post`

```
{
  "id": "uuid",
  "communityId": "uuid",
  "community": { "id": "uuid", "slug": "string", "name": "string", "type": "CommunityType" }, // P-004 (dev, 3cfff41)
  "type": "TEXT | LINK | IMAGE",
  "title": "string",
  "body": "string",          // markdown
  "url": "string | null",    // solo type = LINK
  "imageUrl": "string | null", // solo type = IMAGE
  "tag": "string | null",
  "related": [{ "id", "slug", "name", "type", "avatarUrl" }], // P-018 (2026-10-20): las que eligió el autor, en su orden; [] si está borrado
  "creator": { "id", "username", "avatarUrl", "accuracyRate" } | null, // "[usuario eliminado]" si se borró; null si creatorType = SYSTEM
  "creatorType": "USER | SYSTEM",
  "score": "number",         // upvotes - downvotes
  "commentCount": "number",
  "viewerVote": "1 | -1 | null",
  "editedAt": "ISO 8601 | null",
  "deleted": "boolean",      // true → title y body vacíos ("", P-008 en dev, 3cfff41)
  "publishedAt": "ISO 8601",
  "createdAt": "ISO 8601"
}
```

### `POST /api/v1/posts` — Crear post
**Auth:** requerida.
**Usuario:** sin ownership, `userId` explícito — `userId` (body) debe coincidir con la sesión — se convierte en `Post.creatorId`.

**Request body:** `userId`, `communityId`, `type`, `title` (≤300), `body`, `url?` (si `type=LINK`), `imageUrl?` (si `type=IMAGE`), `tag?`, `relatedCommunityIds?` (hasta 3, distintos de `communityId`, sin canales personales; P-018), `draftId?` (publica ese borrador y lo borra en la misma operación; P-022)
**Respuesta `201`:** el `Post` creado, más `entities: [{ type: "TICKER"|"MENTION"|"COMMUNITY", raw: string, resolvedId: string, position: [number, number] }]`.
**Errores:** `403 USER_MISMATCH` · `422` si `title`/`body` vacíos o exceden el límite, o si `communityId` no existe · `422 INVALID_RELATED_COMMUNITY` (más de 3, repetidas, la principal, inexistente o un canal personal) · `404` si `draftId` no existe o es ajeno (no publica nada).
**Relacionadas:** el post aparece también en `GET /feed/explore?community=` de cada una y en Following de quien sigue alguna (una sola vez). No se editan después: `PATCH /posts/{id}` con `relatedCommunityIds` da `422`.

## Borradores (P-022, implementado el 2026-10-20)

Todos con sesión: el `userId` (body o query) se compara con ella.

```jsonc
// Draft
{
  "id": "uuid", "type": "TEXT | LINK | IMAGE",
  "title": "", "body": "", "url": "", "imageUrl": null, "imageAlt": "", "tag": null,
  "community": null, // CommunitySummary | null
  "related": [],     // como Post.related
  "createdAt": "ISO 8601", "updatedAt": "ISO 8601"
}
```

- `GET /api/v1/users/{userId}/drafts`: solo el dueño; hasta 20, del último guardado al más viejo, `nextCursor: null`.
- `POST /api/v1/drafts`: `201 Draft`; con 20, `409 DRAFT_LIMIT`. Nada es obligatorio; se validan los largos, la comunidad y que `imageUrl` sea una imagen subida con `POST /uploads/post-image`. Las relacionadas van en `relatedCommunityIds`.
- `PATCH /api/v1/drafts/{draftId}`: `200 Draft` y lo pasa primero. Lo que no se manda no cambia; `null` borra. Inexistente o ajeno, `404`.
- `DELETE /api/v1/drafts/{draftId}?userId=`: `204`, también si ya no existía.
- Se publican con `POST /posts` y `draftId` (arriba).

### `GET /api/v1/posts/{id}`
**Público** (si la comunidad del post es pública).

**Errores:** `404`.

### `PATCH /api/v1/posts/{id}`
**Auth:** requerida.
**Usuario:** debe ser igual a `Content.creatorId` (del `Content` que respalda este post) **y** `userId` (body) debe coincidir con la sesión. Contenido `creatorType: SYSTEM` no es editable vía este endpoint (no hay `creatorId` que compare).

**Request body:** `userId` (requerido) + `body`, `title` (si `type=TEXT`) y `tag?` son editables — no permite cambiar `type`/`url`/`imageUrl`. Setea `editedAt`.
**Respuesta `200`:** el `Post` (forma completa, § Recurso `Post`), con `editedAt` actualizado.
**Errores:** `403 USER_MISMATCH`.

### `DELETE /api/v1/posts/{id}`
**Auth:** requerida.
**Usuario:** debe ser igual a `Content.creatorId`, **o** tener rol `MODERATOR`+ en `Content.communityId`, **y** `userId` (query param) debe coincidir con la sesión.

Soft-delete.
**Respuesta:** `204 No Content` — sin body.
**Errores:** `403 USER_MISMATCH`.

---

## Recurso `Poll`

```
{
  "id": "uuid",
  "communityId": "uuid",
  "community": { "id": "uuid", "slug": "string", "name": "string", "type": "CommunityType" }, // P-004 (dev, 3cfff41)
  "question": "string",
  "options": [{ "id": "uuid", "label": "string", "description": "string | null", "position": "number", "voteCount": "number" }],
  "closesAt": "ISO 8601 | null",
  "isClosed": "boolean",
  "allowVoteChange": "boolean", // default true — ver PUT .../vote abajo
  "resultsVisibility": "ALWAYS | ON_VOTE | ON_CLOSE",
  "totalVotes": "number",
  "commentCount": "number", // sin borrados, como en Post (P-006, dev, 3cfff41)
  "viewerOptionId": "uuid | null", // qué opción votó el viewer, null si no votó o no hay sesión
  "creator": { "id", "username", "avatarUrl" } | null, // null si creatorType = SYSTEM
  "creatorType": "USER | SYSTEM",
  "publishedAt": "ISO 8601",
  "createdAt": "ISO 8601"
}
```

`voteCount` por opción y `totalVotes` respetan `resultsVisibility` — si el viewer no votó y es `ON_VOTE`, el backend devuelve `voteCount: null` por opción hasta que vote.

### `POST /api/v1/polls` — Crear encuesta
**Auth:** requerida.
**Usuario:** sin ownership, `userId` explícito — `userId` (body) debe coincidir con la sesión — se convierte en `Poll.creatorId`.

**Request body:** `userId`, `communityId`, `question` (≤300), `options` (array de 2 a 6 objetos `{ label, description? }`), `closesAt?`, `allowVoteChange?` (default `true`), `resultsVisibility` (`ALWAYS | ON_VOTE | ON_CLOSE`)
**Respuesta `201`:** el `Poll` creado.
**Errores:** `403 USER_MISMATCH` · `422`.

### `GET /api/v1/polls/{id}`
**Público**, sujeto a la visibilidad de resultados descrita arriba.

**Errores:** `404`.

### `PUT /api/v1/polls/{id}/vote`
**Auth:** requerida.
**Usuario:** sin ownership, `userId` explícito — `userId` (body) debe coincidir con la sesión.

Idempotente si `allowVoteChange` (default `true`) — un `PUT` con `optionId` distinto mueve el voto mientras la encuesta esté abierta.

**Request body:** `{ "userId": "uuid", "optionId": "uuid" }`
**Respuesta `200`:** el `Poll` (forma completa, § Recurso `Poll`), con `options[].voteCount`/`totalVotes`/`viewerOptionId` actualizados.
**Errores:** `403 USER_MISMATCH` · `409 POLL_CLOSED` — si `isClosed`, sin importar `allowVoteChange` · `409 VOTE_LOCKED` — si `allowVoteChange: false` y ya existe un voto previo.
