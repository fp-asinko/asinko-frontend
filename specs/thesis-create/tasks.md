# Crear una tesis — Tasks

Rama: `feature/thesis-create`, desde `develop`. Requirements y design aprobados por el PO el 2026-11-02.

- [x] **T-01 (S)** Esquema `create-thesis.schema.ts` y `lib/thesis-deadline.ts` (`deadlineAt`, `thesisDeadlineRange`, `isDeadlineInRange`). Tests. → TC-04 a TC-07, TC-13
- [x] **T-02 (M)** `lib/theses-api.ts`, las actions `createThesis` y `getAssetQuote`, y el mock de `POST /theses` con sus errores (la tesis se suma a las del usuario). Tests y `fixtures.test.ts`. → TC-13, TC-15, TC-18
- [x] **T-03 (S)** `hooks/use-local-draft.ts` (lo común del guardado local, sacado de `use-post-draft.ts` sin cambiar su comportamiento) y `use-thesis-draft.ts`. Tests. → TC-10
- [x] **T-04 (M)** `FormatTabs` (fuera de `PostEditor`, con la quinta pestaña), `?type=thesis` en `parseSubmitQuery` y `submitPath`, `SubmitEditor` que cambia de editor, y `only="assets"` en `CommunityPicker`. Tests. → TC-01
- [x] **T-05 (L)** `ThesisEditor`: los campos, el activo que elige su comunidad, el precio de referencia y el aviso de dirección, deshabilitado hasta completar, errores en su campo, guardado local y Cancelar. Textos en en, es y pt. Tests. → TC-02 a TC-10, TC-20
- [x] **T-06 (M)** `ThesisConfirm`: el resumen, el disclaimer, enviar y el paso al perfil; los errores del servidor al campo. Textos. Tests. → TC-11 a TC-15, TC-20
- [x] **T-07 (M)** E2E (`e2e/thesis-create.spec.ts`), 360 px, axe en claro y oscuro, `performance.spec.ts` con `/submit?type=thesis`, `ui-reviewer`. → TC-16, TC-17, TC-19
- [x] **T-08 (S)** `overview.md § Tesis` (280 y precio obligatorio), `specs/submit-page/design.md § 1` (`?type=thesis`). → TC-21
- [x] **T-09 (S)** A mano contra `dev` con una cuenta real: publicar una tesis y verla en el perfil.
  - **2026-11-02, con `qa_t07b_mvya24yo` (email) y `API_MOCKS=missing`:** se publicó desde el formulario en su canal personal, sobre `$BTC`. El backend guardó dirección, objetivo, convicción y el precio de referencia (el de `dev`, desactualizado como lo manda el backend), y la tesis apareció primera en la pestaña Tesis. Después se canceló por la API (`CANCELLED`).
  - **Encontrado:** la fecha límite se elige en la zona del navegador (23:59 local), pero el sitio formatea todas las fechas en UTC (`i18n/request.ts`). Con UTC−3, elegir el 3 de noviembre cierra a las 02:59 UTC del 4, y la tarjeta dice "Nov 4". Pendiente de decisión del PO.
    Resuelto en `specs/local-time` (LT-05).
  - **2026-11-03, de nuevo con la cuenta del PO (`@juansegundomartinez`, `API_MOCKS=missing`), después de los ajustes del 2026-11-02 y 11-03:** el PO publicó dos tesis desde el formulario; quedan publicadas.
    - **Solo en el perfil** ("Your profile"): `$BTC`, `ABOVE` 150000, `LOW`, atajo "1 month". El backend la guardó en su `PERSONAL_CHANNEL` con fecha límite `2026-12-04T02:59:59Z` (3 de diciembre, 23:59 en UTC−3, el día que muestra la tarjeta).
    - **En `#chile`**, entrando desde el grupo: elegir `$SOL` no cambió el destino (TC-03). `BELOW` 78, `HIGH`, "Other date". Guardada en `#chile` (`SYSTEM_GEO`), fecha límite `2026-11-27T02:59:59Z` (26 de noviembre). Aparece en el perfil y el backend la devuelve en `GET /feed/explore?community=chile`; la página del grupo todavía no la dibuja (fuera de alcance: la tarjeta de una tesis en el feed va en el spec siguiente).
    - El precio de referencia viene desactualizado del backend (`referencePriceAt` del 2026-10-13), como ya se sabía.

Orden: T-01 → T-02 → T-03 → T-04 → T-05 → T-06 → T-07 → T-08 → T-09. T-03 y T-04 no dependen de T-02.

| Criterio | Test                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| TC-01    | `submit-page.test.ts` (`?type=thesis`), `format-tabs.test.tsx`, e2e                                         |
| TC-02    | `thesis-editor.test.tsx` (activo de la URL), `community-picker.test.tsx` (`only`)                           |
| TC-03    | `thesis-editor.test.tsx` (activo → comunidad; a mano no se pisa)                                            |
| TC-04    | `create-thesis.schema.test.ts`, `thesis-editor.test.tsx` (contador)                                         |
| TC-05    | `create-thesis.schema.test.ts`, `thesis-editor.test.tsx` (referencia y aviso), `asset-quote.action.test.ts` |
| TC-06    | `thesis-deadline.test.ts`, `thesis-editor.test.tsx` (`min` y `max`)                                         |
| TC-07    | `create-thesis.schema.test.ts`, `thesis-editor.test.tsx`                                                    |
| TC-08    | `thesis-editor.test.tsx` (barra de formato)                                                                 |
| TC-09    | `thesis-editor.test.tsx` (deshabilitado; errores al publicar)                                               |
| TC-10    | `use-thesis-draft.test.ts`, `use-thesis-draft.test.ts`, `use-post-draft.test.ts` (sin cambios)              |
| TC-11    | `thesis-confirm.test.tsx` (resumen y aviso)                                                                 |
| TC-12    | `thesis-confirm.test.tsx` (checkbox, volver)                                                                |
| TC-13    | `create-thesis.action.test.ts` (`userId` de la sesión, fecha), `theses-api.test.ts`                         |
| TC-14    | `thesis-editor.test.tsx` (publica y sigue al perfil), e2e (la tesis primera en el perfil)                   |
| TC-15    | `create-thesis.action.test.ts` (cada código), `thesis-confirm.test.tsx` (al campo), e2e                     |
| TC-16    | e2e (360 px, panel desde abajo)                                                                             |
| TC-17    | e2e (axe en claro y oscuro), `thesis-editor.test.tsx` (grupos de opciones con teclado)                      |
| TC-18    | `fixtures.test.ts`, `theses.test.ts` (mock)                                                                 |
| TC-19    | `performance.spec.ts`                                                                                       |
| TC-20    | `messages.test.ts` (mismas claves en los tres idiomas)                                                      |
| TC-21    | Revisión del PR                                                                                             |

## Revisión 2 (2026-11-02)

- [x] **T-10 (M)** El estilo del prototipo: la tarjeta del activo (`assetQuote` con nombre y variación), fecha y objetivo lado a lado, la dirección deducida del objetivo (píldoras solo sin precio), `LevelBars` para la convicción, el ejemplo del claim y el título de la página. Textos, tests y e2e. → TC-22 a TC-27

| Criterio | Test                                                                            |
| -------- | ------------------------------------------------------------------------------- |
| TC-22    | `thesis-editor.test.tsx` (la tarjeta), `theses-api.test.ts`, e2e                |
| TC-23    | e2e (360 px y axe)                                                              |
| TC-24    | `thesis-editor.test.tsx` (dirección deducida, igual al precio, sin precio), e2e |
| TC-25    | `level-bars.test.tsx`, `thesis-editor.test.tsx`                                 |
| TC-26    | `thesis-editor.test.tsx` (el ejemplo)                                           |
| TC-27    | e2e (el H1)                                                                     |

## Revisión 3 (2026-11-02)

- [x] **T-11 (M)** Sin scroll en escritorio: la comunidad en la fila de las acciones, el activo como tarjeta del alto del claim, los atajos de fecha (`quickDeadlines`), objetivo y convicción lado a lado, "Cómo funciona una tesis" en la columna derecha (plegada sin ella), el razonamiento que crece y los placeholders nuevos. Textos, tests y e2e (TC-36 a 1280×800). → TC-28 a TC-36
