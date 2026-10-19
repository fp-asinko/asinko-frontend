# Logros en el perfil — Tasks

- [x] **T-01 (M)** P-030 en `proposals.md`; contrato (`ACHIEVEMENT_CODES`, `achievementSchema`); mock con ganados y faltantes según el viewer y su 404; README de mocks. Tests. → AC-01, AC-02, AC-11
- [x] **T-02 (M)** `achievements-api` y su mapper, `ACHIEVEMENT_CATALOG`, mensajes en en, es y pt. Tests. → AC-01
- [ ] **T-03 (M)** `AchievementBadge` y `AchievementsCard` en la columna derecha del perfil y en la página por debajo de `lg`. Tests. → AC-03 a AC-05, AC-09
- [ ] **T-04 (M)** La página `/user/{username}/achievements` con `AchievementsList`, su columna derecha, metadata y 404. Tests. → AC-06 a AC-08
- [ ] **T-05 (M)** E2E, 360 px, axe, presupuesto de JS; `ui-reviewer`; commit. → AC-10

Orden: T-01 → T-05. Commit al cerrar T-02 y al cerrar T-05.

## Mapa de criterios a tests

| Criterio      | Test                                                                  |
| ------------- | --------------------------------------------------------------------- |
| AC-01, AC-02  | `src/mocks/achievements.test.ts`, `achievements-api.test.ts`          |
| AC-03, AC-04  | `achievements-card.test.tsx`, e2e                                     |
| AC-05         | e2e (mobile)                                                          |
| AC-06 a AC-08 | `achievements-list.test.tsx`, e2e                                     |
| AC-09         | `achievement-badge.test.tsx`, `achievements-list.test.tsx`, axe (e2e) |
| AC-10         | e2e (axe, 360 px, `performance.spec.ts`)                              |
| AC-11         | `src/mocks/fixtures.test.ts`                                          |
