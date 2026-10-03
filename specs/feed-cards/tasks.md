# Tarjetas del feed con color y vida — Tasks

> **Estado:** aprobado el 2026-10-03.

```
T-01 ─┬─ T-02 ─ T-03
      ├─ T-04 ─ T-05 ─ T-06
      └─ T-07 ──────────────── T-08
```

## Tareas

- [x] **T-01 · Tokens y test de contraste** · S · FC-12, FC-13
  - Tokens de § 2 en `:root`, `.dark` y `@theme inline`.
  - **Tests:** pares nuevos en `tokens-contrast.test.ts`, en los dos temas (se verifica que fallan con un valor más claro). También un test que confirma que ningún token de avatar o encuesta es igual a `--bullish` o `--bearish`.

- [x] **T-02 · Avatares de color** · S · FC-01
  - `identityIndex` en `src/lib/identity-color.ts`. `AVATAR_CLASSES` y el tamaño `xl` en `UserAvatar`.
  - **Tests:**
    - Unitario del hash: estable, ignora prefijo y mayúsculas, siempre en 0–7, y reparte una muestra de handles en al menos 6 tonos.
    - `user-avatar.test.tsx`: la misma clave da la misma clase, y con imagen no hay gradiente.

- [x] **T-03 · Precisión por tramos y hover de la byline** · S · FC-03, FC-10
  - `accuracyTier` con los límites de Q1. El chip usa un mapa de clases y `group/byline`.
  - **Tests:** tramos en 0,4999 / 0,5 / 0,6999 / 0,7. `card-byline.test.tsx` verifica el nombre accesible con el tramo en los tres casos.

- [x] **T-04 · Opciones con marcador y barra fina** · M · FC-04, FC-06, FC-09
  - Recuadro de geometría fija, marcador (radio → leyenda), barra fina con `bar-grow`, negrita de la votada, acento de color en hover y foco. Logo de comunidad en `PollCard` (FC-02).
  - **Tests:**
    - `poll-voting.test.tsx`: la votada lleva ✓ y "(your vote)" accesible, y cada opción tiene un color distinto.
    - `poll-card.test.tsx`: logo con comunidad y sin logo cuando no hay comunidad.
    - e2e: la caja de la encuesta mide lo mismo antes y después de votar (sin saltos).

- [x] **T-05 · Consenso** · S · FC-05, FC-09
  - `pollConsensus` en `features/feed/lib/`, el mensaje en `PollVoting`, `lastVotedId` y la secuencia de § 5.4, y los mensajes en en/es/pt.
  - **Tests:**
    - Unitario de `pollConsensus`: mayoría, minoría, empate, menos de 10 votos, sin voto y resultados ocultos.
    - `poll-voting.test.tsx`: no aparece con el estado optimista; aparece con la respuesta del servidor; aparece sin animación si ya había votado.

- [x] **T-06 · Movimiento de la encuesta** · S · FC-09, FC-11
  - El pop del ✓ con `key` y el retardo del consenso.
  - **Tests:** en `e2e/home-motion.spec.ts`, el consenso aparece después de las barras. Con reducir movimiento, el estado final llega de inmediato y con color.

- [ ] **T-07 · Panel de comentarios** · S · FC-07, FC-08, FC-10
  - Recuadro con margen, autor en negrita, texto principal, `stagger`, hover del avatar, "See all" en negrita con la flecha, y el esqueleto de carga.
  - **Tests:**
    - `comments-preview.test.tsx`: autor y "See all" presentes, con lista y vacío.
    - `comments-toggle.test.tsx`: mientras carga se anuncia el estado y el esqueleto queda oculto para lectores de pantalla.

- [ ] **T-08 · Cierre** · S · FC-12, FC-14
  - e2e de axe en el Home, en claro y en oscuro, después de votar una encuesta y abrir comentarios. Presupuesto de JS en `performance.spec.ts`.
  - Revisión con `review-animations` y `ui-reviewer`. Spec actualizado si algo cambió.

## Criterios → tests

| Criterio    | Test                                                    |
| ----------- | ------------------------------------------------------- |
| FC-01       | `identity-color.test.ts`, `user-avatar.test.tsx`        |
| FC-02       | `poll-card.test.tsx`                                    |
| FC-03       | `accuracy-tier.test.ts`, `card-byline.test.tsx`         |
| FC-04       | `poll-voting.test.tsx`, e2e de geometría                |
| FC-05       | `poll-consensus.test.ts`, `poll-voting.test.tsx`        |
| FC-06       | `poll-voting.test.tsx` (borde de color en foco)         |
| FC-07/08    | `comments-preview.test.tsx`, `comments-toggle.test.tsx` |
| FC-09/10/11 | `e2e/home-motion.spec.ts`                               |
| FC-12/13    | `tokens-contrast.test.ts`, axe en claro y oscuro        |
| FC-14       | `e2e/performance.spec.ts`                               |
