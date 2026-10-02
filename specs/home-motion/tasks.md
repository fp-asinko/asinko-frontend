# Home con movimiento — Tasks

> **Estado:** aprobado el 2026-10-02.

```
T-01 ─┬─ T-02 ─ T-03 ─ T-04 ─ T-05 ─ T-06
      └─ T-07 ─ T-08 ──────────────────────── T-09
```

## Tareas

- [x] **T-01 · Tokens y red de seguridad** · S · G-01, G-02, G-03
  - Tokens de movimiento, `@keyframes`, utilidades `tap` y `stagger` en `globals.css`; regla global de reducir movimiento.
  - **Tests:** `e2e/home-motion.spec.ts` arranca con el caso de reducir movimiento.

- [ ] **T-02 · Feedback general del feed** · S · M-06, M-07, M-08, M-10
  - `tap` en botones de tarjeta, opciones, píldoras, pestañas y composer; globo "Próximamente" con desplazamiento; punto de _Live_ que late.
  - **Tests:** los existentes siguen en verde (no cambia el comportamiento).

- [ ] **T-03 · Votar con movimiento** · S · M-01
  - `lastVote`, `popKey` y el número con `key` en `vote-control.tsx`.
  - **Tests:** `data-animate` según la dirección; nada al cargar ni al quitar el voto.

- [ ] **T-04 · Barras de encuesta** · S · M-02
  - Estado `revealed`, `animate-bar-grow`, transición de ancho al cambiar de opción.
  - **Tests:** unitario de `revealed`; e2e de la barra creciendo.

- [ ] **T-05 · Comentarios que se despliegan** · S · M-03
  - Panel montado después de la primera apertura, `grid-template-rows`, `inert` y `aria-hidden` cerrado.
  - **Tests:** unitario del panel cerrado; los e2e de comentarios siguen en verde.

- [ ] **T-06 · Pestañas, cargar más e imágenes** · S · M-04, M-05, M-09
  - Subrayado `::after`, `stagger` en las páginas nuevas, `FadeImage` solo en esas páginas (D-M1).
  - **Tests:** unitario de `FadeImage`; e2e de CLS al cargar más.

- [ ] **T-07 · Columna: secciones, mosaicos y filas** · M · S-01, S-02, S-03, S-05, S-06
  - Secciones con `Collapsible` de shadcn (alto animado en todos los navegadores), elevación de mosaicos, hover de filas y avatares, `tap` en los botones, duración del panel lateral.
  - **Tests:** los existentes siguen en verde; revisión visual a 360 y 1440 px.

- [ ] **T-08 · Comunidad activa** · S · S-04
  - `CommunityLink` (D-M2) en mosaicos, grupos y sugeridas.
  - **Tests:** `community-link.test.tsx`; e2e con `?community=btc`.

- [ ] **T-09 · Revisión y cierre** · S · G-04, G-05, G-06
  - Skill `review-animations`, `ui-reviewer`, presupuesto de JS, axe, CLS; `design-system.md` actualizado.

## Trazabilidad

| Criterio            | Test                                          | Tarea      |
| ------------------- | --------------------------------------------- | ---------- |
| G-01                | e2e con reducir movimiento                    | T-01, T-09 |
| G-02, G-05          | Revisión con `review-animations`              | T-09       |
| G-03                | `performance.spec.ts` (≤ 230 KB)              | T-09       |
| G-04                | e2e de CLS                                    | T-06, T-09 |
| G-06                | axe en `home.spec.ts` y `home-motion.spec.ts` | T-09       |
| M-01                | `vote-control.test.tsx`                       | T-03       |
| M-02                | `poll-voting.test.tsx` + e2e de barras        | T-04       |
| M-03                | `comments-toggle.test.tsx`                    | T-05       |
| M-04 a M-10         | Revisión visual + tests existentes            | T-02, T-06 |
| S-01 a S-03, S-05/6 | Revisión visual + tests existentes            | T-07       |
| S-04                | `community-link.test.tsx` + e2e               | T-08       |
