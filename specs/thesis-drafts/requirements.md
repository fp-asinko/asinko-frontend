# Borradores de tesis — Requirements

> **Estado:** aprobado por el PO el 2026-11-02 ("si"), con lo propuesto: "Guardar borrador" en la tesis, la lista de Borradores con posts y tesis juntos (con una marca), y abrir una tesis desde la lista lleva a la pestaña Tesis.
> **Fuente:** pregunta del PO: "¿por qué en thesis no hay guardado de borradores también?". `specs/thesis-create` Q8 los dejó afuera porque los borradores del backend (P-022, E03) son solo de posts.
> **Backend:** hace falta una propuesta (**P-038**): un borrador de tipo `THESIS` y `draftId` en `POST /theses`. Mientras tanto se mockea.

## Criterios de aceptación

- [x] **TD-01** En la pestaña Tesis, **"Guardar borrador"** junto a Cancelar y Publicar, como en un post (`specs/drafts-tags` DT-01): guarda en la cuenta lo escrito (comunidad, activo, predicción, objetivo y dirección, fecha límite, convicción y razonamiento) y dice "Guardado" mientras el formulario no cambie. Guardar de nuevo actualiza el mismo.
- [x] **TD-02** **Borradores** también está en la fila de los formatos de la tesis. La lista muestra posts y tesis juntos, del más nuevo al más viejo; una tesis lleva la marca **"Tesis"** y su predicción como título.
- [x] **TD-03** Abrir una tesis desde la lista, desde cualquier pestaña, lleva a la pestaña Tesis con el borrador cargado; abrir un post desde la tesis lleva al editor de posts. Lo que había escrito en la pestaña de destino se reemplaza, como hoy (DT-03).
- [x] **TD-04** Publicar una tesis que vino de un borrador lo borra (`draftId`, como un post: BA-05).
- [x] **TD-05** El límite de 20 es de todos los borradores juntos; los errores, como los de un post (DT-05).
- [x] **TD-06** `docs/references/api/proposals.md` con **P-038** (la forma exacta y el motivo) y el mock: con `API_MOCKS=true`, todos los borradores; con `missing`, solo los de tesis (los de posts siguen yendo al backend), y la lista los junta.
- [x] **TD-07** Textos en en, es y pt; accesibilidad y 360 px como el resto del formulario.

## Fuera de alcance

- Borradores de tesis en otro dispositivo mientras el backend no implemente P-038 (con `missing` viven en la memoria del servidor del front).
