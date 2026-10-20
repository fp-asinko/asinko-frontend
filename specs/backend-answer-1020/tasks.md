# Adoptar la respuesta del backend del 2026-10-20 — Tasks

- [ ] **T-01 (S)** La respuesta en `responses/`, el snapshot y `proposals.md` limpio. → BA-11
- [ ] **T-02 (M)** Mocks adoptados (`implemented: true`, `PATCH /users` partido) y los errores nuevos del perfil. Tests. → BA-01 a BA-03
- [ ] **T-03 (M)** Destacados con la forma real, y destacar una encuesta. Tests. → BA-04
- [ ] **T-04 (M)** Relacionadas: `relatedCommunityIds` al crear, sin la línea al final; borradores con `draftId` y sus relacionadas; el error. Tests. → BA-05, BA-06, BA-08
- [ ] **T-05 (S)** `RelatedPills` en la tarjeta y el detalle. Tests. → BA-07
- [ ] **T-06 (M)** Seguir en las filas de las listas. Tests. → BA-09
- [ ] **T-07 (S)** Activos por `linkedCommunity` y `assetSymbolOf`. Tests. → BA-10
- [ ] **T-08 (M)** Smoke ampliado y corrido contra `dev`; e2e, 360 px, axe, presupuesto; `ui-reviewer`; commit. → BA-12, BA-13

Orden: T-01 → T-08. Commit al cerrar T-01, T-04 y T-08.

## Mapa de criterios a tests

| Criterio     | Test                                                            |
| ------------ | --------------------------------------------------------------- |
| BA-01        | `handlers.test.ts` (qué rutas siguen sin implementar)           |
| BA-02, BA-03 | `update-profile.action.test.ts`, `edit-profile-dialog.test.tsx` |
| BA-04        | `featured-api.test.ts`, e2e                                     |
| BA-05, BA-06 | `composer.action.test.ts`, `create-post.schema.test.ts`, e2e    |
| BA-07        | `related-pills.test.tsx`, e2e                                   |
| BA-08        | `composer.action.test.ts`                                       |
| BA-09        | `follow-list.test.tsx`, e2e                                     |
| BA-10        | `paths.test.ts`, `community-route.test.ts`                      |
| BA-11, BA-12 | revisión del PR; `pnpm api:smoke`                               |
| BA-13        | e2e (axe, 360 px, `performance.spec.ts`)                        |
