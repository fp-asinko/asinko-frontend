# Argumentos y actualizaciones de una tesis — Requirements

> **Estado:** preguntas resueltas por el PO el 2026-11-03, las seis como se recomendaron ("si"). Q2, Q4, Q5 y Q6 se confirman con el backend (`docs/references/api/proposals.md`).
> **Fuente:** Jira **MVP-141** ("Pro/Con arguments tab + author updates on thesis detail": el endpoint de actualizaciones ya está en el backend, E11; falta la UI; la notificación a quienes votaron, ítem 27, sigue pendiente). Sigue a `specs/thesis-detail`, que dejó en la página los contadores y un "Próximamente" (Q3).
> **Backend** (`dev`, probado el 2026-11-03):
>
> - `GET /theses/{id}/comments` responde `200 { items }` y acepta `?side=PRO|CONTRA`, `?sort=` y `?q=` (devuelve vacío sin error). Cada `Comment` trae `side: PRO | CONTRA | null` (E05).
> - `POST /theses/{id}/comments` exige `side` en una tesis (E05: "obligatorio si el contenido padre es una Thesis"). El contrato no dice si una respuesta también lo exige, ni si puede ser distinto del de su padre (Q2).
> - `GET /theses/{id}/updates` devuelve `{ items: [] }`, no la lista suelta que dice E11: hay que corregir el contrato o el backend (Q6).
> - `POST /theses/{id}/updates` `{ userId, body }` → la actualización; solo su autor; `409 THESIS_NOT_OPEN` si no está abierta. No hay editar ni borrar.
> - No se vio si los comentarios de una tesis traen anuncios (`ads`) como los de un post (P-031): con la lista vacía no vienen (Q5).

## Objetivo

Que una tesis se discuta como Asinko la pensó: quien está de acuerdo argumenta a favor, quien no, en contra, y cada lado se lee por separado. Y que su autor pueda contar qué cambió mientras la tesis está abierta, sin editarla (una tesis publicada no se edita, `overview.md`).

## User stories

- Como usuario, quiero leer los argumentos a favor y los en contra por separado, para ver los dos lados antes de opinar.
- Como usuario, quiero sumar un argumento a favor o en contra, y responder a otro, para discutir una tesis con datos.
- Como autor, quiero publicar actualizaciones mientras mi tesis está abierta ("salió el dato de inflación, sigo"), para dar contexto sin tocar lo publicado.
- Como usuario, quiero ver esas actualizaciones en orden, para entender cómo evolucionó la tesis.

## Criterios de aceptación

### Argumentos

- [x] **TA-01** En la página de la tesis, donde hoy dice "Próximamente", dos pestañas: **A favor (N)** y **En contra (N)**, con los contadores de `argumentCounts` (Q1). La elegida queda en la URL (`?side=contra`): se comparte y vuelve con "atrás". A favor es la de por defecto; un valor desconocido también.
- [x] **TA-02** Cada pestaña muestra los argumentos de su lado (`GET /theses/{id}/comments?side=…`) con el mismo hilo que los comentarios de un post (`specs/comment-threads`): respuestas anidadas, votos, plegar, responder y el link a un argumento. Editar y borrar no están en los comentarios de un post todavía: tampoco acá.
- [x] **TA-03** **Ordenar** igual que los comentarios de un post (`specs/post-detail-refresh` PD-03, PD-04): Mejores, Top, Nuevos y Antiguos, en la URL (`?sort=`).
- [x] **TA-04** La caja para escribir es la del post (PD-02), dentro de cada pestaña: en A favor dice "Argumentá a favor" y publica con `side: PRO`; en En contra, `side: CONTRA` (Q3).
- [x] **TA-05** Una respuesta va al lado de su argumento: se manda con el `side` del padre, sin que quien responde elija (Q2).
- [x] **TA-06** Sin argumentos de un lado: "Todavía nadie argumentó a favor. Sé el primero." (o en contra). Sin sesión, escribir abre el modal de cuenta.
- [x] **TA-07** El contador del lado sube al publicar un argumento, como el de comentarios de un post (`specs/card-comment` CC-03).
- [x] **TA-08** En el feed, el contador de argumentos de la tarjeta lleva a la página con la pestaña del lado que tiene más (o A favor si empatan).

### Actualizaciones del autor

- [x] **TA-09** Arriba de los argumentos, si hay alguna, **Actualizaciones del autor**: cada una con su fecha y su texto en Markdown, de la más nueva a la más vieja (Q4).
- [x] **TA-10** Su autor, mientras la tesis está abierta, ve **Publicar una actualización**: una caja de texto (Markdown, hasta 2.000 caracteres, Q4) que se envía con `POST /theses/{id}/updates` y el `userId` de la sesión. Publicada, aparece primera sin recargar.
- [x] **TA-11** Errores: `409 THESIS_NOT_OPEN` ("La tesis ya no está abierta: no se pueden sumar actualizaciones"), `403` el genérico, sin sesión el modal de cuenta.
- [x] **TA-12** Las actualizaciones no se editan ni se borran (el contrato no lo permite): la caja lo dice antes de publicar.

### Calidad

- [x] **TA-13** A 360 px nada genera scroll horizontal; pestañas de 44 px de alto; axe sin violaciones en claro y oscuro con las dos pestañas y la caja abierta.
- [x] **TA-14** Presupuesto de JS (`seo.md`): las pestañas son links (servidor); el hilo reusa lo del post. La página de la tesis no puede pasar los 240 KB.
- [x] **TA-15** Mocks: argumentos de cada lado con respuestas en las tesis de ejemplo; `GET`/`POST` de comentarios con `side`; `GET`/`POST` de actualizaciones con su `409`. Validados en `fixtures.test.ts`.
- [x] **TA-16** Textos en en, es y pt.

## Fuera de alcance

- **Notificar a quienes votaron** cuando hay una actualización (ítem 27): backend.
- **Buscar** entre los argumentos (`?q=`, como PD-05): el backend responde, pero la búsqueda de comentarios de un post todavía es una propuesta (P-014). Va cuando se cierre ahí.
- **Votar la resolución** de una tesis vencida (`resolution-vote`): otro ticket.
- **Elegir otro lado al responder**, citar un argumento del lado contrario.

## Preguntas resueltas (2026-11-03, todas como se recomendaron)

- **Q1. Cómo se leen los lados:** ¿dos pestañas, A favor / En contra, cada una su hilo (**recomendado**: es lo que pide el ticket, "Pro/Con arguments tab", y el backend filtra por lado)? ¿O un solo hilo con una marca verde o roja en cada argumento, como el prototipo (🟢 / 🔴)?
- **Q2. El lado de una respuesta:** ¿hereda el de su argumento, sin elegir (**recomendado**: se responde dentro de una pestaña)? Hay que confirmar con Eugenio que el backend acepta y guarda así una respuesta (E05 no lo dice).
- **Q3. Dónde se elige el lado al escribir:** ¿por la pestaña en la que estás (**recomendado**: una caja por pestaña, sin un control más)? ¿O una sola caja con un selector A favor / En contra?
- **Q4. Las actualizaciones:** ¿arriba de los argumentos, de la más nueva a la más vieja, con un límite de 2.000 caracteres (**recomendado**; el contrato no fija largo, se ajusta con Eugenio)? ¿O en orden cronológico, como un hilo, debajo del razonamiento?
- **Q5. Anuncios entre los argumentos:** ¿como en un post, uno arriba y uno cada 10 (P-031), si el backend los manda para tesis (**recomendado**: se le pregunta a Eugenio y se mockea)? ¿O sin anuncios en las tesis?
- **Q6. La forma de `GET /updates`:** el backend devuelve `{ items }` y el contrato dice una lista. ¿Seguimos al backend y corregimos el snapshot del contrato (**recomendado**: es como devuelve todas las listas)?
