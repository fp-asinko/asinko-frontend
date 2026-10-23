# Abrir y cerrar la columna izquierda en todo el sitio — Tasks

Rama: `feature/sidebar-toggle-reddit-rail`, desde `develop`.

- [x] **T-01 (S)** Tokens y variante: `--rail-shadow` (claro y oscuro), `shadow-rail` y `@custom-variant left-folded` en `globals.css`; la excepción en `design-system.md`. Test de contraste y de tokens, si aplica. → SL-05
- [x] **T-02 (M)** `LeftColumnToggle` y `LeftColumnScope`: estado compartido, cookies, foco al plegar. Tests. → SL-02, SL-03, SL-08, SL-09
- [x] **T-03 (M)** `AppShell`: grilla, franja de 32 px, contenido recortado e invisible, sombra, botón sobre el borde; el layout lee la cookie. Crear post usa `LeftColumnScope` y se borra `LeftColumnFold`. Tests. → SL-01, SL-04, SL-06, SL-07, SL-10
- [x] **T-04 (M)** e2e (abrir, cerrar, recordar al recargar y entre páginas, crear post por separado, sin salto al cargar, teclado), axe en claro y oscuro a 768, 1024 y 1440 px, presupuesto de JS; `ui-reviewer`. → SL-11, SL-12

Orden: T-01 → T-04. Commit al cerrar T-04 y merge a `develop` (pedido del PO: sin PR).

## Mapa de criterios a tests

| Criterio     | Test                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| SL-01, SL-04 | e2e `sidebar-toggle.spec.ts` (posición del botón, ancho de la franja)                                  |
| SL-02, SL-03 | `left-column-toggle.test.tsx`, e2e (teclado)                                                           |
| SL-05        | `tokens-contrast.test.ts` (el token existe en los dos temas), e2e (sombra abierta, sin sombra plegada) |
| SL-06        | e2e (Tab no entra en la columna plegada)                                                               |
| SL-07        | e2e de movimiento reducido (como `home-motion.spec.ts`)                                                |
| SL-08, SL-09 | `left-column-toggle.test.tsx` (cookies), e2e (recargar, navegar, crear post)                           |
| SL-10        | e2e (el estado ya está en el HTML del servidor)                                                        |
| SL-11        | e2e (axe, tres anchos)                                                                                 |
| SL-12        | `performance.spec.ts`                                                                                  |
