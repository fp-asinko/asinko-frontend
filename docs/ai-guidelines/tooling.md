# Tooling de calidad

> Las guías dicen las reglas; el tooling las hace cumplir. Si una regla se puede automatizar, se automatiza.

## TypeScript

`tsconfig.json` en modo estricto:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true, // arr[i] es T | undefined
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
  },
}
```

- **Prohibido `any`**. Si el tipo es desconocido, `unknown` + validación con zod.
- Prohibido `// @ts-ignore`. Si es inevitable, `// @ts-expect-error` con comentario explicando por qué.
- Los tipos de datos externos (API, formularios, env) se **infieren del esquema zod** (`z.infer<typeof schema>`), no se escriben a mano.

## ESLint

Flat config (`eslint.config.mjs`), ejecutado con el CLI de ESLint (`next lint` ya no existe en Next.js 16).

| Plugin / config                                     | Para qué                                                  |
| --------------------------------------------------- | --------------------------------------------------------- |
| `eslint-config-next` (core-web-vitals + typescript) | Reglas de Next.js, React y hooks                          |
| `eslint-plugin-jsx-a11y`                            | Errores de accesibilidad en JSX                           |
| `eslint-plugin-boundaries`                          | Hace cumplir las reglas de dependencias de `structure.md` |
| `eslint-config-prettier`                            | Desactiva reglas de formato (las maneja Prettier)         |

### Boundaries

Traduce el diagrama de dependencias de `structure.md` a errores de lint:

| Elemento       | Puede importar de                                           |
| -------------- | ----------------------------------------------------------- |
| `app`          | todo                                                        |
| `feature`      | `components`, `hooks`, `lib`, `i18n` (nunca otro `feature`) |
| `organisms`    | `molecules`, `ui`, `hooks`, `lib`, `i18n`                   |
| `molecules`    | `ui`, `hooks`, `lib`, `i18n`                                |
| `ui`           | `lib`                                                       |
| `hooks`, `lib` | `lib`                                                       |

Además, entre features solo se importa desde su `index.ts`.

### Reglas

- **Cero warnings**: el lint en CI corre con `--max-warnings=0`.
- Desactivar una regla requiere `// eslint-disable-next-line <regla> -- <motivo>`. Nunca un `eslint-disable` de archivo completo.
- `no-restricted-imports` bloquea `next/link` y la navegación de `next/navigation` fuera de `src/i18n/` (ver `i18n.md`).
- `react/no-danger` en `error`: prohíbe `dangerouslySetInnerHTML` (ver `security.md`).

## Prettier

- `prettier` + `prettier-plugin-tailwindcss` (ordena las clases de Tailwind automáticamente).
- Config mínima; no se discute formato en los PRs.

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./src/app/globals.css"
}
```

`tailwindStylesheet` es obligatorio con Tailwind 4: el plugin lee los tokens de ese archivo para ordenar las clases. El contenido de terceros (`.claude/skills/`, `docs/references/`) queda fuera de Prettier (`.prettierignore`).

## Git hooks

Con **Lefthook** (un solo binario, más rápido que Husky y sin depender del shell):

| Hook         | Qué corre                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `pre-commit` | ESLint + Prettier sobre los archivos staged                                                           |
| `commit-msg` | **commitlint** (`@commitlint/config-conventional`): rechaza commits que no sigan Conventional Commits |
| `pre-push`   | `pnpm typecheck` + `pnpm test`                                                                        |

Los hooks son una ayuda local; **el CI es la fuente de verdad**. Saltearlos con `--no-verify` no evita que el PR falle.

## EditorConfig y finales de línea

- `.editorconfig` en la raíz: UTF-8, indentación de 2 espacios, línea final.
- `.gitattributes` con `* text=auto eol=lf`: el repo guarda LF sin importar el sistema operativo de cada dev.

## Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit"
  }
}
```

## Quality gates en CI

Cada PR corre, en este orden: `format:check` → `lint` → `typecheck` → `test:coverage` → `build` → `test:e2e`. Todos bloqueantes.

## VS Code

- `.vscode/extensions.json` recomienda: ESLint, Prettier, Tailwind CSS IntelliSense, Vitest, Playwright, i18n Ally.
- `.vscode/settings.json` activa el formato al guardar.
