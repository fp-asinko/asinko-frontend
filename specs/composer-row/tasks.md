# La caja de publicar en una fila — Tasks

Rama: `feature/composer-row-single-line`, desde `develop`.

- [x] **T-01 (S)** Las clases de `ComposerPlaceholder`. → CR-01 a CR-03
- [x] **T-02 (S)** e2e: una fila a 640 y 1280 px, dos a 360, texto largo cortado, sin scroll horizontal, axe en claro y oscuro; merge a `develop`. → CR-01 a CR-04

| Criterio            | Test                                                                |
| ------------------- | ------------------------------------------------------------------- |
| CR-01, CR-02, CR-04 | e2e `composer-row.spec.ts`                                          |
| CR-03               | `composer-placeholder.test.tsx` (sin cambios: los links y su orden) |
