# Adoptar la respuesta del backend del 2026-10-20 — Requirements

> **Estado:** borrador, para aprobar por el PO. Decisiones tomadas el 2026-10-20: las relacionadas se muestran como **píldoras bajo el cuerpo**; Explore v1 ("por qué ves esto" e impresiones) va en **otro spec**; las listas suman **Seguir / Siguiendo** en cada fila.
> **Fuente:** `docs/references/api/responses/2026-10-20-backend.md` (respuesta a `proposals6`).
> **Verificado contra `dev` el 2026-10-20** (`pnpm api:smoke` 8 de 8, y a mano con `GET` públicos):
>
> - el perfil trae `headline`, `city`, `links` y `bannerUrl`;
> - `active-communities`, `featured`, las listas con `isFollowedByViewer` y `displayName`;
> - `GET /assets` de a 50 con cursor;
> - `related` en los posts.
>
> **Diferencia con la respuesta:** los slugs de las comunidades de activo que ya existen siguen en mayúscula (`BTC`, `AAPL`); los nuevos van a ser `tsla`, `brk-b`. Hoy no rompe; con el seed nuevo, sí.

## Objetivo

Que lo que el backend ya implementó deje de mockearse, que el front use sus formas reales y que `proposals.md` quede solo con lo pendiente, listo para pasarle al backend.

## Mocks que se apagan (BA-01)

- [ ] **BA-01** Van al backend real con `API_MOCKS=missing`:
  - `PATCH /users/{userId}` con titular, ciudad, links, banner y "Acerca de" largo (P-019, P-020, P-024);
  - la subida de foto y banner (P-021);
  - destacados (P-025);
  - dónde publica una persona (P-027);
  - borradores (P-022).

  Siguen en los mocks para trabajar sin backend (CI, `API_MOCKS=true`). "Abierto a" (P-026), las marcas (P-023), los widgets (P-028, P-029) y los logros (P-030) se siguen mockeando siempre.

## El perfil

- [ ] **BA-02** Los errores nuevos de `PATCH /users` (`HEADLINE_TOO_LONG`, `CITY_TOO_LONG`, `BIO_TOO_LONG`, `INVALID_LINK`, `TOO_MANY_LINKS`) se dicen bajo su campo en "Editar perfil", sin perder lo escrito.
- [ ] **BA-03** Después de guardar, el perfil muestra la foto y el banner con la URL que **devuelve** el backend (la re-codifica y la cambia), nunca la que se mandó.

## Destacados (P-025)

- [ ] **BA-04** Los destacados usan la forma real: cada uno es un ítem del feed (`POST`, `POLL` o `THESIS`) con `featuredAt`. Se puede destacar una **encuesta** desde su "⋯", como un post. Todo lo demás se ve igual (`specs/profile-showcase` PS-05 a PS-08).

## Borradores (P-022)

- [ ] **BA-05** Publicar desde un borrador manda su `draftId` en `POST /posts`: el backend lo borra en la misma operación (sin el `DELETE` de después). Un borrador guarda también sus relacionadas.

## Comunidades relacionadas (P-018)

- [ ] **BA-06** Las relacionadas que se eligen al crear un post (hasta 3) viajan como `relatedCommunityIds`. Se deja de escribir la línea de menciones al final del cuerpo.
- [ ] **BA-07** (Q1) En la tarjeta del feed y en el detalle, las relacionadas son una fila de **píldoras grises** debajo del cuerpo, antes de los votos (`$GGAL`, `#macro`), cada una con link a su página. Sin relacionadas, no hay fila. Un post viejo con la línea de menciones se sigue viendo como hasta hoy.
- [ ] **BA-08** `422 INVALID_RELATED_COMMUNITY` se dice en el editor, junto a las relacionadas, sin perder lo escrito.

## Listas de personas (P-017, Q3)

- [ ] **BA-09** En seguidores, seguidos y miembros, cada fila muestra el nombre visible (si lo hay) y el `@usuario`, y a la derecha **Seguir** o **Siguiendo**, como en el perfil. No hay botón en tu propia fila. Sin sesión, pide una cuenta, como el resto. Dejar de seguir pide confirmación, como hoy.

## Activos

- [ ] **BA-10** La página de un activo toma la comunidad de `linkedCommunity` en `GET /assets/{symbol}`, nunca del símbolo. Las páginas y menciones de activos siguen con el **símbolo** en la URL (`/asset/BRK.B`), aunque el slug de la comunidad sea `brk-b`.

## Contrato y propuestas

- [ ] **BA-11** El snapshot (`docs/references/api/`) suma lo adoptado. `proposals.md` queda con lo pendiente: P-014 (`best`), P-023 y P-026 (decisiones de producto), y lo nuevo que no vio el backend (P-028 a P-030). Sale lo adoptado, P-005 (descartado) y lo que el backend ya resolvió (`GET /assets` paginado, imágenes huérfanas).
- [ ] **BA-12** `pnpm api:smoke` cubre lo adoptado que se puede leer sin sesión (destacados, dónde publica, listas, `linkedCommunity`), y su resultado queda anotado en `proposals.md`.

## Calidad

- [ ] **BA-13** Mobile first a 360 px, axe sin violaciones en claro y oscuro, textos en en, es y pt, presupuesto de JS dentro de 240 KB.

## Fuera de alcance

- Explore v1: la etiqueta "por qué ves esto" (`reason`) y las impresiones (`POST /feed/impressions`). Van en otro spec (Q2).
- Las comunidades de los 59 activos que faltan: las crea el backend; el front ya muestra un activo sin comunidad.
- El catálogo de activos entero (`GET /assets` sin `?q=`): nada lo lista todavía.
