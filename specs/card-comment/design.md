# Comentar desde la tarjeta — Design

## 1. La action (CC-02, CC-05)

**`commentFromCard`** (`features/feed/actions/comment-from-card.action.ts`):

- Recibe `{ kind: 'post' | 'poll', id, body }`, validado con zod (`cardCommentSchema`).
- Toma el `userId` de la sesión. Sin sesión, devuelve `UNAUTHENTICATED`.
- Llama a `createCommentAs`, que suma el destino: `POST /api/v1/{posts|polls}/{id}/comments`.
- **No llama a `refresh()`**, a diferencia de `createComment` del detalle. En el Home, refrescar volvería a pedir Explore y su ranking, y las tarjetas cambiarían de orden mientras la persona lee (CC-02).
- Devuelve `{ id }`.

## 2. La caja (CC-01, CC-04, CC-06)

**`CommentComposer`** (el del detalle) se reutiliza tal cual, con tres props nuevas y opcionales que no cambian el detalle:

- `send`: la action a usar. Por defecto, `createComment` del post.
- `onSent(comment)`: ahora recibe `{ id, body }`. Las respuestas lo siguen llamando sin mirar el argumento.
- `boxId`: el `id` del campo. El detalle usa `COMMENT_BOX`, al que apuntan sus links "comment"; en una tarjeta no lleva `id`, porque puede haber muchas en la página.

## 3. El panel (CC-01 a CC-03, CC-07)

`loadCommentsPreview` (la action que ya trae la vista previa al abrir 💬) devuelve ahora `{ preview, empty }`. `CommentsToggle` dibuja la vista previa dentro de **`CardComments`**, un componente cliente que importa con `next/dynamic`: su JavaScript se carga la primera vez que se abre 💬, no con la página (CC-07). _Cambio al implementar: primero la action devolvía `CardComments` ya armado, pero Next exige que un componente cliente que llega en la respuesta de una action ya esté registrado en la página._

`CardComments` contiene:

1. **Lo mandado**, arriba: lo que está en camino (con `CommentThread` y `PendingComments`, como el detalle) y lo ya mandado en esta visita, con la misma forma, "You · now", en texto plano.
2. La vista previa del servidor, como hoy.
3. La caja, con `send` = `commentFromCard` y `onSent`, que suma el comentario a la lista de arriba y avisa al contador.

**El contador** (CC-03): `CommentsToggle` ofrece un contexto `added` (lo mandado en esta visita). El número de la tarjeta pasa a **`CommentCount`**, un componente cliente chico que muestra `base + added` con el mismo formato que hoy (`countFormat`). La tarjeta le pasa `base`.

## 4. Peso

- `CommentCount` y el contexto: unas 20 líneas en todas las rutas con feed, porque `CommentsToggle` ya es cliente.
- `CardComments` y la caja: diferidas, llegan con la vista previa.
