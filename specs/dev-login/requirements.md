# Login de desarrollo con Bearer — Requirements

> **Estado:** aprobado el 2026-10-05 por pedido directo del Product Owner: "un botón en el header para autologuearme con esta lógica… y poder ver la vista de un usuario logueado".
> **Indicaciones del backend:**
>
> - La cuenta se crea en `asinko-app` local, en `/login`.
> - El front hace `signInWithPassword` con esa cuenta y manda el access token como `Authorization: Bearer` en cada request (P-002, ya en el contrato).
> - Se puede publicar en la comunidad personal; en otras, hay que unirse antes (`PUT /communities/{slug}/members/{userId}`).

## Objetivo

Ver y usar Asinko como un usuario con sesión, contra el backend real, sin esperar al login completo (spec `auth`). Es una herramienta de desarrollo: **nunca existe en producción**.

## Criterios de aceptación

- [ ] **DL-01** Con las credenciales de prueba en `.env.local` (`DEV_LOGIN_EMAIL`, `DEV_LOGIN_PASSWORD`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`), la barra superior muestra un botón **"Dev login"**. Sin esas variables, o en producción, el botón no existe.
- [ ] **DL-02** Al tocarlo, el servidor inicia sesión en Supabase con esas credenciales. El navegador **nunca** las ve.
- [ ] **DL-03** El access token se guarda en una **cookie `HttpOnly`**, `SameSite=Lax` y `Secure` cuando el sitio es https (`security.md § 3`). Nunca va a `localStorage` ni al JS del navegador.
- [ ] **DL-04** Todas las llamadas del servidor al backend llevan `Authorization: Bearer <token>` mientras haya sesión.
- [ ] **DL-05** Con sesión, la app se ve como la de un usuario: sin modales de cuenta ni "Log in"/"Sign up", con la campana y el perfil, la columna con sus intereses y el composer con su inicial. Las escrituras (votar) van al backend real con el `userId` de la sesión.
- [ ] **DL-06** Un botón "Dev logout" borra la cookie. Si el token vence (1 h), la app vuelve a "sin sesión" y basta con tocar "Dev login" otra vez.
- [ ] **DL-07** **Nunca en producción:** `src/env.ts` rechaza las variables `DEV_LOGIN_*` con `APP_ENV=production` (el build falla), y la Server Action vuelve a verificarlo.
- [ ] **DL-08** Ningún secreto en el repo: `.env.example` lleva las cuatro variables con valores de ejemplo y una nota de cómo crear la cuenta.

## Fuera de alcance

- El login real (formulario, registro, redes, renovación del token): spec `auth`.
- Unirse a comunidades y publicar: specs siguientes. Con este login ya van a poder hacerlo.
