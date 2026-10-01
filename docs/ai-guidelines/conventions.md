# Convenciones del equipo

## Idioma

- **Código, variables, comentarios técnicos**: inglés
- **Documentación de producto, specs y mensajes de UI**: idioma del negocio (ajustar por proyecto)
- **Commits**: inglés, formato Conventional Commits
- **PRs**: descripción en idioma del equipo, indistinto

## Gestor de paquetes

- **pnpm** es el único gestor de paquetes del proyecto. No usar `npm` ni `yarn`.
- El único lockfile versionado es `pnpm-lock.yaml`. Si aparece un `package-lock.json` o `yarn.lock`, se borra.
- En un monorepo, los packages se declaran en `pnpm-workspace.yaml` y las dependencias internas con `workspace:*`.

## Git

### Ramas

```
main                                 # rama protegida, deploy a producción
staging                              # rama protegida, deploy a QA
develop                              # rama integradora, deploy a DEV
feature/<spec-slug>-<descripcion>    # ramas de trabajo
fix/<descripcion>                    # bugfixes
hotfix/<descripcion>                 # arreglos urgentes a prod
```

### Flujo

1. Cada feature parte de un spec aprobado en `specs/`.
2. La rama se crea desde `develop` con el slug del spec.
3. PR del feature contra `develop`: corre quality gates.
4. Merge dispara deploy a DEV.
5. Cuando QA aprueba en DEV → PR a `staging`.
6. Merge a `staging` dispara deploy a QA (requiere aprobación del lead técnico).
7. UAT en QA → PR de `staging` a `main`.
8. Merge a `main` dispara pipeline a producción (requiere aprobación de DevOps).

### Commits — Conventional Commits

```
<type>(<scope>): <subject>

<body opcional>

<footer opcional con SPEC-ID o ticket>
```

Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`.

Ejemplos:

```
feat(quote): add multi-step form with validation

SPEC: mvp3-commercial/quote-flow
```

```
fix(seo): correct canonical URL for migrated pages

Closes TICKET-247
```

### Pull Requests

- Squash merge a las ramas protegidas.
- Cada PR referencia el spec correspondiente en la descripción.
- Mínimo 1 aprobación + quality gates verdes.
- PRs a `main` requieren 2 aprobaciones (lead técnico + DevOps).

## Definición de "Hecho" (DoD)

Un PR está hecho cuando:

- [ ] Pasa todos los quality gates (análisis estático, scan de seguridad, build).
- [ ] Todo componente nuevo o modificado tiene su test de Vitest (ver `testing.md`).
- [ ] Tests unitarios para lógica de negocio nueva o modificada (hooks, esquemas, actions).
- [ ] Tests e2e de Playwright para flujos críticos nuevos o modificados, en mobile y desktop.
- [ ] Tipos exportados desde el módulo correspondiente si se usan en más de un lugar.
- [ ] Sin warnings del linter ni errores de tipos (ver `tooling.md`).
- [ ] Textos nuevos traducidos en todos los idiomas, o marcados `TODO(i18n)` (ver `i18n.md`).
- [ ] Dependencias nuevas justificadas y agregadas a `libraries.md`.
- [ ] Métricas de performance y presupuesto de JS dentro de los umbrales (ver `seo.md`).
- [ ] UI probada en mobile (360px) y desktop, con teclado (ver `design-system.md`).
- [ ] Spec actualizado si el alcance cambió durante la implementación.
- [ ] QA aprobó en DEV.

## Comunicación

- **Bloqueantes**: escalamiento inmediato al lead técnico por el canal acordado.
- **SLA de respuesta**: definir por proyecto (ej. 48h para bloqueantes).
- **Specs en revisión**: dueño asignado, deadline máximo 2 días para feedback.
- **Cambios de alcance**: no se aceptan dentro del sprint una vez la spec está validada (congelamiento de specs).
