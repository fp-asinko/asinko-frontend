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
