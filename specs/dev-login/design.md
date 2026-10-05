# Login de desarrollo con Bearer — Design

> **Estado:** aprobado el 2026-10-05.

## 1. Iniciar sesión sin librería

- `POST {SUPABASE_URL}/auth/v1/token?grant_type=password`, con el header `apikey: SUPABASE_ANON_KEY` y el body `{ email, password }`. Responde `access_token`, `expires_in` y `user.id`. Son menos de 50 líneas y no hace falta `@supabase/supabase-js` (`libraries.md`, criterio 2).
- `Profile.id` es igual a `auth.users.id` en el backend (`schema.prisma`). El `userId` de las escrituras sale del token.
- El username se pide una vez al iniciar sesión, con `GET /api/v1/profiles/{id}` y Bearer, y se guarda junto al token.

## 2. Sesión (`src/lib/auth/dev-session.ts`, server-only)

- Cookie `asinko-session` (`HttpOnly`, `SameSite=Lax`, `Secure` con https, `path=/`, `maxAge = expires_in`) con `{ accessToken, userId, username, expiresAt }`, validada con zod al leerla.
- `getViewer()` (`lib/session.ts`):
  - Con `API_MOCKS=true`, el usuario demo, como hasta ahora.
  - En los demás modos, el de la cookie si no venció; si no, `null`.
- `getAccessToken()` alimenta el cliente HTTP.

## 3. Bearer en cada request (DL-04)

`createApiClient` suma la opción `getHeaders`, una función async que el cliente llama en cada request a la red. `lib/api/index.ts` le pasa `authHeaders()`, que lee la cookie. Los mocks no la usan.

## 4. Botón (DL-01, DL-06)

- Server Actions `devLogin` y `devLogout` (`features/dev-login/actions`):
  - No reciben input: las credenciales salen del entorno.
  - Verifican `APP_ENV !== 'production'` y que las variables existan.
  - Ponen o borran la cookie y `revalidatePath` del layout, así toda la app se vuelve a renderizar con o sin sesión.
- `DevLoginButton` (cliente, en el mismo feature):
  - Sin sesión, "Dev login".
  - Con sesión, "@usuario · Dev logout".
  - Muestra un estado pendiente mientras inicia sesión y un error si falla (credenciales, backend caído).
- El layout se lo pasa a `AppShell` como slot (`devTools`), igual que la columna izquierda: los organismos no conocen features. Solo se renderiza si `isDevLoginEnabled()`.

## 5. Tests

- **Unitarios:**
  - `dev-session`: lee y escribe la cookie, la valida y respeta el vencimiento.
  - `authHeaders` / `getHeaders`: manda el Bearer y no lo manda sin sesión.
  - Las actions: rechazan sin variables o en producción, y con credenciales inválidas devuelven un error sin el mensaje de Supabase.
  - `DevLoginButton`: los dos estados.
  - `env-schema`: `DEV_LOGIN_*` en producción falla.
- **Sin e2e:** depende de Supabase real. Se verifica a mano contra `asinko-app` local, y el CI no tiene las variables, así que el botón no existe ahí.

## Ajuste: activos de ejemplo (2026-10-05)

Una cuenta de prueba nueva no está unida a ninguna comunidad de activos, y la sección Assets queda vacía. Pedido del usuario: verla con activos sin escribir en la base de dev.

- Con `API_MOCKS=missing` (solo desarrollo: `src/env.ts` lo rechaza en producción), si la cuenta con sesión no sigue ningún activo, la columna muestra `DEV_SAMPLE_ASSETS` (`features/interests/interests.constants.ts`): BTC, ETH, SOL, XRP, LINK y AVAX, con precios de los mocks de E14.
- Nunca reemplaza los activos que la cuenta sí sigue, nunca aparece sin sesión y no existe con `API_MOCKS=false`.
- El link de cada mosaico usa la comunidad real del backend cuando existe (BTC, ETH); las demás filtran por un slug que el backend no tiene.
- Se borra cuando E14 deje de estar mockeado.
