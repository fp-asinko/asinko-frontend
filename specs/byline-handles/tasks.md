# Nombres sin símbolo en las tarjetas y el # chico en los grupos — Tasks

Rama: `feature/byline-handles`, desde `develop`.

- [x] **T-01 (S)** `CardByline` sin `#` ni `@`; tests. → BH-01, BH-02, BH-04
- [x] **T-02 (S)** El `#` chico y gris en `CommunityHeader`; test. → BH-03
- [x] **T-03 (M)** e2e que buscaban la cabecera por su handle; suite completa, 360 px, axe; merge a `develop`. → BH-05

| Criterio     | Test                                                       |
| ------------ | ---------------------------------------------------------- |
| BH-01, BH-02 | `card-byline.test.tsx`, `post-card.test.tsx`, e2e          |
| BH-03        | `community-header.test.tsx`, e2e `community-pages.spec.ts` |
| BH-04        | `post-card.test.tsx` (menciones del cuerpo intactas)       |
| BH-05        | e2e (axe, 360 px)                                          |
