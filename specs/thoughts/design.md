# Thoughts y posts sin cuerpo — Design

## 1. Contrato (`src/lib/api/contract/content.ts`)

- `postSchema.type` suma `THOUGHT`. `title` y `body` siguen siendo `string`: un thought llega con `title: ""` y un post sin cuerpo con `body: ""`.
- `feedItemSchema` suma la rama `{ kind: 'THOUGHT', content: postSchema, reason }`.
- `draftSchema.type` suma `THOUGHT` (el backend acepta borradores de thoughts).
- **Feed:** `KNOWN_KINDS` suma `THOUGHT`. El filtro "Nuevos" pide `?kind=POST,POLL,THOUGHT`; "Encuestas" sigue con `POLL` (TH-09).
- **El snapshot** (`E03`, `E04`) suma el tipo, el `kind` y el cuerpo opcional.

## 2. Dominio

- `PostItem` suma `thought: boolean`. Un thought es un post con otro formato: se vota, se comenta y se comparte igual, y su página es la de un post. Una tarjeta aparte duplicaría todo eso.
- `toFeedItem`: `kind: 'THOUGHT'` va por `toPostItem` con `thought: true`. `title` queda `""`.
- `postPath(id, title)`: para un thought, el slug sale del texto (`postSlug(body)`), así el link se puede leer (TH-08). La descripción para compartir también sale del texto; la de un post sin cuerpo, del título (TH-02).

## 3. La tarjeta (`PostCard`, TH-06, TH-07)

Con `post.thought`:

- La cabecera de siempre (`CardByline`), con la marca **THOUGHT** a la derecha (`QuoteIcon` sin relleno + "THOUGHT", con el mismo estilo que el badge POLL).
- **Comillas sutiles** (pedido del PO, 2026-10-25): la comilla de la cita es el carácter “ de Figtree, extrabold y en `text-faint`, como el prototipo; no el `QuoteIcon` relleno. Va arriba de la primera línea, y el texto en `text-foreground` con `font-medium` (PO, 2026-10-26: la itálica fina se leía clara). La cita lleva más aire: 16 px arriba y abajo en la tarjeta, 20 en su página (`my-4`, `my-5`), y sangría de 36 px. Lo mismo en el campo del editor.
- **Caja** (PO, 2026-10-26): la cita va en una caja gris `bg-surface rounded-lg`, sin bordes (se probaron negros a los lados y el PO los sacó); las comillas y la firma van adentro.
- **Vistos recientemente:** un thought se guarda con su texto (hasta 160 caracteres) y su ícono de comillas (un post lleva el de una hoja con texto, `FileText`, PO 2026-10-29). El texto va en itálica y entre comillas, como en su tarjeta. Las entradas sin título, guardadas antes de eso, se descartan al leer la lista; si se vuelve a abrir el thought, aparece con su texto (PO, 2026-10-29).
- **Firma** (PO, 2026-10-26): debajo de la cita, "— {nombre visible}" o "— @username" si no tiene, en gris y sin itálica. El backend todavía no manda el nombre visible del autor en los posts: hoy sale el @.
- Sin título. El texto es una **cita**: un `<blockquote>` con unas comillas grandes en `text-faint` (decorativas, `aria-hidden`), el texto en itálica a 21 px (17 + 4, PO 2026-10-26) y `PostMarkdown` (menciones y Markdown, TH-07). El corte en ~6 líneas con "Ver más" es el mismo de hoy.
- El nombre del `article` (`aria-labelledby`) es el texto de la cita, como hoy lo es el título. Sin `<h2>` vacío.
- Votos, comentarios (con la caja de `specs/card-comment`) y compartir: lo mismo de un post.
- **En su página** (`variant="detail"`), la cita va a 26 px (22 + 4, PO 2026-10-26), entera.

> **Cambio al implementar:** el `<h2>` (o el `<h1>` en su página) no es la cita sino "Thought de {autor}", solo para lectores de pantalla (`sr-only`), y la cita se ve debajo. El Markdown y las menciones de la cita no pueden ir dentro de un heading ni de un link; así el `article` se nombra igual que un post y el heading lleva el link a su página.

**Post sin cuerpo** (TH-02): `PostCard` no dibuja el cuerpo cuando `body` es `""` (hoy dibujaría un `PostMarkdown` vacío y podría ofrecer "Ver más").

## 4. Crear (TH-01, TH-03 a TH-05)

- **`createPostSchema`:**
  - `type` suma `THOUGHT`;
  - `body` pasa a ser opcional (`""` permitido);
  - en `superRefine`: con `THOUGHT`, el texto es obligatorio y el título no se manda; con los otros tipos, el título es obligatorio;
  - el `transform` saca el título de un thought.

  `saveDraftSchema`, `use-post-draft` y `preview-post` suman `THOUGHT`.

- **`PostEditor`:**
  - una pestaña **Thought** primera, como el prototipo (pedido del PO, 2026-10-25), con `QuoteIcon`; al llegar sigue elegida Text;
  - con Thought, se ocultan el título, el link y la imagen, y el campo del texto pasa a ser el principal (lo enfocado al llegar), con su propio placeholder ("Share a thought");
  - Publicar se habilita con texto (Thought) o con título (los demás).
  - **El campo del thought** (captura del PO, 2026-10-25), como el prototipo: una caja propia (sin la barra de formato ni Vista previa), `QuoteIcon` grande en `text-faint`, el texto a 18 px en itálica y semibold, y abajo, tras un borde, "Frases breves y memorables" y lo que queda de **250** caracteres (`THOUGHT_MAX`, en rojo al pasarse). Es el mismo `textarea` del cuerpo: cambiar de pestaña no pierde lo escrito, y las menciones se sugieren igual.
  - **El límite de 250 es del front:** el backend no tiene (2026-10-23). El esquema lo exige (`composer.errors.thoughtTooLong`); los thoughts más largos que lleguen del backend se ven igual, con "Ver más".
- **`/submit?type=thought`** elige la pestaña: `parseSubmitQuery` suma `thought`.
- **El ícono de comillas** de `ComposerPlaceholder` pasa de `GatedComingSoon` a `ComposeTrigger type="thought"` (TH-04). `ComposeTrigger` suma ese tipo.

## 5. Mocks

- Fixtures: tres thoughts (de `jeppe`, `maria` y `federico`, en grupos y activos) y un post sin cuerpo.
- El feed los devuelve como `kind: 'THOUGHT'`. `byKind` filtra `THOUGHT` como el backend: `POST` no los incluye.
- `POST /posts` acepta `THOUGHT` (sin título, con texto) y un post sin cuerpo, con los mismos errores que el backend.

## 6. Peso

Todo en Server Components y en lo que ya carga el editor (diferido): sin JavaScript nuevo en la primera carga, salvo `QuoteIcon` en el editor.
