# Página de crear post — Design

## 1. Rutas

- **Sin `pathnames` de next-intl:** configurarlos tipa todos los `Link` del sitio contra la lista de rutas (`keyof pathnames`), y hoy los links son textos libres (`/hub/defi`, `/post/1/x`). En su lugar, dos carpetas que dibujan la misma página:
  - `src/app/[locale]/submit/page.tsx` (inglés) y `src/app/[locale]/publicar/page.tsx` (español y portugués), **fuera de `(main)`**: redirigen o dan 404 según la URL, así que van sin `loading.tsx` para que el 308 y el 404 sean reales (`i18n.md § 404`).
  - Cada una verifica su idioma con `checkSubmitSegment`: `/es/submit` y `/pt/submit` redirigen (308) a `/publicar` conservando la query; `/en/publicar` es 404.
  - `src/i18n/submit-path.ts`: `SUBMIT_SEGMENT` y `submitPath(locale, { community?, type? })`, que arma el link (`/publicar?community=defi`, sin el prefijo de idioma, que pone `Link`). Vive en `i18n/` porque `lib/` no puede importar el tipo `Locale` (límites de `tooling.md`).
- **`?community=`** es el slug (validado con `communitySlugSchema` o `assetSymbolSchema`); **`?type=`** `text | link | image` elige la pestaña al llegar. Valores inválidos se ignoran (`parseSubmitQuery`).
- Metadata (`submitMetadata`): título "Crear post", `robots: noindex`, canonical propio y alternates por idioma.

## 2. La columna derecha por página: ruta paralela `@right`

El layout (`app/[locale]/layout.tsx`) recibe `right` como slot paralelo en lugar de dibujar `<RightColumn />`:

- `@right/default.tsx` → `<RightColumn />` (la de siempre); `@right/page.tsx` y `@right/[...rest]/page.tsx` reexportan `default`. El comodín hace falta porque en una navegación del cliente un slot sin ruta para la URL nueva **se queda con la anterior** (`node_modules/next/dist/docs/.../parallel-routes.md`).
- `@right/submit/page.tsx` y `@right/publicar/page.tsx` → `<SubmitAside community={…} />` dentro de un `Suspense` con un `Skeleton`, que lee `?community=` (las páginas de un slot reciben `searchParams`).
- La etiqueta de la columna (`rightColumn.label`) pasa de "More from Asinko" a **"Related"** ("Relacionado"): en esta página la columna habla de la comunidad, no del sitio.

## 3. Componentes

- **`SubmitPage`** (`features/composer/components/submit-page.tsx`, servidor): un H1; lee la sesión (sin sesión: `EmptyState` con `GateButtons`, SU-06), resuelve la comunidad de la query (`getSubmitCommunity`) y dibuja:
  - el desplegable de reglas para tablet y teléfono (`lg:hidden`, `Collapsible`, SU-08);
  - `SubmitEditor` con la comunidad, la pestaña de la query y `storageKey={draftKey(viewer.id)}`.
- **`getSubmitCommunity(slug, viewerName)`** (`lib/submit-community.ts`, `server-only`, cacheada por request): valida el slug o el símbolo antes de la red; un grupo o un activo con su comunidad; para un activo suma `GET /assets/:symbol` (nombre y clase). `postable` es falso en el canal personal de otra persona: la página no lo ofrece elegido. Devuelve `SubmitCommunity`, el DTO mínimo de la tarjeta.
- **`SubmitEditor`** (cliente, cargado con `SubmitEditorLoader`: `next/dynamic` sin SSR y un esqueleto con la forma del formulario, porque `react-hook-form` y zod llevaban la página a 409 KB; `seo.md § Performance`): envuelve a `PostEditor`. Al elegir otra comunidad, `router.replace(submitPath(…), { scroll: false })`: la columna derecha se vuelve a pedir y el formulario conserva lo escrito. Cancelar con algo escrito abre `DiscardDialog`; salir vuelve atrás solo si el referrer es del mismo sitio, si no va al Home.
- **`PostEditor`**: deja de tener variantes (ventana, caja y pantalla completa se fueron). Un solo diseño con el ancho de la columna y Cancelar junto a Publicar. El foco entra en el título, o en el selector si no hay comunidad (SU-09). `CommunityOption` suma `slug`.
- **`SubmitAside`** (`features/composer/components/submit-aside.tsx`, servidor): la tarjeta (`IdentityBanner` con el banner o el degradé, `UserAvatar`, el handle como H2, nombre o subtítulo, descripción, miembros, la clase de un activo y "Desde …" en grupos) y las reglas; sin comunidad, "Consejos para publicar". Si la lectura falla por algo inesperado, un aviso local (sección secundaria, `engineering-principles.md`). Al pie, `SiteFooter`, como toda columna derecha.
- **Borrador** (`hooks/use-post-draft.ts` y `lib/draft-key.ts`): guarda en `localStorage` (`asinko:post-draft:{userId}`) la comunidad, el formato, el título, el cuerpo y el link, con un retraso de 500 ms y también en `pagehide`. `useStoredDraft` usa `useSyncExternalStore` con snapshot de servidor `null` y recuerda qué borrador ya se ofreció, para no ofrecer de vuelta lo que se está escribiendo. Al montar con borrador y el formulario vacío: una región `role="status"` siempre montada (solo el texto) y el aviso visible con **Recuperar** y **Descartar**; después de elegir, el foco vuelve al título. Publicar o descartar lo borra. Todo acceso a `localStorage` en `try/catch`. `draftKey` es un módulo plano porque lo llama el servidor.
- **Entradas (SU-02):** `ComposeTrigger` pasa a ser un `Link` a `submitPath` con la comunidad del alcance (`ComposeScope` suma `slug`) y el `type`. La caja del Home (`ComposerPlaceholder`) también: el prompt, Link e Imagen; Publicar es el gemelo del prompt, fuera del orden de lectura (`aria-hidden`, `tabIndex={-1}`). Se van `ComposerRoot`, `ComposerView`, `ComposerWindow`, `InlineComposer`, `ComposeSlot` y `openCompose`: el editor queda solo en la página de crear (SU-11). El contexto de `compose` queda en `{ scope, setScope }`. El código anterior queda en la rama `backup/compose-modal-inline`.
- **Mensajes:** namespace `submitPage` (solo servidor) y `composer.draft` (cliente).

## 4. Tests

- Unitarios: `submitPath`; `use-post-draft` (guardar, recuperar, descartar, `localStorage` que falla); `submit-page` (query, segmento, metadata); `getSubmitCommunity`; `SubmitEditor` (cambio de comunidad, descartar, foco después de Recuperar); `ComposeTrigger` y la caja del Home como links con la comunidad del alcance. `SubmitAside` es un Server Component `async`: lo cubre el e2e.
- E2E `e2e/submit-page.spec.ts`: "Crear" desde la barra y desde una comunidad (llega elegida, foco en el título); cambiar de comunidad cambia la URL y la tarjeta sin perder lo escrito; publicar lleva al post; errores del link; el borrador se recupera y se descarta; los consejos sin comunidad; `/es/submit` → `/es/publicar`; `/en/publicar` 404; perfil propio sí, ajeno no; sin sesión, el aviso; 360 px en español; 360 px y axe en claro y oscuro. Los e2e que abrían el editor como ventana pasan a la página.
- Presupuesto de JS: `/en/submit` y `/en/submit?community=defi` se suman a `e2e/performance.spec.ts` (229,2 KB). El resto apenas baja (Home 235,1 → 234,9 KB): el editor ya viajaba diferido con la ventana.
