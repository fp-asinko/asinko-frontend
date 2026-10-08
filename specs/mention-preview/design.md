# Vista previa de menciones — Design

> Con las decisiones del PO (Q1 a Q4 de `requirements.md`, 2026-10-08).
>
> **Ajustes al implementar (2026-10-08), sin cambio de alcance:** todo vive en `features/communities` (no hizo falta mover nada a `lib/`, la antigua T-01); el escucha se monta desde el layout, que puede importar features. La tarjeta es el `HoverCard` de shadcn con un ancla externa (verificado). Sus botones no necesitan `tabIndex={-1}`: la tarjeta se cierra cuando el foco deja el link, así que el tabulador nunca llega a ella.

## 1. Un solo escucha para toda la página

Envolver cada link en un componente cliente (un `HoverCardTrigger` en cada mención) sumaría Base UI y un componente por link a la primera carga, y el presupuesto no lo permite (MP-11). En su lugar:

- Los links que tienen tarjeta llevan un atributo: `data-preview="group:macro"`, `asset:BTC` o `user:maria` (`previewProps` de `lib/communities/preview.ts`). Los pone el servidor en `post-markdown.tsx`, `CardByline` (grupo y autor) y el autor del comentario: no cambia nada del link.
- **`MentionPreviews`** (`features/communities/components`, cliente) se monta en `app/[locale]/layout.tsx` dentro de los proveedores de sesión y membresías: un solo escucha delegado en el documento (`pointerover`/`pointerout`, `focusin`/`focusout`, Esc y clic).
  - El layout lo importa **por su ruta, no por el `index` del feature**: el `index` también exporta la página de comunidad, y Next carga en todas las páginas cada componente cliente alcanzable desde el layout (medido: +2,6 KB en el Home por `CommunityActions`).
- El puntero de un toque (`pointerType: 'touch'`) nunca abre una tarjeta (MP-02).
- Con el puntero quieto 500 ms sobre un `[data-preview]` (Q4), o con el foco de teclado (`:focus-visible`, Q1), descarga con `next/dynamic` la tarjeta (`PreviewPopover`, un chunk) y pide los datos.
- El atributo se lee con una expresión regular (sin zod en el navegador: pesaría en todas las páginas) y la Server Action lo valida otra vez con zod: es contenido del DOM, no confiable.

## 2. La tarjeta

- `PreviewPopover` usa el `HoverCard` de shadcn (Base UI `PreviewCard`) controlado y sin `Trigger`, anclado al link: `HoverCardContent` reenvía `anchor` al `Positioner` (cambio mínimo en `components/ui/hover-card.tsx`, con su comentario `asinko:`). Se abre debajo, alineado al principio del link, y pasa arriba si no entra (MP-09). No toma el foco.
- 360 px de ancho (nunca más que la pantalla menos 16 px), borde, fondo `popover`, radio 16 px y **la única sombra del sistema**, `shadow-float` (`--float-shadow` en claro y oscuro, MP-14): la tarjeta flota sobre la página. Va con `!` porque el `shadow-md` de shadcn (`none` en el sistema) queda en las clases y viene después en el CSS. La animación de entrada y salida es la de shadcn (fundido y escala desde 95 %, 100 ms).
- **`PreviewCard`**, como Reddit: el nombre como link a la página y el botón a su lado; la descripción o la bio con `line-clamp-3` (15 px); y, bajo una línea, los números en una grilla de dos columnas, el valor arriba (17 px, negrita) y la etiqueta abajo (`dl`, números compactos y fechas "nov 2025" con `useFormatter`).
  - **Grupo y activo:** `IdentityBanner` de 96 px y, debajo (sin superponerse), avatar cuadrado redondeado de 56 px, handle y nombre, y Unirse o "Unido" (`CommunityActions` con `favorite={null}`: sin estrella, Q2). Números: miembros y "Creado" (solo los grupos que creó una persona; los del sistema tienen la fecha de carga).
  - **Persona:** sin banner, avatar redondo de 64 px, nombre e insignia, `@username`, y Seguir o "Siguiendo". Números: seguidores, precisión (si ya tiene tesis resueltas), racha y "Miembro desde". Sin botón en el propio perfil.
  - Unido, el foco queda en el nombre (`focusFallbackId` de `JoinButton`), no se pierde.
- **Esqueleto** con la misma forma mientras llegan los datos (MP-08), con `role="status"` y "Cargando vista previa".

## 3. Datos

- Server Action `getPreview({ kind, slug })` en `features/communities/actions/`, validada con zod. `getPreviewData` (`lib/preview-api.ts`) reusa lo que usan las páginas, `getCommunityPage` y, para una persona, también `getProfileDetails`, en paralelo. Devuelve solo lo que la tarjeta muestra:

  ```ts
  type Preview = {
    community: Pick<
      CommunityPage,
      | 'slug'
      | 'handle'
      | 'subtitle'
      | 'description'
      | 'avatarUrl'
      | 'bannerUrl'
      | 'kind'
      | 'memberCount'
      | 'createdAt' // null para las del sistema
      | 'viewerMembership'
    >
    profile: ProfileDetails | null // una persona: su perfil (con joinedAt); seguirla es unirse a su canal
  }
  ```

- Leer no pide sesión (las páginas son públicas); con sesión, llega la membresía.
- **Caché en el cliente** por `kind:slug` durante la visita (MP-08). Un error (incluido `NOT_FOUND`) no muestra la tarjeta y no se guarda.
- Unirse o seguir desde la tarjeta usa el estado compartido de membresías (`JoinedProvider`): el botón de la página, el de la tarjeta del feed y el de la vista previa coinciden, y la caché no queda vieja.

## 4. Abrir y cerrar

| Evento                                                                | Efecto                                                |
| --------------------------------------------------------------------- | ----------------------------------------------------- |
| Puntero quieto 500 ms sobre el link                                   | Abre (descarga y pide si hace falta)                  |
| Pasa de largo (sale antes de 500 ms)                                  | No abre                                               |
| Sale del link o de la tarjeta                                         | Cierra a los 150 ms, salvo que entre a la otra        |
| Foco de teclado en el link (Q1)                                       | Abre con la misma pausa; cuando el foco sigue, cierra |
| Esc                                                                   | Cierra, sin mover el foco (WCAG 1.4.13)               |
| Clic en el link                                                       | Navega y la tarjeta se cierra                         |
| Otra página                                                           | La tarjeta se cierra (sus links ya no están)          |
| Un diálogo abierto desde la tarjeta (salir de un grupo, pedir cuenta) | La tarjeta se queda hasta que se cierra el diálogo    |
| La tarjeta se cierra con el foco en su botón (se hizo clic)           | El foco vuelve al link, no se pierde                  |

## 5. Accesibilidad

- La tarjeta es contenido complementario: el link no gana `aria-haspopup` ni `aria-expanded` (no es un menú). Cuando llegan los datos, el link suma a su `aria-describedby` (sin pisar uno anterior) el resumen de la tarjeta: nombre, descripción y números, sin los botones (Q1). Llega después del foco, y algunos lectores de pantalla solo lo leen al volver a enfocar; se verifica con NVDA o VoiceOver.
- La descripción, la bio y el subtítulo son texto de usuarios: cortan palabras largas (`wrap-anywhere`) en vez de desbordarse.
- El foco nunca entra solo a la tarjeta; con el teclado, la acción está en la página a la que lleva el link (Q1).
- Contraste y tokens de siempre; el banner sin imagen usa el degradé de identidad (`IdentityBanner`).

## 6. Mensajes

`preview.loading` y `preview.stats.*` (las etiquetas de los números), nuevos. La insignia reusa `communities.profile`, que pasa a `CLIENT_NAMESPACES`; los botones, `communities.actions` y `join`.

## 7. Performance

- Medido al cerrar (2026-10-08): Home y detalle 234,6 KB (antes 233,6), páginas de comunidad, activo y perfil 236,1 KB (antes 235,1). +1,0 KB por ruta: el escucha y la entrada del chunk diferido en el manifiesto.
- La tarjeta, Base UI `PreviewCard`, `CommunityActions` (en el Home) y la action van en el chunk diferido.

## 8. Tests

- Unitarios: `MentionPreviews` (pausa, pasar de largo, salir, quedarse sobre la tarjeta, cerrar después del clic en su botón con el foco de vuelta en el link, teclado, Esc, toque y atributo inválido), `PreviewPopover` (esqueleto, tarjeta, `aria-describedby`, error sin tarjeta, caché), `PreviewCard` (grupo, fecha de creación, activo, persona con sus números, precisión desconocida, uno mismo), los mappers (fecha de creación y de alta), `getPreview` y `getPreviewData`, y el atributo (`lib/communities/preview`).
- E2E (`e2e/mention-preview.spec.ts`, desktop): grupo y persona del Home, autor de comentario, pasar de largo, Esc, teclado, unirse desde la tarjeta, axe abierta en claro y oscuro. Mobile: tocar navega y no hay tarjeta. Presupuesto de JS.
