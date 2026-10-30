# Login y registro — Tasks

Rama: `feature/auth-login`, desde `develop`. Requirements y design aprobados por el PO el 2026-10-29.

- [x] **T-01 (M)** Supabase Auth por REST: `lib/auth/supabase-auth.ts` (password, signup, refresh, PKCE, logout), sus esquemas y razones de error, y el mock de `API_MOCKS=true` (`src/mocks/auth.ts`). Tests. → AU-04, AU-08, AU-16
- [x] **T-02 (M)** Sesión: `lib/auth/session.ts` (cookie con refresh token y `username` nulo), `getViewer`, `getAccountState`, `getAccessToken`; `dev-session` pasa a usarla. `refineEnv`: Supabase obligatorio en producción; `.env.example`. Tests. → AU-13, AU-15 a AU-17, AU-20
- [x] **T-03 (M)** Renovar en el proxy (antes de 60 s; cookie en la respuesta y en el request; borrar si la rechazan; seguir si está caído). Tests. → AU-13
- [x] **T-04 (M)** Feature `auth`: esquemas, `profile-api.ts` (`POST /users`, `GET /users/{id}`), mock de `POST /users`, actions `logIn`, `signUp`, `createProfile`, `logOut`, y `safeNext`. Textos. Tests. → AU-02, AU-05 a AU-09, AU-11, AU-14
- [x] **T-05 (M)** Google: Route Handlers `/auth/google` y `/auth/callback`, cookie del `code_verifier`. Tests. → AU-10
- [x] **T-06 (L)** UI: formularios de log in, crear cuenta y username (diferidos); el modal con sus vistas, Google y Reddit; páginas `/login` y `/welcome`; "Cerrar sesión" en "⋯"; el estado sin perfil en el gate y la barra. Textos en en, es y pt. Tests. → AU-01 a AU-03, AU-05, AU-11, AU-12, AU-14, AU-18
- [x] **T-07a (M)** e2e (`auth.spec.ts`), 360 px, axe, presupuesto de JS con `/login` y `/welcome`. → AU-18, AU-19
- [x] **T-08 (S)** Cambio del PO (2026-10-30): la foto de Google en el paso 2 (design.md § 15). Tests. → AU-22
- [x] **T-09 (S)** Cambio del PO (2026-10-30): el nombre visible en el paso 2, con el de Google (design.md § 16). Tests. → AU-23
- [ ] **T-07b (S)** Verificación a mano contra `dev` con una cuenta real (email y Google), y los cinco puntos de MVP-201. Necesita `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `.env.local` y `/auth/callback` en las Redirect URLs de Supabase.

| Criterio     | Test                                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| AU-01, AU-12 | `auth-gate.test.tsx`, e2e `auth.spec.ts`                                                                                            |
| AU-02, AU-07 | `auth.action.test.ts`, `auth-forms.test.tsx`, e2e                                                                                   |
| AU-03        | `next.test.ts`, e2e                                                                                                                 |
| AU-04, AU-08 | `supabase-auth.test.ts`, actions, formularios, e2e                                                                                  |
| AU-05, AU-06 | `auth.schema.test.ts`, `auth-forms.test.tsx`                                                                                        |
| AU-09, AU-11 | `auth.action.test.ts`, `auth-gate-forms.test.tsx`, e2e                                                                              |
| AU-10        | `google.test.ts`, e2e                                                                                                               |
| AU-13        | `session.test.ts`, `refresh-session.test.ts`                                                                                        |
| AU-14        | `auth.action.test.ts`, `more-menu.test.tsx`, e2e                                                                                    |
| AU-15, AU-16 | `session.test.ts`, `api` client tests                                                                                               |
| AU-17        | `session.test.ts` (modo mocks), `dev-session.test.ts`                                                                               |
| AU-18        | Tests de componentes, e2e (axe, 360 px)                                                                                             |
| AU-19        | `performance.spec.ts`                                                                                                               |
| AU-20        | `env-schema.test.ts`                                                                                                                |
| AU-22        | `google-photo.test.ts`, `suggested-photo.action.test.ts`, `auth-forms.test.tsx`, e2e                                                |
| AU-23        | `auth.schema`, `auth.action.test.ts`, `profile-api.test.ts`, `supabase-auth.test.ts`, `sign-up.test.ts`, `auth-forms.test.tsx`, e2e |
