# Resultados de encuesta en pie 3D — Requirements

> **Estado:** aprobado por el PO el 2026-10-26 ("que los resultados de las polls aparezcan en formato pie chart 3d, para darle más interactividad").
>
> - **Q1:** el pie va **junto a la lista**: el pie a la izquierda y las opciones a la derecha como leyenda; en el teléfono, el pie arriba.
> - **Q2:** las porciones iban en escala de grises; el PO pidió después **colores tenues** (2026-10-26).
> - **Q3:** la interactividad es resaltar al pasar el mouse o tocar, más una animación de entrada.
> - **Q4:** va en la **tarjeta del feed y en el detalle**.
>
> Se trabaja en una rama local, sin push, hasta que el PO lo diga.

## Criterios de aceptación

- [x] **PP-01** Cuando una encuesta muestra resultados (votaste, terminó o los muestra a todos), aparece un **pie 3D**: un disco inclinado con espesor, una porción por opción con votos, proporcional a su porcentaje. Antes de tener resultados no hay pie: se vota con las opciones como hoy.
- [x] **PP-02** Las porciones van en **colores tenues**: los 8 tonos de identidad mezclados con el fondo, uno por puesto (la que gana, el primero). Cada porción tiene el suyo, aunque empate. _Cambio del PO (2026-10-26): primero escala de grises; pidió colores tenues._ Una opción sin votos no tiene porción.
- [x] **PP-03** La lista de opciones es la **leyenda**:
  - cada opción lleva un cuadradito del tono de su porción;
  - mantiene su nombre, los votos, el porcentaje y tu voto (tu foto con ✓);
  - mantiene la barra de fondo que se llena según su porcentaje (PO, 2026-10-26: se probó sin ella y volvió);
  - las opciones van ordenadas de más a menos votos, en la lista y en el pie (PO, 2026-10-26).

  En pantallas medianas o más, el pie va a la izquierda y la lista a la derecha. En el teléfono, el pie va arriba y la lista abajo, sin scroll horizontal a 360 px.

- [x] **PP-04** Al **pasar el mouse** (o tocar) por una porción o por su fila de la lista, esa porción se separa un poco del centro y su fila se resalta. Las demás quedan igual (_PO, 2026-10-26: atenuarlas se veía como una sombra_). Al salir, todo vuelve.
- [x] **PP-05** Al aparecer los resultados (al cargar la encuesta o al votar), el pie **entra con una animación** corta. Con "reducir movimiento" aparece sin animar.
- [x] **PP-06** **Accesibilidad:**
  - el pie es decorativo para el lector de pantalla, que lee la lista igual que hoy;
  - el color nunca es la única señal: cada fila dice su opción y su porcentaje;
  - axe sin violaciones en claro y oscuro.
- [x] **PP-07** En la tarjeta del feed y en el detalle. Presupuesto de JS dentro de 240 KB.

## Fuera de alcance

- Inclinar el pie con el puntero.
- Pie para los resultados escondidos ("Results after voting"): no hay porcentajes que dibujar.
