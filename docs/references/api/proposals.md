# Propuestas de cambios al contrato

> Lo que el front necesita y el contrato de la API no tiene. Cada propuesta se mockea en `src/mocks/` con esta forma exacta (ver [`api-integration.md`](../../ai-guidelines/api-integration.md)) y se le pasa al backend para implementarla. Cuando el backend la implementa y el front la adopta, sale de este archivo (queda en el historial de git) y pasa al snapshot del contrato.

**Actualizado el 2026-10-21**, después de la respuesta del backend a `proposals6` ([`responses/2026-10-20-backend.md`](responses/2026-10-20-backend.md)). Lo implementado se adoptó (`specs/backend-answer-1020`) y salió de acá. Queda:

- **Pendiente ahora:** una pregunta sobre los slugs de los activos, y lo que espera una decisión de producto (P-026, P-023 y la fórmula de `best`, P-014).
- **Fase 3 del backend:** los logros (P-030) y los widgets de los grupos (P-028, P-029). En el front ya se ven, contra mocks; el backend los implementa más adelante.
- **Sprint 2 (MVP-3):** lo nuevo que piden las tareas del sprint, empezando por las reglas de la cuenta (P-033), Explore con sesión (P-034), saber si un username está libre mientras se escribe (P-035), borrar una cuenta sin dejar el perfil huérfano (P-036) que `POST /users` guarde lo que dice el contrato (P-037) y borradores de tesis (P-038).

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

### P-031: Anuncios en el feed y en el detalle de un post

**Estado:** propuesta (2026-10-24), mockeada (`specs/ads`). Parte de lo que respondió el backend sobre P-015 el 2026-10-13: los anuncios vienen dentro del feed y el front no decide dónde van.

**Motivo:** el PO pidió volver a mostrar anuncios en los feeds y también en el detalle de un post, con piezas gráficas terminadas (traen su texto, su logo y sus avisos legales adentro, en tamaños distintos: 4:5, 1:1, 1,91:1 y banners de 970×250).

**Cambio:**

- **El `Ad`**: el de P-015, con el texto propio opcional y la imagen con su tamaño (para reservar el lugar, sin saltos al cargar) y su texto alternativo:

  ```json
  {
    "id": "uuid",
    "advertiser": { "name": "string", "logoUrl": "string | null" },
    "body": "string (hasta 280) | null",
    "url": "https://…",
    "image": { "url": "string", "width": 1200, "height": 1500, "alt": "string" } | null
  }
  ```

- **En el feed** (Explore, Following, `?community=` y `/users/{id}/content`): un ítem más de la lista, `{ "kind": "AD", "content": Ad }`, donde el backend lo ponga. El front lo dibuja ahí y no lo cuenta. El mock pone uno después de cada 10 ítems de cada página.
- **En el detalle**: `GET /posts/{id}/comments` (el árbol, sin `?q` ni `?limit`) suma `"ads": [{ "afterCommentId": "uuid | null", "ad": Ad }]`. `null` va debajo del post; si no, va después de ese comentario, en el orden de lectura y antes de sus respuestas. El backend elige las posiciones. El mock pone uno debajo del post y uno cada 10 comentarios, contando respuestas. La búsqueda (`?q=`) y la vista previa de una tarjeta (`?limit`) no traen `ads`.
- **El link**: solo `http(s)`. El front descarta otro esquema y abre el link en otra pestaña con `rel="sponsored"`.

### P-032: Glosario en el Home

**Estado:** propuesta (2026-10-25), mockeada (`specs/glossary`). Es contenido de la plataforma (`overview.md § Creados por la plataforma`).

**Motivo:** el PO pidió tarjetas de glosario en el Home, una cada 8 posts. Cada término tiene su grupo, su definición y un ejemplo. No se vota, no se comenta y no tiene página.

**Cambio:**

- **El `GlossaryTerm`:**

  ```json
  {
    "id": "uuid",
    "term": "string",
    "category": "string",
    "definition": "string",
    "example": "string | null"
  }
  ```

- **En el feed:** solo en el Home (`/feed/explore` sin `?community=` y `/feed/following`), un ítem más de la lista, `{ "kind": "GLOSSARY", "content": GlossaryTerm }`, donde el backend lo ponga, como los anuncios (P-031). El front lo dibuja ahí. El mock pone uno después de cada 8 posts de cada página, sin contar los anuncios, elegido al azar.

### `best` de los comentarios (P-014)

**Estado:** el backend acepta `sort=best` y por ahora responde cronológico; la fórmula está en definición.

**Propuesta del front** (decisión del PO, 2026-10-08), la de Hacker News: `score / (horas desde createdAt + 2) ^ 1,5`, de mayor a menor; un comentario nuevo y votado sube, y uno viejo baja de a poco. El mock la usa. Reddit usa el intervalo de Wilson sobre votos a favor y en contra por separado, y el contrato solo tiene `score`. Si el backend prefiere otra (o guardar votos a favor y en contra para usar Wilson), el front no cambia: solo manda `sort=best`.

## Sprint 2 (MVP-3, 25/10 al 7/11)

Lo que pide el trabajo del sprint: login (MVP-210), tesis (MVP-137, MVP-140, MVP-141, MVP-143), crear comunidad (MVP-204) y notificaciones (MVP-146).

### P-033: Reglas de la cuenta del lado del backend

**Estado:** propuesta (2026-10-29), `specs/auth` (MVP-210). No hace falta mock: el front ya aplica las dos reglas.

**Motivo:** el PO fijó dos reglas para crear una cuenta, y hoy solo las aplica el front. Una cuenta creada por otro camino (la página `/login` del backend, o una llamada directa a Supabase) se las saltea.

**Cambio:**

- **Contraseña de 8 caracteres o más:** en Supabase Auth, _Authentication → Policies → Minimum password length_ en 8 (hoy, el default de 6). Con eso, `signUp` rechaza una más corta, venga de donde venga. Es un cambio de Auth: necesita OK explícito.
- **Edad mínima de 18 años:** el checkbox del front dice "Tengo 18 años o más y acepto los Términos". `POST /users` guarda solo `ageConfirmed` como un booleano. Proponemos que la edad quede escrita en los Términos (`TERMS_VERSION`) y en el contrato de E01, así `ageConfirmed: true` significa siempre "18 o más". No hace falta un campo nuevo.

### P-034: Explore con sesión también trae lo popular

**Estado:** propuesta (2026-10-30), encontrado al probar `specs/auth` con una cuenta nueva. Sin mock: el front no lo compensa (`api-integration.md § Contrato`).

**Motivo:** una cuenta recién creada ve el Home vacío ("No posts yet"). Sin sesión, el mismo pedido trae posts. La respuesta del 2026-10-20 dice que el ranking con sesión suma "lo popular de lo que seguís, comunidades parecidas, tu país y lo popular de toda la plataforma", pero hoy solo trae lo primero:

| `GET /feed/explore?kind=POST,POLL,THOUGHT`, todas las páginas | Ítems | `reason`                       |
| ------------------------------------------------------------- | ----- | ------------------------------ |
| Sin sesión                                                    | 32    | `TRENDING` 28, `COUNTRY` 4     |
| Con sesión (cuenta de QA que sigue comunidades, país FI)      | 21    | `FOLLOWING` 17, `SIMILAR` 4    |
| Con sesión, cuenta nueva que no sigue nada                    | 0     | —                              |

Medido contra `dev` el 2026-10-30.

**Cambio:** con sesión, Explore suma también `COUNTRY` y `TRENDING` (excluyendo lo que ya vino por `FOLLOWING` o `SIMILAR`), como sin sesión. Así una cuenta nueva arranca con lo popular, y una que sigue poco no se queda sin feed a la segunda página. El país de la cuenta (`countryCode`), o el de la IP si no tiene.

### P-035: Saber si un username está libre

**Estado:** propuesta (2026-10-30), mockeada. `specs/auth` (AU-24).

**Endpoint:** `GET /api/v1/usernames/{username}`. Requiere sesión: la usa una cuenta recién creada, en el paso de elegir su username.

**Motivo:** hoy un username tomado se sabe recién al enviar el formulario (`POST /users` → `409 USERNAME_TAKEN`). Queremos avisarlo mientras la persona escribe. Desde el front no se puede saber bien:

- `GET /profiles/{identifier}` responde `404` para un perfil privado, que igual ocupa su username;
- tampoco ve los usernames viejos reservados por un año (`SlugHistory`).

**Cambio:**

```jsonc
// 200
{ "available": false }
```

- `available: false` con las mismas reglas que `POST /users` y `PATCH /users/{userId}`:
  - el username de otro, sin distinguir mayúsculas, aunque su perfil sea privado;
  - uno reservado dentro de su ventana de un año.
- El username propio de quien pregunta cuenta como disponible: sirve también para cambiarlo desde "Editar perfil".
- **Errores:**
  - `422 INVALID_USERNAME` si no cumple `USERNAME_RE` (3 a 30 letras, números o `_`);
  - `401` sin sesión;
  - `429` con `retryAfter` si se abusa. El front pregunta 400 ms después de la última tecla, uno por vez.
- **Es solo un aviso:** `POST /users` sigue decidiendo, y su `409` se sigue mostrando, por ejemplo si dos personas eligen el mismo a la vez.

### P-036: Borrar una cuenta sin dejar el perfil huérfano

**Estado:** propuesta (2026-10-30), encontrada al probar `specs/auth`: había que borrar una cuenta para volver a entrar con Google. No hace falta mock: el front no lo consume.

**Motivo:** el perfil no está atado al usuario de Supabase Auth. `Profile.id = auth.users.id` es una convención, sin clave foránea (`schema.prisma`, `asinko-app` `dev` en `9924924`). Por eso:

- **Si se borra el usuario en Supabase Auth** (desde el panel o con la API de admin), el `Profile` queda huérfano y activo: conserva su username, su foto y su página pública, y nadie puede entrar a esa cuenta. El username queda trabado para siempre.
- **`DELETE /users/{userId}`**, el borrado lógico, sí libera el username: lo cambia a `del_<id>` y vacía los datos. Pero:
  - necesita la sesión de esa misma cuenta, y no borra el usuario de Supabase Auth (el código ya lo marca como pendiente);
  - no le cambia el slug al canal personal. El canal sigue con el username viejo, aunque `PATCH /users/{userId}` mantiene los dos iguales. Si otra cuenta elige después ese username, crear su canal podría chocar con el slug. No lo verificamos.

**Cambio:**

1. **Borrar el usuario en Supabase Auth hace el borrado lógico del perfil**, igual que `DELETE /users/{userId}`:
   - username a `del_<id>`;
   - sin foto, bio, nombre, headline, ciudad ni links;
   - sin borradores ni banner;
   - `isDeleted` y `deletedAt`.

   Por ejemplo, con un trigger `AFTER DELETE ON auth.users` en una migración. No puede ser un `ON DELETE CASCADE`: la fila tiene que quedar, porque las tesis son inmutables y no pierden a su autor (E1-11-03).
2. **El borrado lógico también cambia el slug del canal personal** al username nuevo (`del_<id>`), en la misma transacción, como ya hace `PATCH` al cambiar el username.
3. **Para más adelante ("Borrar la cuenta" en el front, todavía sin spec):** que `DELETE /users/{userId}` también borre el usuario de Supabase Auth, o lo deshabilite, y cierre sus sesiones. Requiere la clave `service_role`, que solo puede estar en el backend. Así una cuenta se borra con un solo pedido, desde la app.

**Pregunta:** ¿el username de una cuenta borrada se reserva un año, como uno cambiado (`SlugHistory`)? Hoy queda libre al instante. Reservarlo evita que alguien se haga pasar por la cuenta borrada en los links y las menciones viejas. Liberarlo permite volver a crear la cuenta con el mismo nombre. Es una decisión de producto.

**Mientras tanto, en `dev`:** para volver a probar el registro con una cuenta ya usada, se borra el usuario en Supabase Auth y se elige otro username. El perfil viejo queda huérfano.

### P-037: `POST /users` guarda los campos que dice el contrato

**Estado:** propuesta (2026-10-30), encontrada al probar `specs/auth` con Google: el nombre del paso 2 no se guardaba. El front ya lo resolvió por su lado; no hace falta mock.

**Motivo:** E01 dice que `POST /users` acepta, además de lo listado, "cualquier otro campo client-safe de `User`/`Profile`". Pero `createUserProfile` (`asinko-app` `dev` en `9924924`) guarda solo `username`, `countryCode`, `language`, `avatarUrl`, `bio` e `isPublic`. El resto, como `displayName`, se ignora sin error, y el `201` dice que salió bien.

**Mientras tanto, en el front:** el nombre se manda con `PATCH /users/{userId}` apenas se crea el perfil. Son dos pedidos, y si el segundo falla, el perfil queda sin nombre hasta que se reintenta.

**Cambio**, una de dos:

1. **(Preferida)** `POST /users` guarda también `displayName`, con las mismas reglas que `PATCH`: hasta 50 caracteres (`422 DISPLAY_NAME_TOO_LONG`) y `null` si es igual al username. Con eso, el front vuelve a un solo pedido.
2. Corregir E01: listar exactamente lo que guarda, y responder `422` a un campo que no acepta, en lugar de ignorarlo.

### P-038: Borradores de tesis

**Estado:** propuesta (2026-11-02, `specs/thesis-drafts`). Mockeada: con `API_MOCKS=missing`, solo los borradores de tesis van al mock; los de posts siguen yendo al backend.

**Motivo:** las tesis se crean desde la misma página que los posts (`specs/thesis-create`), pero los borradores (P-022, E03) solo aceptan `TEXT`, `LINK`, `IMAGE` y `THOUGHT`. Una tesis lleva más trabajo que un post (activo, objetivo, fecha, convicción, razonamiento), y hoy no se puede guardar para terminarla después.

**Cambio:**

- `Draft.type` suma `THESIS`. Una tesis usa `title` para la predicción (`claim`) y `body` para el razonamiento, y suma `thesis` (`null` en los demás tipos):

  ```jsonc
  "thesis": {
    "assetSymbol": "BTC" | null,
    "targetPrice": 150000 | null,
    "targetDirection": "ABOVE" | "BELOW" | null,
    "deadline": "ISO 8601" | null, // el fin del día elegido, como en POST /theses
    "conviction": "LOW" | "MEDIUM" | "HIGH" | "EXTREME" | null
  } | null
  ```

- `POST /drafts` y `PATCH /drafts/{id}` aceptan `thesis`; como hoy, nada es obligatorio y el límite de 20 es de todos los borradores juntos.
- `POST /theses` acepta `draftId`: publica y borra el borrador en la misma operación; inexistente o ajeno, `404` sin publicar (igual que `POST /posts`).

**Mientras tanto, en el front:** después de publicar una tesis que vino de un borrador, el front lo borra con `DELETE /drafts/{id}`. Con `draftId` en el backend, ese pedido se va.

### P-039: Argumentos y actualizaciones de una tesis

**Estado:** consultas (2026-11-03, `specs/thesis-arguments`). El front ya usa lo que el backend tiene; esto aclara cuatro puntos. Con `API_MOCKS=true` se ven con mocks; con `missing`, todo va al backend.

**Motivo:** la página de una tesis muestra sus argumentos a favor y en contra (los comentarios con `side`, E05) y las actualizaciones de su autor (E11). Lo probamos contra `dev` el 2026-11-03.

**Consultas:**

**Probado en `dev` el 2026-11-03:** una respuesta con el `side` de su padre se guarda bien; los comentarios de una tesis no traen `ads`; `/updates` devuelve `{ items }`. Quedan abiertas la 1 (¿rechaza el lado contrario?), la 2 y la 3.

1. **El lado de una respuesta.** E05 dice que `side` es obligatorio en un comentario de una tesis. El front manda también en cada respuesta el `side` del argumento al que responde. ¿El backend lo acepta así? ¿Rechaza una respuesta con el lado contrario al de su padre? Proponemos que la rechace (`422`) o que tome el del padre.
2. **El largo de una actualización.** El contrato no fija un máximo para el `body` de `POST /theses/{id}/updates`. El front corta en 2.000 caracteres. ¿Hay un límite en el backend?
3. **Anuncios entre los argumentos.** En un post, `GET /posts/{id}/comments` trae `ads` (P-031). Proponemos lo mismo en `GET /theses/{id}/comments`, para cada lado: uno arriba y uno cada 10 argumentos. Con la lista vacía no los vimos. Mientras tanto, con `API_MOCKS=missing` el front los agrega a la respuesta real (`MOCK_EXTENSIONS`), como los de un post.
4. **La forma de `GET /theses/{id}/updates`.** `dev` devuelve `{ "items": [...] }`; E11 dice una lista suelta. Seguimos al backend y corregimos el snapshot de E11 (el front acepta las dos).

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

**Estado:** propuesta (2026-10-19), mockeada. **Fase 3 del backend** (2026-10-21). **Backend, 2026-10-22 (`dev`, handoff del 22/10):** existe `POST /uploads/community-image`, pero para el avatar y el banner de una comunidad: `{ userId, contentType, size }`, igual que `POST /uploads/avatar`, sin `communityId` ni control de moderador; la imagen se limpia y se achica recién al guardarla con `POST /communities` o `PATCH /communities/{slug}`. Para los widgets falta que el guardado de P-028 haga lo mismo con sus imágenes: el mock sigue encendido hasta que existan los widgets (revisado contra `dev` en `9924924`, 2026-10-29).

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
