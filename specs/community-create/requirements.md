# Crear un grupo — Requirements

> **Estado:** aprobado por el PO el 2026-11-06, con Q1 a Q5 como se recomendaron.
> **Fuente:** tarea **MVP-204** (sprint MVP-3), "[Front] Crear comunidad: formulario con avatar, banner, descripción y reglas". Sale de MVP-129, que cubre ver un grupo y unirse.
> **Decisiones del PO (2026-11-06):** página propia, porque más adelante el grupo suma widgets (`specs/community-widgets`); el handle se arma solo desde el nombre, se puede editar y avisa si está tomado; límites de largo propios; al crear, se va a la página del grupo.
> **Backend:**
>
> - `POST /api/v1/communities` está implementado (E02, listo el 2026-10-22). Crea un grupo `USER_PUBLIC` y deja a quien lo crea como moderador principal y primer miembro.
> - Las imágenes van por `POST /api/v1/uploads/community-image` (URL firmada). Falta confirmar su body antes de que el grupo exista (Q5).
> - El backend no limita el largo de los textos: se propone en P-048.

## Objetivo

Que cualquier persona con cuenta pueda abrir su propio grupo, con nombre, handle, descripción, imágenes y reglas, y llegar a su página lista para invitar gente.

## User stories

- Como usuario, quiero crear un grupo sobre un tema (por ejemplo, opciones o dividendos) para juntar a la gente que lo discute.
- Como usuario, quiero elegir el handle de mi grupo (`#dividendos-latam`) y saber antes de enviar si está libre.
- Como usuario, quiero ver cómo va a quedar el grupo mientras lo armo.
- Como creador, quiero llegar a la página del grupo apenas lo creo, ya como moderador.

## Criterios de aceptación

### Entrada

- [ ] **CG-01** "Create group" de la columna izquierda deja de ser "Próximamente" y lleva a la página **`/{locale}/create-group`** (Q1). Sin sesión, la página muestra lo mismo que crear post sin sesión: el aviso para entrar con su botón, que vuelve a esta página al entrar (`specs/auth`).
- [ ] **CG-02** La página tiene su título ("Create a group"), su metadata traducida y `noindex`: es un formulario, no contenido.

### El formulario

- [ ] **CG-03** Campos, en este orden y con **títulos de paso numerados** (Q2): el mismo `StepTitle` de la tesis, con ✓ al completarse y "(opcional)" en los opcionales.
  1. **Nombre** (obligatorio): de 3 a 50 caracteres.
  2. **Handle** (obligatorio): `#` fijo adelante. De 3 a 30 caracteres: minúsculas, números y guiones, sin guion al principio ni al final.
  3. **Descripción** (opcional): hasta 500 caracteres.
  4. **Avatar y banner** (opcionales): se recortan como la foto y el banner del perfil (`specs/profile-presentation` PP-07).
  5. **Reglas** (opcionales): texto plano con saltos de línea, como se muestran hoy en la página del grupo. Hasta 2000 caracteres.
  6. **Sitio web** (opcional): `http(s)` con dominio, hasta 300 caracteres, como los links del perfil.
- [ ] **CG-04** Los campos con límite muestran su contador al acercarse al tope. Los errores van debajo de cada campo, con texto y no solo color.

### El handle

- [ ] **CG-05** Mientras no lo tocaste, el handle **sigue al nombre**:
  - pasa a minúsculas y le saca los acentos;
  - los espacios y los símbolos se vuelven un guion, y los guiones repetidos o de los bordes se borran;
  - se corta en 30 caracteres.

  "Dividendos LatAm" → `dividendos-latam`. Apenas lo editás, deja de seguirlo.

- [ ] **CG-06** Mientras se escribe, después de una pausa, avisa si el handle está **libre** ("#dividendos-latam is available", con ✓) o **tomado** ("Already taken", con ✗). Para eso pregunta por `GET /communities/{slug}`: un `404` significa libre. Un handle que otro grupo dejó hace menos de un año también responde, así que figura como tomado, igual que en el backend. Si la consulta falla, no se muestra nada y el control queda para el envío.
- [ ] **CG-07** Un handle con formato inválido muestra el error sin consultar al backend.

### Vista previa

- [ ] **CG-08** Desde `lg`, en la columna derecha va una **vista previa** del grupo como se verá su cabecera:
  - el banner, o el degradé del tono que le toca al handle (`IdentityBanner`);
  - el avatar, o su inicial con el tono;
  - `#handle`, el nombre y la descripción.

  Se actualiza al escribir. En mobile y tablet va debajo del formulario, antes del botón (Q3).

### Crear

- [ ] **CG-09** "Create group" queda deshabilitado mientras falte el nombre o el handle, o mientras se esté creando, para que no se envíe dos veces. La Server Action:
  - valida todo con el mismo esquema que el formulario;
  - toma el `userId` de la sesión;
  - llama a `POST /communities`, sin imágenes.

  Después, cada imagen elegida se sube **ya con el grupo creado** y se guarda en él (Q5).

- [ ] **CG-10** Al crear, lleva a la página del grupo, **`/hub/{slug}`**, ya como miembro y moderador. El grupo aparece en "Grupos" de la columna izquierda sin recargar.
- [ ] **CG-11** Errores al crear:
  - `409 SLUG_TAKEN`: marca el handle como tomado y pone el foco ahí.
  - `422 INVALID_SLUG`: marca el handle como inválido.
  - `401`: abre la ventana de cuenta.
  - Un fallo inesperado: un aviso con lo escrito intacto, para reintentar.
  - Si una imagen no se pudo subir, el grupo **ya quedó creado**: se va igual a su página, sin esa imagen, con un aviso que lo dice (Q5).
- [ ] **CG-12** Cerrar o recargar la pestaña con algo escrito pide confirmación del navegador. Es nuevo en el sitio: crear post no lo pide, porque guarda borradores, y un grupo no tiene borradores.

### Calidad

- [ ] **CG-13** Mobile first: a 360 px, una columna sin scroll horizontal y campos con texto de 16 px. Todo con teclado. Axe sin violaciones en claro y oscuro.
- [ ] **CG-14** Presupuesto de JS (`seo.md`): la página nueva entra en `e2e/performance.spec.ts` y no pasa el tope (241 KB desde el 2026-11-07). El recorte de imágenes y el formulario con zod van diferidos, como en crear post y "Editar perfil".
- [ ] **CG-15** Mocks con `API_MOCKS=true`: `POST /communities` (con `409` y `422`) y la consulta del handle, validados en `fixtures.test.ts`. Los textos van en en, es y pt.

### Mejoras de UX (PO, 2026-11-07)

Después de ver la primera versión, el PO aprobó las mejoras rápidas y medianas:

- [ ] **CG-16** El paso de imágenes no ocupa todo el ancho: hasta 512 px, así el banner mide como la cabecera del grupo y no domina el formulario.
- [ ] **CG-17** Sin nombre ni handle, la vista previa y las imágenes muestran `#` en el avatar, no las iniciales de "your-group".
- [ ] **CG-18** Los placeholders dicen que son un ejemplo ("e.g. Dividends LatAm"), para que no parezcan un valor cargado.
- [ ] **CG-19** Debajo del handle válido se ve la dirección del grupo (`/hub/{slug}`). Si está tomado, se ofrecen hasta tres alternativas que se eligen con un toque y se vuelven a consultar.
- [ ] **CG-20** En el celular, el botón "Create group" queda fijo sobre la barra inferior mientras se completa el formulario, como en crear post.
- [ ] **CG-21** Al crear, un toast confirma "Your group is ready" en la página del grupo.
- [ ] **CG-22** Mientras se escribe el nombre, después de una pausa, se muestran hasta tres grupos existentes con nombre parecido ("Similar groups"), con link a cada uno, para evitar duplicados. Usa `GET /communities?search=`; si falla, no se muestra nada.
- [ ] **CG-23** En la columna derecha, debajo de la vista previa, una tarjeta "Tips for a good group": nombre claro, descripción de para quién es y reglas cortas.

## Fuera de alcance

- Un checklist de "primeros pasos" en la página del grupo nuevo (propuesto el 2026-11-07): sin "Editar grupo", sus pasos (foto, descripción, reglas) no tendrían dónde hacerse. Va con el spec de editar un grupo.
- Editar un grupo después de crearlo (`PATCH /communities/{slug}`), cambiar el handle y transferir la moderación.
- Grupos privados o restringidos, contenido para adultos y temas: el backend solo crea grupos públicos.
- Los widgets del grupo: tienen su spec (`specs/community-widgets`).
- Invitar gente desde la página de creación.

## Preguntas resueltas (2026-11-06, todas como se recomendaron)

Q5 se resolvió con el camino seguro: sirve tanto si el backend pide `communityId` como si no. Además, una Server Action acepta hasta 4,5 MB (`next.config.ts`), y dos imágenes de 4 MB no entrarían en un solo envío.

- **Q1 — La ruta.** Recomendado: **`/create-group`**, en inglés en todos los idiomas, como `/submit`. `/hub/create` se vería más ordenado, pero choca con un grupo cuyo handle sea `create`.
- **Q2 — ¿En pasos numerados, como la tesis?** Recomendado: **sí**, con el mismo `StepTitle`: ① Nombre ② Handle ③ Descripción ④ Imágenes ⑤ Reglas ⑥ Sitio web, y los opcionales marcados como tales. Reddit, por lo que sé, lo hace en una ventana de cuatro pantallas (nombre y descripción, estilo, temas y tipo); en una página propia, todo a la vista es más rápido.
- **Q3 — La vista previa en el teléfono.** Recomendado: **debajo del formulario, antes del botón**: se ve al terminar, sin tapar los campos.
- **Q4 — Los límites.** Recomendado: los de CG-03. Reddit, por lo que sé, limita el nombre de un subreddit a 21 caracteres porque el nombre es el handle. Acá son dos cosas distintas, y 30 alcanza para un handle legible. Se le proponen al backend (P-048) para que valide lo mismo.
- **Q5 — Las imágenes antes de que el grupo exista.** Nuestra propuesta P-029 pide `communityId` y ser moderador, y al crear el grupo todavía no existe. La tarea dice "como la foto del perfil", o sea, posiblemente solo `{ userId, contentType, size }`. Falta leerlo en `HANDOFF-frontend.md` § Recetas del backend. Si pide `communityId`: se crea el grupo sin imágenes, se suben ya como moderador y se guardan con `PATCH`. Si alguna falla, el grupo queda creado sin ella y se avisa. Esto cambiaría la última frase de CG-11.
