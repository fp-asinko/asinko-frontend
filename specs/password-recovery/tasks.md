# Recuperar la contraseña — Tasks

> **Estado:** aprobado por el Tech Lead el 2026-11-09. T-01 a T-05 hechas el mismo día; T-06 espera P-050. Tarea **MVP-217**.

Rama: `feature/password-recovery`, desde `develop`.

- [x] **T-01 (M)** Supabase Auth: `recover`, `verifyRecovery`, `updatePassword` y `signOutOthers` en `lib/auth/supabase-auth.ts` (`call` acepta el método; `samePassword` en `AuthFailure`). El Supabase simulado: `/recover`, `/verify` con los tokens de prueba, `PUT /user` y `logout?scope=others` (design.md § 2, § 9). Tests. → PR-04, PR-09, PR-12, PR-15
- [x] **T-02 (S)** Route Handler `/auth/reset`: valida token y `next`, guarda la cookie `asinko-recovery` y redirige sin el token (design.md § 3). Tests. → PR-06, PR-13, PR-14
- [x] **T-03 (M)** Server Actions `requestRecovery` y `resetPassword`, con sus esquemas: misma respuesta con y sin cuenta, el reintento con la sesión, cerrar las otras sesiones y la cuenta sin perfil (design.md § 5). Textos de error. Tests. → PR-03, PR-04, PR-07 a PR-12, PR-18
- [x] **T-04 (L)** UI: el link en `LogInForm`, la vista `recover` del modal y `/login?mode=recover`, `RecoverForm` con la confirmación y la cuenta regresiva, la página `/reset-password` con `ResetPasswordForm` y el estado vencido, y el aviso al terminar (design.md § 6, § 7). Textos en en, es y pt. Tests. → PR-01 a PR-03, PR-05 a PR-08, PR-16
- [x] **T-05 (M)** e2e `password-recovery.spec.ts` (mobile y desktop, 360 px, axe en claro y oscuro) y `/en/reset-password` en el presupuesto de JS. → PR-16, PR-17
- [ ] **T-06 (S)** Verificación a mano contra `dev` con una cuenta real, cuando P-050 esté configurado: el mail llega, el link funciona desde otro dispositivo, la otra sesión queda afuera y una cuenta de Google puede elegir contraseña. → PR-06, PR-11, PR-18
  - **2026-11-12, contra `dev` (Supabase y `asinko-app`) con `API_MOCKS=missing`, sin el mail:** dos cuentas descartables creadas con la API de admin y borradas al final (el perfil, con `DELETE /users`). El link salió de `admin/generate_link` (`hashed_token`), con la forma de la plantilla de P-050. Todo bien:
    - PR-06, PR-13: el link abre "Choose a new password"; el token queda en la cookie `HttpOnly`, no en la dirección.
    - PR-07: con perfil vuelve al `next` (`/es/asset/BTC`) con sesión; la contraseña nueva entra y la vieja no.
    - PR-08: un link usado y uno inválido lo dicen al guardar; "Get a new link" lleva a pedir otro.
    - PR-09: la misma contraseña se rechaza en el campo y se elige otra sin otro mail.
    - PR-10: sin perfil, a la bienvenida con el `next`.
    - PR-18: el otro navegador queda afuera (Supabase rechaza su access token con 403 y su refresh token con 400).
  - **Falta, con P-050 configurado:** que el mail llegue y su link funcione, y PR-11 con una cuenta de Google real.

Orden: T-01 → T-02 y T-03 → T-04 → T-05. T-06 depende de P-050.

| Criterio     | Test                                                                                   |
| ------------ | -------------------------------------------------------------------------------------- |
| PR-01, PR-02 | `recovery-forms.test.tsx`, `auth-gate-forms.test.tsx`, e2e `password-recovery.spec.ts` |
| PR-03, PR-12 | `recovery.action.test.ts`, e2e (email con y sin cuenta)                                |
| PR-04        | `supabase-auth.test.ts`, `recovery.action.test.ts`                                     |
| PR-05        | `recovery-forms.test.tsx` (cuenta regresiva)                                           |
| PR-06, PR-07 | e2e (link de prueba → contraseña nueva → `next` con sesión y aviso)                    |
| PR-08        | `recovery.action.test.ts`, e2e (link vencido)                                          |
| PR-09        | `supabase-auth.test.ts`, `recovery.action.test.ts`                                     |
| PR-10        | `recovery.action.test.ts`, e2e (`mock-recovery-new` → bienvenida)                      |
| PR-11        | T-06 (a mano: depende de Supabase real)                                                |
| PR-13, PR-14 | `src/app/auth/reset/route.test.ts`, `recovery.test.ts`, `recovery-cookie.test.ts`      |
| PR-15        | `supabase-auth.test.ts` (el Supabase simulado)                                         |
| PR-16        | e2e (360 px, axe)                                                                      |
| PR-17        | e2e `performance.spec.ts`                                                              |
| PR-18        | `recovery.action.test.ts` (`signOutOthers` llamado, y que falle no frena), T-06        |
