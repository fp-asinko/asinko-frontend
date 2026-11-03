# Una tesis en el feed y en su página — Requirements

> **Estado:** preguntas resueltas por el PO el 2026-11-03, las cinco como se recomendaron (Q3 después de ver las dos opciones).
> **Fuente:** Jira **MVP-140** ("Thesis lifecycle UI end-to-end": los estados Abierta → Vencida → Acertada / Errada y la acción de cancelar, que el backend ya tiene, dentro de la ventana en que se puede). Suma lo que dejó afuera `specs/thesis-create`: la tarjeta de una tesis en los feeds (prueba manual del 2026-11-03: la tesis de `#chile` llega en `GET /feed/explore?community=chile`, pero la página del grupo no la dibuja).
> **Backend** (`dev`, leído el 2026-11-03):
>
> - `GET /theses/{id}` responde `200` con la `Thesis` completa (E11), con `community`, `creator`, `score`, `viewerVote`, `argumentCounts` y `canCancel`.
> - `PUT /theses/{id}/cancel` `{ userId, reason }` → la `Thesis` con `state: CANCELLED`. Da `409 THESIS_NOT_CANCELLABLE` si no está abierta o si falta menos del 10 % del plazo entre la publicación y la fecha límite.
> - Votar es como en un post: `PUT /theses/{id}/vote` y `DELETE` (E05).
> - Los feeds mandan `kind: THESIS` (E04). Hoy el front los descarta (`KNOWN_KINDS` en `features/feed/lib/feed-api.ts`).
> - Las tesis no pasan de estado solas hasta que esté el cron (MVP-139, backend). Mientras tanto, los estados resueltos se ven con mocks.
>   **Hoy:** las tesis solo se ven en la pestaña Tesis del perfil (`specs/profile-track-record`), con una tarjeta de solo lectura que no lleva a ningún lado.

## Objetivo

Que una tesis se vea donde se publica, igual que un post: en el Home, en su grupo, en la página de su activo y en su propia página. Que su autor la pueda cancelar mientras se puede, y que cada uno vea en qué quedó.

## User stories

- Como usuario, quiero ver las tesis en los feeds, para enterarme de las predicciones del grupo o del activo que sigo sin ir perfil por perfil.
- Como usuario, quiero abrir una tesis y ver todo: qué apuesta, a qué precio estaba, cuánto falta y, si ya se resolvió, cómo terminó.
- Como autor, quiero cancelar una tesis abierta cuando todavía se puede, diciendo por qué, sabiendo que queda en mi historial como cancelada.
- Como usuario, quiero votar una tesis como voto un post.

## Criterios de aceptación

### La tarjeta en el feed

- [ ] **TD-01** Las tesis aparecen en todos los feeds que las mandan: Home (Explorar y Siguiendo), la página de un grupo, la de un activo y el canal de una persona. Van en el orden del backend, mezcladas con los posts.
- [ ] **TD-02** La cabecera es la de cualquier tarjeta (`specs/community-first`): el grupo con su avatar y Unirse, el autor debajo; en un canal personal, el autor con su foto. Al lado, una etiqueta **Tesis**, para distinguirla de un post.
- [ ] **TD-03** El cuerpo es el de la tarjeta del perfil (`specs/profile-track-record` PT-07):
  - el activo y su precio de referencia;
  - el claim como título;
  - el estado en su chip;
  - el objetivo con su dirección y su fecha;
  - la convicción en barras.
  - Si está abierta, cuánto falta ("Cierra en 23 días"); si está resuelta, el precio de resolución.
- [ ] **TD-04** Abajo, las mismas acciones que un post: votar, los argumentos (`argumentCounts.pro + contra`) y compartir. Los argumentos llevan a la página de la tesis (TD-06).
- [ ] **TD-05** Toda la tarjeta lleva a la página de la tesis, como la de un post. El activo, el grupo y el autor siguen siendo sus propios links.

### La página de la tesis

- [ ] **TD-06** Cada tesis tiene su página, `/{locale}/thesis/{id}` (Q1). Muestra la tarjeta completa con el razonamiento entero en Markdown, igual que el cuerpo de un post. Arriba, el botón Volver del detalle de post (`specs/post-detail-refresh` PD-01).
- [ ] **TD-07** **Los datos de la apuesta**, en un bloque:
  - el precio de referencia y cuándo se tomó;
  - el objetivo y la dirección, con el % de diferencia;
  - la fecha límite con su hora (23:59 en la zona de quien la ve, `specs/local-time`);
  - la convicción;
  - la fecha de publicación.
- [ ] **TD-08** **Según su estado:**
  - **Abierta:** cuánto falta.
  - **Vencida:** "Esperando resolución".
  - **Acertada / Errada:** el precio de resolución, la fecha y cómo se resolvió: automática, por la comunidad o por un admin (`resolutionSource`).
  - **En disputa:** "En revisión".
  - **Cancelada:** cuándo y el motivo.
    El estado nunca se dice solo con color: siempre con ✓ / ✗ o su nombre (`design-system.md`).
- [ ] **TD-09** Sin argumentos todavía: en lugar de comentarios, "N a favor · N en contra" y un aviso de que los argumentos llegan pronto. La pestaña de argumentos y las actualizaciones del autor son MVP-141, el spec siguiente (Q3).
- [ ] **TD-10** Una tesis que no existe da 404 (`notFound()`), como un post. Si el backend falla, la página de error con reintentar.
- [ ] **TD-11** **SEO:** título "Claim · $BTC", descripción con el objetivo y la fecha límite, canonical y `hreflang` por idioma, e imagen para compartir como la de un post (`specs/share-preview`).

### Cancelar

- [ ] **TD-12** El autor ve **Cancelar tesis** en el menú "⋯" de la tarjeta y de la página, solo si el backend dice `canCancel`. Si no puede, no aparece.
- [ ] **TD-13** Cancelar abre una confirmación que dice:
  - que la tesis queda en su historial como **Cancelada**;
  - que no se puede deshacer.
    Pide un **motivo**, obligatorio (Q4). Hay que confirmarlo.
- [ ] **TD-14** Confirmado, se manda `PUT /theses/{id}/cancel` con el `userId` de la sesión (nunca del cliente) y el motivo. La tarjeta pasa a Cancelada sin recargar, con el motivo.
- [ ] **TD-15** Errores:
  - `409 THESIS_NOT_CANCELLABLE`: "Ya no se puede cancelar: falta muy poco para la fecha límite"; la opción desaparece.
  - `403`: el error genérico.
  - Sin sesión: el modal de cuenta (`specs/auth`).

### Votar

- [ ] **TD-16** Votar una tesis es como votar un post (`specs/feed-cards`): sube y baja, con el puntaje, el voto propio marcado y la misma animación. Sin sesión, el modal de cuenta.

### El perfil

- [ ] **TD-17** La tarjeta de la pestaña Tesis del perfil pasa a ser un link a su página (Q5). Sigue igual de liviana: sin votos ni la cabecera del grupo, que en el perfil sobran.

### Calidad

- [ ] **TD-18** A 360 px nada genera scroll horizontal. La tarjeta y la página funcionan con teclado. Axe sin violaciones en claro y oscuro.
- [ ] **TD-19** **Presupuesto de JS** (`seo.md`): la tarjeta y la página se dibujan en el servidor. Solo votar, el menú y la confirmación de cancelar son cliente, y la confirmación se carga diferida. Las rutas con feed no pueden pasar los 240 KB.
- [ ] **TD-20** **Mocks:**
  - tesis en los feeds de los mocks, de cada estado;
  - `GET /theses/{id}`, `PUT /theses/{id}/cancel` (con su `409`) y el voto, con el contrato validado en `fixtures.test.ts`;
  - `liveExample` de `GET /theses/{id}` para `pnpm api:smoke`.
- [ ] **TD-21** Textos en en, es y pt.

## Fuera de alcance

- **Argumentos a favor y en contra, y las actualizaciones del autor:** MVP-141, el spec siguiente. Comentar una tesis exige elegir un lado (`side`, E05).
- **El voto de resolución de la comunidad** (`PUT /theses/{id}/resolution-vote`, para las vencidas): otro ticket.
- **El "¿Estás de acuerdo? BULL / BEAR" del prototipo y las reacciones Bullish, Bearish, Interesting y Degen de `overview.md`:** el contrato solo tiene votar hacia arriba o hacia abajo. Si se quieren, van como propuesta al backend.
- **Stakes y tokens del prototipo:** fase 4.
- **El cron que resuelve las tesis:** backend (MVP-139).

## Preguntas resueltas (2026-11-03)

- **Q1. La URL:** `/thesis/{id}`, igual en los tres idiomas, como `/post/{id}`, `/hub/…` y `/asset/…`. **Sí.** Las otras páginas de contenido no se traducen.
- **Q2. La etiqueta "Tesis" en la tarjeta del feed:**
  - **Opción A, elegida:** una píldora gris "Tesis", al lado de la hora en la cabecera. Sigue el sistema monocromático.
  - **Opción B:** una franja de color arriba de la tarjeta, como la "alerta" del prototipo para las tesis abiertas.
- **Q3. Los argumentos en la página:** sin comentarios hasta MVP-141, con los contadores y un "Próximamente" (el backend exige un lado para comentar una tesis). **Elegido:** MVP-141 va justo después, en su spec; hacerlo acá era casi el doble antes de ver algo funcionando.
- **Q4. El motivo de cancelar:** el contrato lo pide (`reason`), pero no dice si puede ir vacío ni el largo. **Obligatorio, de hasta 280 caracteres**: el historial queda honesto. Si el backend acepta vacío o tiene otro largo, se ajusta con Eugenio.
- **Q5. La tarjeta del perfil:** **pasa a ser un link a la página de la tesis, sin cambiar su forma.**
