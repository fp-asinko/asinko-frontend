# Listas de seguidores y seguidos — Requirements

> **Estado:** aprobado por el PO el 2026-10-09: Q1, una ventana; Q2, se propone P-017 y se mockea.
> **Fuente:** pedido del PO (2026-10-09), punto B de las opciones del perfil: "hagamos la lista de seguidores y seguidos". El documento de entregables pide los contadores en el perfil (ya están); las listas son una mejora sobre la misma página.
> **Backend:** `GET /api/v1/users/{userId}/followers` y `/following` existen en `dev` (E01): públicos, paginados por cursor, con la forma resumida de `User` (`id`, `username`, `avatarUrl`, `accuracyRate`).

## Objetivo

Que los números "1.204 seguidores · 180 siguiendo" lleven a quiénes son, como en Instagram y X, para descubrir gente que acierta.

## User stories

- Como usuario, quiero ver a quién sigue alguien que acierta, para encontrar a otros como él.
- Como usuario, quiero ver quién me sigue.

## Criterios de aceptación

- [ ] **FL-01** En el perfil, "N seguidores" y "N siguiendo" son botones. Cada uno abre la **lista** en una ventana (a pantalla completa en el teléfono), con dos pestañas **Seguidores · Siguiendo** y la tocada elegida.
- [ ] **FL-02** Cada fila: avatar, `@usuario` (link a su perfil, que cierra la ventana) y su precisión con el color de su tramo, como en la columna izquierda.
- [ ] **FL-03** De a 20, con **Cargar más** al final (o al llegar con el scroll), por cursor.
- [ ] **FL-04** Estados: cargando (esqueleto de filas), vacío ("@maria todavía no tiene seguidores" / "@maria todavía no sigue a nadie"; en tu perfil, en segunda persona), y error local con Reintentar.
- [ ] **FL-05** (Q2) En cada fila, **Seguir** (píldora negra) o **Siguiendo** (gris), como el botón del perfil: seguir no pide confirmación; dejar de seguir sí. Sin sesión, abre el aviso para entrar. En tu propia fila no hay botón.
- [ ] **FL-06** Teclado y lectores: las pestañas son un `tablist` real (flechas, `aria-selected`), la lista tiene nombre ("Seguidores de @maria"), el foco entra en la pestaña elegida y vuelve al número al cerrar.
- [ ] **FL-07** A 360 px nada genera scroll horizontal; filas de 44 px o más.
- [ ] **FL-08** Textos en en, es y pt; axe sin violaciones en claro y oscuro; la ventana y su lista se cargan al primer uso (`seo.md`).
- [ ] **FL-09** Mocks de las dos rutas con paginación, `404` para un usuario inexistente, y suficientes seguidores en `@maria` para paginar.

## Fuera de alcance

- Buscar dentro de la lista, "seguidos en común", sacar a un seguidor.
- Listas de miembros de un grupo (otra página, otro endpoint).

## Preguntas resueltas (2026-10-09)

- **Q1. ¿Ventana o página?** ¿Una ventana con pestañas, como Instagram (**recomendado**: no saca al usuario del perfil y es más liviano), o páginas propias `/user/maria/followers` y `/following`, como X (se pueden compartir)?
- **Q2. Botón Seguir en cada fila:** el backend no dice, para cada persona de la lista, si ya la seguís. ¿Lo proponemos (**P-017**: `isFollowedByViewer` en cada ítem, como en el perfil) y lo mockeamos para mostrar los botones (**recomendado**, como Instagram y X)? Alternativa: listas sin botones hasta que el backend lo tenga.
