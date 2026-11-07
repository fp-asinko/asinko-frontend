# El gráfico de la tesis — Requirements

> Estado: **aprobado** por el PO el 2026-11-05 ("dale"), con Q1 a Q4 respondidas. Pedido del 2026-11-05: "en el detalle, que arriba de la card de thesis aparezca con una animación un gráfico de dónde empezó y a dónde apunta, imitando un movimiento de finanzas". Amplía la barra de `specs/thesis-identity` (TI-01) con el recorrido completo.

## User stories

- Como lector, quiero ver en la página de una tesis cómo se movió el precio desde que se publicó, y a dónde tiene que llegar, para entender la apuesta de un vistazo.
- Como autor, quiero que mi tesis se vea como una apuesta financiera real, con su gráfico.

## Criterios de aceptación

### El gráfico

- [ ] **CH-01** Solo en **la página de la tesis**, entre la cabecera de su tarjeta (Atrás y el autor) y el ticket (Q3). En el feed sigue la barra (`specs/thesis-identity`).
- [ ] **CH-02** Una línea del precio desde **la publicación hasta hoy**. A la derecha, el espacio que falta **hasta el plazo**, con una línea punteada desde el precio de hoy hasta el **objetivo en el plazo**: "a dónde apunta" (Q2).
- [ ] **CH-03** Dos líneas horizontales con su rótulo: la **entrada** (gris) y el **objetivo** (en el color de la apuesta, con su toro o su oso, `specs/thesis-agree` AG-19). El precio de hoy, como un punto al final de la línea, con su valor.
- [ ] **CH-04** La línea va en el color de la apuesta si el precio está del lado del objetivo respecto de la entrada, y en gris si va en contra. El área bajo la línea, con un degradé suave del mismo color.
- [ ] **CH-05** **Cerrada:** la línea llega hasta el plazo (o hasta la cancelación) y termina en el precio de la resolución, sin línea punteada. El sello de `specs/thesis-identity` sigue en el ticket.
- [ ] **CH-06** **Sin historial** (el backend no lo tiene, o el activo no tiene datos de mercado): no hay gráfico, y la página queda como hoy. Con pocos puntos (menos de 2), lo mismo.
- [ ] **CH-07** Sin activo, o con un objetivo "a un precio" (`equals`): sin la punteada al objetivo; solo la línea y la entrada. Sin activo, sin gráfico.

### La animación (Q1)

- [ ] **CH-08** Al entrar a la página, la línea **se dibuja de izquierda a derecha**, como un gráfico en vivo. Después aparecen el punto de hoy (con un pulso que se repite una vez) y la punteada al objetivo.
- [ ] **CH-09** Solo `transform`, `opacity` y `clip-path` (`design-system.md § Movimiento`, skill `animate`): la línea se destapa con un `clip-path`, no animando el trazo ni con una máscara de SVG (2026-11-06: se trababa).
- [ ] **CH-10** Con `prefers-reduced-motion`, el gráfico aparece entero, sin dibujarse.

### Calidad

- [ ] **CH-11** Accesible: el gráfico es una imagen con su descripción (`role="img"` y un nombre como "Precio de BTC desde el 13 oct: de $83.584 a $91.000 hoy; el objetivo, $150.000 al 1 dic"). Contraste de 3:1 para las líneas y los rótulos grandes, 4,5:1 para el texto chico.
- [ ] **CH-12** Mobile first: a 360 px, el gráfico va a todo el ancho y mide unos 160 px de alto; en desktop, unos 220 px. Sin scroll horizontal.

### Recorrerlo (Q4)

- [ ] **CH-16** Con el mouse o el dedo sobre el gráfico, una línea vertical y un punto siguen al día más cercano, con un globo que dice **la fecha y el precio** de ese día, y cuánto estaba de la entrada ("13 oct · $86.200 · +3,1 % desde la entrada"). Al salir, vuelve a mostrar hoy.
- [ ] **CH-17** **Con teclado:** el gráfico se enfoca con Tab y se recorre con ← → (un día), Inicio y Fin. El lector de pantalla lee la fecha y el precio de cada día (`role="slider"` con `aria-valuetext`).
- [ ] **CH-18** En pantallas táctiles, arrastrar de costado recorre el gráfico y arrastrar hacia arriba o abajo sigue haciendo scroll de la página.
- [ ] **CH-19** Lo interactivo es una hoja cliente chica, encima del SVG de servidor: sin ella (antes de cargar), el gráfico se ve igual.

### Como un broker (PO, 2026-11-06)

- [ ] **CH-20** **Eje de precios a la derecha**, fuera del dibujo: tres o cuatro precios redondos con una grilla tenue, y como etiquetas el precio de **hoy** (rellena, en el color de la línea), el del **objetivo** (con borde, en el color de la apuesta) y el de la **entrada** (con borde gris). Nada se dice dos veces ni se pisa: un precio redondo cerca de una etiqueta no se muestra, y la de hoy gana sobre las otras. Sobre las líneas quedan solo las palabras ("Entrada", "🐂 Objetivo"), sin precio.
- [ ] **CH-21** **Cabecera**, como en Robinhood: el precio grande (24 px) y su cambio desde la entrada en verde o rojo ("+56,7 % desde la entrada · Hoy"). Al recorrer el gráfico, muestra el punto que se toca, con su fecha. Reemplaza a la lectura chica de arriba a la izquierda.
- [ ] **CH-22** Mientras la tesis está abierta, el punto de hoy **pulsa** todo el tiempo, "en vivo". Cerrada, no.

### Calidad (cont.)

- [ ] **CH-13** Sin librerías de gráficos: un SVG propio, dibujado en el servidor (como el pie de las encuestas), y la hoja cliente de CH-19. Presupuesto de 240 KB (`seo.md`): la página de la tesis tenía 231,4 KB.
- [ ] **CH-14** Textos en en, es y pt.
- [ ] **CH-15** Propuesta al backend en `proposals.md` (P-046) y mock. Con `API_MOCKS=false` y sin el endpoint, no hay gráfico.

## Fuera de alcance

- Velas, volumen, indicadores o elegir el rango.
- El gráfico en el feed o en el perfil.

## Decisiones del PO (2026-11-05)

| #   | Pregunta                   | Decisión                                                                                                                                                                                              |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | ¿Cuánto dura la animación? | **1,2 s** la línea y **300 ms** el punto de hoy y la punteada: segunda excepción a los 300 ms de `design-system.md`, una vez al entrar. El 2026-11-06 pidió más tiempo: **1,6 s**, a ritmo constante. |
| Q2  | ¿Qué rango?                | **De la publicación al plazo**, con la punteada de hoy al objetivo.                                                                                                                                   |
| Q3  | ¿Dónde?                    | **Arriba de toda la tarjeta**, antes de la cabecera. Corregido el 2026-11-06: **debajo de la cabecera** (Atrás y el autor van arriba de todo) y antes del ticket.                                     |
| Q4  | ¿Interactivo?              | **Sí, en esta spec** (CH-16 a CH-19).                                                                                                                                                                 |

## Dependencias

- `specs/thesis-identity` (la barra, el toro y el oso, el sello) y `specs/thesis-detail` (la página).
- Backend: **P-046**, el historial de precios de un activo entre dos fechas (`GET /api/v1/assets/{symbol}/prices?from=&to=`), con hasta unos 200 puntos: cada hora mientras entren, si no, más espaciados. Hoy el contrato no tiene historial (E14). Mientras tanto, mock, con la volatilidad del activo (las cripto un 3,5 % por día, el resto un 1,5 %).
