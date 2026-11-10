# ¿Se cumple? Sí / No en una tesis — Requirements

> Estado: **aprobado** por el PO el 2026-11-05 ("dale"), con Q4 y Q5 como se recomendaban. Pedido del 2026-11-05: "deberíamos agregar un sistema de sí y no, tipo votación, que cuando sea no invite mediante un CTA al usuario a crear una tesis". Retoma el "¿Estás de acuerdo? BULL / BEAR" del prototipo, que `specs/thesis-detail` dejó fuera porque el contrato no lo tenía.

## Decisiones del PO (2026-11-05)

| #   | Pregunta                 | Decisión                                                                                                                                                                               |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | ¿Y los votos ▲▼?         | **Conviven.** ▲▼ dice si la tesis es buena (ordena el feed, como Reddit); Sí / No dice si la persona cree que se va a cumplir. Se puede votar ▲ una tesis bien argumentada y decir No. |
| Q2  | ¿Qué abre el CTA del No? | **Una contra-tesis precargada:** crear tesis con el mismo activo, y la dirección contraria como punto de partida.                                                                      |
| Q3  | ¿Cuándo se ven los %?    | **Después de votar**, como las encuestas: antes, solo los botones, para que nadie se deje llevar por la mayoría. El autor y quien no tiene sesión los ven siempre.                     |

## User stories

- Como lector, quiero decir con un toque si creo que una tesis se va a cumplir, y ver qué piensa el resto después de decirlo.
- Como lector que no está de acuerdo, quiero que Asinko me invite a apostar lo contrario, para que mi desacuerdo quede en mi track record y no solo en un voto.
- Como autor, quiero ver cuánta gente cree en mi tesis.

## Criterios de aceptación

### La pregunta (Q1)

- [ ] **AG-01** Debajo del claim (PO, 2026-11-06: primero qué tiene que pasar, después la pregunta; antes iba entre el ticket y el claim), una fila: **"¿Estás de acuerdo?"** ("Do you agree?"; PO, 2026-11-09: antes "¿Se cumple?") y dos botones, **Sí** y **No**. En el feed y en la página de la tesis, donde va antes del razonamiento.
- [ ] **AG-02** Solo mientras la tesis está **abierta**. Cerrada (acertada, errada, vencida, disputada, cancelada), la fila muestra el resultado final en solo lectura, si hubo votos; sin votos, no se muestra.
- [ ] **AG-03** Los votos ▲▼ no cambian: siguen en la fila de acciones (Q1).

### Votar (Q3)

- [ ] **AG-04** Al tocar Sí o No, el voto se marca al instante (optimista) y la fila pasa a mostrar el resultado: una barra partida con el % de Sí y de No, y el total ("128 votos"). Si la action falla, vuelve al estado anterior y lo dice debajo, como los votos ▲▼.
- [ ] **AG-05** El voto propio se ve marcado (borde de su color y el ícono relleno), y se puede **cambiar** tocando el otro, o **quitar** tocando el mismo. (Q4)
- [ ] **AG-06** Sí lleva el verde de sube (👍) y No el rojo de baja (👎), siempre con su palabra y su %: el color nunca es la única señal. **Botones grandes, como el Bull / Bear del prototipo** (PO, 2026-11-05): la pregunta centrada y dos botones de 44 px a medio ancho cada uno; votado, cada botón se rellena desde la izquierda con su % y abajo va el total en palabras. El texto va en negro; el color, en el ícono, el borde y el relleno.
- [ ] **AG-07** **El autor** no vota su propia tesis: ve el resultado desde el principio, sin botones.
- [ ] **AG-08** **Sin sesión:** ve el resultado; al tocar Sí o No se abre el modal de cuenta, que vuelve a la misma tesis (`specs/guest-experience` G-04).
- [ ] **AG-09** Un doble toque no manda dos votos: los botones quedan bloqueados mientras la action corre.

### La invitación del No (Q2)

- [ ] **AG-10** Con el voto en **No**, debajo de la barra aparece una invitación que **nombra la apuesta**: **"@maria apuesta a que $BTC supera $150.000 al 1 dic 2026."**, con "Tomá la posición contraria: si acertás, suma a tu precisión." debajo, un ícono de espadas (el choque) y el botón **"Apostá en contra"**, que lleva a crear tesis, pegado al texto. Sin objetivo o sin autor, el título es "¿Creés que se equivoca?". Se ve **mientras el voto siga en No, también en otra visita**; sin ✕: se va al cambiar el voto (PO, 2026-11-09; antes "¿Pensás distinto? Publicá tu tesis" y "Crear tesis", con ✕ y solo en la visita en que se votó).
- [ ] **AG-11** El botón abre `/submit?type=thesis` con **el mismo activo** elegido y la tesis original como referencia: "Respondés a @autor: ↑ $240 al 4 nov 2027". El objetivo sigue decidiendo la dirección (TC-24); el formulario sugiere la contraria ("Si creés que no llega a $240, tu objetivo va por debajo").
- [ ] **AG-12** Al votar Sí no aparece ninguna invitación.
- [ ] **AG-13** Sin activo (una tesis cualitativa vieja), la invitación abre crear tesis vacío.

### Toro y oso (PO, 2026-11-05)

- [ ] **AG-19** La tesis dice si es **alcista** o **bajista** con un toro (sube) o un oso (baja) en el verde o el rojo del objetivo, en el rótulo de la celda OBJETIVO del ticket (`specs/thesis-ticket` TK-05, PO 2026-11-06; antes, un rótulo propio "BULLISH" / "BEARISH"). Una tesis a un precio exacto no lleva animal. Lucide no los trae: se dibujan como átomos propios (`components/ui/stance-marks.tsx`), con el trazo de lucide.

### Calidad

- [ ] **AG-14** Accesible: la pregunta es el nombre del grupo (`role="group"` con `aria-labelledby`), cada botón dice su estado (`aria-pressed`), y el resultado se anuncia al votar (`aria-live="polite"`). Áreas táctiles de 44 px; funciona con teclado.
- [ ] **AG-15** Mobile first: a 360 px, la pregunta arriba y los dos botones a medio ancho; el total y la invitación debajo, a todo el ancho.
- [ ] **AG-16** Textos en en, es y pt.
- [ ] **AG-17** El presupuesto de JS se mantiene (240 KB por ruta, `seo.md`): la fila es una hoja cliente chica; la invitación es Server-rendered o va con la misma hoja.
- [ ] **AG-18** Propuesta al backend en `proposals.md` (P-043) y mock, con `API_MOCKS=true` y `missing`. Con `false`, la fila no se muestra.

## Fuera de alcance

- Que la contra-tesis quede **vinculada** a la original (un "respuestas a esta tesis" en su página). Necesita un campo nuevo en el backend; va en un spec aparte si se quiere.
- Usar los votos Sí / No en la reputación o para resolver tesis. Son una opinión, no un dato del mercado.
- Las reacciones Bullish, Bearish, Interesting y Degen de `overview.md`.
- Notificar al autor de los votos.

## Preguntas resueltas (2026-11-05)

- **Q4. ¿Se puede cambiar o quitar el voto?** **Sí, las dos** (AG-05), mientras la tesis esté abierta. Una opinión cambia con el precio, y bloquearla no le suma nada a nadie (no es la apuesta: esa es la tesis).
- **Q5. Texto de la pregunta.** **"¿Se cumple?"** / "Will it happen?" / "Vai acontecer?". Descartado el "¿Estás de acuerdo?" del prototipo, más ambiguo (¿de acuerdo con el razonamiento o con el resultado?).

## Dependencias

- `specs/thesis-ticket` (el ticket encima de la fila) y `specs/thesis-create` (TC-24: la dirección sale del objetivo).
- Backend: P-043 (votos Sí / No en una tesis). Mientras tanto, mock.
