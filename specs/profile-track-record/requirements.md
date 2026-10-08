# Perfil con track record — Requirements

> **Estado:** aprobado por el PO el 2026-10-08, con Q1 a Q3 como se recomendaron.
> **Fuente:** documento de entregables (`docs/references/ASINKO-requirements.pdf`, "Página de perfil": `GET /profiles/{identifier}` con "contadores de correctas/incorrectas/canceladas, seguidores/seguidos" e "Historial de tesis del usuario: `GET /users/{userId}/theses`"), elegido por el PO el 2026-10-08 (punto B), con X e Instagram de inspiración.
> **Backend:** los dos endpoints existen en `dev` (`asinko-app`, E01 y E12). El contrato de `Profile` ya trae los contadores; hoy el front solo muestra seguidores, precisión y racha.

## Objetivo

Que el perfil cuente el historial de la persona, que es lo que distingue a Asinko: cuántas tesis acertó, erró o canceló, a cuántos sigue, y la lista de sus tesis, como la pestaña de un perfil de X.

## User stories

- Como usuario, quiero ver si alguien acierta antes de hacerle caso.
- Como usuario, quiero ver las tesis de una persona, abiertas y resueltas, sin buscarlas en el feed.
- Como creador, quiero que mi perfil muestre mi historial completo.

## Criterios de aceptación

### Números

- [ ] **PT-01** Debajo de la bio, como X: **N Siguiendo · N Seguidores** (antes solo seguidores), con el número en negrita.
- [ ] **PT-02** Una fila de **track record**: precisión (si tiene tesis resueltas), racha, y **N acertadas · N erradas · N canceladas**. Acertadas con ✓ y erradas con ✗ (el color nunca es la única señal, `design-system.md`).
- [ ] **PT-03** Sin ninguna tesis resuelta, la fila dice "Todavía sin tesis resueltas" en lugar de ceros.

### Pestañas

- [ ] **PT-04** Debajo del encabezado, dos pestañas como las de X: **Posts** (lo de hoy: el feed del canal) y **Tesis**. La elegida queda en la URL (`?tab=theses`): se comparte y vuelve con "atrás". Posts es la de por defecto; un valor desconocido también.
- [ ] **PT-05** **Tesis** lista las tesis de la persona (`GET /users/{userId}/theses`), de la más nueva a la más vieja, 20 por página con **Cargar más** por cursor, como el feed.
- [ ] **PT-06** Estado vacío: "@maria todavía no publicó tesis"; en tu propio perfil, "Todavía no publicaste tesis" (crear tesis está fuera de esta etapa: sin botón). Estado de carga con esqueleto; si falla, un error local con el resto de la página funcionando.

### La tarjeta de tesis (solo lectura)

- [ ] **PT-07** Como la del prototipo, sin los botones de votar (votar tesis queda para cuando entren en el feed, según el documento):
  - el activo (`$BTC`, link a su página) y la fecha de publicación;
  - el **claim** como título;
  - el **estado** en un chip: Abierta, Acertada ✓, Errada ✗, Vencida, En disputa, Cancelada;
  - el objetivo: "Por encima de $150.000 antes del 31 dic 2026" (dirección, precio y deadline);
  - la **convicción** en 4 barras (Baja, Media, Alta, Extrema) con su nombre para lectores;
  - resuelta: el precio de resolución; cancelada: el motivo, si lo hay.
- [ ] **PT-08** Precios y fechas con el formato del idioma (`useFormatter`).

### Calidad

- [ ] **PT-09** A 360 px nada genera scroll horizontal; pestañas de 44 px de alto.
- [ ] **PT-10** Pestañas accesibles (links con `aria-current`, como los filtros del feed); textos en en, es y pt; axe sin violaciones en claro y oscuro.
- [ ] **PT-11** Presupuesto de JS (`seo.md`): la pestaña Tesis se dibuja en el servidor; solo "Cargar más" es cliente, y ya existe.
- [ ] **PT-12** Mocks: tesis de ejemplo para los usuarios del mock (abiertas y resueltas de cada estado), con el contrato de `Thesis` (E11) validado en `fixtures.test.ts`. Sin `liveExample` para `pnpm api:smoke`: la ruta pide un `userId` y los ids del seed no se conocen desde el front.

## Fuera de alcance

- Crear, votar, cancelar o comentar tesis.
- Listas de seguidores y seguidos (punto D del PO, después).
- Página de detalle de una tesis (la tarjeta no es un link).
- Rating AAA…D y tiers (P-011: después del MVP).

## Preguntas resueltas (2026-10-08)

- **Q1. Los números:** ¿dos líneas de texto como X (**recomendado**: liviano, entra a 360 px) o una grilla de 4 números grandes como Instagram (Seguidores, Siguiendo, Precisión, Racha) con el detalle de acertadas/erradas debajo?
- **Q2. Filtro en Tesis:** el endpoint filtra por estado. ¿Lo dejamos para después (**recomendado**, YAGNI) o sumamos chips "Todas · Abiertas · Resueltas"?
- **Q3. Una tercera pestaña "Respuestas"** (los comentarios de la persona, como X): el backend no tiene ese endpoint. ¿Afuera por ahora (**recomendado**) o lo proponemos?
