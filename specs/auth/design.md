# Login y registro — Design

> **Estado:** aprobado por el PO el 2026-10-29.

## 1. Decisión principal: todo en el servidor, sin `supabase-js`

El navegador **nunca** habla con Supabase ni ve un token. Cada paso es una Server Action o un Route Handler de `asinko-web`, que llama a la API REST de Supabase Auth (`{SUPABASE_URL}/auth/v1/…`) con `fetch`, como ya hace el "Dev login".

| Opción                               | A favor                                                                                                           | En contra                                                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REST desde el servidor (elegida)** | Cero KB en el navegador (presupuesto de JS). Los tokens solo en cookies `HttpOnly` (AU-16). Sin dependencia nueva | Escribimos ~6 llamadas a mano (password, signup, refresh, PKCE, logout, user). Cada una es un `fetch` con su esquema zod: unas 150 líneas en total |
| `@supabase/ssr` + `supabase-js`      | La librería resuelve refresh y PKCE                                                                               | ~45 KB gzip si llega al navegador; guarda la sesión en cookies legibles por JS por defecto; duplica lo que ya resolvimos en `dev-session`          |

El handoff y la tarea mencionan `supabase-js`: lo que piden es el resultado (login con email y Google, Bearer en cada llamada, refresh). El resultado es el mismo y el backend no nota la diferencia.

## 2. La API de Supabase Auth que usamos

Todo con `apikey: SUPABASE_ANON_KEY` y validado con zod (`src/lib/auth/supabase-auth.ts`, `server-only`). Ningún mensaje de Supabase llega a la UI: se traduce a una razón (`credentials`, `emailTaken`, `rateLimited`, `unavailable`…).

| Para            | Llamada                                                                                            | Responde                                                    |
| --------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Log in          | `POST /auth/v1/token?grant_type=password` `{ email, password }`                                    | `{ access_token, refresh_token, expires_in, user: { id } }` |
| Crear la cuenta | `POST /auth/v1/signup` `{ email, password }`                                                       | Lo mismo (la confirmación por email está desactivada)       |
| Renovar         | `POST /auth/v1/token?grant_type=refresh_token` `{ refresh_token }`                                 | Lo mismo, con un refresh token nuevo                        |
| Google, ir      | `GET /auth/v1/authorize?provider=google&redirect_to=…&code_challenge=…&code_challenge_method=s256` | Redirección a Google                                        |
| Google, volver  | `POST /auth/v1/token?grant_type=pkce` `{ auth_code, code_verifier }`                               | Lo mismo que log in                                         |
| Cerrar sesión   | `POST /auth/v1/logout` con el Bearer                                                               | `204`: revoca el refresh token                              |

Errores que distinguimos: `400 invalid_credentials` → `credentials`; `422 user_already_exists` / `email_exists` → `emailTaken`; `422 weak_password` → `weakPassword`; `429` → `rateLimited`; red, timeout o `5xx` → `unavailable`.

## 3. Sesión (`src/lib/auth/session.ts`, server-only)

Reemplaza a `dev-session.ts`, que pasa a usarlo (el "Dev login" se queda, AU-17).

- **Cookie `asinko-session`**, `HttpOnly`, `SameSite=Lax`, `Secure` con https, `path=/`, **30 días** (se renueva con cada refresh):
  ```ts
  { accessToken, refreshToken, userId, username: string | null, expiresAt }
  ```
  `username: null` = cuenta sin perfil (AU-09, AU-11). Validada con zod al leerla; una cookie rota es "sin sesión".
- **`readSession()`**: la de la cookie, o `null`. Ya no se apaga en producción (sí el "Dev login").
- **`getViewer()`** (`lib/session.ts`) devuelve `{ id, username }` solo con perfil. Nueva **`getAccountState()`**: `'guest' | 'needs-profile' | 'ready'`, para el layout.
- **`getAccessToken()`** sigue alimentando el Bearer del cliente HTTP (AU-15), también sin perfil (lo necesita `POST /users`).
- Con `API_MOCKS=true` todo sigue igual (§ 9).

## 4. Renovar sin que se note (AU-13): en el proxy

El access token de Supabase dura 1 hora. `src/proxy.ts` ya corre antes de cada página y cada Server Action (antes de que llamen a la API, `api-integration.md § Sesión`):

1. Si hay sesión y al access token le queda **menos de 60 s**, pide uno nuevo con el refresh token.
2. Pone la cookie nueva en la **respuesta** (para el navegador) y en el **request** que sigue al render, para que el servidor ya use el token nuevo en esa misma carga (patrón de `proxy.md § Using cookies`).
3. Si Supabase rechaza el refresh token (revocado, cuenta borrada), borra la cookie: la página se ve sin sesión, sin error (AU-13).
4. Si Supabase no responde, deja la cookie como está y sigue: el render ve el token vencido, la API responde `401` y la acción abre el modal.

Dos pedidos en paralelo con el mismo refresh token (por ejemplo, prefetches) no rompen la sesión: Supabase acepta reusar el anterior durante 10 s (_reuse interval_).

## 5. Rutas

Iguales en todos los idiomas, con el prefijo, como `/hub` y `/user` (`i18n.md § URLs`):

| Ruta                       | Qué es                                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/{locale}/login`          | El formulario de log in como página (AU-03), con pestaña a crear cuenta (`?mode=signup`) y Google. Con sesión, redirige a `next` o al Home. `noindex` |
| `/{locale}/welcome`        | Elegir username y aceptar (AU-11). Solo con sesión sin perfil; si no, redirige. `noindex`                                                             |
| `GET /auth/google?next=`   | Route Handler: genera el `code_verifier` (cookie `HttpOnly` de 10 min junto con `next`) y redirige a Supabase                                         |
| `GET /auth/callback?code=` | Route Handler: canjea el código, guarda la sesión, pide el perfil y redirige a `next` o a `/welcome?next=…`. Un error vuelve a `/login?error=google`  |

`next` se valida en cada punto con la misma función (`safeNext`, `lib/auth/next.ts`): solo una ruta que empieza con `/` y no con `//` ni `/\`. Si no, el Home (AU-03).

**Para el backend (Eugenio):** en Supabase, _Redirect URLs_ tiene que aceptar `{dominio}/auth/callback`, la de las previews y `http://localhost:3000/auth/callback` para desarrollo.

## 6. Server Actions (`features/auth/actions/`)

Todas validan con zod, nunca reciben un `userId` y devuelven `ActionResult` con claves de traducción.

| Action          | Input                                           | Hace                                                                                                                                                                        |
| --------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `logIn`         | `{ email, password }`                           | Password grant → `GET /users/{id}` para el username (`404` → `username: null`) → cookie                                                                                     |
| `signUp`        | `{ email, password, username, accepted: true }` | Signup en Supabase → cookie (sin perfil) → `POST /users` → cookie con el username. Si `POST /users` falla, devuelve el error del campo y la sesión queda sin perfil (AU-09) |
| `createProfile` | `{ username, accepted: true }`                  | Con sesión sin perfil: `POST /users` → cookie con el username                                                                                                               |
| `logOut`        | —                                               | `POST /auth/v1/logout` (sin esperar si falla) y borra la cookie                                                                                                             |

Al terminar bien, `revalidatePath('/', 'layout')`: toda la página se vuelve a dibujar con o sin sesión (AU-02, AU-14).

`POST /users` se llama a través del cliente HTTP de siempre (`features/auth/lib/profile-api.ts`), con su esquema y su mapeo de errores: `409 USERNAME_TAKEN` y `422 INVALID_USERNAME` van al campo username.

## 7. Formularios

- **Esquemas** (`features/auth/schemas/`): `logInSchema`, `signUpSchema`, `profileSchema`. Email con `z.email()`, contraseña de 8 a 72 caracteres (el máximo de bcrypt), username `/^[a-zA-Z0-9_]{3,30}$/` (el del backend), `accepted: z.literal(true)`. Mensajes = claves (`i18n.md`).
- **`react-hook-form` + `zodResolver`** con los `Field` de shadcn (`libraries.md`). Zod pesa ~90 KB en el navegador: los formularios **se cargan diferidos** (AU-19, `seo.md § Zod`):
  - en el modal, al pasar a "Log in" o "Create account" (el modal ya es diferido);
  - en `/login` y `/welcome`, con un esqueleto del mismo alto mientras carga, como la página de crear post.
- Errores del servidor con `setError` en su campo, o arriba del formulario (`role="alert"`) cuando no son de un campo (credenciales, `429`, caído). El foco va al primer campo con error (AU-18).
- Botón principal deshabilitado mientras la action corre (sin doble envío, `security.md § 7`) y, en crear cuenta, hasta marcar el checkbox (AU-05).
- Inputs de 16 px (zoom de iOS), `autocomplete` (`email`, `current-password`, `new-password`, `username`) y el ojo para mostrar la contraseña.

## 8. UI

- **Modal** (`components/organisms/auth-gate/`): suma una vista. `request.action` de `'login'` o `'signup'` abre directo ese formulario; las demás muestran la invitación de hoy, ahora con los botones funcionando (AU-01). Debajo, "o", **Continuar con Google** (un link a `/auth/google?next=…`: anda sin JavaScript) y **Reddit** "Próximamente" (AU-12). Se borran Instagram y X de `brand-marks.tsx`; se suma la G de Google (Simple Icons, CC0, en el color del texto como las otras).
  - Los organismos no conocen features: el layout le pasa al `AuthGateProvider` los formularios como slots ya diferidos (`loginForm`, `signupForm`), igual que `devTools`.
- **Sin perfil** (AU-11): el layout pasa `accountState`. Con `'needs-profile'`, `requireAccount` lleva a `/welcome?next=…` en lugar de abrir el modal, y la barra superior muestra "Elegí tu username" en lugar del perfil.
- **Cerrar sesión** (AU-14): el perfil de la barra hoy es un link directo a tu página, sin menú. La opción va en el menú **"⋯"** (`MoreMenu`), que ya tiene idioma y tema, como el último ítem con sesión. Se ajusta AU-14 en ese sentido.

## 9. Mocks y tests

- **Con `API_MOCKS=true`** (CI) no hay Supabase. `src/mocks/auth.ts` responde las llamadas de § 2 en el mismo lugar del código (la función de `supabase-auth.ts` consulta el mock antes de la red, como el cliente HTTP):
  - `demo@asinko.dev` / `demo-password` entra como el usuario demo;
  - una cuenta nueva se guarda en memoria, y `POST /users` (mock nuevo, tipo contrato) le crea el perfil;
  - `taken@asinko.dev` responde email registrado, y el username `taken` responde `USERNAME_TAKEN`;
  - Google redirige directo al callback con un código de prueba.

  `getViewer()` en ese modo: la cookie de sesión si hay; si no, el usuario demo salvo la cookie de invitado (como hoy).

- **Unitarios:** `session` (leer, escribir, vencida, rota, sin perfil), `supabase-auth` (cada llamada y cada error contra un `fetch` falso), el refresh del proxy (renueva, borra si lo rechazan, sigue si está caído), `safeNext`, los tres esquemas, las cuatro actions (input inválido, sin sesión, `userId` de la sesión, errores al campo), los formularios y el modal con sus vistas.
- **E2E** (`e2e/auth.spec.ts`, en mobile y desktop, con mocks): crear cuenta desde el modal y ver la sesión; log in y log out desde "⋯"; errores de credenciales y de username tomado; Google → `/welcome` → elegir username → vuelve a la página; `/login?next=` vuelve a esa ruta y rechaza `//evil.com`; 360 px y axe en claro y oscuro; el peso de JS (`performance.spec.ts` suma `/login` y `/welcome`).
- **A mano contra `dev`**, con una cuenta real: los cinco puntos de MVP-201 que quedaron para la sesión real (subidas, destacados, borradores, relacionadas, impresiones).

## 10. Configuración

- `SUPABASE_URL` y `SUPABASE_ANON_KEY` (ya existen, solo del servidor: el navegador no los usa) pasan a ser **obligatorias en producción** (AU-20, `refineEnv`). El handoff habla de `NEXT_PUBLIC_SUPABASE_*`: no hace falta exponerlas.
- En Vercel hay que cargarlas con esos nombres en cada ambiente.
- `.env.example` lo explica. `DEV_LOGIN_*` sigue igual y sigue prohibida en producción.
- CSP sin cambios: el navegador no llama a Supabase (`connect-src` igual); Google es una navegación, no un `fetch`.
