# Experiencia sin sesión — Requirements

> **Estado:** para aprobar. Pedido el 2026-10-05, como paso previo a crear posts (fase 1), que necesitan login.
> **Decisiones del Product Owner (2026-10-05):**
>
> - Dos specs seguidos: este (vista sin sesión y modal) y después `auth` (login real con Supabase).
> - El login será un **modal sobre la página**, más una página `/login` para los links directos.
> - Sí a la tarjeta "Join Asinko" en la columna derecha.
>
> **Referencias:**
>
> - Reddit: lectura abierta y modal de login al actuar.
> - X: modal que dice qué ibas a hacer y llamado fijo a crear cuenta.
> - Instagram: muro que no se puede cerrar. Es el anti-patrón: no se copia.

## Objetivo

Que alguien sin cuenta pueda leer todo Asinko sin trabas y, cuando quiera participar, se encuentre con una invitación clara, en contexto y que se puede cerrar. Nunca con un error ni con un muro.

## User stories

1. Como **visitante**, quiero leer el feed, los comentarios y las comunidades sin crear una cuenta, para decidir si me interesa.
2. Como **visitante**, cuando intento votar, comentar o publicar, quiero que me expliquen qué necesito y me ofrezcan entrar o crear una cuenta, sin perder lo que estaba mirando.
3. Como **visitante**, quiero saber siempre dónde entrar o crear una cuenta.
4. Como **visitante que crea su cuenta**, quiero volver a lo que estaba haciendo (esto se completa en `auth`).

## Criterios de aceptación

### Lectura abierta

- [ ] **G-01** Sin sesión se lee todo lo público (feed "For you", filtros, comunidades, comentarios), sin límite de scroll, sin muros y sin carteles que no se puedan cerrar.

### Llamados a crear cuenta

- [ ] **G-02** **Barra superior:** sin sesión, el lugar del perfil (hoy deshabilitado) muestra "Log in" y "Sign up". En mobile, solo "Log in", para que entre en 360 px. Con sesión, todo sigue como hoy.
- [ ] **G-03** **Tarjeta "Join Asinko":** en la columna derecha, arriba de la de tokens, solo sin sesión. Lleva un título, una línea de valor (track record verificable) y los dos botones.

### Modal contextual

- [ ] **G-04** Sin sesión, estas acciones abren un **modal**, en lugar de un error o de "Coming soon":
  - votar un post;
  - votar una encuesta;
  - la caja "What are you thinking?" y sus acciones Post, Thesis y Live;
  - unirse a una comunidad;
  - la pestaña "Following".
- [ ] **G-05** El modal **dice qué ibas a hacer** ("Vote to make your take count", "Join Asinko to post", etc.) y ofrece "Log in" y "Create account". Hasta que exista `auth`, los dos botones dicen "Coming soon" (H-26).
- [ ] **G-06** Se cierra con Esc, tocando afuera o con su botón de cerrar. Al cerrarse, el foco vuelve al control que lo abrió. No deja nada a medias: el voto no queda marcado.
- [ ] **G-07** **Mobile first:** en mobile es un panel que sube desde abajo; desde `md`, un diálogo centrado.
- [ ] **G-08** **Accesible:** diálogo con título y descripción, foco atrapado mientras está abierto y AA en claro y oscuro.

### Base para `auth`

- [ ] **G-09** El modal recibe la acción que lo abrió (por ejemplo `vote-post`) y la página actual, para que `auth` pueda volver ahí después de entrar (`?next=` relativo, `security.md § 5`).

### Generales

- [ ] **G-10** **Sin peso:** el modal se carga recién la primera vez que hace falta (`next/dynamic`). El JS del Home se queda en ≤ 230 KB.
- [ ] **G-11** Con sesión (hoy, el usuario demo con `API_MOCKS=true`) nada cambia: no se ven los llamados y las acciones funcionan igual.
- [ ] **G-12** Textos en en, es y pt.

## Fuera de alcance

- El login y el registro reales, Supabase y la vuelta a la acción después de entrar: van en `auth`.
- Comentar (todavía no existe la caja de comentario) y seguir personas (fase 2). Cuando existan, usan el mismo modal.
- Barra fija abajo como la de X: en mobile ya está la navegación inferior. Se puede evaluar después.

## Preguntas abiertas

| #   | Pregunta                                                                                                 | Propuesta                                                                                                                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Texto del modal según la acción (en)                                                                     | **Votar un post:** "Vote to make your take count" · **Votar una encuesta:** "Vote to see where you stand" · **Publicar:** "Join Asinko to post" · **Unirse:** "Join Asinko to join communities" · **Following:** "Log in to see who you follow". Debajo, la misma línea: "Asinko is where calls get a public, verifiable track record." |
| Q2  | La pestaña "Following" sin sesión hoy muestra un estado vacío ("You need an account…"). ¿Modal o página? | **Se queda la pestaña con su estado vacío**, y ese estado suma los dos botones. Es una página entera privada: redirigir o abrir un modal al tocarla sería más brusco                                                                                                                                                                    |
| Q3  | Tarjeta "Join Asinko" (en)                                                                               | Título "New to Asinko?" · "Build a public track record. Every call you make is checked against the market." · Botones "Create account" y "Log in"                                                                                                                                                                                       |

## Dependencias

- `specs/home`, `specs/right-column` y `specs/feed-cards` cerrados.
- El spec `auth` reemplaza los "Coming soon" del modal por el formulario real.
