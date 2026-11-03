# Formulario de crear post, como Reddit — Requirements

> **Estado:** pedido del PO el 2026-10-18, con capturas del editor actual y del "Publicar" de Reddit: "en Reddit se entiende mucho mejor y está mejor espaciado el estilo, también se entiende mejor dónde va el título y el texto; el nuestro no es tan entendible". Cambia el aspecto del formulario de `specs/submit-page`; lo que hace no cambia.
> **Hoy:** el título y el cuerpo no tienen caja (estilo X, para la caja del Home que ya no existe); los formatos van abajo, como íconos, junto a Publicar; el contador del título aparece recién a los 250 caracteres.

## Criterios de aceptación

- [x] **SF-01** El **selector de comunidad** es una píldora con borde, más grande, como el "Seleccionar comunidad" de Reddit; los relacionados y el "+" siguen a su lado.
- [x] **SF-02** Los **formatos** (Texto, Link, Imagen) van **arriba**, debajo de la comunidad, como pestañas con su nombre y una línea bajo la elegida.
- [x] **SF-03** El **título** va en su propia caja con borde redondeado y alto cómodo, con "Título \*" como texto de ejemplo, y debajo, a la derecha, su contador siempre visible (`0/300`).
- [x] **SF-04** El **cuerpo** va en otra caja: arriba, adentro, Escribir / Vista previa a la izquierda y la barra de formato con los emojis a la derecha; debajo, el texto. "Admite Markdown" va debajo de la caja.
- [x] **SF-05** El link (formato Link) y la descripción de la imagen van en cajas como la del título.
- [x] **SF-06** Abajo, a la derecha, solo **Cancelar** y **Publicar**. En el teléfono siguen fijos sobre la barra inferior (`specs/submit-tools` ST-07).
- [x] **SF-07** Más aire entre las partes (16 px), y el borde de una caja se oscurece al escribir en ella.
- [x] **SF-08** 360 px sin scroll horizontal, axe sin violaciones en claro y oscuro, y el resto como estaba: borrador, vista previa, menciones, imagen, atajos, errores por campo.

## Fuera de alcance

- "Añadir marcas" y "Guardar borrador" de Reddit: el contrato no tiene etiquetas ni borradores en el servidor (el borrador es local, `specs/submit-page` SU-12).
- Encuesta como formato (fase 2).

## Cómo se hizo

- `PostEditor`: los formatos (`TabsList variant="line"`) pasan arriba; el título, el link y la descripción de la imagen, en cajas (`FIELD_BOX`); el contador del título, siempre; abajo, solo Cancelar y Publicar. `BodyTabs` dibuja la caja del cuerpo, con sus pestañas, la barra de formato y los emojis adentro, arriba. `CommunityPicker`: la variante `chip` con borde y 40 px de alto.
- Cubierto por los tests del editor (`post-editor.test.tsx`, `body-tabs.test.tsx`) y los e2e de `submit-page.spec.ts`, sin cambios de roles ni de nombres.

## Revisión 2: la comunidad abajo, como la tesis (2026-11-02)

Pedido del PO después de la revisión 3 de `specs/thesis-create`: "creo que deberíamos poner lo de comunidad abajo en el resto de opciones como hicimos en thesis". Aprobado con lo propuesto ("si").

- [x] **SF-09** La **comunidad y sus relacionadas** dejan de estar arriba: en la fila de las acciones, a la izquierda, "Se publica en" con el selector, los relacionados y el "+". Cambia SF-01 (la píldora sigue igual) y SF-02 (los formatos quedan arriba de todo).
- [x] **SF-10** **Borradores** (`specs/drafts-tags` DT-02) pasa al final de la fila de los formatos, a la derecha. En el teléfono, solo el ícono (el nombre queda para el lector de pantalla): con la palabra, la quinta pestaña quedaba debajo a 360px (PO 2026-11-03).
- [x] **SF-11** **"Añadir etiqueta"** va en la fila de abajo, después de la comunidad y sus relacionados ("Se publica en #macro · + · Añadir etiqueta"), y aparece cuando hay comunidad: la etiqueta es de esa comunidad (`specs/drafts-tags` DT-07). Ajustado con el PO el 2026-11-02: bajo el título, y sin comunidad, parecía que no estaba.
- [x] **SF-12** El foco entra siempre en el título (o en el texto de un thought): la comunidad ya no está arriba (cambia `specs/submit-page` SU-09).
- [x] **SF-13** Debajo de "Se publica en", una línea gris dice si también se ve en el perfil: con un grupo, "También en tu perfil" (el perfil lista todo lo que la persona publica, `GET /users/{id}/content`); con su canal, "Solo en tu perfil". Igual en posts y tesis. Pedido del PO el 2026-11-02.
- [x] **SF-14** El final del post en dos bloques (PO 2026-11-02: estaba todo mezclado): arriba, a la izquierda, "Se publica en" con la comunidad y sus relacionados, debajo la línea del perfil (SF-13) y debajo "Añadir etiqueta"; después una línea divisoria y, solos a la derecha, Cancelar, Guardar borrador y Publicar. En el teléfono solo los botones quedan fijos sobre la barra inferior. La tesis, sin etiqueta ni relacionados, sigue en una fila desde md ("Se publica en", la línea del perfil al lado y los botones): así Publicar entra en 1280×800 (`specs/thesis-create` TC-36). En el teléfono, igual que el post: solo los botones quedan fijos.
