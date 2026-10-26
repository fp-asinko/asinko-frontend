# Glosario en el Home — Design

## 1. Propuesta P-032 (`docs/references/api/proposals.md`)

```json
{
  "id": "uuid",
  "term": "Short selling",
  "category": "Trading",
  "definition": "string",
  "example": "string | null"
}
```

- **Feed:** un ítem más de la lista, `{ "kind": "GLOSSARY", "content": GlossaryTerm }`, solo en Explore y Following sin `?community=` (el Home). Como los anuncios, va donde lo ponga el backend.
- El mock pone uno después de cada 8 ítems de contenido (posts y encuestas) de cada página, sin contar los anuncios.

## 2. Contrato y mocks

- `src/lib/api/contract/glossary.ts`: `glossaryTermSchema`. En `content.ts`, `feedItemSchema` suma la rama `GLOSSARY` (`reason` como los demás).
- `KNOWN_KINDS` (`feed-api.ts`) suma `GLOSSARY`.
- **Mocks** (`src/mocks/fixtures/glossary.ts`): los 15 términos del PO y `randomGlossary(count)`, al azar sin repetir el anterior (el patrón de `randomAds`). `feedPage` recibe si es el Home: con eso, intercala uno cada 8 ítems de contenido, después de poner los anuncios.

## 3. Dominio

```ts
export type GlossaryItem = {
  kind: 'glossary'
  id: string
  term: string
  category: string
  definition: string
  example: string | null
}
// FeedItem = PostItem | PollItem | AdItem | GlossaryItem
```

`toGlossaryItem` en `mappers.ts`. Un término se puede repetir en una página: la key de su `<li>` lleva su lugar, como la de un anuncio.

## 4. Componente (`features/feed/components/glossary-card.tsx`, Server Component)

Un `<article>` con el nombre "Glossary: {term}" (`aria-label`), así el lector de pantalla oye qué es antes de leerlo. Adentro, el término es el `<h2>`.

- **Cabecera:** el grupo (`type-meta text-muted-foreground`) a la izquierda. A la derecha, la marca con `BookOpenTextIcon` y "Glossary", con el estilo de la de POLL (`type-action font-extrabold uppercase`).
- **Término:** `text-2xl font-extrabold`, 24 px. El prototipo lo pone más grande que un título de post.
- **Texto:** `type-post-body`.
- **Ejemplo:**
  - una caja `rounded-lg bg-surface` con `border-l-3 border-foreground` y padding de 12 × 16;
  - la etiqueta "Example" con `type-section text-muted-foreground`;
  - el texto `type-post-body italic`.
- El mismo padding que las tarjetas del feed. Sin acciones.

Textos en `glossary.*`:

| Clave     | en               | es               | pt                |
| --------- | ---------------- | ---------------- | ----------------- |
| `label`   | Glossary         | Glosario         | Glossário         |
| `region`  | Glossary: {term} | Glosario: {term} | Glossário: {term} |
| `example` | Example          | Ejemplo          | Exemplo           |

## 5. Sobre el feed real (GL-07)

Con `API_MOCKS=missing` el feed viene del backend, que todavía no manda glosarios ni anuncios. Por eso se suman sobre la respuesta real.

- `MockExtension` (`src/mocks/types.ts`): `{ method, path, extend(response, context) }`. Es una propuesta encima de un endpoint implementado.
- `MOCK_EXTENSIONS` (`handlers.ts`) cubre tres endpoints, con las mismas funciones que los handlers:
  - Explore: anuncios, y glosarios sin `?community=`;
  - Following: anuncios y glosarios;
  - el contenido de un perfil: solo anuncios.
- El cliente HTTP (`extensions`) aplica la extensión a la respuesta de la red **antes** de validarla. Solo con `missing`: con `true`, los handlers ya los ponen; en producción `API_MOCKS` es `false`.

## 6. Peso

Server Component, sin JavaScript nuevo. `BookOpenTextIcon` se dibuja en el servidor.
