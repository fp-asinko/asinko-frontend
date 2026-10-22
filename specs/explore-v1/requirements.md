# Explore v1: "por qué ves esto" e impresiones — Requirements

> **Estado:** aprobado por el PO el 2026-10-22, con Q1 a Q4 como se recomendaron. Pedido del mismo día para cerrar el batch 1 (MVP-201 y MVP-144, sprint MVP-2): es lo que `specs/backend-answer-1020` dejó fuera de alcance (su Q2).
> **Fuente:** `docs/references/api/responses/2026-10-20-backend.md` § 7 y `HANDOFF-frontend.md` de `asinko-app` (rama `dev`, 2026-10-22).
> **Verificado contra `dev` el 2026-10-22** (con `GET` públicos y leyendo el código del backend):
>
> - `GET /feed/explore` trae `requestId` en la página y `reason` en cada ítem: `{ type, via, countryCode }`. Sin sesión llegan `TRENDING` y `COUNTRY`.
> - `via` es la comunidad que lo trajo (`{ id, slug, name, type, avatarUrl }`) y solo viene con `SIMILAR`; `countryCode`, solo con `COUNTRY`.
> - `reason` llega `null` fuera del Explore del Home (`?community=`, Following).
> - `requestId` llega en **toda** página de feed: Explore, Following y el feed de una comunidad (`?community=`). Es `null` cuando la página está vacía.
> - `POST /feed/impressions` responde `204` y no necesita sesión. Lleva `{ userId, requestId, events }`: entre 1 y 100 eventos, y `dwellMs` es un entero de 0 a una hora. Con sesión, el `userId` tiene que ser el de la sesión; sin sesión, `null`. Lo que no corresponde a ese `requestId` se ignora sin error.

## Objetivo

Que el Home explique por qué muestra cada post de Explore, y que el backend sepa qué se vio y qué se abrió para mejorar el ranking.

## Decisiones del PO (2026-10-22)

- **Q1.** Se muestran **solo `SIMILAR` y `COUNTRY`**. `FOLLOWING` ya se ve en la cabecera (un grupo que seguís) y `TRENDING` es casi todo el feed (17 de 20 ítems en `dev`): repetirlo en cada tarjeta es ruido.
- **Q2.** Una línea chica **arriba de la cabecera** de la tarjeta, en gris y con un ícono, como el "Porque te interesa…" de Reddit.
- **Q3.** El país **con su nombre** ("Popular en Argentina"), en el idioma de la página.
- **Q4.** Reporta impresiones **todo feed que traiga `requestId`**: Explore y Following en el Home, y el feed de cada grupo y de cada activo.

## Criterios de aceptación

### La etiqueta (Q1 a Q3)

- [ ] **EX-01** En el Explore del Home, una tarjeta con un motivo que se muestra (Q1) lleva una línea arriba de la cabecera (Q2):
  - `SIMILAR`: "Porque sigues {comunidad}", con el handle de la comunidad de `via` (`#macro`, `$AAPL`) como link a su página;
  - `COUNTRY`: "Popular en {país}" (Q3).
- [ ] **EX-02** Sin motivo no hay línea, ni espacio reservado: `reason` en `null`, `FOLLOWING` y `TRENDING` (Q1), un `SIMILAR` sin `via` o un `COUNTRY` sin `countryCode`. Un `type` desconocido no rompe la tarjeta: se trata como sin motivo.
- [ ] **EX-03** Following, los feeds de grupo y de activo, el perfil y el detalle de un post nunca muestran la línea.
- [ ] **EX-04** La línea se entiende sin color: ícono + texto. Un lector de pantalla la lee como parte de la tarjeta, antes del título. Textos en en, es y pt; el nombre del país sale de `Intl` en el idioma de la página, nunca de una lista propia.

### Impresiones (Q4)

- [ ] **EX-05** **Visto (`SEEN`):** una tarjeta de un feed con `requestId` (Q4) que estuvo visible al menos al 50 % durante 1 segundo seguido cuenta como vista, una vez por tarjeta y por página cargada. `dwellMs` es el tiempo que estuvo visible.
- [ ] **EX-06** **Abierto (`OPEN`):** abrir el post desde su tarjeta (la tarjeta, el título, la imagen o los comentarios) cuenta como abierto. Votar, compartir, unirse o seguir un link de la tarjeta (una mención, la comunidad, el autor) no lo es.
- [ ] **EX-07** Los eventos se mandan **en lotes** de hasta 100, cada uno con el `requestId` de su página: una página cargada con "Cargar más" lleva el suyo. Lo visto **no se pierde al salir**: cambiar de pestaña, navegar a otra página de Asinko o cerrar la pestaña manda lo pendiente.
- [ ] **EX-08** El navegador nunca llama a la API (`api-integration.md`): los eventos pasan por el servidor de `asinko-web`. El `userId` sale de la sesión en el servidor, nunca del navegador; sin sesión va `null`. El cuerpo se valida con zod antes de mandarlo.
- [ ] **EX-09** Una impresión que falla **no se nota**: ni un mensaje ni un cambio en la página, y no se reintenta en bucle. Una página sin `requestId` (vacía) no manda nada.
- [ ] **EX-10** Sin datos personales: solo los ids del contenido, el tipo de evento y el tiempo. Nada en logs ni en Sentry más allá del endpoint y el código de error.

### Calidad

- [ ] **EX-11** Mobile first a 360 px; axe sin violaciones en claro y oscuro; `prefers-reduced-motion` respetado (la línea no se anima).
- [ ] **EX-12** Presupuesto de JS (`seo.md`): el observador de impresiones es código cliente en todas las rutas con feed. Se mide antes y después, y la ruta más pesada (perfil, 231,7 KB) sigue por debajo de 240 KB.
- [ ] **EX-13** Los mocks (`API_MOCKS=true`) traen `reason` variados y `requestId`, y simulan `POST /feed/impressions` (`204`). `pnpm api:smoke` valida `reason` y `requestId` contra `dev`. El snapshot del contrato suma lo adoptado.

## Fuera de alcance

- Ocultar un post o decir "no me interesa" (el backend no lo tiene).
- Usar las impresiones para algo en el front (por ejemplo, marcar lo ya visto).
- Impresiones en el perfil (`/users/{id}/content` no trae `requestId`) y en el detalle de un post.
- Las tesis en el feed: llegan con el batch 2 y van a usar la misma etiqueta y las mismas impresiones.
