# El grupo como protagonista y botón Unirse — Requirements

> **Estado:** aprobado por el PO el 2026-10-05.
> **Pedido del Product Owner** (con capturas de Reddit): "que los grupos tengan más importancia, como hace Reddit, y que el usuario se vea más chico y sin imagen… agreguemos el botón de unirnos si no estamos".
> **Decisiones tomadas con el PO:**
>
> - Grupo arriba y usuario abajo.
> - Píldora negra que desaparece al unirse.
> - Propuesta al backend, y mientras tanto usar los datos que ya hay.
> - También los "Join" de la columna izquierda.

## Objetivo

Que cada tarjeta del feed muestre primero **de qué grupo es** y deje unirse con un toque, como Reddit. El autor pasa a segundo plano.

## User stories

- Como lector, quiero ver primero el grupo de cada post, para decidir rápido si me interesa.
- Como lector con cuenta, quiero unirme a un grupo desde el post o la columna, sin salir del feed.
- Como lector sin cuenta, quiero que tocar "Unirse" me explique que necesito una cuenta.

## Criterios de aceptación

### Cabecera de la tarjeta (posts y encuestas)

- [ ] **CF-01** **Línea 1:**
  - El avatar del grupo (40 px, el alto de las dos líneas como Reddit; cuadrado redondeado como en la columna izquierda. Era de 24 px hasta el 2026-10-08) y su handle (`#acciones`, `$BTC`) en negrita y color de texto principal. El handle es un link al Home filtrado.
  - Después, `·` y el tiempo relativo (y "editado" si corresponde).
- [ ] **CF-02** **Línea 2:** `@usuario`, más chico y en gris, **sin foto**, con su chip de accuracy. Un post del sistema muestra "Asinko".
- [ ] **CF-03** **Canal personal:** un post en el canal personal de un usuario no tiene grupo. Su cabecera es de una línea con la foto del usuario, `@usuario`, accuracy y tiempo, sin línea 2 ni botón Unirse.
- [ ] **CF-04** El avatar del grupo usa su imagen si existe. Si no, sus iniciales sobre el color de identidad del slug, igual que en la columna.

### Unirse

- [ ] **CF-05** Si no sos miembro del grupo, la línea 1 lleva a la derecha una píldora negra **"Unirse"** (`bg-primary`, como Reddit). Siendo miembro, en un canal personal o en una tarjeta borrada, no aparece.
- [ ] **CF-06** **Sin sesión**, tocar "Unirse" abre el modal de cuenta con el texto de unirse (acción `join` de `guest-experience`). No se llama al backend.
- [ ] **CF-07** **Con sesión**, al tocarlo:
  - El botón desaparece al instante (optimista) de **todas** las tarjetas de ese grupo y de la columna izquierda.
  - El servidor llama a `PUT /communities/{slug}/members/{userId}`, con el `userId` de la sesión (`api-integration.md § userId`).
  - Después la página se actualiza en segundo plano: el grupo aparece en "Groups" de la columna izquierda.
- [ ] **CF-08** **Si falla:** el botón vuelve y aparece un aviso debajo con el error traducido, como en los votos. Si la sesión venció (`401`), se abre el modal de cuenta.
- [ ] **CF-09** Mientras se guarda, el botón no se puede tocar dos veces (`security.md § 7`).
- [ ] **CF-10** **Columna izquierda:**
  - Los "Join" de Suggested dejan de ser "Próximamente" y usan la misma acción y el mismo comportamiento (CF-06 a CF-09).
  - Al unirte, el grupo desaparece de Suggested y pasa a Groups.

### Datos

- [ ] **CF-11** Se pide al backend sumar `avatarUrl` y `viewerMembership` a la comunidad de cada post y encuesta (propuesta **P-010** en `proposals.md`). Los mocks ya la tienen.
- [ ] **CF-12** Mientras P-010 no exista, el front cruza el feed con dos listas, **en paralelo con el feed** (sin sumar espera):
  - `GET /communities?mine=true`, solo con sesión.
  - `GET /communities`, para los avatares.

  Un grupo que no esté en esas listas muestra iniciales y el botón Unirse. Unirse es idempotente, así que no hay riesgo.

### Calidad

- [ ] **CF-13** A 360 px la línea 1 entra sin scroll horizontal: el handle se corta con "…" antes que el botón. El botón tiene al menos 32 px de alto.
- [ ] **CF-14** Accesibilidad:
  - El botón se llama "Unirse a #acciones" para el lector de pantalla.
  - Se usa con teclado y tiene foco visible.
  - Al desaparecer, el foco no se pierde: pasa al título del post.
- [ ] **CF-15** El JS de primera carga sigue dentro de los 230 KB (`seo.md`).
- [ ] **CF-16** Textos nuevos en en, es y pt.

## Fuera de alcance

- Salir de un grupo, con confirmación: spec `communities`.
- El botón Unirse en el chip del feed filtrado y en la página del grupo: spec `communities`.
- Seguir usuarios (`PUT /users/{id}/follow`).
- Cambiar el diseño de las tesis (todavía no están en el feed).

## Dependencias

- `guest-experience` (modal de cuenta, acción `join`).
- `dev-login` o mocks (`API_MOCKS=true`) para probar con sesión.
- Backend: `PUT /communities/{slug}/members/{userId}` ya existe en `dev`. P-010 es opcional: CF-12 lo cubre mientras tanto.
