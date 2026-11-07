# Identidad de la tesis: cómo va, quién apuesta y un ticket de verdad — Requirements

> Estado: **aprobado** por el PO el 2026-11-05 ("dale"), con Q1 a Q3 como se recomendaban. Pedido del 2026-11-05: "¿qué más le mejorarías a la estructura de UX / UI para darle más identidad y que parezca más una tesis?". El PO eligió empezar por la barra de precio (1) y el ticket troquelado con su sello (3), y sumó el historial de quien apuesta (2).

## Por qué

Hoy el ticket dice **la apuesta** (activo, objetivo, convicción y plazo) pero no **cómo va** ni **quién la firma**, y por fuera se parece a cualquier panel gris. Una tesis es lo que distingue a Asinko de Reddit: tiene que leerse como una apuesta abierta, con un final.

## User stories

- Como lector, quiero ver de un vistazo si una tesis va ganando o perdiendo, sin abrirla.
- Como lector, quiero saber si quien apuesta suele acertar, para darle a su tesis el peso que merece.
- Como autor, quiero que mi tesis acertada se vea como un logro, no como una línea de texto.

## Criterios de aceptación

### 1. Cómo va: la barra de precio

- [ ] **TI-01** Debajo de la fila del activo, la convicción y el objetivo, una barra fina de **entrada → hoy → objetivo**. A la izquierda, el precio de entrada; a la derecha, el objetivo con su toro o su oso (`specs/thesis-agree` AG-19); sobre la barra, una marca con el **precio de hoy**.
- [ ] **TI-02** La barra se llena desde la entrada hasta el precio de hoy, en el color de la apuesta: verde si es alcista, rojo si es bajista, como el objetivo y su animal. Con palabras al lado, nunca solo el color: "Hoy $89,21 · tiene que bajar un 12,6 % más" o "4 % por debajo de la entrada", y la entrada y el objetivo en cada extremo (PO, 2026-11-05).
- [ ] **TI-03** **Ya pasó el objetivo** (antes del plazo): la barra llena y "Objetivo alcanzado". La resolución sigue siendo la del backend al plazo; la barra no la adelanta.
- [ ] **TI-04** **Va en contra** (el precio cruzó la entrada para el otro lado): la marca queda en el borde izquierdo con una flecha hacia afuera, y la cifra dice cuánto.
- [ ] **TI-05** **Cerrada:** la barra queda fija en el precio de la resolución, en vez del de hoy. Cancelada, vencida o disputada sin precio: sin barra.
- [ ] **TI-06** **Sin precio de hoy** (el activo no lo tiene, o el backend no lo manda): sin barra, y el ticket queda como hoy. Precio viejo (`priceStale`): la barra se muestra y dice "precio del 3 nov".
- [ ] **TI-07** **Objetivo "a un precio"** (`equals`) o sin precio de entrada: sin barra, solo la distancia al objetivo en palabras.

### 2. Quién apuesta: su historial

- [ ] **TI-08** Ya existe un chip chico de acierto junto al autor en toda tarjeta (`CardByline`, "68%", con el color de su tramo, `specs/feed-cards`). **En una tesis** se dice en palabras: "68 % de aciertos". Es la píldora de la apuesta: quien la firma y cuánto suele acertar. El dato ya está en el contrato (`creator.accuracyRate`, E11).
- [ ] **TI-09** En una tesis, el acierto se muestra solo con **3 tesis resueltas o más** (Q2): con menos, no hay chip. Así un 1 de 1 no dice 100 %. Mientras el backend no mande cuántas tiene (P-045), el chip se muestra como hoy.
- [ ] **TI-10** La píldora no lleva a ningún lado propio: el nombre del autor ya lleva a su perfil, donde está el track record (`specs/profile-track-record`).
- [ ] **TI-11** En la pestaña "Tesis" de un perfil no se muestra (el perfil ya lo dice arriba).

### 3. Un ticket de verdad

- [ ] **TI-12** El ticket se **troquela** entre la apuesta y el plazo: dos muescas semicirculares en los costados y una línea punteada en lugar del borde liso. Solo CSS.
- [ ] **TI-13** Las muescas dejan ver lo que hay detrás del ticket (blanco, o el gris de la tarjeta con el mouse encima): no son círculos pintados del color del fondo.
- [ ] **TI-14** **Cerrada, un sello** inclinado sobre el ticket: **ACERTADA ✓**, **ERRADA ✗**, **CANCELADA**, **VENCIDA** o **EN REVISIÓN**. Acertada y errada, en los tonos de `--thesis-correct` y `--thesis-incorrect`; el resto, en gris. Reemplaza al chip del estado en una tesis cerrada (Q3); el detalle (fecha, precio, motivo) sigue en "Resultado".
- [ ] **TI-15** El sello no tapa números: va en la parte de abajo del ticket, a la derecha. Es decorativo para el lector de pantalla, que ya lee el estado.

### Calidad

- [ ] **TI-16** Accesible: la barra es una imagen con texto (`role="img"` y un nombre como "Precio de hoy $236, entre la entrada $224,72 y el objetivo $270") o, mejor, texto visible que la explique; contraste de 3:1 para la barra y la marca, 4,5:1 para el texto.
- [ ] **TI-17** Mobile first: a 360 px la barra va a todo el ancho del ticket, con la entrada y el objetivo debajo de sus extremos.
- [ ] **TI-18** Sin JS nuevo: la barra, el troquel y el sello son de servidor. Presupuesto de 240 KB por ruta (`seo.md`).
- [ ] **TI-19** Textos en en, es y pt.
- [ ] **TI-20** Propuestas al backend en `proposals.md` y mock (ver Dependencias). Con `API_MOCKS=false` y sin esos campos, el ticket queda como hoy.

## Fuera de alcance

- Un gráfico de precio en el tiempo (velas o línea). La barra dice dónde está, no el recorrido.
- Precios en tiempo real: el precio de hoy es el último que tiene el backend (Twelve Data, `overview.md`).
- La racha y el rating (AAA … D) en la cabecera: con el acierto alcanza para empezar.
- Animar el sello al resolverse una tesis.

## Decisiones del PO (2026-11-05)

| #   | Pregunta                                      | Decisión                                                                                     |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Q1  | ¿Dónde va la barra?                           | **Dentro del ticket**, entre la fila de arriba y el troquel: es parte de la apuesta.         |
| Q2  | ¿Desde cuántas tesis resueltas va el acierto? | **3 o más.** Hace falta `creator.resolvedCount` (P-045).                                     |
| Q3  | ¿El sello reemplaza al chip del estado?       | **Sí**, en una tesis cerrada: se dice una vez. Abierta, el chip "Open" sigue junto al plazo. |

## Dependencias

- `specs/thesis-ticket` (el ticket) y `specs/thesis-agree` (AG-19: el toro y el oso).
- Backend, propuestas nuevas:
  - **P-044:** el precio de hoy del activo en la tesis (`asset.price`, `asset.priceUpdatedAt`, `asset.priceStale`, como en `GET /assets/{symbol}`). Sin eso, el feed tendría que pedir cada activo aparte.
  - **P-045:** `creator.resolvedCount` en la tesis (acertadas + erradas), para TI-09.
- El acierto (`creator.accuracyRate`) ya está en el contrato (E11).
