# Home con movimiento — Requirements

> **Estado:** implementado y cerrado el 2026-10-03. Requisitos aprobados el 2026-10-02.
> Spec de diseño sobre el Home terminado (`specs/home`). Pedido el 2026-10-02: "más vida" en el feed y más interacciones en la columna izquierda.
> **Fuente de verdad:** las transiciones del prototipo (`docs/references/prototype.html`): hovers de 120–150 ms, barras que crecen en 600 ms con `cubic-bezier(0.4, 0, 0.2, 1)`, chevrons de ~200 ms, aparición con fade de 200 ms, punto de "Live" que late. Criterio de las skills `emil-design-eng` y `review-animations`.

## Objetivo

Que el Home responda a lo que hace la persona: cada acción tiene un feedback inmediato y los cambios de estado se ven, sin volverlo lento, sin sumar peso y sin molestar a quien pidió menos movimiento.

## User stories

1. Como **usuario**, quiero que al votar la flecha y el puntaje reaccionen, para sentir que mi voto se registró.
2. Como **usuario**, quiero ver crecer las barras de una encuesta al votar, para entender el resultado de un vistazo.
3. Como **usuario**, quiero que los comentarios y las secciones de la columna se abran y cierren de forma fluida, para no perder el lugar.
4. Como **usuario**, quiero que la columna "Tus intereses" responda al pasar el mouse o tocar, y que marque la comunidad que estoy viendo, para orientarme.
5. Como **usuario que pidió reducir el movimiento** en su sistema, quiero que nada se anime, para usar el sitio sin molestias.

## Criterios de aceptación

### Feed

- [x] **M-01** **Votar**: al votar, la flecha hace un "pop" corto (crece y vuelve, sin partir de 0) y el puntaje cambia con un desplazamiento vertical en la dirección del voto (sube al votar a favor, baja en contra).
- [x] **M-02** **Encuesta**: al revelarse los resultados (después de votar), las barras crecen desde 0 hasta su porcentaje con la curva del prototipo, y los porcentajes aparecen con un fade. Al cargar la página con resultados ya visibles, las barras no se animan.
- [x] **M-03** **Comentarios**: el panel se despliega y se pliega animando la altura; el chevron rota.
- [x] **M-04** **Pestañas y filtros**: el subrayado de la pestaña activa aparece creciendo desde el centro; las píldoras de filtro cambian de fondo con transición.
- [x] **M-05** **Cargar más**: las tarjetas nuevas aparecen con un fade y un leve desplazamiento hacia arriba, escalonadas (las primeras 5).
- [x] **M-06** **Feedback al presionar**: votos, opciones de encuesta, píldoras, pestañas, acciones del composer y botones de la tarjeta se achican levemente al presionarlos.
- [x] **M-07** **Hovers** con transición de fondo y color (120–150 ms, como el prototipo) en todo lo interactivo del feed.
- [x] **M-08** **"Próximamente"**: el globo aparece con fade y un leve desplazamiento desde el botón.
- [x] **M-09** **Imágenes de posts**: aparecen con un fade al terminar de cargar, sin salto (el espacio ya está reservado).
- [x] **M-10** **Live**: el punto rojo de la pestaña _Live_ late, como en el prototipo.

### Columna "Tus intereses"

- [x] **S-01** **Secciones**: plegar y desplegar anima la altura (además del chevron que ya rota). En navegadores que no lo soportan, se pliega sin animación (mejora progresiva).
- [x] **S-02** **Mosaicos de activos**: al pasar el mouse o enfocar, el mosaico se eleva levemente y su borde inferior gana intensidad; al presionar, se hunde.
- [x] **S-03** **Personas, grupos y sugeridas**: filas con hover de fondo y feedback al presionar; el avatar crece levemente al hacer hover.
- [x] **S-04** **Comunidad activa**: cuando el feed está filtrado por una comunidad (`?community=`), su mosaico o su grupo en la columna se marca como seleccionado (`aria-current`) y el cambio se anima.
- [x] **S-05** **Botones de la columna** ("more", "Create group", "+ Join"): hover y feedback al presionar.
- [x] **S-06** **Panel lateral en mobile**: abre y cierra deslizándose (ya lo hace) con la duración y curva de este spec.

### Generales

- [x] **G-01** **Reducir movimiento**: con `prefers-reduced-motion: reduce` no hay desplazamientos, escalas ni latidos; a lo sumo, cambios de opacidad instantáneos o muy cortos.
- [x] **G-02** **Rápido**: ninguna animación de interfaz supera 300 ms, salvo las barras de encuesta (600 ms, del prototipo). Curvas de salida (`ease-out`), nunca `ease-in`.
- [x] **G-03** **Sin peso**: las animaciones son CSS; el JavaScript de primera carga del Home sigue ≤ 230 KB (hoy 221,6 KB). Sin librerías nuevas.
- [x] **G-04** **Sin saltos de layout**: las animaciones usan `transform` y `opacity` (o altura en los desplegables); el CLS no sube.
- [x] **G-05** **Interrumpibles**: si la persona vuelve a tocar en medio de una animación (abrir y cerrar rápido), la animación se revierte desde donde está, sin saltar.
- [x] **G-06** **Accesibilidad intacta**: el foco, los nombres accesibles y los anuncios no cambian; axe sigue sin violaciones.

## Fuera de alcance

- **Smooth scroll** (decidido el 2026-10-02: se mantiene el scroll nativo).
- Animaciones entre páginas (View Transitions) y animaciones con física o gestos (arrastrar).
- Celebraciones (confeti, etc.) y animaciones continuas fuera del punto de _Live_.
- Datos en tiempo real (precios que se actualizan solos).

## Decisiones (aprobadas el 2026-10-02)

| #   | Pregunta                                                    | Decisión                                                       |
| --- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| Q1  | ¿Entra **S-04** (marcar la comunidad activa en la columna)? | **Sí**                                                         |
| Q2  | **M-01**: ¿"pop" de la flecha también al quitar el voto?    | **No**: solo al votar                                          |
| Q3  | **M-05**: ¿escalonar también la primera página del Home?    | **No**: la primera página aparece de una, sin demora para leer |

## Dependencias

- `specs/home` cerrado (T-01 a T-13).
- Skills `emil-design-eng`, `review-animations` y `apple-design` para el criterio y la revisión.
