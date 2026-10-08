# Columna izquierda, segunda vuelta — Design

## 1. El post principal (P-016)

- Contrato: el resumen de comunidad suma `topPost: { id, title } | null` (opcional en el esquema hasta que el backend lo mande: `communitySchema` lo acepta ausente). El backend elige el más votado de los últimos 7 días, o el más reciente.
- Mock: lo calcula de los fixtures con esa regla (`src/mocks/fixtures/communities.ts`).
- Mappers de `interests`: `Group.topPostTitle` y `Suggestion.topPostTitle` y `Suggestion.description` (hoy no la tiene). Textos recortados y vacíos como `null`.

## 2. Cómo se ve

| Fila     | Antes                                                           | Después                                                                                                                                                                                                |
| -------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Grupo    | Avatar 20 px, `#handle` 14 px semibold, descripción 11 px       | La fila de las sugeridas: avatar 32 px `rounded-md`, `#handle` `type-small` negrita y, al lado del avatar y debajo del nombre, el post principal, la descripción o los miembros (`type-meta`, 1 línea) |
| Persona  | Avatar 28 px, `@usuario` 14 px semibold, precisión en chip gris | Avatar 32 px, `@usuario` `type-small` negrita, precisión con el color de su tramo (del tamaño de las sugeridas, PO 2026-10-08)                                                                         |
| Sugerida | Avatar 32 px, handle 12 px, "N miembros"                        | Igual tamaño, handle 13 px negrita, debajo el post principal, la descripción o los miembros, 1 línea                                                                                                   |

- La precisión por tramo: `accuracyTier` y sus clases pasan de `features/feed/lib` a `lib/accuracy-tier.ts` (la usan el feed y la columna; los features no se importan entre sí).
- Se mantienen el foco visible, el `aria-current` de la página actual y los nombres accesibles (la línea de abajo es parte del link, con `{' '}` entre las partes).

## 3. Tests

- Mappers (post principal, descripción, vacíos), `GroupList`, `PeopleList` (tramos), `SuggestedCommunities` (las tres opciones de la línea de abajo), el mock (regla de los 7 días contra el esquema), `lib/accuracy-tier`.
- E2E: la columna sigue pasando axe en claro y oscuro (`interests` y `guest`); el presupuesto de JS no cambia.
