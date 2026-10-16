# Relacionados en la columna derecha — Design

## 1. URL

- `submitPath(locale, { community, type, related })`: `related` son los slugs (`BTC`, `macro`, sin el símbolo), separados por coma.
- `parseSubmitQuery` lee `related`: hasta 3, cada uno validado (`communitySlugSchema` o `assetSymbolSchema`), sin repetidos ni la comunidad principal; lo inválido se descarta.
- `SubmitEditor` reemplaza la URL (`router.replace`, sin scroll) al cambiar la comunidad **o** los relacionados, con los dos: hoy cambiar la comunidad borraría los relacionados de la URL. `PostEditor` suma `onRelatedChange(handles)` y la prop `related` (los de la URL al llegar).

## 2. Servidor

- `SubmitPage` resuelve cada relacionado con `getSubmitCommunity` (cacheada por request: la columna derecha lo reusa) y le pasa al editor sus handles; los que no existen o no se pueden etiquetar (canales personales) se descartan.
- `@right/submit` y `@right/publicar` pasan `related` a `SubmitAside`, que los resuelve en paralelo y dibuja `RelatedCard`: un `Collapsible` de shadcn plegado, el trigger (dentro de un `h2`, como las tarjetas hermanas) con el título y un `PlusIcon` que rota 45° al abrir (200 ms; 150 al cerrar, como el panel), y las filas.
- D-3: el `Collapsible` mantiene su estado porque el árbol del servidor se reconcilia en el mismo lugar (misma `key`); al pasar de 0 a 1 relacionado se monta plegado.

## 3. Tests

- `submitPath` y `parseSubmitQuery` con `related`.
- `SubmitEditor`: la URL lleva comunidad y relacionados; cambiar uno conserva el otro.
- E2E: sumar dos relacionados muestra "Relacionados (2)" plegado; el "+" los despliega con sus handles; recargar conserva las píldoras y la tarjeta; axe con la tarjeta abierta, en claro y oscuro.
