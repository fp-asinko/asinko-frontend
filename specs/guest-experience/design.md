# Experiencia sin sesión — Design

> **Estado:** aprobado el 2026-10-05 con Q1–Q3 como se proponen.

## 1. Saber si hay sesión en el cliente

- `getViewer()` corre en el servidor. El layout pasa `signedIn: boolean` a un **`AuthGateProvider`** (cliente, `components/organisms/auth-gate/`): un contexto con `signedIn` y `requireAccount(action)`.
- `requireAccount(action)`:
  - Con sesión devuelve `true` y la acción sigue.
  - Sin sesión abre el modal con esa acción y devuelve `false`, así la acción no corre ni deja un estado optimista.
- **Doble chequeo:** las Server Actions siguen verificando la sesión (`security.md § 5`). Si una devuelve `UNAUTHENTICATED` (por ejemplo, una sesión vencida), el componente abre el mismo modal en vez del error en línea de hoy.

```ts
type GatedAction = 'vote-post' | 'vote-poll' | 'post' | 'join' | 'following'
const { requireAccount } = useAuthGate()
function onUpvote() {
  if (!requireAccount('vote-post')) return
  // … the vote as today
}
```

- El contexto es chico (sin dependencias). El modal es aparte y se carga con `next/dynamic` la primera vez que se abre (G-10), igual que `mobile-sidebar.tsx`.

## 2. El modal (`components/organisms/auth-gate/auth-gate-dialog.tsx`)

- Sobre el Dialog de Base UI que ya usa `Sheet`: **`Sheet side="bottom"`** en mobile y un **`Dialog`** centrado desde `md` (G-07). El `Dialog` se suma con `pnpm dlx shadcn@latest add dialog`, en su variante Base UI.
- **Contenido:**
  - Título según la acción (Q1).
  - La línea de valor.
  - "Create account" (botón principal) y "Log in" (secundario). Hasta `auth`, los dos son `ComingSoon`.
- **Cierre (G-06):** Esc, el fondo o el botón ×. Base UI devuelve el foco al disparador.
- **Datos para `auth` (G-09):** el estado del modal guarda `{ action, next: pathname + search }`. `auth` va a usar esos datos para armar `/login?next=…` y repetir la acción.
- **Motion:** el de `Sheet` (`--ease-out`, 200 ms al abrir y 150 ms al cerrar).

## 3. Llamados permanentes

| Dónde                  | Sin sesión                                                                              | Con sesión    |
| ---------------------- | --------------------------------------------------------------------------------------- | ------------- |
| Barra superior (G-02)  | `Button` "Log in" (`variant="ghost"`) y "Sign up" (`default`); en mobile, solo "Log in" | Como hoy      |
| Columna derecha (G-03) | `JoinCard` arriba de `SeasonTokensTeaser`                                               | No se muestra |
| "Following" vacío (Q2) | El `EmptyState` actual suma los dos botones                                             | Como hoy      |

- Los botones abren el modal con la acción `'signup'` o `'login'` y un título genérico ("Join Asinko" / "Log in to Asinko").
- `JoinCard` es un organismo sin lógica de negocio. Usa el estilo de la tarjeta de tokens (`rounded-lg border bg-surface`) y su botón principal es `bg-primary`.

## 4. Puntos que cambian

| Componente                         | Hoy                                  | Con este spec                                                                                      |
| ---------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `vote-control.tsx`                 | Vota y muestra "You need an account" | `requireAccount('vote-post')` antes del optimista                                                  |
| `poll-voting.tsx`                  | Igual                                | `requireAccount('vote-poll')`                                                                      |
| `composer-placeholder.tsx`         | Caja y acciones "Coming soon"        | Sin sesión, abren el modal (`'post'`); con sesión siguen "Coming soon" hasta el spec de crear post |
| `suggested-communities.tsx` (Join) | "Coming soon"                        | Sin sesión, modal (`'join'`); con sesión sigue "Coming soon"                                       |
| `site-header.tsx`                  | Perfil deshabilitado                 | "Log in" y "Sign up" sin sesión                                                                    |

- Los mensajes `needAccount` en línea dejan de usarse y se borran.

## 5. Mensajes (en)

`authGate.title.{vote-post,vote-poll,post,join,following,login,signup}`, `authGate.value`, `authGate.login`, `authGate.signup`, `authGate.close`, más `joinCard.title` y `joinCard.body` (Q3). Se traducen a es (tuteo) y pt. `authGate` va a `CLIENT_NAMESPACES`, porque el modal es cliente.

## 6. Presupuesto de JS (G-10)

- Hoy: 228,1 de 230 KB.
- Los botones y el contexto son chicos (~1 KB), pero hay que medirlos. El modal entero va diferido.
- Si no entra, los botones de la barra superior y de `JoinCard` se renderizan en el servidor como links a `?auth=signup` y el modal lee ese parámetro al cargarse.

## 7. Tests

- **Unitarios:**
  - `auth-gate`: `requireAccount` con y sin sesión.
  - El modal: título por acción, cierre con Esc y vuelta del foco.
  - `vote-control`, `poll-voting`, `composer-placeholder` y `suggested-communities`: sin sesión abren el modal, no llaman a la action y no dejan el voto marcado. Con sesión, igual que hoy.
  - `site-header` y `join-card` con y sin sesión.
- **e2e** (`e2e/guest.spec.ts`, el build con `API_MOCKS=missing` sin sesión): votar abre el modal, Esc lo cierra y el foco vuelve, axe con el modal abierto, mobile como panel inferior y presupuesto de JS.
- Los e2e actuales (con usuario demo) siguen en verde: G-11.

## 8. Ajustes de la implementación

- **Idioma y tema en el menú (mobile):** a 360 px, "Log in" no entraba en la barra, que con sesión ya ocupaba 352 px. Debajo de `md`, `LocaleSwitcher` y `ThemeToggle` pasan al panel del menú (`MenuSettings`), con y sin sesión, como en Reddit y X. Lo decidió el Product Owner el 2026-10-05 y lo encontró el e2e (`scrollWidth` > viewport). Los e2e de tema e idioma abren el menú en mobile (`e2e/fixtures/settings.ts`). _Reemplazado por `specs/header-refresh` (2026-10-05): idioma y tema van en el menú "⋯" de la barra, en todos los tamaños, y el panel ☰ queda solo con las comunidades._
- **"Following" sin sesión:** no se pide el feed. El estado de "necesita cuenta" sale directo de `getViewer()`, porque el backend lo rechazaría de todos modos. Se quitó `following` de `GatedAction`, ya que la pestaña conserva su página (Q2).
- **e2e sin sesión:** con `API_MOCKS=true`, la cookie `asinko-mock-guest=1` apaga el usuario demo en ese navegador (`MOCK_GUEST_COOKIE` en `src/lib/session.ts`). Solo se lee en ese modo, que `env.ts` rechaza en producción, y solo puede quitar una sesión, nunca crearla.
- **El modal:**
  - Lleva su propio botón de cerrar de 44 px, como el menú, porque el de shadcn mide 28 px.
  - Ocupa todo el ancho hasta `md` (`sm:max-w-none`; antes, entre 640 y 767 px, quedaba de 384 px).
  - Las clases de texto van sueltas y no `type-*`, porque `cn` no las combina con las de la base del Dialog y del Button.
- **Botones de cuenta:** 44 px de alto en mobile y 36 px desde `md`.
- **`dialog.tsx`** (shadcn, Base UI), con comentarios `asinko:`:
  - `closeLabel` obligatorio.
  - Apertura en 200 ms y cierre en 150 ms con `ease-out`.
  - `DialogFooter` sin el "Close" fijo en inglés.
