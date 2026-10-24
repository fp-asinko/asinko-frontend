# La caja de publicar en una fila — Requirements

> **Estado:** implementado el 2026-10-23; ampliado el 2026-10-24 con CR-05 y CR-06 (pedido del PO: Q2, el ícono de barras es Portfolio; Q3, una fila si entra).
> **Antes:** Aprobado por el PO el mismo día: "esto podríamos ponerlo directamente en una row, para salvar espacio, que los botones y publicar queden del lado derecho". Q1: en el teléfono sigue en dos filas, como hoy.
> Cambia el aspecto (y el de su esqueleto de carga, para que nada salte) de la caja de publicar del Home (`ComposerPlaceholder`, H-09 de `specs/home`); lo que hace no cambia.

## Criterios de aceptación

- [x] **CR-01** Desde `sm` (640 px), la caja es una sola fila: el avatar y el texto ("What are you thinking?") a la izquierda; los íconos (link, imagen, tesis, live) y Publicar a la derecha, sin la línea que hoy los separa.
- [x] **CR-02** Por debajo de `sm` queda como hoy: el texto arriba y, debajo de una línea, los íconos y Publicar (Q1). El texto se lee entero a 360 px.
- [x] **CR-03** Cada parte sigue llevando a lo mismo (crear post, en su formato; tesis y live, "Próximamente") y el orden del teclado no cambia: el texto, después los íconos.
- [x] **CR-04** El texto más largo (en portugués, "No que você está pensando?") entra en la fila; si no entrara, se corta con "…" antes que empujar los íconos. Sin scroll horizontal; axe sin violaciones en claro y oscuro.

### Cambio con el PO (2026-10-24)

- [x] **CR-05** Suman tres formatos "Próximamente", como Tesis y Live (opacidad baja, aviso al tocarlos): **Duelo** (dos espadas cruzadas), **Portfolio** (gráfico de barras, Q2) y **Thought** (comillas). Quedan 7 íconos.
- [x] **CR-06** Con 7 íconos, la caja es **una fila solo si entra**: mide su propio ancho (container query) y, si no alcanza para el texto entero, vuelve a las dos filas (tablet, escritorio chico y teléfono). Reemplaza el "desde `sm`" de CR-01 (Q3). En el teléfono los íconos miden 32 px para que entren con Publicar.

## Fuera de alcance

- La página de crear post y su editor.
- Sumar o quitar formatos.
