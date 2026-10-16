# Etiquetar comunidades y activos al publicar — Requirements

> **Estado:** aprobado por el PO el 2026-10-16. Q1: etiquetar (no publicar en varias), enviado como menciones. Q2: hasta 3.
> **Fuente:** pedido del PO (2026-10-16), sobre la página de crear post (`specs/submit-page`): "ahora hay que poder arrobar más comunidades o assets, debería haber un más al lado de la comunidad seleccionada".
> **Hoy:** un post va a una comunidad (`communityId`, E03). Las menciones `$ # @` del cuerpo ya se resuelven en el backend (P-001, `entities`): se ven como links y notifican. El 2026-10-13 el backend decidió que una mención **no** suma el post al feed de lo mencionado.

## Objetivo

Decir de qué más habla un post (un post en `#argentina` sobre `$GGAL` y `#macro`) sin escribir las menciones a mano.

## User stories

- Como usuario, quiero sumar con un "+" los activos o grupos de los que habla mi post, junto a la comunidad donde lo publico.

## Criterios de aceptación

- [x] **RT-01** Al lado de la comunidad elegida, un botón **"+"** abre el mismo selector (con sus chips y la búsqueda, `specs/picker-filters`) para sumar una comunidad o un activo **relacionado**. Solo aparece con una comunidad elegida.
- [x] **RT-02** (Q2) Hasta **3** relacionados. Cada uno es una píldora con su handle y una × para quitarlo. Con 3, el "+" desaparece.
- [x] **RT-03** El selector del "+" no ofrece "Tu perfil", la comunidad principal ni los ya sumados.
- [x] **RT-04** (Q1) Al publicar, los relacionados se agregan **al final del cuerpo como menciones**, en una línea propia (`$GGAL #macro`). El backend las resuelve como cualquier mención: se ven como links en el post y notifican. El post se publica en la comunidad principal; no aparece en el feed de los relacionados (decisión del backend del 2026-10-13; se propone en P-018).
- [x] **RT-05** Cambiar la comunidad principal conserva los relacionados, salvo el que pase a ser la principal, que se quita.
- [x] **RT-06** El borrador local (`specs/submit-page` SU-12) también guarda los relacionados.
- [x] **RT-07** Accesibilidad: el "+" tiene nombre ("Sumar comunidad o activo relacionado"); cada × dice qué quita ("Quitar $GGAL"); al quitar uno, el foco vuelve al "+" (o al anterior). Áreas táctiles de 24 px o más; a 360 px la fila pasa a la línea de abajo sin scroll horizontal; axe sin violaciones en claro y oscuro.
- [x] **RT-08** Textos en en, es y pt.

## Fuera de alcance

- Publicar el mismo post en varias comunidades (crosspost).
- Que el post aparezca en el feed de los relacionados: depende del backend (P-018).
- Etiquetar personas (`@`): para eso están las menciones en el cuerpo.
