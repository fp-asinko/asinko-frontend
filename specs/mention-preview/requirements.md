# Vista previa de menciones — Requirements

> **Estado:** aprobado por el PO el 2026-10-08, con las opciones recomendadas en Q1 a Q4.
>
> **Cambio con el PO (2026-10-08, al verla, con una captura de Reddit):** tarjetas más grandes, distintas para grupos y personas, con sombra para separarlas de la página, el botón al lado del nombre (no pegado a la portada) y más datos en columnas.
> **Fuente:** pedido del PO (2026-10-08), con una captura de Reddit: "estaría bueno que tuviesen un hover con un mini detalle del perfil como hace Reddit, lo podríamos poner en los post también". Para grupos (`#`), personas (`@`) y activos (`$`).

## Objetivo

Que pasar el mouse sobre un grupo, una persona o un activo muestre quién o qué es sin salir de la página: una tarjeta chica, como la de Reddit, con lo esencial y la acción de unirse o seguir.

## User stories

- Como usuario, quiero ver de qué se trata un grupo o un activo mencionado sin abrir su página, para decidir si me interesa.
- Como usuario, quiero ver quién escribió un post (su bio, cuántos lo siguen, su precisión) antes de confiar en lo que dice.
- Como usuario, quiero unirme a un grupo o seguir a alguien desde la tarjeta.

## Criterios de aceptación

### Dónde

- [ ] **MP-01** La tarjeta aparece sobre:
  - las **menciones** `$`, `#` y `@` del cuerpo de posts y comentarios (las que son link, P-001);
  - la **cabecera de las tarjetas** del feed y del detalle: el grupo y el autor;
  - el **autor de cada comentario**.
- [ ] **MP-02** Solo en dispositivos con mouse (desde que la pantalla tiene hover). En el teléfono, tocar sigue llevando a la página, como hoy.

### Qué muestra

- [ ] **MP-03** **Grupo:** banner (su imagen o el degradé de su tono) y, debajo, avatar, `#handle` y el nombre si dice algo más, con **Unirse** (o "Unido") al lado; la descripción (hasta 3 líneas) y, bajo una línea, los números en columnas: miembros y, si lo creó una persona, desde cuándo existe.
- [ ] **MP-04** **Activo:** lo mismo que el grupo, con `$SÍMBOLO` y su nombre. Sin precio hasta que exista (P-003).
- [ ] **MP-05** **Persona:** sin banner, con un avatar más grande; el nombre si existe (P-011), `@username`, la insignia y **Seguir** (o "Siguiendo") al lado; la bio (hasta 3 líneas) y, bajo una línea, seguidores, precisión, racha y desde cuándo está en Asinko. Sin botón si es uno mismo.
- [ ] **MP-06** Toda la tarjeta lleva a la página (el handle es el link); el botón de unirse o seguir funciona sin salir, con las mismas reglas que en la página (sin sesión pide cuenta; salir de un grupo pide confirmación).

### Comportamiento

- [ ] **MP-07** Aparece después de una pausa breve con el mouse quieto encima (no al pasar de largo) y se va al sacarlo, con un margen para poder llevar el mouse a la tarjeta y usar el botón.
- [ ] **MP-08** Mientras llegan los datos, un esqueleto con la forma de la tarjeta; si fallan, la tarjeta no aparece (el link sigue funcionando). Una tarjeta ya vista vuelve al instante.
- [ ] **MP-14** Flota sobre la página: borde y la única sombra del sistema (`shadow-float`, en claro y oscuro).
- [ ] **MP-09** Entra en pantalla: se ubica arriba o abajo del link según el lugar, sin tapar el link.
- [ ] **MP-10** **Accesibilidad (WCAG 1.4.13):** se cierra con Esc sin mover el foco, se puede pasar el mouse sobre ella sin que se cierre, y se queda hasta que se saca el mouse. No reemplaza el nombre accesible del link. Ver Q1 para el teclado.

### Calidad

- [ ] **MP-11** No suma más de ~1 KB a la primera carga (`seo.md`; margen hoy: 4,9 KB en las páginas de comunidad): la tarjeta y su lógica se descargan la primera vez que hace falta.
- [ ] **MP-12** El navegador no llama a la API: los datos llegan por Server Actions, con DTOs mínimos (`security.md § 4`).
- [ ] **MP-13** Textos nuevos en en, es y pt; axe sin violaciones con la tarjeta abierta, en claro y oscuro.

## Fuera de alcance

- Precio y variación del activo (P-003).
- Vista previa de posts (al pasar sobre un título).
- Tarjetas en el teléfono (mantener presionado).
- Menciones en el editor mientras se escribe (son texto, no links).

## Dependencias

- `GET /api/v1/communities/:slug` (grupos y activos) y `GET /api/v1/profiles/:identifier` (personas): en el backend, ya los usan las páginas (`specs/community-pages`).
- Las menciones del cuerpo son links solo si el backend las resuelve (P-001): mientras tanto, la tarjeta aparece en la cabecera de las tarjetas y en los autores.
- Unirse y seguir: `JoinButton` y las actions de `specs/community-pages`.

## Decisiones del PO (2026-10-08)

- **Q1. Teclado.** Las reglas piden que nada funcione solo con hover. Propuesta: la tarjeta también aparece al enfocar el link con el teclado (con la misma pausa), y Esc la cierra; su botón no entra en el orden de tabulación, porque la misma acción está en la página a la que lleva el link. **Recomendado.** Alternativa: solo con mouse, como Reddit.
- **Q2. Acción en la tarjeta.** Propuesta: Unirse en grupos y activos, Seguir en personas, como Reddit. **Recomendado.** Alternativa: tarjeta solo informativa (más liviana).
- **Q3. Dónde.** Propuesta: menciones, cabecera de las tarjetas (grupo y autor) y autores de comentarios (MP-01). **Recomendado.** Alternativa: solo menciones.
- **Q4. Pausa.** Propuesta: 500 ms para abrir y 150 ms de margen para cerrar, lo de Reddit. **Recomendado.**
