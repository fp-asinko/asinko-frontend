# Editar perfil — Requirements

> **Estado:** aprobado por el PO el 2026-10-09: Q1, una ventana; Q2, "Preguntale a @…" queda como está hoy.
> **Fuente:** pedido del PO (2026-10-09) al ver su perfil sin nombre ni descripción: "¿no hay nombre y descripción para poner?". Elegido entre las opciones del perfil (punto A).
> **Alcance:** no está en el documento de entregables (ni adentro ni afuera): es una mejora chica sobre la página de perfil, que sí está. El backend ya la tiene: `PATCH /api/v1/users/{userId}` (E01), solo el propio usuario.

## Objetivo

Que cada persona escriba su bio desde su perfil, como en X, sin depender del seed.

## User stories

- Como usuario, quiero contar en una línea quién soy y qué analizo, para que me sigan los que les interesa.
- Como usuario, quiero corregir mi bio cuando cambia lo que hago.

## Criterios de aceptación

- [ ] **PE-01** En **tu** perfil, el botón **Editar perfil** (píldora gris con borde, como el "Seguir" del prototipo pero secundario) va donde en los demás perfiles está Seguir. En el de otra persona no aparece.
- [ ] **PE-02** Abre una ventana **Editar perfil** (en el teléfono, a pantalla completa, como el editor de posts) con la **bio**: un campo de varias líneas, con lo que ya tiene, el contador "N/160" y el foco adentro.
- [ ] **PE-03** **Guardar** manda la bio (sin espacios de más) y cierra; el perfil la muestra al instante, sin recargar. Mientras guarda, el botón dice "Guardando…" y no se puede tocar dos veces. **Cancelar** o Esc cierran sin guardar, y piden confirmación si hay cambios.
- [ ] **PE-04** Más de 160 caracteres: el contador se pone en rojo, el campo dice "Hasta 160 caracteres" y Guardar no avanza (el backend también lo rechaza: `422 BIO_TOO_LONG`). Una bio vacía es válida: borra la que había.
- [ ] **PE-05** Si el backend falla, el error se muestra en la ventana y lo escrito no se pierde.
- [ ] **PE-06** El `userId` sale de la sesión en el servidor, nunca del formulario (`api-integration.md`). Sin sesión, la action devuelve `UNAUTHENTICATED`.
- [ ] **PE-07** La bio se muestra como texto plano (sin Markdown ni links), cortando las palabras largas a 360 px.
- [ ] **PE-08** Textos en en, es y pt; axe sin violaciones en claro y oscuro; la ventana se carga al primer uso (`seo.md`): la primera carga del perfil no crece.
- [ ] **PE-09** Mock de `PATCH /users/{userId}` con la validación del backend (`USER_MISMATCH`, `BIO_TOO_LONG`), que actualiza el perfil del usuario demo.

## Fuera de alcance

- **Nombre visible:** espera P-011 (`displayName`). Cuando el backend lo tenga, se suma a esta misma ventana.
- **Foto de perfil y banner:** esperan un bucket de avatares (y el de imágenes, P-013, todavía no existe en `dev`).
- Cambiar el `@usuario`, perfil privado, idioma o país: tienen reglas propias en el backend (reserva de 1 año, etc.) y no se pidieron.

## Preguntas resueltas (2026-10-09)

- **Q1. ¿Ventana o en el lugar?** ¿Una ventana "Editar perfil" como X (**recomendado**: deja lugar para sumar el nombre y la foto después) o editar la bio ahí mismo, debajo del nombre?
- **Q2. "Preguntale a @maria":** hoy es un botón que no hace nada. ¿Lo dejamos como "Próximamente" (**recomendado**, como el resto de lo que no existe) o lo sacamos hasta que exista?
