# Recuperar la contraseña — Design

> **Estado:** borrador (2026-11-09), pendiente del Tech Lead. Requirements aprobados por el PO el 2026-11-09. Tarea **MVP-217**.
>
> Se apoya en `specs/auth/design.md`: el cliente REST de Supabase (§ 1, § 2), la sesión en cookie (§ 3), los Route Handlers fuera del locale (§ 5) y el modal de cuenta (§ 8, § 12).

## 1. Decisión principal: el token se canjea al guardar, no al abrir el link

Los filtros de seguridad de mail (Outlook Safe Links, gateways corporativos) **abren los links** antes que la persona. Si el token se canjeara al abrir el link, el filtro lo gastaría y la persona encontraría el link vencido.

Por eso:

1. El link del mail lleva a un Route Handler (`/auth/reset`) que **no llama a Supabase**: guarda el `token_hash` en una cookie `HttpOnly` y redirige a la página sin el token en la URL.
2. La página muestra el formulario.
3. Al guardar, la Server Action canjea el token, cambia la contraseña y cierra las otras sesiones, todo en el mismo request.

Lo que resigna: un link vencido se descubre al guardar, no al abrir la página. Se ajusta la redacción de PR-06 y PR-08 en `requirements.md` (el criterio es el mismo).

Descartado: **PKCE** (`code_challenge` en `/recover`). El `code_verifier` queda en una cookie del navegador que pidió el mail, y quien abre el mail en el celular después de pedirlo en la computadora no podría usarlo.

## 2. La API de Supabase Auth que se suma

En `src/lib/auth/supabase-auth.ts`, con el mismo `call` (que pasa a aceptar el método) y la misma regla: se lee el `error_code`, nunca el mensaje.

| Función                       | Llamada                                                         | Resultado                                                                   |
| ----------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `recover(email, redirectTo)`  | `POST /auth/v1/recover?redirect_to=…` `{ email }`               | `ok` siempre que no sea `429` o `5xx` (Supabase responde igual sin cuenta)  |
| `verifyRecovery(tokenHash)`   | `POST /auth/v1/verify` `{ type: 'recovery', token_hash }`       | `AuthResult` con los tokens; `otp_expired` u otro `4xx` → `expired`         |
| `updatePassword(token, pass)` | `PUT /auth/v1/user` `{ password }` con `Authorization: Bearer`  | `ok`, o `weakPassword`, `samePassword` (nuevo en `AuthFailure`), `expired`  |
| `signOutOthers(token)`        | `POST /auth/v1/logout?scope=others` con `Authorization: Bearer` | Mejor esfuerzo, como `signOut`: si falla, la contraseña ya cambió (ver § 5) |

`AuthFailure` suma `samePassword` (`error_code: same_password`). `429` (`over_email_send_rate_limit`) ya es `rateLimited`.

## 3. Rutas

| Ruta                          | Qué es                                                                                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/auth/reset` (Route Handler) | Llega desde el mail con `token_hash`, `type=recovery` y `next`. Valida el formato del token (zod) y `next` (`safeNext`), guarda el token en la cookie `asinko-recovery` y redirige a `/{locale}/reset-password?next=…`. Sin token válido, igual redirige: la página muestra el estado de link vencido. |
| `/[locale]/reset-password`    | La página del formulario (PR-06). Fuera de `(main)` y sin `loading.tsx`, como `/login`. `noindex`. Sin la cookie, muestra directamente el estado de PR-08. No redirige con sesión: alguien con sesión también puede venir del mail.                                                                    |

- **La cookie `asinko-recovery`:** `HttpOnly`, `SameSite=Lax` (llega con la redirección), `Secure` con https, `path=/`, `maxAge` de 1 hora (Q4). Guarda el token o, una vez gastado, la marca `verified` (§ 5). Se borra al guardar bien o cuando Supabase dice que el token no sirve.
- **El idioma:** `next` trae el locale de la página donde se pidió el mail (`localeOf`, `src/app/auth/paths.ts`); sin `next`, el idioma por defecto.
- El proxy no corre en `/auth/` (ya excluido): la página `/reset-password` sí pasa por él, con la CSP y el locale de siempre.
- `/reset-password` no se traduce (como `/login` y `/welcome`).

## 4. El link del mail

`recover` manda `redirect_to = {origen}/auth/reset?next={next}`. El origen sale del request de la Server Action (como Google, `startGoogle`); Supabase solo acepta un `redirect_to` que esté en sus Redirect URLs, así que un `Host` falso no sirve para mandar el link a otro dominio (cae al Site URL del proyecto).

La plantilla "Reset password" de Supabase arma el link con el token hash en vez del link por defecto (P-050):

```html
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a>
```

## 5. Server Actions (`features/auth/actions/`)

### `requestRecovery({ email, next })`

1. Valida con `recoverSchema` (email, como AU-06).
2. `supabaseAuth.recover(email, redirectTo)`.
3. Devuelve `{ ok: true }` también cuando Supabase no tiene la cuenta (PR-03, PR-12). Errores: `rateLimited` y `unavailable` (PR-04).

### `resetPassword({ password })`

1. Valida con `newPasswordSchema` (8 o más, AU-06). Una contraseña corta no gasta el link.
2. Lee `asinko-recovery`. Sin cookie → `{ ok: false, error: 'auth.reset.expired' }`.
3. Con el token: `verifyRecovery(tokenHash)`. `expired` → borra la cookie y devuelve `auth.reset.expired` (PR-08). Bien: `startSession(tokens)`, y la cookie pasa a valer `verified` (el token ya se gastó).
4. Con `verified`: usa la sesión actual. Sin sesión → `auth.reset.expired`.
5. `updatePassword(accessToken, password)`. `weakPassword` y `samePassword` van al campo (PR-09), y la cookie queda en `verified`: el próximo intento usa la sesión, sin otro mail. `expired` → borra la cookie y `auth.reset.expired`.
6. `signOutOthers(accessToken)` (PR-18, Q1). Mejor esfuerzo: si falla, se reporta a Sentry (sin el email ni el token) y se sigue.
7. Borra la cookie, `revalidatePath('/', 'layout')` y devuelve `{ needsProfile, suggestion }`, como `logIn`: sin perfil va a la bienvenida (PR-10).

**Por qué la marca `verified` (2026-11-09, al implementar):** sin un segundo intento, una contraseña rechazada por débil gastaría el link. Pero si el segundo intento aceptara cualquier sesión, cualquiera con sesión podría cambiar su contraseña por este camino sin saber la actual. La marca, que solo deja el paso 3, limita el reintento a la sesión que dio el link. También hace que, si se recarga la página después de un rechazo, siga mostrando el formulario.

`readRecovery`, `markRecoveryVerified`, `clearRecovery` y `requestOrigin` viven en `src/lib/auth/recovery-cookie.ts` (server-only); el formato del token y de la cookie, en `src/lib/auth/recovery.ts`.

## 6. Formularios

Con `react-hook-form`, `zodResolver` y `AuthField`, como el login, y cargados diferidos (`next/dynamic`, PR-17).

- **`RecoverForm`** (email): al enviar bien, se reemplaza por la confirmación (PR-03), con `role="status"`, el botón "Reenviar" con la cuenta regresiva de 60 s (PR-05) y "Volver a log in".
- **`ResetPasswordForm`** (contraseña nueva, `autocomplete="new-password"`, `reveal`). `auth.reset.expired` lo reemplaza por el estado de PR-08: el texto y el botón "Pedir un link nuevo", que lleva a `/login?mode=recover` con el mismo `next`.
- **`LogInForm`** suma el link "Forgot your password?" (un `<button type="button">`, PR-01, Q3) y una prop `onForgot(email)`, que recibe lo escrito en el campo email (PR-02).

## 7. UI

- **Modal de cuenta:** `GateView` (organismo `auth-gate`) suma `'recover'`, con su título (`authGate.title.recover`). En esa vista no se muestran el "¿No tenés cuenta?" ni Google: el pie es "Volver a log in". `AuthGateForms` guarda el email que trae `onForgot` y se lo pasa a `RecoverForm`.
- **`/login`:** `mode=recover` muestra `RecoverForm` (el link del log in cambia la query con `router.replace`, como el cambio a `signup`).
- **`/reset-password`:** el mismo armado de `/login` (logo, título y el formulario centrado).
- **Aviso al terminar (PR-07):** toast con `notify()` (`components/organisms/toaster`), "Your password was changed", después de la navegación a `next`. Va con un parámetro `?password=changed` que lee un componente cliente chico y luego limpia de la URL (como `?welcome=1`).

## 8. Textos

En `messages/{en,es,pt}.json`, namespace `auth` (ya está en `CLIENT_NAMESPACES`):

- `auth.login.forgot`
- `auth.recover.{title,submit,pending,sent,resend,resendIn,back}`
- `auth.reset.{title,submit,pending,expired,requestNew,done}`
- `auth.errors.samePassword`
- `authGate.title.recover`

## 9. Mocks y tests

**Supabase simulado** (`src/mocks/auth.ts`, PR-15):

- `POST /recover`: `200 {}` para cualquier email; `limited@asinko.dev` responde `429` (PR-04).
- `POST /verify` con `type: recovery`:
  - `mock-recovery-demo`: sesión del usuario demo;
  - `mock-recovery-new`: una cuenta sin perfil (PR-10);
  - cualquier otro: `403 otp_expired` (PR-08).
- `PUT /user`: cambia la contraseña de la cuenta en memoria; la misma que tenía → `422 same_password`.
- `POST /logout?scope=others`: `204`.

Para probarlo a mano con `API_MOCKS=true`: `/auth/reset?token_hash=mock-recovery-demo&type=recovery&next=/en`.

**Unitarios:**

- `supabase-auth.test.ts`: las cuatro funciones, con sus errores.
- `request-recovery.action.test.ts` y `reset-password.action.test.ts`: input inválido, la misma respuesta con y sin cuenta, sin cookie, token vencido, contraseña débil e igual, el reintento con la sesión, `signOutOthers` que falla y sin perfil.
- El Route Handler: guarda la cookie, la URL de destino no lleva el token y `next` externo se descarta.
- Los formularios: el link del log in con el email, la confirmación, la cuenta regresiva y el estado vencido.

**e2e** (`e2e/password-recovery.spec.ts`, mobile y desktop):

- pedir el link desde el modal y desde `/login`, con la misma confirmación para un email con y sin cuenta;
- el link de prueba, la contraseña nueva, la vuelta a `next` con sesión y el aviso;
- entrar con la contraseña nueva;
- link vencido;
- 360 px y axe en claro y oscuro;
- `/en/reset-password` en `e2e/performance.spec.ts` (PR-17).

## 10. Configuración (P-050)

Se pide a quien administra Supabase y se anota en `docs/references/api/proposals.md`:

1. **SMTP propio** (producción).
2. **Plantilla "Reset password"** en inglés con el link de § 4.
3. **Redirect URLs:** `{dominio}/auth/reset` y el de las previews.

Sin variables de entorno nuevas.

## 11. Trazabilidad

| Criterio                    | Dónde                                    |
| --------------------------- | ---------------------------------------- |
| PR-01, PR-02                | § 6 `LogInForm`, § 7                     |
| PR-03 a PR-05, PR-12        | § 5 `requestRecovery`, § 6 `RecoverForm` |
| PR-06 a PR-09, PR-11, PR-18 | § 1, § 3, § 5 `resetPassword`            |
| PR-10                       | § 5 paso 7                               |
| PR-13, PR-14                | § 3, § 4                                 |
| PR-15                       | § 9                                      |
| PR-16, PR-17                | § 6, § 8, § 9                            |
