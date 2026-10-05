# Testing

> **Vitest** + Testing Library para tests unitarios. **Playwright** para tests end to end. Todo componente nuevo nace con su test.

## Qué se testea con qué

| Qué                                                | Herramienta                     | Dónde                                        |
| -------------------------------------------------- | ------------------------------- | -------------------------------------------- |
| Componentes (client y Server Components síncronos) | Vitest + Testing Library        | Al lado del archivo: `product-card.test.tsx` |
| Hooks                                              | Vitest (`renderHook`)           | `use-product-search.test.ts`                 |
| Esquemas de validación                             | Vitest                          | `quote-form.schema.test.ts`                  |
| Server Actions y `lib/`                            | Vitest (dependencias mockeadas) | `create-quote.action.test.ts`                |
| Server Components `async`                          | Playwright                      | `e2e/`                                       |
| Flujos de usuario completos                        | Playwright                      | `e2e/<flujo>.spec.ts`                        |

> Vitest no soporta Server Components `async` (limitación documentada por Next.js). Se cubren con e2e.

## Reglas

1. **Cada componente nuevo se crea con su `.test.tsx`** en el mismo PR. Sin test, el componente no está hecho.
2. **Excepción**: los componentes de `components/ui/` generados por el CLI de shadcn sin modificar. Si se modifican, se testea la modificación.
3. **Cada criterio de aceptación del spec** (`requirements.md`) tiene al menos un test que lo verifica: unitario si es lógica aislada, e2e si es un flujo.
4. **Un bug resuelto agrega el test que lo reproduce** antes del fix.
5. Los tests se escriben en inglés (nombres de `describe`/`it`), igual que el código.

## Cobertura

El umbral es un **piso, no un objetivo**: la regla principal sigue siendo "cada componente y cada criterio de aceptación tiene su test". No se escriben tests triviales para subir el número.

| Dónde                                     | Líneas / funciones / statements                             | Branches |
| ----------------------------------------- | ----------------------------------------------------------- | -------- |
| `features/**/{actions,schemas,lib,hooks}` | 80%                                                         | 75%      |
| `lib/`, `hooks/`                          | 80%                                                         | 75%      |
| Componentes                               | Sin umbral: cubiertos por la regla "un componente, un test" | —        |
| `app/`                                    | Excluido: cubierto por e2e                                  | —        |
| `components/ui/` (shadcn sin modificar)   | Excluido                                                    | —        |

- `pnpm test:coverage` falla si algún umbral no se cumple. Es un **quality gate bloqueante** en CI.
- Excluir un archivo de la cobertura requiere justificación en el PR.
- Los umbrales solo se suben, nunca se bajan.

## Tests unitarios (Vitest)

### Stack

```bash
pnpm add -D vitest @vitest/coverage-v8 @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom
```

```ts
// vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true }, // native in Vite: no plugin needed
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'], // import '@testing-library/jest-dom/vitest'
    include: ['src/**/*.test.{ts,tsx}'], // e2e/ queda fuera
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/components/ui/**', // shadcn sin modificar
        'src/app/**', // pages y layouts: cubiertos por e2e
        'src/**/*.types.ts',
        'src/**/index.ts',
        'src/**/*.test.{ts,tsx}',
      ],
      thresholds: {
        // Umbral solo donde vive la lógica
        'src/features/**/{actions,schemas,lib,hooks}/**': {
          lines: 80,
          functions: 80,
          statements: 80,
          branches: 75,
        },
        'src/{lib,hooks}/**': { lines: 80, functions: 80, statements: 80, branches: 75 },
      },
    },
  },
})
```

### Cómo escribir un test de componente

- **Testear comportamiento, no implementación.** Lo que el usuario ve y hace, no el estado interno ni las clases CSS.
- **Buscar por rol y nombre accesible** (`getByRole('button', { name: /send/i })`). Si no se puede encontrar por rol, probablemente el componente tiene un problema de accesibilidad.
- Prioridad de queries: `getByRole` > `getByLabelText` > `getByText` > `getByTestId` (último recurso).
- Interacciones con `userEvent`, no con `fireEvent`.
- Un test cubre: render por defecto, cada variante relevante, interacciones y estados (loading, error, vacío, deshabilitado).

```tsx
// src/components/molecules/search-field.test.tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { SearchField } from './search-field'

describe('SearchField', () => {
  it('calls onSearch with the typed query on submit', async () => {
    const onSearch = vi.fn()
    renderWithIntl(<SearchField onSearch={onSearch} />)

    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'sneakers')
    await userEvent.click(screen.getByRole('button', { name: /search/i }))

    expect(onSearch).toHaveBeenCalledWith('sneakers')
  })

  it('disables the button while the query is empty', () => {
    renderWithIntl(<SearchField onSearch={vi.fn()} />)
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled()
  })
})
```

### Mocks

- Se mockea en el **borde**: las funciones de `lib/` del feature, no `fetch` ni el ORM desde el componente (ver Dependency Inversion en `engineering-principles.md`).
- La navegación localizada (`@/i18n/navigation`) se mockea con el helper compartido: `vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))` y `setPathname('/')` para fijar la ruta activa.
- El cliente de la API se testea con su fábrica (`createApiClient({ baseUrl, fetch, mocks })`), pasando un `fetch` falso: nunca se importa la instancia de `@/lib/api`, que depende de las variables de entorno.
- Código que lee `@/env` se testea con `vi.mock('@/env', () => ({ env }))` y un objeto `env` de `vi.hoisted`.
- Los componentes con textos se renderizan con `renderWithIntl` (`src/test/render-with-intl.tsx`), que los envuelve en `NextIntlClientProvider` con los mensajes del idioma por defecto (ver `i18n.md`). Para probar formatos en otro idioma: `renderWithIntl(ui, { locale: 'es' })`.
- **Server Actions**: se testean llamándolas directo, con sus dependencias mockeadas en el borde (`@/lib/session`, las funciones de `lib/` del feature, `next-intl/server`). Verifican input inválido, falta de sesión y que el `userId` sale de la sesión.
- Un componente que importa una Server Action (directa o indirectamente) arrastra el cliente de la API y `@/env`: en sus tests se mockea la action (`vi.mock('../actions/<nombre>.action', () => ({ … }))`).
- APIs del navegador que jsdom no trae (`IntersectionObserver`): un doble con `vi.stubGlobal` que deje disparar el evento desde el test (ver `load-more.test.tsx`).
- Nada de llamadas reales a red ni a servicios externos en tests unitarios.

## Tests end to end (Playwright)

### Stack

```bash
pnpm create playwright
```

### Estructura

```
e2e/
├── fixtures/              # Fixtures y datos de prueba compartidos
├── quote-flow.spec.ts     # Un archivo por flujo, nombrado como el spec
└── navigation.spec.ts
playwright.config.ts
```

### Configuración

Ajustes del proyecto que ya están en `vitest.config.mts` y `src/test/setup.ts`:

- `server-only` apunta a un módulo vacío (`src/test/stubs/server-only.ts`): fuera de Next ese paquete lanza un error a propósito.
- `next-intl` se procesa con Vite (`server.deps.inline`): importa `next/navigation` sin extensión.
- El setup desmonta los componentes entre tests (`cleanup`, porque no usamos globals de Vitest) y agrega un `matchMedia` falso para jsdom.
- Tests que no necesitan DOM (lint, ESLint, esquemas puros) declaran `// @vitest-environment node`.

Playwright:

- **Mobile first también en e2e**: cada test corre en un proyecto mobile y uno desktop.
- Contra el **build de producción** (`pnpm build && pnpm start`), no contra `next dev`.

```ts
// playwright.config.ts (extracto)
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Reglas

- **Qué cubrir**: los flujos críticos de negocio y los criterios de aceptación de cada spec que involucran más de una pantalla o datos del servidor.
- **Locators por rol**, igual que en unitarios (`page.getByRole(...)`). Nada de selectores CSS ni XPath.
- **Sin `waitForTimeout`**: usar las esperas automáticas de Playwright y `expect(...).toBeVisible()`.
- **Elementos "Próximamente"** (`aria-disabled`, H-26): Playwright no los cliquea porque los considera deshabilitados. Se usa `click({ force: true })` y se verifica el aviso; el `aria-disabled` se chequea aparte.
- **Tests independientes**: cada test prepara sus propios datos y no depende del orden de ejecución.
- **Accesibilidad**: los flujos críticos incluyen un chequeo con `@axe-core/playwright`.

```ts
// e2e/quote-flow.spec.ts
import { expect, test } from '@playwright/test'

test('user can request a quote', async ({ page }) => {
  await page.goto('/en/quote')
  await page.getByLabel(/email/i).fill('cliente@example.com')
  await page.getByRole('button', { name: /send/i }).click()
  await expect(page.getByRole('status')).toHaveText(/we received your request/i)
})
```

## Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Specs de la base (`specs/foundation`)

- Corren en el puerto 3100 (el 3000 queda para `pnpm dev`) contra el build de producción con `APP_ENV=preview` y mocks.
- `e2e/fixtures/axe.ts` tiene `expectNoA11yViolations(page)` (WCAG 2.2 AA) y `collectConsoleErrors(page)` (violaciones de CSP, errores de hidratación). Antes de medir, espera a que terminen las animaciones finitas: en pleno fade-in, axe ve bajo contraste en el texto que está entrando.
- `e2e/performance.spec.ts` verifica el presupuesto de JavaScript (`seo.md`). Toda ruta nueva se suma a su lista.
- Los chequeos que no dependen del dispositivo (headers, peso de JS) corren solo en el proyecto desktop.
- **Sin sesión:** con `API_MOCKS=true` hay usuario demo. Para probar la experiencia sin sesión, el test agrega la cookie `asinko-mock-guest=1` (`e2e/guest.spec.ts`). Solo funciona en ese modo, nunca en producción.
- **Idioma y tema** están en el menú "⋯" de la barra superior, en todos los tamaños: `settings(page)` de `e2e/fixtures/settings.ts` lo abre y devuelve el `menu`.

## En el pipeline

- Cada PR corre `pnpm test:coverage` y `pnpm test:e2e`. Ambos son **quality gates bloqueantes**.
- Los e2e fallidos suben el trace de Playwright como artefacto del job.
- Un test que solo pasa gracias a un reintento es **flaky** y se trata como roto: se arregla o se abre un ticket y se marca `test.fixme` con referencia al ticket.
