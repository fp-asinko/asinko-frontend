# Barra superior simple y grises fríos — Tasks

> **Estado:** aprobado el 2026-10-05.

- [x] **T-01 · Grises fríos** · S · HR-05, HR-06
  - Tokens en `globals.css` y `design-system.md`.
  - **Tests:** `tokens-contrast.test.ts`, axe.
- [ ] **T-02 · Menú "⋯"** · M · HR-03, HR-07
  - `DropdownMenu` de shadcn, idioma, modo oscuro y "Sign up" en mobile. Carga diferida.
  - **Tests:** unitario del menú.
- [ ] **T-03 · Barra nueva** · M · HR-01, HR-02, HR-04
  - Grilla alineada con el shell, buscador centrado, acciones a la derecha, sin "Tokens" ni idioma ni tema sueltos. `MenuSettings` sale del panel ☰.
  - **Tests:** `site-header.test.tsx`; e2e de centrado y de desborde, y `theme.spec` e `i18n.spec` adaptados.
- [ ] **T-04 · Cierre** · S · HR-07, HR-08
  - Presupuesto de JS, axe en claro y oscuro, revisión con `ui-reviewer` y capturas comparadas con Reddit.
