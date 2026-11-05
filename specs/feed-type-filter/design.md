# Filtro por tipo en el feed — Design

## 1. URL

`feedParamsSchema` (`features/feed/schemas/feed-params.schema.ts`):

| Parámetro | Valores                           | Por defecto | Notas                                                                  |
| --------- | --------------------------------- | ----------- | ---------------------------------------------------------------------- |
| `filter`  | `new`                             | `new`       | El orden. `polls` se acepta por compatibilidad y se convierte (FT-10). |
| `type`    | `all`, `posts`, `theses`, `polls` | `all`       | Nuevo. Inválido → `all`. `all` no se escribe en los links.             |

`?filter=polls` sin `type` se lee como `type=polls` (un `preprocess` sobre el objeto entero). `feedHref` arma los links con `type` y nunca vuelve a escribir `filter=polls`.

## 2. Pedido a la API

`feed-api.ts`: `KINDS` pasa a depender de `type`:

| `type`   | `kind` (feed)              | `kind` (perfil, sin filtros hoy) |
| -------- | -------------------------- | -------------------------------- |
| `all`    | `POST,POLL,THOUGHT,THESIS` | `POST,POLL,THOUGHT`              |
| `posts`  | `POST,THOUGHT`             | —                                |
| `theses` | `THESIS`                   | —                                |
| `polls`  | `POLL`                     | —                                |

## 3. Componentes

| Pieza                    | Dónde                                         | Qué hace                                                                                                                                                                                                                            |
| ------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FeedTabs`               | `features/feed/components/feed-tabs.tsx`      | Suma un `trailing` a la derecha del renglón de pestañas (`flex`, `ml-auto`, `shrink-0`). Las pestañas pueden achicarse; los controles no.                                                                                           |
| `FeedSort`               | `features/feed/components/feed-sort.tsx`      | La píldora New (un link con `aria-current`), lo que hoy hace `FeedFilters` para New.                                                                                                                                                |
| `FeedTypeMenu` (cliente) | `features/feed/components/feed-type-menu.tsx` | La píldora "All ▾" y el `DropdownMenu` de shadcn (Base UI) con `DropdownMenuRadioGroup`. Cada opción navega con el `Link`/`router` de `@/i18n/navigation` a `feedHref({...params, type})`. Diferido no: es chico y se ve al cargar. |
| `FeedFilters`            | `features/feed/components/feed-filters.tsx`   | En las páginas de comunidad (FT-11): New + el selector en su renglón. En el Home ya no se usa; el chip de comunidad (FT-03) queda en su propio renglón, solo cuando hay uno.                                                        |

**A 360 px (FT-02):** las pestañas usan `min-w-0` y su texto no se corta (son tres palabras cortas); New y el selector van con `px-3` y `h-8`. Si en algún idioma no entra, el texto del selector se esconde y queda el ícono de filtro con su nombre accesible (`sr-only sm:not-sr-only`).

## 4. Textos

`feed.type.label` ("Content type"), `feed.type.all|posts|theses|polls`, y los vacíos `feed.empty.posts|theses` (el de polls ya existe). Las claves `feed.filters.polls` y su vacío se reusan.

## 5. Tests

| Qué                                                           | Dónde                                      |
| ------------------------------------------------------------- | ------------------------------------------ |
| `type` en la URL, inválido → all, `filter=polls` → polls      | `feed-params.schema.test.ts`               |
| `kind` por tipo                                               | `feed-api.test.ts`                         |
| Menú: opciones, ✓, links que conservan pestaña y comunidad    | `feed-type-menu.test.tsx`                  |
| Barra: pestañas + New + selector en un renglón                | `feed-view.test.tsx`, `feed-tabs.test.tsx` |
| 360 px sin scroll, axe claro/oscuro, elegir Theses en el Home | `e2e/feed-type-filter.spec.ts`             |
| Presupuesto de JS                                             | `performance.spec.ts`                      |
