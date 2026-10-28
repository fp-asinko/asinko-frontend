# Favoritos en grupos, personas y activos — Requirements

> **Estado:** aprobado por el PO el 2026-10-28 ("dale"): la estrella como Reddit, sin una sección aparte, también para personas y activos. Se trabaja local, sin push, hasta que el PO lo diga.
>
> **Fuente:** el backend (`asinko-app` dev), revisado en su código:
>
> - el favorito vive en la membresía (`isFavorite`), con `PUT` y `DELETE /api/v1/communities/{slug}/favorite`, para cualquier comunidad de la que seas miembro;
> - un activo es una comunidad `SYSTEM_ASSET`;
> - seguir a una persona es ser miembro de su canal personal (`PERSONAL_CHANNEL`, con slug igual a su username y `createdByProfileId` igual a su id);
> - `GET /communities?mine=true` trae todas tus membresías, con `viewerIsFavorite`, favoritas primero.

## Criterios de aceptación

- [x] **FV-01** En la columna izquierda, cada lista (Grupos, Personas, Activos) muestra **primero los favoritos**, cada uno con una **estrella negra** junto al nombre.
- [x] **FV-02** Al pasar el mouse por una fila de Grupos o Personas (o con el foco del teclado), aparece a la derecha la estrella para **marcar o desmarcar** el favorito. Se ve al instante y la lista se reordena después. En **Activos**, la estrella va en la esquina de la tarjetita, chica y sin fondo: negra y fija si es favorito, vacía al pasar el mouse si no (PO, 2026-10-28). La tarjeta de la página que se ve se marca con fondo gris, no con borde.
- [x] **FV-03** En la página de un perfil que seguís, al lado de "Siguiendo", aparece la estrella de favorito, como en un grupo y en un activo. Cambia CP-12 de `specs/community-pages`, que la sacaba. En tu propio perfil, nada.
- [x] **FV-04** Sin sesión no hay estrellas. Si falla, vuelve como estaba y lo dice, como la estrella de la cabecera.
- [x] **FV-05** **Accesibilidad:**
  - la estrella es un botón con nombre ("Add maria to favorites" o "Remove maria from favorites") y `aria-pressed`;
  - la estrella negra de la fila es decorativa, y el lector de pantalla la oye en el nombre del botón;
  - axe sin violaciones en claro y oscuro;
  - presupuesto de JS dentro de 240 KB.

## Fuera de alcance

- Una sección "Favoritos" aparte.
- Favoritos de algo de lo que no sos miembro (el backend responde `404 NOT_MEMBER`).
