# Logros en el perfil, como la vitrina de trofeos de Reddit — Requirements

> **Estado:** aprobado por el PO el 2026-10-19 ("sigamos con logros").
> **Fuente:** pedido del PO (2026-10-19), después de `specs/profile-aside` ("los logros, en otro spec"). Respuestas:
>
> - Catálogo: **tesis y reputación**, **comunidad**, **antigüedad** y **perfil completo**.
> - Dónde: en la **columna derecha** del perfil, los últimos ganados con **Ver todos**, que lleva a la lista completa.
> - Bloqueados: **solo en tu perfil**, en gris y con su progreso. Los demás ven solo los ganados.
>
> **Backend:** no hay logros en el contrato. Se proponen (P-030) y se mockean. Quién ganó qué lo decide el backend; el front no lo calcula (`api-integration.md § Contrato`).

## Objetivo

Que el historial de una persona se vea de un vistazo, en lo que logró, y que en tu propio perfil haya un siguiente paso que te motive (acertar tres seguidas, llegar a 100 seguidores).

## User stories

- Como visitante, quiero ver los logros de una persona junto a su perfil, para saber cuánto lleva y qué tan bien le va.
- Como usuario, quiero ver qué logros me faltan y cuánto me falta para cada uno, para tener un objetivo.
- Como usuario, quiero ver todos los logros de alguien en una página, ordenados por tipo.

## Criterios de aceptación

### El catálogo (Q1)

- [x] **AC-01** 16 logros en cuatro grupos, cada uno con su ícono, su nombre y una línea que dice cómo se gana:
  - **Tesis y reputación:** Primera tesis, Primer acierto, Racha de 3, Racha de 5, Racha de 10 (acertadas seguidas), 10 tesis resueltas y Precisión de 70 % (con 10 o más resueltas).
  - **Comunidad:** Primer post, Primer comentario, Un post con 100 votos, 100 seguidores, Fundó un grupo y Modera un grupo.
  - **Antigüedad:** Aniversario (uno por año en Asinko: "1 año", "2 años"…) y Miembro fundador (se unió antes del lanzamiento).
  - **Perfil completo:** completó los 8 pasos de "Completa tu perfil" (`specs/profile-showcase` PS-02).
- [x] **AC-02** Un logro ganado no se pierde aunque después baje la racha o la precisión: queda con la fecha en que se ganó.

### En la columna derecha (Q2)

- [x] **AC-03** En un perfil, debajo de la tarjeta de reputación (`specs/profile-aside` PA-01), una tarjeta **Logros** con cuántos ganó ("Logros · 7") y los **4 últimos** ganados, del más nuevo al más viejo: una fila cada uno, como la vitrina de Reddit: el ícono, el nombre y cuándo se ganó (mes y año). _Cambio del PO (2026-10-21): antes iban en una grilla de 4 con el nombre debajo, y en la columna de 300 px los nombres se cortaban desparejos._ La descripción está en la lista completa. Arriba, **Ver todos**.
- [x] **AC-04** Sin logros ganados, la tarjeta no aparece en el perfil de otra persona. En el tuyo dice "Todavía no tienes logros" y muestra el más cercano a ganarse, con su progreso.
- [x] **AC-05** Por debajo de `lg` la tarjeta va en la página, después de la tarjeta de reputación, como en PA-03: el contenido es el mismo en mobile y desktop.

### La lista completa

- [x] **AC-06** **Ver todos** lleva a `/user/{username}/achievements` (igual en todos los idiomas, como el perfil): el encabezado del perfil chico (foto, nombre, volver al perfil) y los logros en sus cuatro grupos, cada grupo con su título y una grilla (2 columnas en el teléfono, 3 desde `md`). Cada logro: ícono, nombre, descripción y la fecha en que se ganó.
- [x] **AC-07** (Q3) En **tu** perfil, los que te faltan aparecen en gris, con su progreso cuando se puede medir ("2 de 3", con una barra) y sin fecha. Primero los ganados de cada grupo, después los que faltan. En el perfil de otra persona, solo los ganados, y los grupos sin logros no aparecen.
- [x] **AC-08** La página tiene su título y descripción traducidos, canonical, `hreflang` y es indexable como el perfil. Un usuario inexistente da 404.

### Calidad

- [x] **AC-09** El estado nunca depende solo del color: un logro que falta dice "Bloqueado" (para lectores de pantalla y en la descripción) y tiene su progreso en texto.
- [x] **AC-10** Mobile first a 360 px; axe sin violaciones en claro y oscuro; textos en en, es y pt; **sin JavaScript nuevo** en el perfil (le quedan 0,1 KB, `seo.md`): todo es de servidor.
- [x] **AC-11** `proposals.md` con P-030 y el mock con su forma y sus errores. El usuario demo tiene logros ganados y bloqueados de cada grupo.

## Fuera de alcance

- Avisar cuando se gana un logro (notificaciones, fase 3) y las tarjetas de hito en el feed del prototipo (`MilestoneCard`).
- Logros de comunidades, niveles (bronce, plata, oro), logros raros o con porcentaje de quién los tiene.
- Destacar logros, ocultarlos o elegir cuáles se muestran.
- Ratings y tiers (`docs/product/overview.md § Reputación`), que llegan con su propio spec.

## Dependencias

- `specs/profile-aside` (la columna derecha y la tarjeta de reputación) y `specs/profile-showcase` (los 8 pasos).
- Backend: P-030.
