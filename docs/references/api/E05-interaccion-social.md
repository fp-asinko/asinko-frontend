# API — E05 Interacción social

**Spec:** `product/specs/E05-interaccion-social.md` · **Schema:** `Comment`, `Vote` (`plan/schema-v1.prisma`)

---

## Upvote / downvote

Aplica a `post`, `thesis` y `comment`.

### `PUT /api/v1/{postId|thesisId|commentId}/vote`
En la práctica, tres rutas con la misma forma:
- `PUT /api/v1/posts/{id}/vote`
- `PUT /api/v1/theses/{id}/vote`
- `PUT /api/v1/comments/{id}/vote`

**Auth:** requerida.
**Usuario:** sin ownership, `userId` explícito — `userId` (body) debe coincidir con la sesión.

**Request body:** `{ "userId": "uuid", "value": 1 | -1 }`
**Respuesta `200`:** `{ "score": "number", "viewerVote": 1 | -1 }`
**Errores:** `403 USER_MISMATCH`.

### `DELETE /api/v1/{posts|theses|comments}/{id}/vote`
**Auth:** requerida.
**Usuario:** sin ownership, `userId` explícito (query param) — mismo criterio que el `PUT`.

**Respuesta:** `204 No Content` — sin body.
**Errores:** `403 USER_MISMATCH`.

---

## Comentarios

### Recurso `Comment`

```
{
  "id": "uuid",
  "author": { "id", "username", "avatarUrl", "accuracyRate" },
  "body": "string",
  "parentCommentId": "uuid | null",
  "side": "PRO | CONTRA | null",   // solo si cuelga de una Thesis
  "score": "number",
  "viewerVote": "1 | -1 | null",
  "replyCount": "number",
  "editedAt": "ISO 8601 | null",
  "deleted": "boolean",
  "createdAt": "ISO 8601"
}
```

### `GET /api/v1/{posts|theses|polls}/{id}/comments`
**Público.** Acepta `?side=PRO|CONTRA` para Thesis, para traer un solo sub-thread.

**Forma de respuesta:** `{ "items": Comment[] }` donde cada `Comment` trae sus `replies` anidados inline.

### `POST /api/v1/{posts|theses|polls}/{id}/comments` — Crear comentario
**Auth:** requerida.
**Usuario:** sin ownership, `userId` explícito — `userId` (body) debe coincidir con la sesión.

**Request body:** `userId`, `body`, `parentCommentId?`, `side?` (obligatorio si el contenido padre es una Thesis)
**Respuesta `201`:** el `Comment` creado.
**Errores:** `403 USER_MISMATCH` · `422`.

### `PATCH /api/v1/comments/{id}`
**Auth:** requerida.
**Usuario:** debe ser igual a `Comment.authorId` **y** `userId` (body) debe coincidir con la sesión.
Solo `body` — `parentCommentId`/`side` no son editables.

**Request body:** `{ "userId": "uuid", "body": "string" }`
**Respuesta `200`:** el `Comment` (forma completa, § Recurso `Comment`), con `editedAt` actualizado.
**Errores:** `403 USER_MISMATCH`.

### `DELETE /api/v1/comments/{id}`
**Auth:** requerida.
**Usuario:** debe ser igual a `Comment.authorId`, **o** tener rol `MODERATOR`+ en la comunidad del contenido padre — cualquiera de las dos alcanza, **y** `userId` (query param) debe coincidir con la sesión.

**Respuesta:** `204 No Content` — sin body.
**Errores:** `403 USER_MISMATCH`.
