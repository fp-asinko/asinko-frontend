# Crear una tesis — Requirements

> **Estado:** aprobado por el PO el 2026-11-02 ("si"), con Q1 a Q8 como se recomendaron ("dale").
> **Fuente:** Jira **MVP-137** ("Thesis creation form + validations": activo, dirección, precio objetivo, deadline, claim de 280 caracteres, convicción de 4 niveles y razonamiento) y **MVP-143** ("Wire 'not financial advice' disclaimer into thesis confirmation", con texto provisorio hasta la revisión legal). Visión de producto (`docs/product/overview.md § Tesis`) y el prototipo (`CreateTesisScreen`: una pestaña "Thesis" en Crear, junto a Post).
> **Backend** (`asinko-app` rama `dev`, `9924924`, leído el 2026-11-02): `POST /api/v1/theses` implementado (E11). Pide `userId`, `communityId`, `assetSymbol`, `claim` (≤ 280), `reasoning`, `conviction` (`LOW|MEDIUM|HIGH|EXTREME`), `deadline` (entre 24 h y 5 años desde ahora), `targetPrice`, `targetDirection` (`ABOVE|BELOW|EQUALS`) y `disclaimerAccepted: true`. El precio de referencia lo toma el backend al crear (E14-02, MVP-164). Cualquiera publica en cualquier comunidad, salvo en el canal personal de otro (`PERSONAL_CHANNEL_OWNER_ONLY`).
> **Hoy:** la página de crear (`specs/submit-page`) tiene Thought, Text, Link e Image. Las tesis solo se ven en la pestaña Tesis del perfil (`specs/profile-track-record`). El feed del backend ya manda `kind: THESIS`, pero el front no lo conoce y lo descarta.

## Objetivo

Publicar una tesis, el contenido central de Asinko: una predicción falsable sobre un activo, con fecha límite y precio objetivo, que después queda en el historial público de quien la escribe.

## User stories

- Como usuario, quiero publicar una predicción concreta sobre un activo (sube por encima o baja por debajo de un precio antes de una fecha), para que mi historial muestre si acierto.
- Como usuario, quiero saber antes de publicar que la tesis no se puede editar ni borrar y que no es asesoramiento financiero.
- Como usuario, quiero que el formulario me diga qué falta o qué está mal antes de enviarlo.

## Decisiones (2026-11-02)

| #   | Decisión                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1  | Se crea en una pestaña **"Tesis"** de la página de crear, junto a Thought, Text, Link e Image (como el prototipo).                                                                                                                                                                                                                         |
| Q2  | El claim admite **280** caracteres, como el backend y MVP-137. Se corrige el "140" de `overview.md`.                                                                                                                                                                                                                                       |
| Q3  | Precio objetivo y dirección **obligatorios**, con dos direcciones: **"Por encima de"** y **"Por debajo de"**. "Igual a" (`EQUALS`) no se ofrece: con un precio real es casi imposible de acertar.                                                                                                                                          |
| Q4  | La fecha límite es **solo una fecha**: cierra a las 23:59 de ese día en la zona horaria de quien la escribe. Mínimo, que falten más de 24 h; máximo, 5 años.                                                                                                                                                                               |
| Q5  | Se publica en una comunidad con el **mismo selector de los posts**; al elegir el activo, queda elegida su comunidad (`$NVDA` → la de NVDA), y se puede cambiar.                                                                                                                                                                            |
| Q6  | El disclaimer va en un **paso de confirmación** al tocar "Publicar": el resumen de la tesis, que no se puede editar ni borrar, y el checkbox "No es asesoramiento financiero" (texto provisorio hasta la revisión legal, MVP-143).                                                                                                         |
| Q7  | Al publicar, se va a **tu perfil, pestaña Tesis**, con la nueva primera. Sin aviso aparte: `sonner` no está instalado y nada del sitio muestra toasts; los posts tampoco avisan, llevan a su página (ajustado el 2026-11-02, design.md § 7). La tarjeta en el feed, el detalle, los estados y cancelar van en el spec siguiente (MVP-140). |
| Q8  | ~~**Sin borrador en el backend**~~ (los borradores son de posts). **Desde el 2026-11-02 hay borradores de tesis**, con la propuesta P-038 mockeada (`specs/thesis-drafts`). Lo escrito se guarda en el navegador mientras se edita, como un post (`specs/submit-page` SU-12).                                                              |

## Criterios de aceptación

### El formulario

- [ ] **TC-01** (Q1) La página de crear suma la pestaña **"Tesis"** después de Image. Solo con sesión, como el resto de la página. Queda en la URL (`?type=thesis`): se comparte y recarga.
- [ ] **TC-02** **Activo**: un selector con búsqueda sobre el catálogo de activos soportados (`$` + símbolo, nombre y precio actual cuando lo hay). Solo se elige uno del catálogo, nunca un texto libre. Entrando desde la página de un activo, o con `?community=` de la comunidad de un activo, viene elegido.
- [ ] **TC-03** (Q5) Al elegir el activo queda elegida su comunidad en el selector de comunidad, si quien escribe no eligió otra a mano. Se puede cambiar a cualquier comunidad o al canal personal propio.
- [ ] **TC-04** (Q2) **Claim**: una línea, obligatoria, de hasta **280** caracteres con contador. Ayuda: "Una frase clara que se pueda comprobar".
- [ ] **TC-05** (Q3; ajustado por R1 y R3) **Dirección y precio objetivo**, obligatorios: "Por encima de" o "Por debajo de" y un precio mayor que cero, en la misma unidad que el precio del activo (el contrato no trae la moneda: el campo no muestra un símbolo de moneda). Con el activo elegido, se muestra su precio actual como referencia (con "desactualizado" si `priceStale`) y la diferencia en % con el objetivo. Un objetivo del lado contrario a la dirección (por ejemplo "por encima de" un precio menor al actual) se avisa, pero no se bloquea. **Desde la revisión 2:** la referencia es la tarjeta del activo (TC-22) y la dirección sale del objetivo (TC-24); el aviso de lado contrario ya no hace falta.
- [ ] **TC-06** (Q4) **Fecha límite**, obligatoria, con un selector de fecha. Lo más cerca es el día en que, a las 23:59, falten más de 24 h; lo más lejos, 5 años. Fuera de ese rango, el campo lo dice.
- [ ] **TC-07** (con la forma de TC-25) **Convicción**, obligatoria: cuatro opciones, **Baja, Media, Alta y Extrema** (`LOW` a `EXTREME`), con una ayuda: la convicción pesa en tu calibración, y una errada con convicción extrema pesa más.
- [ ] **TC-08** **Razonamiento**, obligatorio: el argumento detrás del claim, con la misma caja de texto del cuerpo de un post (Markdown, formato y emojis).
- [ ] **TC-09** Mientras falte un campo obligatorio o haya uno inválido, "Publicar" está deshabilitado, igual que en el formulario de posts. Un error (un claim largo, una fecha fuera de rango) aparece en su campo al tocar "Publicar" y se actualiza mientras se corrige, como en los posts (design.md § 3, ajustado el 2026-11-02).
- [ ] **TC-10** (Q8) Lo escrito se guarda en el navegador mientras se edita y vuelve al recargar o al volver a la pestaña, hasta publicar o descartar. "Guardar borrador" no aparece en la pestaña Tesis.

### Confirmar y publicar

- [ ] **TC-11** (Q6) "Publicar" abre una **confirmación** con el resumen: activo, claim, "por encima de / por debajo de" el precio, fecha límite y convicción. Dice que **una tesis publicada no se puede editar ni borrar** y que se resuelve sola a la fecha límite contra el precio de mercado.
- [ ] **TC-12** (Q6, MVP-143) La confirmación tiene el checkbox **"Entiendo que esto no es asesoramiento financiero"** (texto provisorio, marcado `TODO(legal)` hasta la revisión, ítem 42). Sin marcarlo, "Publicar tesis" no envía. "Volver" cierra la confirmación sin perder nada.
- [ ] **TC-13** Al confirmar se manda `POST /theses` con el `userId` de la sesión (nunca del cliente), la comunidad, el símbolo, el claim, el razonamiento, la convicción, la fecha límite (fin del día elegido, en la zona horaria del navegador, como ISO), el precio, la dirección y `disclaimerAccepted: true`. El botón no se puede tocar dos veces mientras se envía.
- [ ] **TC-14** (Q7) Publicada, se borra lo guardado en el navegador y se va a tu perfil en la pestaña **Tesis**, con la nueva primera.
- [ ] **TC-15** **Errores**, cada uno donde corresponde y sin perder lo escrito:
  - `CLAIM_TOO_LONG` → en el claim;
  - `DEADLINE_OUT_OF_RANGE` → en la fecha límite;
  - `ASSET_NOT_FOUND` o `AMBIGUOUS_SYMBOL` → en el activo;
  - `INVALID_COMMUNITY` o `PERSONAL_CHANNEL_OWNER_ONLY` → en la comunidad;
  - `DISCLAIMER_NOT_ACCEPTED` → en el checkbox;
  - `401` → el modal de cuenta, que vuelve a la página;
  - `429` → "Esperá un momento antes de volver a publicar";
  - cualquier otro → un error general con "Reintentar".

### Calidad

- [ ] **TC-16** A 360 px todo entra sin scroll horizontal; la confirmación es un panel desde abajo en el teléfono y una ventana en desktop (patrón Drawer/Dialog). Los campos usan 16 px o más (sin zoom en iOS).
- [ ] **TC-17** Accesibilidad: cada campo con su etiqueta y su error asociado; la convicción y la dirección son grupos de opciones navegables con teclado; la confirmación atrapa el foco, lo devuelve a "Publicar" al cerrar, y el checkbox se lee con su texto. axe sin violaciones en claro y oscuro.
- [ ] **TC-18** Mocks (`API_MOCKS=true`): `POST /theses` con la forma del backend y sus errores, y la tesis creada se suma a `GET /users/{id}/theses` del usuario demo. Con `missing`, va al backend real (la ruta ya existe).
- [ ] **TC-19** El presupuesto de JS se respeta: la pestaña Tesis y la confirmación se cargan diferidas, como el editor (`seo.md`).
- [ ] **TC-20** Textos en en, es y pt.
- [ ] **TC-21** `overview.md § Tesis` dice 280 caracteres (Q2) y que el precio objetivo es obligatorio (Q3).

## Revisión 2: el estilo del prototipo (2026-11-02)

Pedido del PO al ver la primera versión, con una captura del prototipo (`CreateTesisScreen`): "me gusta más como está en el prototipo, usar el gráfico en barras para elegir la convicción y la UI que plantea". Decisiones R1 a R6, las recomendadas ("dale").

- [x] **TC-22** (R1) Debajo del activo, su **tarjeta**: el símbolo y el nombre a la izquierda; a la derecha el precio y la variación del día con flecha y color (verde sube, rojo baja; la flecha y el signo siempre, el color nunca solo). "Desactualizado" si `priceStale`. Debajo, la ayuda "El precio de referencia se toma al publicar". Sin precio (no se pudo leer), la tarjeta muestra solo el símbolo y el nombre.
- [x] **TC-23** (R2) **Fecha límite y objetivo lado a lado** desde `sm`, cada uno con su etiqueta; en el teléfono, uno debajo del otro.
- [x] **TC-24** (R3) **La dirección sale del objetivo**: con el precio actual, un objetivo mayor es "por encima" y uno menor "por debajo", dicho debajo del campo ("Por encima del precio actual · +50 %"). Un objetivo igual al precio actual se marca como error. Sin precio, aparecen las dos píldoras para elegirla, como antes.
- [x] **TC-25** (R4) **Convicción en 4 barras** de alturas crecientes, con el nombre al lado ("Media"). Se elige tocando una barra o con el teclado (un grupo de opciones: flechas, una sola parada de Tab, foco visible). Se llenan hasta la elegida con el color de su nivel, de verde a rojo: Baja verde, Media ámbar, Alta naranja y Extrema roja (`--level-1…4`, PO 2026-11-02). El nombre al lado sigue: el color nunca es la única señal. Sin elegir, el nombre dice "Elige tu convicción".
- [x] **TC-26** (R5) El ejemplo del claim usa el activo y un objetivo de muestra (1,5 veces el precio): "ej.: BTC > 146.145 antes de la fecha límite". Sin activo, el ejemplo genérico.
- [x] **TC-27** (R6) Con la pestaña Tesis, el H1 de la página es **"Publicar tesis"**, con el subtítulo "Tu tesis queda en tu historial. Se resuelve sola en la fecha límite.". Con un post, "Crear post" como hoy.

## Revisión 3: sin scroll en escritorio (2026-11-02)

Pedido del PO con una captura del formulario: "qué mejorarías, como placeholders y diseño; además quiero evitar el scroll". Medido: unos 1.250 px de alto sin activo elegido. Propuesta aprobada ("dale"): llegar a unos 750 px, sin scroll en escritorio desde 1280×800. En el teléfono el scroll sigue, con Publicar fijo abajo.

- [x] **TC-28** La **comunidad** deja de estar arriba: en la fila de las acciones, a la izquierda, "Se publica en" con el selector. Sigue eligiéndose sola con el activo (TC-03) y se puede cambiar.
- [x] **TC-29** **El activo es su tarjeta:** una sola caja que se toca para elegir, del alto y el borde del claim. Vacía dice "Elige un activo"; elegido, el símbolo, el nombre, el precio y la variación del día (TC-22).
- [x] **TC-30** **Las filas:** el activo y el claim, cada uno a todo el ancho, uno debajo del otro; la fecha, con sus atajos en un renglón; el objetivo en su propio renglón, con la dirección al lado; la convicción en su fila, con su ayuda al lado de las barras ("Tu convicción afecta tu calibración. Extrema + errada = penalización mayor."); el razonamiento; "Se publica en" en la fila de Cancelar y Publicar. En el teléfono, uno debajo del otro. (Ajustado con el PO el 2026-11-02, varias vueltas: fecha, objetivo y convicción en tres columnas dejaba los atajos en tres renglones; activo y claim lado a lado no le gustó; la convicción va en su propia fila, con su ayuda.)
- [x] **TC-31** **Las ayudas van a la columna derecha**, en una tarjeta "Cómo funciona una tesis": una frase que se pueda comprobar; la fecha, entre mañana y 5 años, cierra a las 23:59 de tu hora; se resuelve sola contra el precio de mercado; no se edita ni se borra; la convicción pesa en tu calibración; el precio de referencia se toma al publicar. Reemplaza a los consejos de un post y al subtítulo. Bajo los campos quedan solo el contador del claim, la dirección deducida y los errores. Sin columna derecha (teléfono y tablet), la tarjeta va plegada bajo el título, como las reglas de una comunidad.
- [x] **TC-32** El **razonamiento** arranca con dos líneas y crece mientras se escribe.
- [x] **TC-33** **Atajos de fecha:** 1 mes, 3 meses, 6 meses, 1 año y fin de año, como un grupo de opciones; "Otra fecha" se convierte en el calendario en su lugar, en la misma fila, así la fila no crece (PO 2026-11-02). La fecha elegida ("Cierra el 2 feb 2027") va al lado del título "Fecha límite". Un atajo fuera del rango (fin de año a menos de un día) no se ofrece.
- [x] **TC-34** Sin activo, el **objetivo** está deshabilitado y dice "Elige un activo primero".
- [x] **TC-35** El ejemplo del **razonamiento**: "¿Por qué va a pasar? Datos, catalizadores y qué te haría cambiar de idea".
- [x] **TC-36** El formulario entra sin scroll en escritorio a 1280×800 con un activo elegido (lo mide un e2e).

## Fuera de alcance

- La tarjeta de una tesis en el feed y en las páginas de comunidad y activo, aunque el backend ya las mande (`kind: THESIS`). Va en el spec siguiente, con el detalle.
- La página de detalle, los estados (abierta, vencida, acertada, errada, disputada), cancelar, las actualizaciones del autor, los argumentos a favor y en contra y el voto de resolución: MVP-140 y MVP-141.
- Tesis cualitativas (sin activo ni precio): el backend solo crea cuantitativas.
- "Igual a" (`EQUALS`), la hora exacta de la fecha límite y el stake de tokens (fase 4).
- Borradores de tesis en el backend.
- Reacciones Bullish, Bearish, Interesting y Degen.

## Dependencias

- `specs/auth`: hace falta sesión real para publicar contra `dev`.
- `specs/submit-page`: la página, el selector de comunidad, el guardado local y la caja de texto con formato.
- `specs/profile-track-record`: la pestaña Tesis del perfil, a donde se llega al publicar.
- Backend: nada nuevo. Que la tesis se resuelva sola depende del cron real (MVP-139); el bug de cancelar (MVP-166) no afecta a crear.
