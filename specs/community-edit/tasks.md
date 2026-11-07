# Editar un grupo — Tasks

> Basado en `requirements.md` y `design.md` (2026-11-07). Rama `feature/community-edit`, desde `feature/community-create`. Cada tarea lleva sus tests.

## Tareas

- [x] **T1 — Mock (S).** `updateCommunity` acepta todos los campos editables, con `422` por campo y `null` para borrar (design § 7).
  - Tests: `community-create.test.ts`, `fixtures.test.ts`.
  - Depende de: —.
- [x] **T2 — Esquema y servidor (M).**
  - Partir `createGroupSchema` en `groupFields`, y sumar `editGroupChangesSchema`.
  - `lib/update-group.ts` y `update-group.action.ts`.
  - Tests: esquema (vacío → `null`, límites); la acción con sesión, sin sesión, `userId` de la sesión, `403` y `422` al campo.
  - Depende de: T1.
- [x] **T3 — La ventana (L).** `EditGroupProvider`, `EditGroupButton` (diferido), `EditGroupDialog`: campos, imágenes, guardar, cancelar con cambios, abrir en un campo, toast.
  - Tests: `edit-group-dialog.test.tsx` (CE-02 a CE-05) y `edit-group-button.test.tsx`.
  - Depende de: T2.
- [x] **T4 — Pasos (S).** `lib/group-steps.ts` y la cookie por grupo en `checklist-cookie.ts` y `HideableChecklist` (prop `cookie`).
  - Tests: `group-steps.test.ts`; los del perfil siguen pasando.
  - Depende de: —.
- [x] **T5 — La tarjeta (M).** `GroupChecklist` con `EditGroupPrompt` y el link al primer post.
  - Tests: `group-checklist.test.tsx` (pasos hechos y no, todo hecho → nada).
  - Depende de: T3, T4.
- [x] **T6 — Página (S).** En `hub/[slug]/page.tsx`: el provider, el botón junto a "Edit widgets", `hasPosts` y la tarjeta, solo para quien modera. Textos en en, es y pt.
  - Tests: `community-header.test.tsx`.
  - Depende de: T3, T5.
- [x] **T7 — E2E y cierre (M).** `e2e/community-edit.spec.ts`, en mobile y desktop:
  - un grupo creado en el test, editado (descripción y reglas) y visto en su página;
  - el checklist con sus pasos, uno que abre la ventana en su campo, y ocultarlo;
  - quien no modera no ve el botón;
  - axe en claro y oscuro.

  Además: medir la página del grupo (`performance.spec.ts`), pasar `ui-reviewer`, y `lint`, `typecheck` y los tests en verde.
  - Depende de: T6.

## Criterios → tests

| Criterio      | Test                                                   |
| ------------- | ------------------------------------------------------ |
| CE-01         | `community-header.test.tsx`; e2e: quien no modera      |
| CE-02 a CE-05 | `edit-group-dialog.test.tsx`; e2e: editar              |
| CE-06         | `update-group.action.test.ts`                          |
| CE-07, CE-08  | `group-steps.test.ts`, `group-checklist.test.tsx`; e2e |
| CE-09         | e2e: axe y 360 px                                      |
| CE-10         | `performance.spec.ts`                                  |
| CE-11         | `community-create.test.ts`, `fixtures.test.ts`         |
