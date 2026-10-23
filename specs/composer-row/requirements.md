# La caja de publicar en una fila — Requirements

> **Estado:** implementado y cerrado el 2026-10-23. Aprobado por el PO el mismo día: "esto podríamos ponerlo directamente en una row, para salvar espacio, que los botones y publicar queden del lado derecho". Q1: en el teléfono sigue en dos filas, como hoy.
> Cambia el aspecto (y el de su esqueleto de carga, para que nada salte) de la caja de publicar del Home (`ComposerPlaceholder`, H-09 de `specs/home`); lo que hace no cambia.

## Criterios de aceptación

- [x] **CR-01** Desde `sm` (640 px), la caja es una sola fila: el avatar y el texto ("What are you thinking?") a la izquierda; los íconos (link, imagen, tesis, live) y Publicar a la derecha, sin la línea que hoy los separa.
- [x] **CR-02** Por debajo de `sm` queda como hoy: el texto arriba y, debajo de una línea, los íconos y Publicar (Q1). El texto se lee entero a 360 px.
- [x] **CR-03** Cada parte sigue llevando a lo mismo (crear post, en su formato; tesis y live, "Próximamente") y el orden del teclado no cambia: el texto, después los íconos.
- [x] **CR-04** El texto más largo (en portugués, "No que você está pensando?") entra en la fila; si no entrara, se corta con "…" antes que empujar los íconos. Sin scroll horizontal; axe sin violaciones en claro y oscuro.

## Fuera de alcance

- La página de crear post y su editor.
- Sumar o quitar formatos.
