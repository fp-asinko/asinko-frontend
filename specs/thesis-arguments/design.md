# Argumentos y actualizaciones de una tesis — Design

> Basado en `requirements.md` (Q1 a Q6 resueltas el 2026-11-03). Rama `feature/thesis-arguments`, desde `feature/thesis-detail-lifecycle`.

## 1. La idea

Los argumentos son **los comentarios de la tesis**, con un lado. El hilo de los comentarios de un post (`specs/comment-threads`, `specs/post-detail-refresh`) ya resuelve casi todo:

- respuestas anidadas, votos y plegar;
- responder y el link a un comentario;
- el orden y el esqueleto mientras carga.

Este spec lo generaliza para que hable de **un contenido**, no solo de un post, en vez de escribir otro hilo. Todo vive en `features/feed`, junto a la página de la tesis.

## 2. Un destino para los comentarios

Hoy los componentes y las funciones de comentarios reciben un `postId`. Pasan a recibir un **destino**:

```ts
// features/feed/feed.types.ts
export type CommentTarget =
  { kind: 'post'; id: string } | { kind: 'thesis'; id: string; side: 'PRO' | 'CONTRA' }
```

- `lib/comments-api.ts`: `getCommentTree(target, sort)` y `createCommentAs(userId, target, input)` arman la ruta del patrón:
  - un post va a `/api/v1/posts/:id/comments`;
  - una tesis va a `/api/v1/theses/:id/comments`, con `?side=` al leer y `side` en el body al escribir.
    La caché por request (`cache`) sigue: la clave es el destino serializado.
- `createComment` (la acción) acepta `target` en lugar de `postId`, validado con zod: `kind`, el `id` uuid y el `side` solo si es una tesis. El `side` sale del destino, **nunca** de lo que escribe quien comenta. Así una respuesta va al lado de su pestaña (TA-05, Q2).
- `CommentTree`, `CommentItem`, `CommentReply` y `CommentComposer` reciben `target` en lugar de `postId`. El post los llama con `{ kind: 'post', id }`: su comportamiento no cambia y sus tests siguen pasando.
- `searchComments` y la búsqueda quedan solo para el post (fuera de alcance).

## 3. Las pestañas (TA-01, TA-03, TA-06, TA-08)

- **`ThesisArguments`** (Server Component, en `thesis-route-page.tsx`) reemplaza el bloque "Próximamente".
  - Las pestañas son **links**, como los filtros del feed (`aria-current`), y no un Tabs de cliente: cero JS (TA-14). Van a `?side=pro` y `?side=contra`.
  - `thesisArgumentsQuerySchema` (zod) valida `side` (`pro` por defecto, también si el valor es desconocido) y `sort` (el de PD-03).
  - Cada pestaña muestra su contador (`argumentCount.pro` / `.contra`).
- Debajo van la caja, el orden y la lista, como `PostComments`. La lista va en su `Suspense`, con `key` de lado y orden.
- **Vacío:** la frase del lado, "Todavía nadie argumentó a favor. Sé el primero." (o en contra).
- **El feed:** la tarjeta lleva el contador a `/thesis/{id}?side=contra` si `contra > pro`, y si no a `?side=pro` (TA-08). `#arguments` sigue llevando a la sección.

## 4. La caja (TA-04, TA-07)

`CommentComposer` con `target` de la tesis y un `placeholder` del lado: "Argumentá a favor…" o "Argumentá en contra…". Al publicar, `CommentCount` del lado sube como en un post (CC-03): el contador de la pestaña es un `CommentCount` con su base.

## 5. Actualizaciones (TA-09 a TA-12)

- **`lib/thesis-updates-api.ts`** (`server-only`):
  - `getThesisUpdates(id)` → `GET /theses/:id/updates`, con el esquema `{ items: ThesisUpdate[] }` (Q6). Si el backend lo cambia a lista suelta, el esquema acepta las dos formas.
  - `createThesisUpdateAs(userId, id, body)` → `POST`.
  - `ThesisUpdate` (dominio): `{ id, body, createdAt }`. El autor es el de la tesis, así que no se repite.
- **`ThesisUpdates`** (servidor): la sección "Actualizaciones del autor".
  - Va arriba de los argumentos y solo aparece si hay alguna, o si quien mira puede publicar.
  - Ordenadas de la más nueva a la más vieja (Q4), cada una con su fecha (`dateTime` medium) y su Markdown con `PostMarkdown`.
  - Si falla, un error local; el resto de la página sigue (sección secundaria).
- **`ThesisUpdateComposer`** (cliente): una caja plegada "Publicar una actualización" que se abre como la de comentarios (PD-02).
  - Solo para el autor con la tesis abierta. El servidor lo decide con `canCancel || (state === 'open' && autor === viewer)`, no solo con `canCancel`, que se apaga en el último 10 %.
  - Hasta 2.000 caracteres, con contador.
  - Avisa que "No se puede editar ni borrar".
  - Al publicar, `router.refresh()`.
- **`create-thesis-update.action.ts`:** esquema `{ thesisId: uuid, body: trim 1..2000 }`, sesión adentro y el `userId` de la sesión.
  - `409 THESIS_NOT_OPEN` → `feed.thesis.updates.errors.notOpen`.
  - Sin sesión, el modal de cuenta.

## 6. Anuncios (Q5)

Los anuncios de la tesis siguen el camino del post. `getCommentTree` lee `ads` en la respuesta y los cuelga después de su comentario. Uno sin comentario (`afterCommentId: null`) va arriba de los argumentos. Si el backend no los manda, no aparecen. Los mocks los mandan como en un post.

## 7. Contrato y propuestas (Q2, Q4, Q5, Q6)

Van en `docs/references/api/proposals.md` como **P-039**, para Eugenio:

- una respuesta en una tesis lleva el `side` de su padre (el front lo manda igual);
- el largo máximo de una actualización (el front usa 2.000);
- anuncios en los comentarios de una tesis, como en un post (P-031);
- `GET /theses/{id}/updates` devuelve `{ items }`: el snapshot de E11 se corrige.

## 8. Mocks (TA-15)

- `src/mocks/fixtures/comments.ts`: argumentos de los dos lados, con respuestas, para dos tesis de ejemplo. Sus `argumentCounts` coinciden con el número de argumentos de primer nivel de cada lado.
- `handlers.ts`:
  - `GET /api/v1/theses/:id/comments` con `?side=` y `?sort=`, y sus anuncios;
  - `POST` con `side` obligatorio: sin él, `422`;
  - `GET` y `POST /api/v1/theses/:id/updates`, este último con `403` y `409 THESIS_NOT_OPEN`.
- Rutas `implemented: true`, porque el backend las tiene. Con `liveExample` para el `GET` de comentarios y de actualizaciones.

## 9. Textos

- `feed.thesis.arguments`: las pestañas, los vacíos y la caja de cada lado.
- `feed.thesis.updates`: el título, la caja, el aviso y los errores. Los del cliente se suman a `CLIENT_NAMESPACES`.
- Todo en en, es y pt.

## 10. Performance (TA-14)

- Las pestañas son links y el hilo es el del post, así que lo nuevo de cliente es `ThesisUpdateComposer`, solo para el autor. Se carga diferido, como la confirmación de cancelar.
- Se mide en `performance.spec.ts` con `/thesis/{id}`.

## 11. Tests

| Qué                                                                     | Dónde                                                                                                  |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| El destino: rutas, `side` al leer y al escribir                         | `comments-api.test.ts`                                                                                 |
| La acción: `side` del destino, nunca del cliente; post igual            | `comment.action.test.ts`, `comment.schema.test.ts`                                                     |
| El hilo y la caja con un destino de tesis                               | `comment-tree.test.tsx`, `comment-composer.test.tsx`                                                   |
| Pestañas, URL, vacío, link del feed                                     | `thesis-arguments.test.tsx` (lo síncrono), e2e                                                         |
| Actualizaciones: API, acción, caja                                      | `thesis-updates-api.test.ts`, `create-thesis-update.action.test.ts`, `thesis-update-composer.test.tsx` |
| Mocks contra el contrato                                                | `fixtures.test.ts`                                                                                     |
| Flujos: argumentar de cada lado, responder, actualizar, 360 px, axe, JS | `e2e/thesis-arguments.spec.ts`, `performance.spec.ts`                                                  |
