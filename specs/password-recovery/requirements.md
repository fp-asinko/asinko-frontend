# Recuperar la contraseña — Requirements

> **Estado:** aprobado por el PO el 2026-11-09. Tarea **MVP-217**.
>
> Viene de `specs/auth`, que dejó "Olvidé mi contraseña" fuera de alcance ("va en otra tarea", requirements § Fuera de alcance).
>
> **Fuente:** la API de Supabase Auth (el mismo proyecto que usa el backend, `specs/auth`), llamada por REST desde el servidor como el login:
>
> - `POST /auth/v1/recover` `{ email }` manda el mail de "Reset password". Responde igual exista o no la cuenta: no revela qué emails están registrados.
> - El mail lleva un token de un solo uso que vence (1 hora por defecto). `POST /auth/v1/verify` `{ type: 'recovery', token_hash }` lo canjea por una sesión.
> - `PUT /auth/v1/user` `{ password }` cambia la contraseña de quien tiene esa sesión.
> - El backend (`asinko-app`) no interviene: no hay que pedirle endpoints. Lo que sí hace falta es configurar Supabase (ver Dependencias).

## Objetivo

Que quien olvidó su contraseña pueda elegir una nueva desde un mail, sin ayuda de nadie, y vuelva a entrar con sesión.

## User stories

1. Como **usuario con cuenta**, quiero pedir un mail para elegir una contraseña nueva cuando no me acuerdo la mía, para no perder mi cuenta.
2. Como **usuario que abrió ese mail**, quiero elegir la contraseña nueva y quedar con sesión, para seguir donde estaba.
3. Como **usuario**, quiero que nadie pueda usar este camino para saber si un email tiene cuenta en Asinko.

## Criterios de aceptación

### Pedir el mail

- [ ] **PR-01** El formulario de **Log in** (en el modal y en `/login`) tiene un link **"¿Olvidaste tu contraseña?"** debajo del campo de contraseña. Abre el formulario de recuperación **dentro del modal**, sin cambiar de página; en `/login`, en la misma página. Se puede volver al log in.
- [ ] **PR-02** El formulario pide solo el **email**, ya completado con el que se había escrito en el log in. Antes de enviar, valida el formato (como AU-06).
- [ ] **PR-03** Al enviar, **siempre** muestra la misma confirmación, exista o no la cuenta: "Si hay una cuenta con ese email, te mandamos un link para elegir una contraseña nueva. Revisá también el spam." Con un botón para volver al log in.
- [ ] **PR-04** **Errores**, en el formulario, sin el mensaje de Supabase:
  - demasiados pedidos (`429`): que espere y pruebe de nuevo;
  - Supabase caído: que pruebe en un rato.
- [ ] **PR-05** Para no mandar mails de más, el botón queda bloqueado mientras se envía, y después de una confirmación "Reenviar" se habilita recién a los 60 segundos (el mínimo de Supabase entre dos mails al mismo email).

### Elegir la contraseña nueva

- [ ] **PR-06** El link del mail lleva a una página de Asinko, **en el idioma** en que se pidió. El token queda en el servidor (PR-13) y la página muestra el formulario **"Elegí tu contraseña nueva"**: un campo de contraseña de 8 caracteres o más (AU-06), que se puede mostrar, con `autocomplete="new-password"`.
- [ ] **PR-07** Al guardar, la persona queda **con sesión** y vuelve a la página donde había pedido el mail (`next`, con las reglas de AU-03); sin ella, al Home. Un aviso confirma que la contraseña cambió.
- [ ] **PR-08** **Link vencido (dura 1 hora, Q4), ya usado o inválido:** la página lo dice, sin detalles técnicos, y ofrece pedir uno nuevo (PR-01), con el email vacío. Se sabe al guardar, no al abrir el link: los filtros de mail abren los links antes que la persona, y canjear el token al abrir lo gastaría (`design.md § 1`, 2026-11-09). Sin el token (por ejemplo, la página abierta sin venir del mail), lo dice al abrirla.
- [ ] **PR-09** **Errores al guardar**, en el campo: contraseña débil (`weak_password`), igual a la anterior (`same_password`), sesión vencida mientras se elegía (vuelve a PR-08) y Supabase caído.
- [ ] **PR-10** Una cuenta **sin perfil** (creó la cuenta y no terminó la bienvenida) sigue el camino de siempre: después de guardar la contraseña va a la bienvenida (AU-09, AU-11).
- [ ] **PR-18** Al guardar la contraseña nueva, **se cierran las otras sesiones** de la cuenta: en cualquier otro dispositivo, la próxima acción pide entrar de nuevo (AU-13). La sesión actual sigue (Q1).
- [ ] **PR-11** Una cuenta creada **solo con Google** también puede pedir el mail. Al elegir la contraseña, puede entrar desde ese momento con email y contraseña además de Google (es lo que hace Supabase).

### Seguridad

- [ ] **PR-12** Nada de este flujo revela si un email tiene cuenta: la misma respuesta y en el mismo tiempo aproximado (PR-03).
- [ ] **PR-13** El token del mail **nunca** llega al JavaScript del navegador ni queda en el historial: lo canjea el servidor y la página redirige a una URL sin él. La sesión queda en la cookie `HttpOnly` de siempre (AU-16).
- [ ] **PR-14** Toda vuelta (`next`, el `redirect_to` que va a Supabase) acepta solo rutas internas (`security.md § 5`).
- [ ] **PR-15** Con `API_MOCKS=true` el flujo funciona contra el Supabase simulado (`src/mocks/auth.ts`): el pedido responde bien sin mandar nada, y hay un token de prueba que abre el formulario de PR-06, para los tests y para probarlo a mano.

### Calidad

- [ ] **PR-16** Textos en en, es y pt. A 360 px sin scroll horizontal. Teclado y lector de pantalla: cada campo tiene su label, los errores y la confirmación de PR-03 se anuncian, y al abrir un formulario el foco va a su campo. Axe sin violaciones en claro y oscuro.
- [ ] **PR-17** Presupuesto de JS dentro de 241 KB en todas las rutas: los formularios nuevos se cargan recién al abrirlos, como los del login (`seo.md`).

## Fuera de alcance

- **Cambiar la contraseña con sesión** (desde una página de cuenta o ajustes) y **cambiar el email**: no hay página de cuenta todavía.
- **Borrar la cuenta** (P-036).
- **Log in sin contraseña** (magic link o código por mail).
- El **diseño del mail** más allá del texto y el link: lo configura quien administra Supabase (ver Dependencias).

## Dependencias

Configuración de Supabase, a cargo de quien lo administra. Va como propuesta en `docs/references/api/proposals.md` cuando se apruebe este documento:

1. **SMTP propio.** El que trae Supabase manda muy pocos mails por hora y no sirve para producción. Sin esto, en `dev` se puede probar, pero no lanzar.
2. **Plantilla "Reset password"** en inglés (Q2), con el link a nuestra página (con el token, no el link por defecto de Supabase), y el texto de Asinko.
3. **Redirect URLs:** la ruta del link (`/auth/reset`, `design.md § 3`) en el dominio del front y sus previews.

## Preguntas resueltas

- **Q1. Al cambiar la contraseña se cierran las otras sesiones** (PO, 2026-11-09): todas menos la actual. Si alguien había entrado en otro dispositivo, queda afuera (PR-18).
- **Q2. El mail va solo en inglés** (PO, 2026-11-09): Supabase tiene una sola plantilla por tipo de mail. La página a la que lleva el link (PR-06) sí va en el idioma del sitio. Mails en tres idiomas necesitan otra herramienta de envío y quedan para después.
- **Q3. El link "¿Olvidaste tu contraseña?" se ve siempre** (PO, 2026-11-09), debajo del campo de contraseña (PR-01).
- **Q4. El link del mail dura 1 hora** (PO, 2026-11-09), el valor por defecto de Supabase (PR-08).
