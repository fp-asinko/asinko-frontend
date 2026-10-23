# Comentar desde la tarjeta — Requirements

> **Estado:** implementado y cerrado el 2026-10-23. Aprobado por el PO el mismo día: "hoy no me deja comentar rápidamente en un post en el Home; es importante para no perder experiencia de usuario". Q1: la caja va **abajo de la vista previa** de comentarios. Q2: lo mandado **aparece ahí, primero**, y se sigue en el Home.

## Objetivo

Comentar un post o una encuesta desde su tarjeta, sin ir al detalle.

## Criterios de aceptación

- [x] **CC-01** Al abrir 💬 en una tarjeta (post o encuesta, en el Home, un grupo, un activo o un perfil), debajo de los comentarios de la vista previa aparece la caja **"Join the conversation"**, la misma píldora del detalle: se abre al enfocarla, con Cancelar y Comentar, emojis y sugerencias de `$ # @` (Q1). Con la vista previa vacía, la caja también está.
- [x] **CC-02** Al mandar, el comentario aparece **al instante arriba de la vista previa** de esa tarjeta, la caja se vacía y la página no se mueve: ni se recarga el feed ni cambia su orden (Q2).
- [x] **CC-03** El número de comentarios de la tarjeta **sube** con cada comentario mandado.
- [x] **CC-04** Si falla, el texto vuelve a la caja con el motivo, como en el detalle. Sin sesión, tocar la caja pide una cuenta (`specs/guest-experience`).
- [x] **CC-05** El `userId` sale de la sesión en el servidor. El texto se valida con zod antes de mandarlo (`security.md § 5`).
- [x] **CC-06** Accesible: la caja tiene su nombre, lo mandado se anuncia ("Comment sent"), funciona con teclado y el foco queda en la caja. A 360 px sin scroll horizontal; axe sin violaciones en claro y oscuro.
- [x] **CC-07** No suma JavaScript a la primera carga: la caja llega con la vista previa, al abrir 💬 (`seo.md`).

## Fuera de alcance

- Responder a un comentario desde la tarjeta (se hace en el detalle).
- Editar o borrar desde la tarjeta.
