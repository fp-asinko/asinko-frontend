# Adoptar lo que el backend ya tiene — Requirements

> **Estado:** aprobado por el PO el 2026-10-18 ("sigamos con la 3"): adoptar lo implementado en la respuesta del 2026-10-13 (`docs/references/api/responses/2026-10-13-backend.md`). Decisiones tomadas al escribirlo: D-1 a D-3, a confirmar.
> **Hoy:** la búsqueda de comentarios (P-014) se mockea siempre; el perfil arma "Posts" con el feed de su canal personal, que en dev está vacío porque el seed publica en grupos; no hay pestaña de respuestas; la página de un activo dice "Sin datos de mercado todavía" aunque el activo tenga precio.

## Mocks que se apagan

- [x] **BK-01** La búsqueda de comentarios (`?q=`, P-014), el post principal de cada comunidad (`topPost`, P-016) y el nombre visible (`displayName`, P-011) van al backend real con `API_MOCKS=missing`. Siguen en los mocks para trabajar sin backend (CI, `API_MOCKS=true`).

## El perfil (P-012)

- [x] **BK-02** La pestaña **Posts** de un perfil muestra todo lo que la persona publicó, en cualquier comunidad, del más nuevo al más viejo (`GET /users/{userId}/content?kind=POST,POLL`), con "Cargar más".
- [x] **BK-03** (D-1) Una pestaña nueva, **Respuestas**, después de Posts, como X: los comentarios de la persona, del más nuevo al más viejo (`GET /users/{userId}/comments`). Cada uno dice dónde está ("en _título del post_", con su comunidad) y lleva a ese comentario dentro de su post. Con "Cargar más".
- [x] **BK-04** Sin posts o sin respuestas, un estado vacío que lo dice (en tu perfil, invitando a publicar o comentar). Un perfil privado ajeno ya da 404 (como hoy).

## La página de un activo (P-003)

- [x] **BK-05** (D-2) Los datos del activo muestran el **precio** y la **variación** del día (con flecha y color, nunca solo color), con o sin comunidad. Si el precio es viejo (`priceStale`), lo marca como desactualizado y dice cuándo se actualizó ("Actualizado el 13/10, 18:40"). Sin precio: "Sin datos de mercado todavía", como hoy.
- [x] **BK-06** (D-3) Las monedas (`FOREX`, como `EUR/USD`) muestran el número sin símbolo de moneda; el resto, en dólares.

## Calidad

- [x] **BK-07** El snapshot del contrato (`docs/references/api/`) suma los endpoints nuevos y sale de `proposals.md` lo adoptado, en el mismo cambio (`api-integration.md § Contrato`).
- [x] **BK-08** Mobile first a 360 px, axe sin violaciones en claro y oscuro, textos en en, es y pt, presupuesto de JS dentro de 240 KB.

## Fuera de alcance

- La pestaña "Todo" del prototipo (posts, tesis y respuestas mezclados).
- Gráfico de precio y sentimiento (Bullish/Bearish) del activo.

## Decisiones (a confirmar por el PO)

- **D-1.** El orden de las pestañas: Tesis · Posts · Respuestas (Tesis y Posts quedan como los ordenó el PO el 2026-10-09).
- **D-2.** El precio va en el desplegable "Datos del activo" que ya existe, abierto por defecto si hay precio.
- **D-3.** Sin moneda en el contrato, todo se muestra en dólares salvo los pares de monedas.
