# Nombres sin símbolo en las tarjetas y el # chico en los grupos — Requirements

> **Estado:** implementado y cerrado el 2026-10-23. Aprobado por el PO el mismo día, con capturas: "en el feed hay que sacar los # y @, en los grupos el hashtag tiene que aparecer mucho más chico y clarito". Q1: el `$` de los activos **queda como está** en los dos lugares.
> Cambia el aspecto de la cabecera de las tarjetas (`specs/community-first`) y del título de la página de un grupo (`specs/community-pages`). Lo que hace cada link no cambia.

## Criterios de aceptación

- [x] **BH-01** En la cabecera de una tarjeta (feed, grupo, activo, perfil y detalle), el grupo se escribe **sin `#`** (`crypto`) y el autor **sin `@`** (`eth_bull`); también los autores de la vista previa de comentarios de la tarjeta. Un activo sigue como `$BTC` (Q1).
- [x] **BH-02** Los links siguen llevando a la misma página y abriendo la misma tarjeta al pasar el mouse. Su nombre accesible es el texto que se ve.
- [x] **BH-03** En la página de un grupo, el título lleva el `#` **mucho más chico y en gris** (`--muted-foreground`), pegado al nombre. El nombre queda como está. Un activo (`$BTC`) y un perfil no cambian (Q1).
- [x] **BH-04** Las menciones dentro del texto de un post o comentario no cambian: siguen con `#`, `$` y `@`, porque así se escriben.
- [x] **BH-05** A 360 px sin scroll horizontal; axe sin violaciones en claro y oscuro; el contraste del `#` en gris cumple 3:1 (texto grande).

## Fuera de alcance

- La columna izquierda, las sugerencias y las píldoras de relacionadas (siguen con su símbolo).
- El `@` del título de un perfil sin nombre visible.
