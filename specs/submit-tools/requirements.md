# Herramientas de la página de crear post — Requirements

> **Estado:** aprobado por el PO el 2026-10-18: las cuatro mejoras propuestas en `specs/submit-page` (vista previa, barra de formato, Publicar fijo en el teléfono, plegar la columna izquierda). Q1: la vista previa como pestaña "Escribir / Vista previa". Q2: la barra con los 6 básicos. Decisiones tomadas al escribirlo: D-1 a D-3, a confirmar.
> **Fuente:** `specs/submit-page` § Mejoras propuestas y el pedido del PO: "vayamos con el punto 5".

## Vista previa (Q1)

- [x] **ST-01** Sobre el cuerpo, dos pestañas: **Escribir** y **Vista previa**. La vista previa muestra el post como va a quedar en el feed: la misma tarjeta (comunidad, autor, título, el Markdown ya formateado, la imagen o el link), con las acciones en cero y sin poder tocarlas.
- [x] **ST-02** (D-1) Las menciones se ven en negrita, como en el feed, pero **sin link**: las resuelve el backend al publicar (P-001). Lo que no es Markdown válido se muestra como texto, igual que al publicar.
- [x] **ST-03** Volver a Escribir conserva lo escrito (el foco queda en la pestaña, como en toda lista de pestañas). Sin título ni cuerpo, la vista previa dice qué falta. Si no se puede armar (el servidor falla), lo dice y se puede seguir escribiendo.

## Barra de formato (Q2)

- [x] **ST-04** Sobre el cuerpo (en Escribir), una barra con **negrita, itálica, link, lista, cita y código**. Con texto elegido lo envuelve (`**texto**`); sin texto, escribe las marcas y deja el cursor en el medio. Lista y cita marcan cada línea elegida (`- `, `> `). Link escribe `[texto](https://)` y deja elegido `https://`.
- [x] **ST-05** Atajos: **Ctrl/⌘ + B**, **I** y **K** (negrita, itálica, link) en el cuerpo. Deshacer (Ctrl/⌘ + Z) deshace el formato.
- [x] **ST-06** Es una barra de herramientas accesible: un solo Tab entra en ella y las flechas recorren los botones (WAI-ARIA `toolbar`); cada botón dice qué hace y su atajo.

## Publicar a mano en el teléfono

- [x] **ST-07** En el teléfono (menos de `md`), la fila de abajo del editor (formatos, emojis, Cancelar y Publicar) queda **pegada al borde inferior**, sobre la barra de navegación, mientras se escribe un post largo. El contenido que pasa por debajo no queda tapado al enfocarlo (`scroll-padding`, WCAG 2.4.11).

## La columna izquierda

- [x] **ST-08** (D-2) En la página de crear post, desde `md`, la columna izquierda ("Tus intereses") arranca **plegada**: una franja angosta con un botón para desplegarla. Desplegada, se ve como en el resto del sitio, con un botón para plegarla. En las demás páginas no cambia nada.
- [x] **ST-08b** **Cambio con el PO (2026-10-18):** plegarla y desplegarla se anima: el ancho se desliza como un cajón (200 ms al abrir, 150 al cerrar), el contenido se desvanece sin aplastarse y el botón acompaña el borde. Sin movimiento con `prefers-reduced-motion`.
- [x] **ST-09** (D-3) La elección se recuerda en el navegador (abierta o plegada) para la próxima vez que se crea un post. Si el navegador no guarda nada (modo privado), arranca plegada.

## Calidad

- [x] **ST-10** Mobile first a 360 px; axe sin violaciones en claro y oscuro con la vista previa, la barra y la columna plegada; textos en en, es y pt.
- [x] **ST-11** El presupuesto de JS de la página de crear post y del resto no pasa de 240 KB (`seo.md`): la vista previa se arma en el servidor (`react-markdown` no llega al navegador).

## Fuera de alcance

- Títulos, tablas, imágenes dentro del cuerpo: el Markdown de Asinko no los muestra.
- Vista previa en vivo al lado (se eligió la pestaña, Q1).
- Plegar la columna en otras páginas.

## Decisiones (a confirmar por el PO)

- **D-1.** Menciones sin link en la vista previa: el front no las resuelve por su cuenta (`api-integration.md § Contrato`).
- **D-2.** La columna no tiene navegación sino "Tus intereses" (activos, personas, grupos): plegada no queda como íconos sino como una franja con el botón.
- **D-3.** Recordar la elección en el navegador (`localStorage`), como conveniencia de cada persona.
