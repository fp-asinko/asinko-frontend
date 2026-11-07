# ¿Se cumple? Sí / No en una tesis — Tasks

Rama: `feature/thesis-agree-yes-no`. Aprobado por el PO el 2026-11-05. Depende del ticket (`specs/thesis-ticket`), que todavía no está en `develop`.

- [x] **T-01 (S)** P-043 en `proposals.md`; esquemas crudos en el contrato (`agreement` opcional mientras sea propuesta); mapper a `ThesisAgreement` con su test. → AG-18
- [x] **T-02 (M)** Mocks: rutas `PUT` / `DELETE` con errores (`401`, `403 OWN_THESIS`, `409 THESIS_CLOSED`), `MockExtension` para `missing`, fixtures; `fixtures.test.ts` en verde. → AG-18
- [x] **T-03 (S)** `votes-api` + `answerThesis` con su test: input inválido, sin sesión, `userId` de la sesión, cambiar y quitar. → AG-04, AG-05, AG-08
- [x] **T-04 (M)** `AgreeBar` (molécula) con su test: %, total, sin votos, solo lectura. → AG-06, AG-02
- [x] **T-05 (L)** `ThesisAgree` con su test: sin votar, votar Sí / No, cambiar, quitar, autor, sin sesión, cerrada, error que revierte, doble toque, invitación y su ✕. → AG-01 a AG-10, AG-12, AG-14
- [x] **T-06 (S)** En `ThesisCard` (feed y detalle); actualizar su test. → AG-01, AG-03, AG-15
- [x] **T-07 (M)** Contra-tesis en crear tesis: `?counter=`, `counter-thesis.ts` con su test, la tarjeta de referencia y la sugerencia. → AG-11, AG-13
- [x] **T-08 (S)** Textos en en, es y pt. → AG-16
- [x] **T-09 (M)** e2e `thesis-agree.spec.ts` (mobile y desktop, axe): votar No → invitación → crear tesis con el activo; sin sesión → modal. Presupuesto de JS; `ui-reviewer`. → AG-14, AG-15, AG-17
- [x] **T-10 (S)** Botones grandes como el prototipo (relleno con su %, 44 px) y el toro / oso sobre el objetivo del ticket (`stance-marks.tsx` con su test, `thesis-ticket.test.tsx`). PO, 2026-11-05. → AG-05, AG-06, AG-19

## Criterios → tests

| Criterio            | Test                                             |
| ------------------- | ------------------------------------------------ |
| AG-01–AG-10, AG-12  | `thesis-agree.test.tsx`                          |
| AG-02, AG-06        | `agree-bar.test.tsx`                             |
| AG-04, AG-05, AG-08 | `answer-thesis.action.test.ts`                   |
| AG-11, AG-13        | `counter-thesis.test.ts`, `thesis-agree.spec.ts` |
| AG-14, AG-15        | `thesis-agree.spec.ts` (360 px, axe)             |
| AG-16               | `messages.test.ts`                               |
| AG-17               | `performance.spec.ts`                            |
| AG-18               | `fixtures.test.ts`, mapper test                  |
