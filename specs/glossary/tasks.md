# Glosario en el Home — Tasks

Rama: `feature/glossary-home`, desde `develop`. Se mergea a `develop` (Q3).

- [x] **T-01 (S)** Propuesta P-032, contrato (`glossaryTermSchema`, rama `GLOSSARY`), `KNOWN_KINDS`. Tests. → GL-01, GL-05
- [x] **T-02 (M)** Mocks: los 15 términos, `randomGlossary` y el intercalado cada 8 en el Home. Tests. → GL-01, GL-03
- [x] **T-03 (M)** Dominio (`GlossaryItem`, `toGlossaryItem`) y `GlossaryCard` en `FeedItems`. Textos. Tests. → GL-02, GL-04
- [x] **T-04 (S)** e2e: la tarjeta en el Home cada 8 posts, 360 px, axe en claro y oscuro, presupuesto. Ajustar los e2e que cuentan tarjetas. → GL-01, GL-06

| Criterio     | Test                                              |
| ------------ | ------------------------------------------------- |
| GL-01        | `handlers.test.ts`, e2e `glossary.spec.ts`        |
| GL-02, GL-04 | `glossary-card.test.tsx`, e2e                     |
| GL-03        | `glossary.test.ts` (fixtures), `fixtures.test.ts` |
| GL-05        | `feed-api.test.ts`                                |
| GL-06        | e2e (axe, 360 px), `performance.spec.ts`          |
