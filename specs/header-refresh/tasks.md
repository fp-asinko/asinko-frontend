# Barra superior simple y grises fríos — Tasks

> **Estado:** aprobado y cerrado el 2026-10-05.
>
> **Cierre:**
>
> - Tests: 530 unitarios y 155 e2e en verde (mobile y desktop, axe en claro y oscuro con el menú abierto).
> - JS del Home: 226,2 KB de 230. Bajó 1,9 KB: el selector de idioma y el interruptor de tema ya no se cargan al inicio, y el menú "⋯" se descarga diferido.
> - Revisión con `ui-reviewer` aplicada; los detalles, en `design.md § 5`.

- [x] **T-01 · Grises fríos** · S · HR-05, HR-06
  - Tokens en `globals.css` y `design-system.md`.
  - **Tests:** `tokens-contrast.test.ts`, axe.
- [x] **T-02 · Menú "⋯"** · M · HR-03, HR-07
  - `DropdownMenu` de shadcn, idioma, modo oscuro y "Sign up" en mobile. Carga diferida.
  - **Tests:** unitario del menú.
- [x] **T-03 · Barra nueva** · M · HR-01, HR-02, HR-04
  - Grilla alineada con el shell, buscador centrado, acciones a la derecha, sin "Tokens" ni idioma ni tema sueltos. `MenuSettings` sale del panel ☰.
  - **Tests:** `site-header.test.tsx`; e2e de centrado y de desborde, y `theme.spec` e `i18n.spec` adaptados.
- [x] **T-04 · Cierre** · S · HR-07, HR-08
  - Presupuesto de JS, axe en claro y oscuro, revisión con `ui-reviewer` y capturas comparadas con Reddit.
