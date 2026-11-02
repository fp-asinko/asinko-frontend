# Crear una tesis — Design

> **Estado:** aprobado por el PO el 2026-11-02 ("si"), con el ajuste de TC-09.

## 1. Dónde vive

Todo en `features/composer`: es una forma más de crear, en la misma página (`specs/submit-page`). Los features no se importan entre sí, y la tarjeta de tesis (`features/communities`) no hace falta acá.

| Pieza                  | Archivo                             | Tipo                |
| ---------------------- | ----------------------------------- | ------------------- |
| Esquema del formulario | `schemas/create-thesis.schema.ts`   | zod                 |
| Llamada al backend     | `lib/theses-api.ts` (`server-only`) | `POST /theses`      |
| Precio del activo      | `actions/asset-quote.action.ts`     | Server Action (GET) |
| Publicar               | `actions/create-thesis.action.ts`   | Server Action       |
| Fecha límite           | `lib/thesis-deadline.ts`            | funciones puras     |
| Guardado local         | `hooks/use-thesis-draft.ts`         | hook                |
| Formulario             | `components/thesis-editor.tsx`      | cliente, diferido   |
| Confirmación           | `components/thesis-confirm.tsx`     | cliente, diferido   |
| Pestañas de formato    | `components/format-tabs.tsx`        | cliente             |

## 2. Pestaña y URL (TC-01)

- `parseSubmitQuery` suma `thesis` a `type`. `SubmitPage` pasa `type: 'THESIS'`.
- `SubmitEditor` decide: con `THESIS` dibuja `ThesisEditor` (cargado con `next/dynamic`, con el mismo `EditorSkeleton`); si no, `PostEditor`. Cambiar de pestaña llama a `onTypeChange`, que hace `router.replace(submitPath(locale, { community, type }))` sin scroll: la URL dice dónde está la persona y "atrás" no se llena de pestañas.
- **`FormatTabs`**: la fila de pestañas sale de `PostEditor` a su propio componente, con las cinco (`THOUGHT`, `TEXT`, `LINK`, `IMAGE`, `THESIS`) y el mismo estilo (`FORMAT`). `PostEditor` la sigue usando para sus cuatro (cambian el formulario ahí mismo, como hoy) y la quinta llama a `onTypeChange('THESIS')`. `ThesisEditor` la dibuja con `THESIS` elegida, y cualquier otra llama a `onTypeChange`.
- **Los dos editores quedan montados** una vez abiertos, el otro oculto (`hidden`): pasar de un post a una tesis y volver no pierde lo escrito ni vuelve a ofrecer el borrador. Cada uno tiene además su propio guardado local. Cancelar con algo escrito en cualquiera de los dos pregunta, y descartar borra los dos borradores.
- `EditorSkeleton` pasa a su propio archivo (`submit-editor-skeleton.tsx`): lo usan el loader de la página y la carga diferida del editor de tesis.
- `submitPath` suma `thesis` a sus tipos.

## 3. El formulario (`ThesisEditor`)

`react-hook-form` con `zodResolver(createThesisSchema)`, `mode: 'onSubmit'` y `reValidateMode: 'onChange'`, como `PostEditor`. "Publicar" está deshabilitado mientras falte algo (TC-09); al tocarlo con algo inválido (un claim largo, una fecha fuera de rango), cada campo dice su error y lo sigue mientras se corrige. TC-09 decía "al salir del campo": se ajusta a esto, igual que los posts (ver § 10).

Orden de los campos, en una columna (mobile first):

1. **Comunidad**: el `CommunityPicker` de siempre (`chip`).
2. **Activo** (TC-02): el mismo `CommunityPicker` con un prop nuevo, `only="assets"`: fija el filtro de activos, oculta las fichas Todo / Grupos / Activos (`specs/picker-filters`) y no ofrece "Tu perfil". Sin el prop, el picker queda como hoy. Un activo es la comunidad del activo (`$NVDA`), y de ahí sale el símbolo (`assetSymbolOf`, `lib/communities/paths.ts`). Si la comunidad de la URL es de un activo, viene elegido.
3. **Claim** (TC-04): `Input` con contador `n/280` y la ayuda.
4. **Dirección y precio** (TC-05): un grupo de dos opciones (`ChoiceGroup`, una molécula nueva en `components/molecules/` sobre el `radio-group` de shadcn, agregado con su CLI: píldoras grises, la elegida negra, flechas para moverse) "Por encima de" / "Por debajo de", y un `Input` `inputMode="decimal"`. Debajo, con el activo elegido: "Precio actual: 182,40 · objetivo +9,6 %" (con `useFormatter`) y "desactualizado" si `priceStale`. Si el objetivo queda del lado contrario a la dirección, un aviso gris (no error).
5. **Fecha límite** (TC-06): `Input type="date"` con `min` y `max` de `thesisDeadlineRange(now)`.
6. **Convicción** (TC-07): grupo de cuatro opciones (`radiogroup`) con su ayuda.
7. **Razonamiento** (TC-08): `BodyTabs` con su barra de formato, emojis y menciones, igual que el cuerpo de un post.
8. **Cancelar / Publicar**, como el post. Cancelar con algo escrito abre `DiscardDialog`.

**Comunidad que sigue al activo (TC-03):** un ref `communityTouched` se marca cuando la persona elige comunidad a mano. Mientras esté sin marcar, elegir un activo elige también su comunidad (y la URL la sigue, como hoy).

**Precio del activo:** al elegir un activo, `getAssetQuote(symbol)` (Server Action) lee `GET /assets/:symbol` y devuelve solo `{ price, priceStale }`. Si falla, el formulario sigue sin la referencia. Valida el símbolo con `assetSymbolSchema` antes de la red.

## 4. Esquema (`create-thesis.schema.ts`)

```ts
export const CLAIM_MAX = 280
export const THESIS_DIRECTIONS = ['ABOVE', 'BELOW'] as const // Q3: sin EQUALS
export const CONVICTIONS = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'] as const

export const createThesisSchema = z.object({
  communityId: z.uuid({ message: 'composer.thesis.errors.community' }),
  assetSymbol: assetSymbolSchema, // 'composer.thesis.errors.asset'
  claim: z.string().trim().min(1).max(CLAIM_MAX), // claimRequired / claimTooLong
  direction: z.enum(THESIS_DIRECTIONS),
  targetPrice: z.coerce.number().positive().finite(), // targetPrice
  deadline: z.iso.datetime(), // el fin del día elegido, armado en el navegador
  conviction: z.enum(CONVICTIONS),
  reasoning: z.string().trim().min(1), // reasoningRequired
  disclaimerAccepted: z.literal(true), // disclaimer
})
```

- Los mensajes son claves de `composer.thesis.errors.*` (`i18n.md`).
- El formulario guarda la fecha como `YYYY-MM-DD`; al enviar se convierte con `deadlineAt(date)`.
- Sin máximo para el razonamiento: el backend no tiene.

## 5. Fecha límite (`lib/thesis-deadline.ts`, Q4)

- `deadlineAt('2026-12-31')` → el ISO de `2026-12-31T23:59:59` **en la zona del navegador** (`new Date(y, m - 1, d, 23, 59, 59)`). Por eso se arma en el cliente: el servidor no conoce la zona de la persona.
- `thesisDeadlineRange(now)` → `{ min, max }` como `YYYY-MM-DD`:
  - `min` es **mañana**: el fin de mañana siempre queda a más de 24 h de cualquier momento de hoy.
  - `max` es el día de `now + 5 × 365 días` menos uno: el fin de ese día no pasa el límite del backend (`DEADLINE_MAX_MS = 5 × 365 días`).
- `isDeadlineInRange(iso, now)`: la misma regla que el backend (`asinko-app lib/api/theses.ts`). La usa la action antes de la red, por si la página quedó abierta de un día para otro.

## 6. Confirmar (`ThesisConfirm`, TC-11, TC-12)

- `Dialog` de shadcn (Base UI), cargado con `next/dynamic` al primer "Publicar".
- **En el teléfono, un panel desde abajo:** el mismo `Dialog` con clases `max-sm:` (abajo, a todo el ancho, esquinas de arriba redondeadas). No hay `Drawer` en el proyecto y sumarlo es otra dependencia; el comportamiento (foco atrapado, Esc, devolver el foco) es el del `Dialog`. Es el uso justificado de `max-*:` (`design-system.md`).
- Contenido:
  - Título "Publicar tesis".
  - El resumen: `$NVDA` · claim · "Por encima de 200 · 31 dic 2026" · convicción.
  - "Una tesis publicada no se puede editar ni borrar. Se resuelve sola a la fecha límite contra el precio de mercado."
  - `Checkbox` "Entiendo que esto no es asesoramiento financiero" (texto en `messages/`, marcado `TODO(legal)` en el PR).
  - "Volver" y "Publicar tesis" (deshabilitado sin el checkbox, y mientras envía).
- El checkbox es parte del formulario (`disclaimerAccepted`): su error del servidor (`DISCLAIMER_NOT_ACCEPTED`) se muestra ahí.
- Si el servidor devuelve un error de un campo, la confirmación se cierra y el error queda en el campo, con el foco ahí.

## 7. Publicar (`createThesis`, TC-13 a TC-15)

```ts
export async function createThesis(raw: unknown): Promise<ActionResult<{ username: string }>>
```

1. `createThesisSchema.safeParse(raw)`; si falla, `fieldErrors`.
2. `isDeadlineInRange(deadline, new Date())`; si no, error en `deadline`.
3. Sesión con `getViewer()`; sin sesión, `api.errors.UNAUTHENTICATED` (la UI abre el modal de cuenta).
4. `createThesisRequest({ userId: viewer.id, ... })` en `lib/theses-api.ts`: `POST /api/v1/theses` con `targetDirection` y `disclaimerAccepted: true`, validando la respuesta con `thesisSchema.pick({ id: true })`.
5. Sus códigos, al campo:

| Código del backend                    | Campo                | Clave                                      |
| ------------------------------------- | -------------------- | ------------------------------------------ |
| `CLAIM_TOO_LONG`                      | `claim`              | `composer.thesis.errors.claimTooLong`      |
| `DEADLINE_OUT_OF_RANGE`               | `deadline`           | `composer.thesis.errors.deadline`          |
| `ASSET_NOT_FOUND`, `AMBIGUOUS_SYMBOL` | `assetSymbol`        | `composer.thesis.errors.asset`             |
| `INVALID_COMMUNITY`                   | `communityId`        | `composer.errors.invalidCommunity`         |
| `PERSONAL_CHANNEL_OWNER_ONLY`         | `communityId`        | `composer.errors.ownProfileOnly`           |
| `DISCLAIMER_NOT_ACCEPTED`             | `disclaimerAccepted` | `composer.thesis.errors.disclaimer`        |
| `VALIDATION_ERROR`                    | —                    | `composer.errors.invalid`                  |
| `401`                                 | —                    | el modal de cuenta (`openGate`)            |
| `429`                                 | —                    | `api.errors.RATE_LIMITED`                  |
| otro                                  | —                    | `composer.errors.general` con "Reintentar" |

6. Publicada: devuelve el `username` de la sesión. El cliente borra el guardado local y va a `/user/{username}?tab=theses`. Sin toast: `sonner` no está instalado y sumarlo con su `Toaster` en el layout costaría JS en todas las rutas por un solo aviso; la tesis nueva, primera en el perfil, es la confirmación (como un post, que lleva a su página).

## 8. Guardado local (`use-thesis-draft.ts`, TC-10)

- Otra clave, `asinko:thesis-draft:{userId}` (`thesisDraftKey`), con el mismo patrón que `use-post-draft.ts`: escribe a los 500 ms de dejar de escribir y en `pagehide`, `try/catch` en todo acceso, Recuperar / Descartar al volver.
- Guarda la comunidad, el activo, el claim, la dirección, el precio, la fecha, la convicción y el razonamiento. **No** guarda el checkbox del disclaimer: se acepta en cada publicación.
- `use-post-draft.ts` y el nuevo comparten cómo se lee y se escribe (`read`, `writeDraft`, `clearDraft`, `discardDraft`, lo ya ofrecido y el `useSyncExternalStore` de `useStoredDraft`). Lo que no depende de la forma del borrador se sube a `hooks/use-local-draft.ts` (lleva el hook `useLocalDraft`, por eso no va en `lib/`), parametrizado por el esquema zod de cada uno. Es el segundo uso y no el tercero, pero el código sería idéntico.

## 9. Mocks (TC-18)

- `POST /api/v1/theses` en `handlers.ts`: `kind: 'contract'`, `implemented: true`, `schema: thesisSchema`.
- El handler (`src/mocks/theses.ts`, como `sign-up.ts`): `401` sin token, `403 USER_MISMATCH`, cada `422` del backend y `404 ASSET_NOT_FOUND` con un símbolo fuera de los fixtures. Si todo está bien, arma la tesis `OPEN` con `referencePrice` del fixture del activo y la suma a las tesis del usuario (`thesesBy`), primera.
- `fixtures.test.ts` la valida con su `example`. Sin `liveExample`: es una escritura y el smoke solo hace `GET`.

## 10. Cambios a otros documentos

- `requirements.md` TC-09: ya ajustado (los errores al tocar Publicar, como los posts).
- `docs/product/overview.md § Tesis` (TC-21): claim de 280 caracteres y precio objetivo obligatorio.
- `specs/submit-page/design.md § 1`: `?type=` suma `thesis`.

## 11. Textos

`composer.thesis.*` en en, es y pt, dentro del namespace `composer` (ya está en `CLIENT_NAMESPACES`): la pestaña, cada campo con su ayuda y su error, las direcciones, las convicciones, el precio de referencia, la confirmación y el disclaimer.

## 12. Performance (TC-19)

- `ThesisEditor` y `ThesisConfirm` con `next/dynamic`: la página de crear post no suma nada hasta elegir la pestaña.
- El `FormatTabs` que sale de `PostEditor` no suma peso: es el mismo código.
- `e2e/performance.spec.ts` ya mide `/submit`; se suma `/submit?type=thesis`.

## 13. Accesibilidad (TC-17)

- Cada campo con `Field`/`FieldLabel`/`FieldError` (`aria-describedby` y `aria-invalid`).
- Dirección y convicción: `radiogroup` con nombre ("Dirección", "Convicción"), una sola parada de Tab y flechas, foco visible.
- El contador del claim y el precio de referencia se anuncian con `aria-live="polite"`, solo al cambiar.
- La confirmación: título como nombre del diálogo, el foco entra en el checkbox y vuelve a "Publicar" al cerrar.

## 14. Revisión de UI (2026-11-02)

El `ui-reviewer` marcó dos bloqueantes, ya resueltos: el foco se perdía al cambiar de editor (ahora va a la pestaña elegida del que queda visible, o al primer campo de la tesis la primera vez) y la línea del precio concatenaba textos (ahora es un mensaje ICU, y el aviso de dirección va aparte, en un `role="status"`). También se resolvieron: la línea del precio sin `aria-live`; la confirmación dice por qué no envía sin la casilla y marca `aria-busy`; el foco de `ChoiceGroup` en la píldora y `aria-required`; las clases compartidas en `editor-styles.ts`; el precio y el guardado en `useAssetQuote` y `useKeepThesisDraft`. Queda `thesis-editor.tsx` largo (~650 líneas, casi todo el formulario), como `post-editor.tsx`.

Al revisarlo apareció un bug: volver desde la tesis a Link o Image mostraba el formato anterior del post. `PostEditor` recibe `formatRequest` y lo toma.

## 15. Tests

- **Unitarios:**
  - `create-thesis.schema` (cada campo, sin `EQUALS`, el disclaimer);
  - `thesis-deadline` (zona, `min` y `max` en los bordes, años bisiestos);
  - `theses-api` (el body y cada código);
  - `create-thesis.action` (input inválido, fecha fuera de rango, sin sesión, `userId` de la sesión, cada error a su campo);
  - `asset-quote.action`;
  - `use-thesis-draft`;
  - `ThesisEditor` (activo → comunidad, comunidad a mano no se pisa, precio de referencia y aviso de dirección, deshabilitado hasta completar, errores);
  - `ThesisConfirm` (resumen, checkbox, volver, error al campo);
  - `FormatTabs`;
  - el mock (`fixtures.test.ts` y sus errores).
- **E2E** (`e2e/thesis-create.spec.ts`, mobile y desktop, con mocks): llegar a la pestaña desde la URL; completar desde la página de un activo, confirmar y ver la tesis primera en el perfil; un error del servidor en su campo; 360 px y axe en claro y oscuro; el peso de JS.
- **A mano contra `dev`** con una cuenta real: publicar una tesis y verla en el perfil.

## 16. Revisión 2: el estilo del prototipo (TC-22 a TC-27)

- **Tarjeta del activo** (TC-22): `assetQuote` pasa a devolver `{ name, price, changePct, stale }` (sigue saliendo de `GET /assets/:symbol`). La tarjeta va sobre fondo blanco con borde (`bg-background border`), no sobre `--surface`: el verde de una suba solo va sobre blanco (`design-system.md`). La variación usa el `Delta` que ya existe (`components/molecules/delta.tsx`), con flecha y signo.
- **Fecha y objetivo** (TC-23): una grilla `sm:grid-cols-2`.
- **Dirección** (TC-24): con precio, el formulario la calcula y la escribe en `direction` (`setValue`) cada vez que cambian el objetivo o el precio: mayor, `ABOVE`; menor, `BELOW`; igual, sin dirección y con el error `thesis.errors.samePrice`. Debajo del objetivo, la frase con la dirección y el %. Sin precio, el `ChoiceGroup` de antes. El aviso de lado contrario se va: con la dirección deducida no puede pasar.
- **Convicción** (TC-25): `LevelBars`, una molécula nueva (`components/molecules/level-bars.tsx`) sobre el `radio-group` de shadcn. Cada `RadioGroupItem` es una barra de 16 px de ancho y alto creciente (20, 26, 32 y 38 px, los del prototipo), sin el punto. Se llenan hasta la elegida; con la última, `bg-destructive`. Al lado, el nombre de la elegida, o la invitación. Reemplaza al `ChoiceGroup` de la convicción.
- **Ejemplo del claim** (TC-26): `thesis.claim.example` con `{symbol, target}`, el objetivo con `format.number`.
- **Título** (TC-27): `SubmitPage` elige el H1 y el subtítulo por `?type=`. Al cambiar de pestaña, la URL cambia (`router.replace`) y el servidor vuelve a dibujar la página con el título nuevo; el formulario no se toca (es cliente).

## 17. Revisión 3: sin scroll en escritorio (TC-28 a TC-36)

- **Comunidad** (TC-28): el `CommunityPicker` (variante `chip`) baja a la barra de acciones, a la izquierda de Cancelar y Publicar (`justify-between`; se parte en dos renglones si no entra).
- **Activo** (TC-29): `CommunityPicker` suma la variante `card` (todo el ancho, borde, `rounded-lg`, texto a la izquierda) y un `renderValue` opcional: el editor dibuja ahí la tarjeta del activo. El cambio es interno del feature (no es un átomo de `ui/`).
- **Filas** (TC-30): activo y claim a todo el ancho, uno debajo del otro; la fecha sola, con los atajos y el día en una fila que se parte si no entra; objetivo y convicción en `grid sm:grid-cols-2`. La variante `card` mide `h-12` con `rounded-2xl` y `border-input`, como el claim. Medido en `next dev` a 1280×800 con un activo: Publicar termina a 786 px.
- **Cómo funciona una tesis** (TC-31): `ThesisTips` (servidor) en `SubmitAside` cuando `?type=thesis`; la página la repite plegada bajo el título con `lg:hidden` (el mismo `Collapsible` de las reglas). Se van las ayudas bajo los campos y `submitPage.thesisSubtitle`.
- **Razonamiento** (TC-32): `field-sizing-content` con `min-h-20` y `max-h-96`. Donde el navegador no lo soporta (Safari viejo), queda en tres líneas con scroll propio.
- **Atajos de fecha** (TC-33): `quickDeadlines(now)` en `lib/thesis-deadline.ts` devuelve los días de cada atajo (sumando meses en el calendario local) y deja afuera los que caen fuera de `thesisDeadlineRange`. Un `ChoiceGroup` con los atajos y "Otra fecha"; el valor del formulario sigue siendo el día. Con "Otra fecha", el `input type="date"`. Al lado, la fecha con `format.dateTime`.
- **Objetivo** (TC-34) y **razonamiento** (TC-35): placeholders nuevos; el objetivo, `disabled` sin activo.
- **Medida** (TC-36): un e2e a 1280×800 compara el fondo de los botones con el alto de la ventana.
