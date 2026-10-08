# Selector de emojis — Requirements

> **Estado:** aprobado por el PO el 2026-10-08.
> **Fuente:** pedido del PO (2026-10-08): "en la parte de creación de post, podríamos agregar un botón para agregar emojis nativos del sistema".

## Objetivo

Poner emojis en un post o un comentario sin saber el atajo del sistema operativo: un botón abre un panel chico, se busca o se elige, y el emoji queda donde estaba el cursor.

> **Límite técnico:** una página web no puede abrir el selector del sistema (Win + . en Windows, ⌃⌘Espacio en Mac). El panel es propio, pero los emojis son los del sistema: se dibujan con la fuente de emojis de cada dispositivo, no son imágenes.

## User stories

- Como usuario de computadora, quiero agregar un 🚀 o un 📉 sin acordarme del atajo del sistema.
- Como usuario, quiero encontrar un emoji escribiendo su nombre en mi idioma ("fuego", "cohete").
- Como usuario, quiero tener a mano los que uso seguido.

## Criterios de aceptación

### Dónde

- [ ] **EP-01** Un botón con una carita en la fila de abajo del editor de posts (junto a Texto, Link e Imagen) y en las cajas de comentar y responder, con nombre accesible "Agregar emoji".

### El panel

- [ ] **EP-02** Al tocarlo se abre un panel junto al botón: un buscador arriba, los **recientes** y los emojis por **categoría** (caritas, gestos y personas, naturaleza, comida, actividades, viajes, objetos, símbolos), con una fila para saltar entre categorías.
- [ ] **EP-03** Elegir un emoji lo inserta donde está el cursor del campo (o reemplaza lo seleccionado), cierra el panel y devuelve el foco al campo con el cursor después del emoji. Lo escrito no se pierde ni salta.
- [ ] **EP-04** **Buscar por nombre**, sin mayúsculas ni acentos, en el idioma de la página y en inglés ("fuego", "fire" → 🔥). Sin resultados, lo dice.
- [ ] **EP-05** **Recientes:** los últimos 16 elegidos, primero el más reciente, guardados en el navegador. Sin recientes, la sección no aparece.
- [ ] **EP-06** Solo emojis que los sistemas actuales muestran bien (hasta Emoji 13), sin banderas (Windows no las dibuja), con los de finanzas a mano (📈 📉 💰 💸 🚀 🐂 🐻 💎 🔥 ⚠️).

### Interacción y accesibilidad

- [ ] **EP-07** **Teclado:** al abrir, el foco va al buscador; ↓ o Tab pasan a la grilla, las flechas recorren los emojis, Enter o Espacio insertan, Esc cierra y devuelve el foco al campo. Enter en el buscador inserta el primer resultado.
- [ ] **EP-08** El panel es un diálogo con nombre ("Emojis"); cada emoji es un botón con su nombre en el idioma de la página; el lector de pantalla anuncia cuántos resultados hay al buscar. axe sin violaciones, en claro y oscuro.
- [ ] **EP-09** **Mobile first:** a 360 px el panel entra en pantalla (ancho de la pantalla menos márgenes), con áreas táctiles de 40 px por emoji. En el teléfono también funciona, aunque su teclado ya tenga emojis.

### Calidad

- [ ] **EP-10** No suma más de ~1 KB a la primera carga (`seo.md`; quedan 2,3 KB en las páginas de comunidad): el panel, la lista y los nombres se descargan al tocar el botón (o al pasar el mouse, para que abra al instante).
- [ ] **EP-11** Sin librerías nuevas. Nombres de las categorías y textos en en, es y pt.

## Fuera de alcance

- Tonos de piel, emojis compuestos nuevos (Emoji 14+) y banderas.
- Emojis o stickers propios.
- Reacciones con emoji a posts o comentarios.
- Autocompletar con `:nombre:` mientras se escribe.

## Decisiones del PO (2026-10-08)

- **Enfoque:** selector propio y liviano con los emojis del sistema (no solo indicar el atajo, ni una librería).
- **Dónde:** crear post, y comentarios y respuestas.
- **Buscador:** sí, por nombre.
