# Nombres sin símbolo en las tarjetas y el # chico en los grupos — Design

- **`CardByline`** (`features/feed/components/card-byline.tsx`):
  - `GroupName` escribe `group.slug` cuando el grupo no es un activo. Un activo mantiene el `$` en gris, como hoy.
  - `AuthorName` escribe `author.username` en vez de `author.handle`.
  - El texto del avatar (sus iniciales) y el color de identidad no cambian, porque salen del nombre y del slug (`specs/feed-cards`).
- **`CommunityHeader`** (`features/communities/components/community-header.tsx`): con `page.kind === 'group'`, el `<h1>` es un `<span>` con el `#` más el nombre:
  - el `#` va en `text-[0.75em] font-semibold text-muted-foreground`, con `mr-0.5`;
  - todo dentro del mismo `<h1>` y sin espacio, así el nombre accesible sigue siendo `#crypto`.

  Un activo y un perfil siguen como hoy.

- **Tests:** los unitarios y los e2e que buscaban `@maria` o `#defi` en la cabecera de una tarjeta pasan a buscar el nombre sin símbolo. Los que buscan menciones en el texto, en la columna o en las píldoras no cambian (BH-04).
