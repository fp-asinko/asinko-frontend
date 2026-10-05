# Experiencia sin sesión — Tasks

> **Estado:** para aprobar junto con `requirements.md` y `design.md`.

```
T-01 ─┬─ T-02 ─┬─ T-04 ─ T-06
      └─ T-03 ─┴─ T-05 ─┘
```

## Tareas

- [ ] **T-01 · Contexto `AuthGate`** · S · G-09, G-11
  - Provider con `signedIn` y `requireAccount`, que el layout alimenta desde `getViewer()`.
  - **Tests:** unitarios del contexto.
- [ ] **T-02 · Modal** · M · G-05 a G-08, G-10
  - `Dialog` de shadcn (Base UI), `AuthGateDialog` con `Sheet` en mobile, carga diferida, mensajes en en/es/pt.
  - **Tests:** título por acción, cierre, foco y `ComingSoon` en los botones.
- [ ] **T-03 · Llamados permanentes** · S · G-02, G-03
  - Botones en `SiteHeader`, `JoinCard` en la columna derecha y botones en el estado vacío de "Following".
  - **Tests:** con y sin sesión.
- [ ] **T-04 · Acciones con modal** · M · G-04, G-06
  - Votos de post y de encuesta, composer y Join. Se borran los `needAccount`.
  - **Tests:** sin sesión, nada se marca ni se envía.
- [ ] **T-05 · e2e sin sesión** · S · G-01, G-04 a G-08
  - Un proyecto de Playwright sin sesión (`API_MOCKS=missing` con los mocks que hagan falta), o un flag de mocks sin usuario demo.
  - **Tests:** `e2e/guest.spec.ts`.
- [ ] **T-06 · Cierre** · S · G-10, G-12
  - Presupuesto de JS, axe, revisión con `ui-reviewer`, y `api-integration.md` y `specs/home` actualizados.

## Criterios → tests

| Criterio   | Test                                                  |
| ---------- | ----------------------------------------------------- |
| G-01       | `e2e/guest.spec.ts` (feed, comentarios y comunidades) |
| G-02, G-03 | `site-header.test.tsx`, `join-card.test.tsx`          |
| G-04       | Tests de cada componente y e2e                        |
| G-05–G-08  | `auth-gate-dialog.test.tsx`, e2e con axe              |
| G-09       | `auth-gate.test.tsx`                                  |
| G-10       | `e2e/performance.spec.ts`                             |
| G-11       | e2e actuales con el usuario demo                      |
| G-12       | Test de claves de `messages/`                         |
