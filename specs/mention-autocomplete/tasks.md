# Autocompletar menciones — Tasks

- [x] **T-01 (S)** Contrato y mocks:
  - Esquema de `/assets` con `nextCursor` opcional y su mock `implemented: true`.
  - Mock de `GET /search` (usuarios y comunidades).
  - P-001 ampliada en `proposals.md` (E3-06).
  - Tests: `fixtures.test.ts`. → MA-02, MA-10
- [ ] **T-02 (S)** `activeMention` en `lib/mentions/`, con sus tests. → MA-01, MA-06
- [ ] **T-03 (S)** `searchMentions`: la búsqueda por símbolo y la Server Action en `lib/mentions/`, con sus tests. → MA-02, MA-03, MA-10
- [ ] **T-04 (M)** `MentionAssist` y `MentionField` (molécula): lista junto al cursor, teclado, combobox ARIA, inserción y carga diferida al enfocar. Tests. → MA-01 a MA-09
- [ ] **T-05 (S)** El cuerpo del editor y las cajas de comentar y responder usan `MentionField`; textos en en, es y pt. → MA-01, MA-11
- [ ] **T-06 (S)** E2E y presupuesto de JS (la primera carga no cambia). → MA-07 a MA-09

Orden: T-01 → T-02 → T-03 → T-04 → T-05 → T-06.
