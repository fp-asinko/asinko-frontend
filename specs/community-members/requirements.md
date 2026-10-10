# Miembros de una comunidad — Requirements

> **Estado:** aprobado por el PO el 2026-10-10: Q1, grupos y activos; Q2, P-017 ampliada y mockeada; Q3, sin moderadores por ahora.
> **Fuente:** documento de entregables (`docs/references/ASINKO-requirements.pdf`, "Común a las tres": "Listado de miembros (`GET /communities/{slug}/members`), si el diseño lo pide"). Pedido del PO el 2026-10-10: "reutilicemos" la lista de seguidores (`specs/follow-lists`).
> **Backend:** `GET /api/v1/communities/{slug}/members` existe en `dev` (E02, leído en `asinko-app` `bd91e4b`): público, paginado por cursor de a 20, del miembro más nuevo al más viejo, con `id`, `username`, `avatarUrl` y `role` (`MEMBER`, `MODERATOR`, `PRINCIPAL_MODERATOR`). Incluye al creador. Un slug inexistente devuelve una lista vacía.

## Objetivo

Que "1.204 miembros" en un grupo lleve a quiénes son, con la misma ventana que los seguidores de un perfil.

## User stories

- Como usuario, quiero ver quiénes están en un grupo antes de unirme.
- Como usuario, quiero encontrar gente para seguir dentro de un grupo que me interesa.

## Criterios de aceptación

- [x] **CM-01** En la página de un grupo (y de un activo, Q1), "N miembros" es un botón que abre la **lista de miembros** en la ventana de seguidores: a pantalla completa en el teléfono, una ventana arriba en desktop, con el título "Miembros de #macro". Sin pestañas: es una sola lista.
- [x] **CM-02** Cada fila es la de seguidores (`FollowRow`): avatar y `@usuario` (link a su perfil, que cierra la ventana). Sin precisión, que este endpoint no trae, y sin distinguir moderadores (Q3).
- [x] **CM-03** De a 20, del más nuevo al más viejo, con **Cargar más** al final (o al llegar con el scroll), por cursor.
- [x] **CM-04** Estados, los de seguidores: cargando (esqueleto de filas), vacío ("#macro todavía no tiene miembros") y error local con Reintentar.
- [x] **CM-05** (Q2) Botón Seguir o Siguiendo en cada fila, como en seguidores, con `isFollowedByViewer` (P-017, ampliada a esta lista y mockeada); mientras el backend no lo mande, la fila va sin botón. En tu propia fila no hay botón.
- [x] **CM-06** Teclado y lectores: la lista tiene nombre ("Miembros de #macro"), el foco entra en la ventana y vuelve a "N miembros" al cerrar.
- [x] **CM-07** A 360 px nada genera scroll horizontal; filas de 44 px o más.
- [x] **CM-08** Textos en en, es y pt; axe sin violaciones en claro y oscuro; la ventana se carga al primer uso y el presupuesto de JS se mantiene (`seo.md`).
- [x] **CM-09** Mock de la ruta para `API_MOCKS=true`, con paginación y suficientes miembros en un grupo para paginar.

## Fuera de alcance

- Gestión de miembros (cambiar roles, sacar a alguien): queda para la spec de moderación.
- Distinguir moderadores en la lista (Q3: "por el momento no va a haber moderadores").
- Buscar dentro de la lista, ordenar por otra cosa.
- El perfil: sus miembros son sus seguidores, que ya tienen su lista (`specs/follow-lists`).

## Preguntas resueltas (2026-10-10)

- **Q1. ¿En qué páginas?** ¿Grupos y activos (**recomendado**: los dos muestran "N miembros" y tienen miembros), o solo grupos?
- **Q2. Botón Seguir en cada fila:** el endpoint no dice si ya seguís a cada miembro. ¿Sumamos el mismo campo de P-017 (`isFollowedByViewer`) a esta lista y lo mockeamos, así las filas son iguales a las de seguidores (**recomendado**)? Alternativa: filas sin botón.
- **Q3. Moderadores:** ¿una etiqueta "Moderador" al lado del nombre de los moderadores y del creador (**recomendado**, como "Mod" en Reddit), o todos iguales?
