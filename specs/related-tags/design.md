# Etiquetar comunidades y activos al publicar — Design

## 1. Datos

- `createPostSchema` suma `related: z.array(relatedHandle).max(3).default([])`, donde `relatedHandle` es `$` + `assetSymbolSchema` o `#` + `communitySlugSchema` (el formato de las menciones). Sin repetidos.
- El `transform` del esquema agrega `\n\n` + los handles separados por espacio al final de `body` y quita `related` del objeto: el backend recibe el mismo `POST /posts` de hoy. Así la Server Action (que valida con el mismo esquema) es la que decide, no el navegador.
- El borrador (`use-post-draft.ts`) suma `related`, validado con el mismo `relatedHandleSchema` (opcional, para leer borradores viejos).

## 2. UI

- `CommunityPicker` suma dos props:
  - `variant: 'chip' | 'add'` (con `cva`): `chip` es el de hoy; `add` es un botón redondo de 32 px con `PlusIcon` y `aria-label`, que no muestra valor y llama a `onChange` con la opción elegida.
  - `exclude: readonly string[]` (handles): las opciones que no muestra (RT-03). En `add`, además, sin "Tu perfil".
- `RelatedPicker` (`related-picker.tsx`, para no sumar más al editor): las píldoras de los relacionados (`#macro ×`, grises como el selector, truncadas a 360 px) en una lista con nombre y el picker `add` si hay menos de 3. `PostEditor` lo pone al lado del selector en una fila `flex flex-wrap items-center gap-1.5`, solo con comunidad. El estado son los handles (`related: string[]`) en el formulario (`react-hook-form`): lo que se muestra, lo que se excluye y lo que se manda.
- Quitar uno lleva el foco al "+" (que vuelve a estar) o a la × anterior.
- Mensajes: `composer.community.addRelated` (el nombre del "+"), `composer.related.label` (la lista) y `composer.related.remove` ("Quitar {handle}").

## 3. P-018

En `docs/references/api/proposals.md`: un campo `relatedCommunityIds` (hasta 3) en `POST /posts` y que el post aparezca también en el feed de esas comunidades. Si el backend lo acepta, se deja de escribir la línea de menciones y se manda el campo (cambia solo el `transform`).

## 4. Tests

- Esquema: agrega la línea al final; máximo 3; rechaza handles inválidos y repetidos; sin relacionados, el cuerpo queda igual.
- `CommunityPicker variant="add"`: botón con nombre, `exclude` y sin "Tu perfil".
- `PostEditor`: sumar, quitar (foco), tope de 3, cambiar la principal quita el repetido, publicar manda los handles.
- Borrador: guarda y recupera los relacionados.
- E2E (`submit-page.spec.ts`): sumar `$BTC` y `#macro`, publicar y ver los links en el post; 360 px y axe con relacionados.
