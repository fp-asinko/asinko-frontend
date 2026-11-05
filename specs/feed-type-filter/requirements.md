# Filtro por tipo en el feed, en la barra de las pestañas — Requirements

> Estado: **aprobado** por el PO el 2026-11-05 ("si apruebo"). Pedido del 2026-11-05: "la parte de New y Polls estén abajo de Publish y en el mismo renglón que For you; además deberíamos agregar un selector para filtrar thesis, post, etc."

## Decisiones del PO (2026-11-05)

| #   | Pregunta           | Decisión                                                                                                        |
| --- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| Q1  | Forma del selector | **Menú desplegable**: una píldora con el tipo elegido y una flecha, que abre All, Posts, Theses y Polls.        |
| Q2  | New y Polls de hoy | **Polls pasa al selector**; **New queda** como el orden, listo para Hot y Top cuando el backend ordene el feed. |
| Q3  | Tipos              | **All, Posts, Theses, Polls.** Posts incluye texto, imagen, link y thoughts.                                    |

## User stories

- Como lector del Home, quiero elegir qué tipo de contenido veo (solo tesis, solo encuestas…) sin perder la pestaña en la que estoy.
- Como lector, quiero que la barra del feed ocupe un solo renglón: menos espacio antes del contenido.

## Criterios de aceptación

### La barra del Home

- [ ] **FT-01** Debajo de la caja de publicar, **un solo renglón**: a la izquierda las pestañas For you · Following · Live (como hoy); a la derecha, **New** y el **selector de tipo**. El renglón de píldoras de abajo desaparece.
- [ ] **FT-02** A 360 px entra en un renglón, sin scroll horizontal: New y el selector quedan a la derecha, en su tamaño mínimo (24×24 px de área táctil o más).
- [ ] **FT-03** El chip de la comunidad elegida (`?community=`, "× #macro") sigue funcionando: va debajo de la barra, solo cuando hay una.

### El selector (Q1, Q3)

- [ ] **FT-04** Una píldora con el tipo elegido y una flecha ("All ▾"). Abre un menú con **All, Posts, Theses y Polls**; el elegido lleva ✓.
- [ ] **FT-05** Elegir uno cambia el feed y queda en la URL (`?type=posts|theses|polls`; All no se escribe). Se puede compartir y volver con "atrás". La pestaña, el orden y la comunidad se conservan.
- [ ] **FT-06** Qué trae cada uno: **All**, todo (como hoy); **Posts**, texto, imagen, link y thoughts; **Theses**, solo tesis; **Polls**, solo encuestas. Los anuncios y el glosario siguen apareciendo entre los ítems, como hoy.
- [ ] **FT-07** Funciona con teclado y lector de pantalla: es un menú de opciones (Base UI), con su nombre ("Content type: All") y el elegido anunciado.
- [ ] **FT-08** Sin resultados para ese tipo, el estado vacío lo dice ("No theses here") con el mismo formato de hoy.

### New y Polls (Q2)

- [ ] **FT-09** **New** queda como el orden, a la izquierda del selector, marcado como activo (es el único por ahora).
- [ ] **FT-10** **Polls** deja de ser una píldora: es una opción del selector. Una URL vieja con `?filter=polls` muestra las encuestas, con el selector en Polls.

### Las páginas de comunidad y de activo

- [ ] **FT-11** En `/hub/{slug}` y `/asset/{symbol}`, que no tienen pestañas, el renglón de filtros queda donde está, con New y el mismo selector. El perfil sigue sin filtros (como hoy).

### Calidad

- [ ] **FT-12** Sin violaciones de axe (WCAG 2.2 AA), en claro y oscuro.
- [ ] **FT-13** Textos en en, es y pt.
- [ ] **FT-14** El presupuesto de JS no pasa de 240 KB en el Home ni en las páginas de comunidad.

## Dependencias

- El backend ya filtra por tipo con `kind` en `GET /feed` y en el feed de una comunidad: no hace falta propuesta.

## Fuera de alcance

- Hot y Top (cuando el backend ordene el feed).
- Filtrar por más de un tipo a la vez.
- El perfil.
