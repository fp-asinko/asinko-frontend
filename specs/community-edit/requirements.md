# Editar un grupo — Requirements

> **Estado:** aprobado por el PO el 2026-11-07: Q1, botón propio en la cabecera del grupo; Q2, el handle no se edita; Q3, los cuatro pasos.
> **Fuente:** al terminar `specs/community-create`, el PO pidió un checklist de "primeros pasos" para el grupo nuevo (2026-11-07). Sus pasos (foto, descripción, reglas) no tienen dónde hacerse sin poder editar el grupo, así que el checklist va acá.
> **Backend:** `PATCH /api/v1/communities/{slug}` (E02), ya en el contrato: para `MODERATOR` y `PRINCIPAL_MODERATOR`, edita `name`, `description`, `avatarUrl`, `bannerUrl`, `mainUrl` y `rules`. El `slug` solo lo cambia el `PRINCIPAL_MODERATOR`, una vez cada dos años, y el viejo queda reservado un año.

## Objetivo

Que quien modera un grupo pueda mantener su presentación (foto, banner, nombre, descripción, reglas y sitio web) desde la página del grupo. Y que quien acaba de crear uno sepa qué le falta para que se vea completo.

## User stories

- Como moderador, quiero cambiar la foto, el banner y la descripción de mi grupo, para que se entienda de qué se trata.
- Como moderador, quiero actualizar las reglas cuando el grupo crece.
- Como creador de un grupo nuevo, quiero ver qué le falta, para dejarlo listo antes de invitar gente.

## Criterios de aceptación

### Editar

- [ ] **CE-01** En la página de un grupo que moderás (`MODERATOR` o `PRINCIPAL_MODERATOR`), un botón **"Edit group"** en la cabecera, junto a "Edit widgets" (Q1). Quien no modera no lo ve. El backend igual es quien decide.
- [ ] **CE-02** Abre una ventana **"Edit group"**, como "Editar perfil", a pantalla completa en el teléfono. Tiene lo que el grupo ya tiene, con los mismos campos y límites que crear un grupo (`specs/community-create` CG-03):
  - foto y banner, con el mismo recorte;
  - nombre;
  - descripción;
  - reglas;
  - sitio web.

  El handle se ve pero no se edita (Q2).

- [ ] **CE-03** **Guardar** manda solo lo que cambió y cierra. La página muestra los cambios sin recargar, y un toast dice "Changes saved". Mientras guarda, el botón dice "Saving…" y no se puede tocar dos veces. Las imágenes se suben al guardar, no al recortar.
- [ ] **CE-04** **Cancelar**, Esc o cerrar con cambios piden confirmación. Si el backend falla, el error se muestra en la ventana y lo escrito queda.
- [ ] **CE-05** Un campo vacío borra lo que había (descripción, reglas, sitio web). La foto y el banner se pueden quitar: el grupo vuelve al color de su handle.
- [ ] **CE-06** La Server Action valida con el mismo esquema que crear un grupo, toma el `userId` de la sesión y devuelve los errores del backend en su campo: `403 NOT_MODERATOR` como "Only its moderators can edit this group", y `422` en el campo que corresponda.

### Primeros pasos

- [ ] **CE-07** En la página de un grupo que moderás, mientras le falte algo, una tarjeta **"Get your group started"** con sus pasos (Q3):
  1. foto y banner;
  2. descripción;
  3. reglas;
  4. el primer post.

  Cada paso hecho va con ✓, y uno sin hacer lleva a donde se hace: la ventana "Edit group", en el campo del paso, o crear post en el grupo.

- [ ] **CE-08** Se puede **ocultar** con ✕, como "Complete your profile" (`specs/profile-showcase` PS-13), y queda oculta para ese grupo en ese navegador. Con todo hecho, no aparece.

### Calidad

- [ ] **CE-09** Mobile first a 360 px. Todo con teclado. Axe sin violaciones en claro y oscuro.
- [ ] **CE-10** Presupuesto de JS (`seo.md`, 241 KB): la página del grupo mide hoy 239,6 KB. La ventana va diferida, y la tarjeta se dibuja en el servidor (solo su ✕ es cliente). La primera carga de la página del grupo no puede pasar el tope.
- [ ] **CE-11** El mock de `PATCH /communities/:slug` (hoy solo imágenes, `specs/community-create`) acepta todos los campos editables con la validación del backend. Textos en en, es y pt.

## Fuera de alcance

- Cambiar el handle (Q2).
- Moderar miembros, transferir la moderación, borrar o archivar el grupo.
- Los widgets: ya tienen su editor (`specs/community-widgets`).
- Temas y tipo de grupo (público o restringido): el backend no los tiene.

## Preguntas resueltas (2026-11-07, todas como se recomendaron)

- **Q1 — ¿Dónde va "Edit group"?** Recomendado: un botón propio junto a "Edit widgets", con el mismo estilo. La alternativa es un menú "Manage group" con las dos opciones: queda más prolijo, pero esconde lo que más se usa detrás de un toque más.
- **Q2 — ¿Se puede cambiar el handle?** Recomendado: **no por ahora**. El backend lo permite solo una vez cada dos años y reserva el viejo un año; los links compartidos cambian, y un error no tiene vuelta atrás por dos años. Reddit, por lo que sé, no deja cambiar el nombre de un subreddit. Si hace falta, va en un spec propio, con su advertencia.
- **Q3 — ¿Qué pasos lleva el checklist?** Recomendado: los cuatro de CE-07. Se podría sumar "Agregá un widget", pero los widgets son más avanzados y harían la tarjeta más larga para un grupo que recién empieza.
