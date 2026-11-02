# Crear una tesis — Tasks

Rama: `feature/thesis-create`, desde `develop`. Requirements y design aprobados por el PO el 2026-11-02.

- [x] **T-01 (S)** Esquema `create-thesis.schema.ts` y `lib/thesis-deadline.ts` (`deadlineAt`, `thesisDeadlineRange`, `isDeadlineInRange`). Tests. → TC-04 a TC-07, TC-13
- [x] **T-02 (M)** `lib/theses-api.ts`, las actions `createThesis` y `getAssetQuote`, y el mock de `POST /theses` con sus errores (la tesis se suma a las del usuario). Tests y `fixtures.test.ts`. → TC-13, TC-15, TC-18
- [x] **T-03 (S)** `hooks/use-local-draft.ts` (lo común del guardado local, sacado de `use-post-draft.ts` sin cambiar su comportamiento) y `use-thesis-draft.ts`. Tests. → TC-10
- [ ] **T-04 (M)** `FormatTabs` (fuera de `PostEditor`, con la quinta pestaña), `?type=thesis` en `parseSubmitQuery` y `submitPath`, `SubmitEditor` que cambia de editor, y `only="assets"` en `CommunityPicker`. Tests. → TC-01
- [ ] **T-05 (L)** `ThesisEditor`: los campos, el activo que elige su comunidad, el precio de referencia y el aviso de dirección, deshabilitado hasta completar, errores en su campo, guardado local y Cancelar. Textos en en, es y pt. Tests. → TC-02 a TC-10, TC-20
- [ ] **T-06 (M)** `ThesisConfirm`: el resumen, el disclaimer, enviar, el toast y el paso al perfil; los errores del servidor al campo. Textos. Tests. → TC-11 a TC-15, TC-20
- [ ] **T-07 (M)** E2E (`e2e/thesis-create.spec.ts`), 360 px, axe en claro y oscuro, `performance.spec.ts` con `/submit?type=thesis`, `ui-reviewer`. → TC-16, TC-17, TC-19
- [ ] **T-08 (S)** `overview.md § Tesis` (280 y precio obligatorio), `specs/submit-page/design.md § 1` (`?type=thesis`). → TC-21
- [ ] **T-09 (S)** A mano contra `dev` con una cuenta real: publicar una tesis y verla en el perfil.

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
| TC-14    | `thesis-confirm.test.tsx` (toast y navegación), e2e (la tesis primera en el perfil)                         |
| TC-15    | `create-thesis.action.test.ts` (cada código), `thesis-confirm.test.tsx` (al campo), e2e                     |
| TC-16    | e2e (360 px, panel desde abajo)                                                                             |
| TC-17    | e2e (axe en claro y oscuro), `thesis-editor.test.tsx` (grupos de opciones con teclado)                      |
| TC-18    | `fixtures.test.ts`, `theses.test.ts` (mock)                                                                 |
| TC-19    | `performance.spec.ts`                                                                                       |
| TC-20    | `messages.test.ts` (mismas claves en los tres idiomas)                                                      |
| TC-21    | Revisión del PR                                                                                             |
