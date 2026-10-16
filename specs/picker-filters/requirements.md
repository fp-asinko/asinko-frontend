# Filtros del selector de comunidad — Requirements

> **Estado:** aprobado por el PO el 2026-10-16. Q1: chips y además los símbolos `#` y `$` al empezar la búsqueda. Q2: no hay filtro de personas: solo se publica en el perfil propio, que sigue primero.
> **Fuente:** pedido del PO (2026-10-16), con una captura del selector de la página de crear post (`specs/submit-page`): "debería haber alguna forma de poder filtrar por comunidad, usuarios o assets".
> **Hoy** (`specs/post-create-detail` PC-06): el selector muestra "Tu perfil" y tus comunidades al abrir y busca en el servidor mientras escribís. Grupos y activos salen mezclados, sin forma de pedir solo unos u otros.

## Objetivo

Encontrar rápido dónde publicar: solo grupos o solo activos, con un toque o escribiendo el símbolo que ya se usa en las menciones.

## User stories

- Como usuario, quiero ver solo activos cuando voy a publicar sobre `$BTC`, sin que los grupos llenen la lista.
- Como usuario, quiero escribir `$bt` o `#mac` y que el selector entienda qué busco, como en las menciones.

## Criterios de aceptación

- [x] **PF-01** Arriba de la lista, debajo de la búsqueda, tres chips: **Todo**, **Comunidades** y **Activos**. Al abrir, Todo está activo. Uno solo activo a la vez.
- [x] **PF-02** **Comunidades** deja solo los grupos (todo lo que no es un activo); **Activos**, solo las comunidades de activos (`$`). Vale para la lista inicial (tus comunidades) y para la búsqueda.
- [x] **PF-03** (Q1) Escribir `#` al principio de la búsqueda activa **Comunidades** y `$` activa **Activos**; el símbolo no se busca (`$bt` busca "bt"). Borrar el símbolo vuelve a **Todo**. Elegir un chip a mano con un símbolo escrito lo saca de la búsqueda.
- [x] **PF-04** (Q2) "Tu perfil" sigue primero en **Todo**, como hoy, si coincide con la búsqueda. En **Comunidades** y **Activos** no aparece: no es ni un grupo ni un activo. No hay filtro de personas: solo se publica en el perfil propio (el backend rechaza el de otra persona).
- [x] **PF-05** El mensaje de lista vacía dice qué faltó: "No se encontraron activos" o "No se encontraron comunidades".
- [x] **PF-06** Accesibilidad: los chips son botones con `aria-pressed` dentro de un grupo con nombre ("Filtrar por tipo"), alcanzables con Tab desde la búsqueda; el foco no se pierde al cambiar de chip. Áreas táctiles de 24 px o más. Axe sin violaciones con la lista abierta, en claro y oscuro, a 360 px.
- [x] **PF-07** Textos en en, es y pt.

## Fuera de alcance

- Filtrar por tipo de grupo (geográfico, categoría, de usuarios).
- Buscar personas para publicar en su perfil (el backend no lo permite).
- Cambiar el endpoint: `GET /communities` ya acepta `type` (`docs/references/api/E02-comunidades.md`).
