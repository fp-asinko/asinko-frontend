# La tesis como ticket de apuesta — Tasks

Rama: `feature/thesis-ticket-card`, desde `feature/thesis-form-steps` (los azules de la convicción viven ahí). Aprobado por el PO el 2026-11-05.

- [ ] **T-01 (S)** Token `--brand-text` en claro y oscuro, en `@theme inline` y en `tokens-contrast.test.ts`. → TK-13
- [ ] **T-02 (S)** P-041 en `proposals.md` y en los mocks; `logoUrl` en el contrato, opcional mientras sea propuesta. → TK-04
- [ ] **T-03 (M)** `ThesisTicket` (organismo) con su test: abierta, cerrada, cancelada, sin activo, 360 px. → TK-03 a TK-08, TK-12
- [ ] **T-04 (M)** `ThesisCard` del feed: la línea de arriba, el ticket y el claim en segundo plano; actualizar su test. → TK-01, TK-02, TK-09 a TK-11
- [ ] **T-05 (S)** Q4: la página de la tesis con el ticket `detail`; se borra `ThesisBet` y su test pasa al ticket. → TK-07
- [ ] **T-06 (S)** Q5: la tarjeta de la pestaña Tesis del perfil. → TK-03 a TK-09
- [ ] **T-07 (S)** e2e: `thesis-detail.spec.ts` a 360 px y con axe, presupuesto de JS, `ui-reviewer`. Actualizar `design-system.md` (identidad de la tesis, Q2) y `thesis-detail` TD-03, TD-07. → TK-12 a TK-15

## Criterios → tests

| Criterio     | Test                                     |
| ------------ | ---------------------------------------- |
| TK-01, TK-02 | `features/feed/.../thesis-card.test.tsx` |
| TK-03–TK-08  | `thesis-ticket.test.tsx`                 |
| TK-09–TK-11  | `features/feed/.../thesis-card.test.tsx` |
| TK-12, TK-13 | `thesis-detail.spec.ts` (360 px, axe)    |
| TK-14        | `messages.test.ts` (mismas claves)       |
| TK-15        | `performance.spec.ts`                    |
