# Front adaptado al contrato nuevo del backend — Requirements

> **Estado:** para aprobar. Pedido el 2026-10-03. Cambio de contrato: requiere spec (`sdd-philosophy.md`).
> **Origen:** `asinko-app` en `dev` implementó P-004, P-006, P-007 y P-008 (commit `3cfff41`, 2026-10-02) y P-002 (`3c5676c`). Hoy el front sigue compensando con los atajos de `specs/home/design.md § 6`.

## Objetivo

Consumir lo que el backend ya resuelve y borrar los atajos del front. La regla es de `api-integration.md § Contrato`: el front no compensa con lógica lo que el backend ya resuelve.

## User stories

1. Como **usuario**, quiero ver el nombre de la comunidad en todas las tarjetas, no solo en las de la primera página de comunidades.
2. Como **usuario**, quiero ver cuántos comentarios tiene una encuesta, igual que un post.
3. Como **usuario**, quiero que los comentarios de una tarjeta abran rápido, aunque el post tenga cientos.
4. Como **equipo**, queremos que los mocks y el snapshot del contrato digan lo mismo que el backend.

## Criterios de aceptación

- [ ] **BC-01** **Comunidad del contenido (P-004):** la tarjeta de post y la de encuesta toman la comunidad del campo `community` del contenido. Toda tarjeta muestra su `$BTC` o `#defi` con link, sin importar en qué página de comunidades esté.
- [ ] **BC-02** **Un request menos por página:** el feed deja de pedir `GET /communities` en cada página para nombrar comunidades. Solo lo pide si la página trae menciones `$` o `#` para resolver (ver Q1).
- [ ] **BC-03** **Comentarios de una encuesta (P-006):** el botón de comentarios de la encuesta muestra la cantidad, con el mismo formato y el mismo nombre accesible que el de un post ("6 comments"). Hoy dice solo "Comments".
- [ ] **BC-04** **Primeros comentarios livianos (P-007):** la vista previa pide `?limit=N&replies=false` y sigue mostrando los 3 primeros comentarios de primer nivel que no estén borrados.
- [ ] **BC-05** **Mocks al día:** los mocks devuelven `community` y `commentCount` en encuestas, respetan `limit` y `replies`, y un contenido borrado trae `body: ""` (P-008). `src/mocks/fixtures.test.ts` los valida contra el esquema.
- [ ] **BC-06** **Contrato y propuestas:** el snapshot de `docs/references/api/` y `proposals.md` marcan P-002, P-004, P-006, P-007 y P-008 como implementadas en `dev`. Los atajos anotados en `specs/home` quedan cerrados.
- [ ] **BC-07** **Contra el backend real:** `pnpm api:smoke` pasa contra `asinko-app` local con los esquemas nuevos.
- [ ] **BC-08** **Sin regresiones:** nada más cambia a la vista. El JS del Home no crece, porque todo el cambio es de servidor.

## Fuera de alcance

- Usar `Authorization: Bearer` (P-002): llega con el login.
- Menciones resueltas en la lectura (P-001), activos (P-003) y batching del feed (P-009, sin escribir).
- El cambio del backend de "publicar sin ser miembro" (`d1a18e7`): el front todavía no crea contenido.

## Preguntas abiertas

| #   | Pregunta                                                                                                                                     | Propuesta                                                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Las menciones `$` y `#` del texto se resuelven por id (`entities.resolvedId`), y eso P-004 no lo cubre. ¿Qué hacemos con `GET /communities`? | Pedirlo solo cuando la página trae entidades `COMMUNITY` o `TICKER`. Hoy el backend real no las manda (P-001), así que en la práctica no se pide. Se sigue pidiendo con los mocks, que sí las traen |
| Q2  | `limit` cuenta comentarios borrados, y la vista previa los saltea. ¿Cuántos pedimos para mostrar 3?                                          | `limit=6`: deja margen para borrados y sigue siendo una fracción del árbol                                                                                                                          |
| Q3  | ¿`community` es obligatorio en el esquema?                                                                                                   | Sí, el backend lo manda siempre. Si un ítem no lo trae, `keepValidItems` lo descarta y lo reporta (H-20). Es la señal de que el front habla con un backend viejo                                    |

## Dependencias

- `asinko-app` `dev` en `3cfff41` o posterior, corriendo en `localhost:3001` para BC-07.
- `specs/home` y `specs/feed-cards` cerrados.
