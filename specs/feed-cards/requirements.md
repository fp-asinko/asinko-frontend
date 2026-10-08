# Tarjetas del feed con color y vida — Requirements

> **Estado:** aprobado el 2026-10-03, con Q1–Q3 como se proponen. Pedido el 2026-10-03 después de una revisión contra el prototipo: el feed tiene la estructura correcta pero se ve apagado. Indicación del Product Owner: "no escatimar en colores", con animaciones.
> **Fuente de verdad:** `docs/references/prototype.html` (colores medidos en el navegador: resultados de encuesta, badges de rating, panel de comentarios) y el sistema de movimiento de `specs/home-motion`.

## Objetivo

Que cada tarjeta del feed transmita identidad (quién, dónde) y que votar o leer comentarios se sienta como participar en una comunidad viva, sin perder legibilidad ni accesibilidad.

## User stories

1. Como **usuario**, quiero reconocer de un vistazo a cada persona y comunidad por su color, para ubicarme rápido en el feed.
2. Como **usuario**, quiero ver la reputación del autor con un color que la distinga, para saber a quién vale la pena leer.
3. Como **usuario**, quiero que al votar una encuesta los resultados se vean claros y con color, y saber si pienso como la mayoría.
4. Como **usuario**, quiero que los comentarios se vean como una conversación dentro de la tarjeta.
5. Como **usuario que pidió reducir el movimiento**, quiero el mismo color sin animaciones.

## Criterios de aceptación

### Identidad

- [ ] **FC-01** **Avatares de color**: sin foto, cada usuario y cada comunidad muestra sus iniciales sobre un color propio, estable (el mismo en todas las pantallas y sesiones) y elegido de una paleta del sistema. Aplica a posts, encuestas, comentarios y la columna "Tus intereses".
- [ ] **FC-02** **Logo de la encuesta**: la encuesta muestra, a la izquierda de la pregunta, el avatar grande (48 px) de su comunidad, con su color, como el logo de activo del prototipo. Un activo (`$BTC`) muestra su símbolo.
- [ ] **FC-03** **Reputación con color**: el chip de precisión del autor se colorea por tramos (alta, media y baja), con el porcentaje siempre visible: el color nunca es la única señal.

### Encuestas

- [ ] **FC-04** **Resultados con color**: al ver resultados, cada opción tiene su color (cuadrado de leyenda y barra fina), dentro de un recuadro propio como el del prototipo. La opción votada va en negrita y con ✓.
- [ ] **FC-05** **Consenso**: después de votar, un mensaje dice qué porcentaje de la comunidad votó lo mismo y si quedaste con la mayoría, la minoría o en un empate.
- [ ] **FC-06** **Antes de votar**: las opciones se ven como botones claros con un acento de color al pasar el mouse o enfocar.

### Comentarios

- [ ] **FC-07** **Panel como conversación**: el panel de comentarios es un recuadro con esquinas redondeadas y margen dentro de la tarjeta; cada comentario con su avatar de color, el autor en negrita y el texto en el color principal.
- [ ] **FC-08** **"Ver todos los comentarios"** en negrita y en el color principal, como el prototipo (sigue como "Próximamente" hasta el detalle de post).

### Movimiento

- [ ] **FC-09** Las barras de color crecen al revelarse los resultados y el mensaje de consenso aparece después de las barras.
- [ ] **FC-10** Los avatares de los comentarios responden al hover de su fila; el panel de comentarios entra con sus comentarios escalonados. **Cambio con el PO (2026-10-08):** la cabecera de la tarjeta (avatar del grupo y chip de precisión) ya no reacciona al hover.
- [ ] **FC-11** Todo respeta "reducir movimiento" y los tokens de `specs/home-motion` (≤ 300 ms salvo las barras).

### Generales

- [ ] **FC-12** **Contraste**: todo color nuevo con texto cumple WCAG AA (4,5:1 texto, 3:1 elementos gráficos) en tema claro **y** oscuro; lo verifica el test de contraste existente.
- [ ] **FC-13** **Colores con significado**: la paleta de encuestas y avatares no usa el verde y el rojo de sube/baja (`--bullish`, `--bearish`), para no confundirlos con variaciones de precio.
- [ ] **FC-14** **Sin peso**: colores y animaciones en CSS y en el servidor; el JavaScript del Home sigue ≤ 230 KB.

## Fuera de alcance

- Fotos de perfil y logos reales de activos (no existen en los datos; E14 y la subida de imágenes son otros specs).
- Rating AAA–D (fase 2): se usa la precisión por tramos mientras tanto.
- Puntaje y votos (▲▼) de las encuestas: el contrato no los tiene.
- Detalle de post y comentarios completos (spec `post-detail`).

## Preguntas abiertas

| #   | Pregunta                                             | Propuesta                                                               |
| --- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| Q1  | Tramos de precisión (FC-03)                          | Alta ≥ 70 %, media 50–69 %, baja < 50 %                                 |
| Q2  | Mensaje de consenso (FC-05) cuando hay pocos votos   | Mostrarlo desde 10 votos; antes, solo los resultados                    |
| Q3  | ¿El color del avatar sale del usuario o lo elige él? | Del usuario (estable, calculado); elegirlo llega con el perfil (fase 2) |

## Dependencias

- `specs/home` y `specs/home-motion` cerrados.
- Agentes de diseño para la paleta y las animaciones (skills `apple-design`, `emil-design-eng`, `find-animation-opportunities`, `review-animations`).

## Revisión 1 — Encuestas como el prototipo (2026-10-03)

> **Estado:** aprobado el 2026-10-05 con R1-Q1 a R1-Q3 como se proponen. Pedido del Product Owner después de ver las encuestas con datos reales: colores muy fuertes, filas muy altas, consenso poco visible y botones de antes de votar que no convencen. Reemplaza FC-04 y FC-06, mueve FC-05 y deja sin efecto D-C1 y D-C2 (`design.md § 12`). Medidas tomadas del prototipo en el navegador, a 1280 y a 360 px.

- [x] **FC-15** **Resultados compactos:** una fila por opción, con cuadrado de color, etiqueta, barra en el medio y porcentaje. Todo va dentro de un recuadro con fondo degradado y una línea fina de colores arriba. A 360 px la barra se achica y la etiqueta nunca se corta.
- [x] **FC-16** **Color con jerarquía:** las opciones van en tono suave, con texto secundario. La tuya, si votaste, va en color pleno, negrita y texto principal. Sin voto propio, todas quedan suaves.
- [x] **FC-17** **Consenso arriba:** si votaste, un banner encabeza el recuadro. Tiene un título grande ("50% of the community thinks like you") y un subtítulo según el tramo: mayoría, minoría o empate.
- [x] **FC-18** **Antes de votar** (resultados ocultos): botones limpios a lo ancho, con borde y esquinas redondeadas, sin marcador ni color. Al pasar el mouse cambian de fondo; con foco, muestran anillo.
- [x] **FC-19** **Logo:** el de la encuesta es un cuadrado de esquinas redondeadas, como el del activo en el prototipo, no un círculo.

| #     | Pregunta                                                                                             | Propuesta                                                                                                                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1-Q1 | Las encuestas reales tienen 9 votos y el consenso pide 10 (Q2): hoy nunca se ve. ¿Bajamos el mínimo? | **5 votos.** Con menos, "el 100 % piensa como vos" no dice nada                                                                                                                                                               |
| R1-Q2 | Subtítulos del banner (el prototipo solo tiene el de mayoría)                                        | Mayoría: "You are with the majority. Is the consensus right?" · Minoría: "You are in the minority. Early, or wrong?" · Empate: "The community is split down the middle." Título: "{percent} of the community thinks like you" |
| R1-Q3 | Encuesta con resultados visibles sin haber votado (visibilidad `ALWAYS`, o una visita sin cuenta)    | Se ven las filas de resultados, todas en tono suave. Si se puede votar, cada fila es el botón para votar. Los botones limpios de FC-18 quedan solo para cuando los resultados están ocultos                                   |

## Revisión 2 — Encuestas minimalistas (2026-10-05)

> **Estado:** aprobado el 2026-10-05 por el Product Owner, con sus respuestas sobre el consenso y el voto propio: "Menos es más". Los colores por opción no convencen. La referencia son los botones limpios del prototipo, y los resultados van dentro de la misma caja, rellenando el fondo según el porcentaje. Reemplaza FC-15, FC-16 y FC-17 (`design.md § 13`).

- [x] **FC-20** **Una sola forma:** antes y después de votar, cada opción es la caja limpia de FC-18. Con resultados, el fondo de la caja se rellena de izquierda a derecha según el porcentaje: etiqueta a la izquierda, porcentaje a la derecha. Sin colores por opción, sin cuadrados, sin barras aparte, sin línea de colores y sin recuadro exterior.
- [x] **FC-21** **La que gana, resaltada:** la opción con más votos (o las que empatan arriba) lleva el relleno pleno y el texto en negrita. Las demás tienen el mismo relleno con menos opacidad y el texto secundario.
- [x] **FC-22** **Tu voto:** un ✓ junto a la etiqueta de la opción que votaste, gane o no; para lectores de pantalla, "(your vote)".
- [x] **FC-23** **Consenso en una línea:** debajo de las opciones, en gris y sin caja ni color: "49% of the community thinks like you" (mínimo de 5 votos, R1-Q1).

## Revisión 4 — Votos, tu avatar y nota con invitación a comentar (2026-10-05)

> **Estado:** aprobado por el PO el 2026-10-05.
> **Pedido del PO**, con capturas de Reddit y del prototipo: "agregar tu logo en lo que votes y a la derecha la cantidad de votos, arriba dejar alguna nota como hace el prototipo, con una invitación a que me comentes".
> **Decisiones con el PO:**
>
> - Votos y porcentaje chico.
> - Nota con un botón que abre los comentarios.
> - La nota reemplaza a la línea de consenso y solo aparece después de votar.

- [x] **FC-24** **Tu avatar en tu voto:** la opción que votaste lleva tu avatar (20 px, iniciales sobre tu color de identidad, igual que el composer) en lugar del ✓, con el mismo "pop" al votar. Para lectores de pantalla sigue diciendo "(your vote)".
- [x] **FC-25** **Votos a la derecha:** con resultados, cada opción muestra la cantidad de votos en el color del texto de la opción y, al lado, el porcentaje más chico y en gris. Si el backend da el porcentaje pero no la cantidad, solo el porcentaje.
- [x] **FC-26** **Nota arriba de las opciones:** después de votar (con resultados y al menos 5 votos, R1-Q1), una caja arriba de las opciones dice cuántos piensan como vos y hace una pregunta según el caso:
  - **minoría**: "19% share your view. The other 81% bet differently. What are they seeing that you are not?";
  - **mayoría**: "63% share your view. You are with the majority. What could the other 37% be seeing?";
  - **empate**: "50% share your view. It is a tie. What tips the balance?"
- [x] **FC-27** **Invitación a comentar:** la nota lleva el botón "Tell us why", que despliega los comentarios de la encuesta (el mismo panel del 💬). Cuando exista crear comentarios, ese botón abre la caja para escribir.
- [x] **FC-28** **Sin saltos:** la nota entra desplegándose (alto animado, como los comentarios) después del relleno, así las opciones bajan de a poco. Para un voto anterior está desde el principio, sin animación. La línea gris de consenso de FC-23 se va.
