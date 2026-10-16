# Relacionados en la columna derecha — Requirements

> **Estado:** pedido del PO el 2026-10-16, con una captura de la columna derecha de la página de crear post: "en esta sección podríamos poner un más y que desglosen el resto de comunidades o assets". Decisiones tomadas al escribirlo (D-1 a D-3), a confirmar por el PO.
> **Hoy:** la columna derecha (`specs/submit-page` SU-07) muestra la tarjeta de la comunidad principal y sus reglas. Los relacionados (`specs/related-tags`) solo se ven como píldoras en el editor.

## Criterios de aceptación

- [x] **RA-01** Con relacionados, debajo de la tarjeta de la comunidad y de sus reglas, una tarjeta **"Relacionados (N)"** con un **"+"** que la despliega. Sin relacionados, no aparece.
- [x] **RA-02** (D-1) Arranca plegada: lo principal es dónde se publica y con qué reglas. El "+" gira a "×" al abrirla.
- [x] **RA-03** (D-2) Desplegada, una fila por relacionado: avatar, handle, el nombre (o el del activo) y los miembros. Sin banner ni reglas: el post no se publica ahí.
- [x] **RA-04** Sumar o quitar un relacionado en el editor actualiza la columna, como cambiar la comunidad: los relacionados viajan en la URL (`?community=defi&related=BTC,macro`), así recargar o compartir los conserva, y el editor los recupera como píldoras.
- [x] **RA-05** (D-3) Desplegada o plegada se recuerda mientras se edita (al sumar otro no se cierra).
- [x] **RA-06** Accesibilidad: el "+" es el botón del desplegable con su nombre ("Relacionados (2)") y `aria-expanded`; foco visible; axe sin violaciones en claro y oscuro.
- [x] **RA-07** Textos en en, es y pt.

## Fuera de alcance

- En el teléfono y la tablet no hay columna derecha: los relacionados se ven como píldoras en el editor.
- Links a la página de cada relacionado: sacarían de la página de crear post.
