# Vista previa de menciones — Design

> Con las decisiones del PO (Q1 a Q4 de `requirements.md`, 2026-10-08).

## 1. Un solo escucha para toda la página

Envolver cada link en un componente cliente (`HoverCard` de shadcn en cada mención) sumaría Base UI y un componente por link a la primera carga, y el presupuesto no lo permite (MP-11). En su lugar:

- Los links que tienen tarjeta llevan un atributo: `data-preview="group:macro"`, `asset:BTC` o `user:maria`. Los pone el servidor (`post-markdown.tsx`, `CardByline`, el autor del comentario): no cambia nada del link.
- **`PreviewHost`** (organismo, cliente, en el shell): un solo escucha delegado de `pointerover`/`pointerout` (y `focusin`/`focusout`, Q1) en el documento. Pesa unas 40 líneas. Solo se activa con `(hover: hover)` (MP-02).
- Con el puntero quieto 500 ms sobre un `[data-preview]` (Q4), descarga con `import()` la tarjeta (`PreviewCard`, un chunk) y pide los datos.
- El atributo se valida con zod antes de usarse (`kind` y un slug o username con su esquema): es contenido del DOM, no confiable.

## 2. La tarjeta

- `PreviewCard` usa el `Popover` de shadcn (Base UI) anclado al link (`anchor` del `Positioner`), con `side` arriba o abajo según el espacio (MP-09) y sin robar el foco (`initialFocus` en `false`). Si `HoverCard` de shadcn (Base UI `PreviewCard`) admite un ancla externa, se usa ese; se verifica en T-02.
- 320 px de ancho, borde, fondo `popover`, radio 16 px, sin sombra; entra con `animate-fade-in` (≤ 200 ms) y sale en 150 ms (`specs/home-motion`).
- **Grupo y activo:** `IdentityBanner` (64 px), avatar superpuesto, handle (link), subtítulo, descripción con `line-clamp-3`, miembros con `getFormatter` (formato compacto), `JoinButton` variante `compact`.
- **Persona:** avatar redondo, `@username` (link), nombre e insignia, bio con `line-clamp-3`, seguidores, precisión (el chip de tramos de las tarjetas) y racha, botón Seguir de `community-actions` (no en el propio perfil).
- **Esqueleto** con la misma forma mientras llegan los datos (MP-08).

## 3. Datos

- Server Action `getPreview({ kind, id })` en `lib/previews/` (no es de un feature: la usan el feed y las páginas), validada con zod. Reusa `GET /communities/:slug` y `GET /profiles/:identifier` a través de funciones de `lib/` y devuelve un DTO mínimo:

  ```ts
  type Preview =
    | {
        kind: 'group' | 'asset'
        handle
        subtitle
        description
        avatarUrl
        bannerUrl
        colorKey
        memberCount
        communityId
        viewerMembership
      }
    | {
        kind: 'user'
        handle
        displayName
        badge
        bio
        avatarUrl
        followerCount
        accuracyRate
        currentStreak
        isSelf
        viewerFollows
      }
  ```

- **Caché en el cliente** por `kind:id` mientras dura la página (MP-08). Un `NOT_FOUND` o un error no muestra la tarjeta.
- Unirse o seguir desde la tarjeta actualiza el estado compartido de membresías (`specs/community-pages`), así el botón de la página y el de la tarjeta coinciden.
- Hoy `communities` y `profiles` viven en `features/communities/lib`. Para no importar entre features, sus llamadas a la API y mappers pasan a `lib/communities/` (refactor sin cambio de comportamiento, T-01).

## 4. Abrir y cerrar

| Evento                              | Efecto                                                 |
| ----------------------------------- | ------------------------------------------------------ |
| Puntero quieto 500 ms sobre el link | Abre (descarga y pide si hace falta)                   |
| Sale del link o de la tarjeta       | Cierra a los 150 ms, salvo que entre a la otra         |
| Esc                                 | Cierra, sin mover el foco (WCAG 1.4.13)                |
| Foco de teclado en el link (Q1)     | Abre con la misma pausa; `focusout` cierra             |
| Clic en el link                     | Navega; la tarjeta se cierra                           |
| Scroll                              | La tarjeta sigue al link (el `Positioner` lo resuelve) |

## 5. Accesibilidad

- La tarjeta es contenido complementario: el link no gana `aria-haspopup` ni `aria-expanded` (no es un menú). Se asocia con `aria-describedby` mientras está abierta, así un lector de pantalla oye el resumen al enfocar (Q1).
- El botón de la tarjeta tiene `tabIndex={-1}`: la acción también está en la página de destino (Q1).
- Contraste y tokens de siempre; el banner sin imagen usa el degradé de identidad (`IdentityBanner`).

## 6. Mensajes

`preview.*` (cliente): miembros y seguidores (ICU con plural y formato compacto), precisión, racha, "Cargando". Se suma a `CLIENT_NAMESPACES`. Los botones reusan los textos de `community`.

## 7. Performance

- Primera carga: `PreviewHost` (~1 KB) y una entrada más en el manifiesto de chunks diferidos (~0,2 KB, `seo.md`). Se mide en T-05 contra 233,6 / 235,1 KB.
- La tarjeta, Base UI `Popover` y la action van en el chunk diferido.

## 8. Tests

- Unitarios: `PreviewHost` (pausa, cancelación al pasar de largo, Esc, foco, atributo inválido ignorado), `PreviewCard` (grupo, activo, persona, uno mismo, esqueleto), `getPreview` (validación, mapeo, errores), el esquema del atributo.
- E2E (desktop): hover sobre el grupo y el autor de una tarjeta del Home, sobre un autor de comentario; Esc; llevar el mouse a la tarjeta y unirse; axe abierta en claro y oscuro; en mobile no aparece y tocar navega. Presupuesto de JS.
