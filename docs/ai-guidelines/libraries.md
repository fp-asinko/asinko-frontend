# Librerías

> Stack aprobado. **No se agregan alternativas** a lo que ya está en esta lista sin un PR que actualice esta guía.

## Base

| Necesidad                | Librería                                  | Notas                                                                                                                             |
| ------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Framework                | `next` (App Router)                       |                                                                                                                                   |
| UI                       | `shadcn/ui` (Base UI + Tailwind CSS)      | Primitivos de [Base UI](https://base-ui.com), el default de shadcn desde julio 2026. No mezclar con Radix. Ver `design-system.md` |
| Variantes de componentes | `class-variance-authority` + `cn`         | `cn` es el paquete de shadcn (MIT) que reemplaza a `clsx` + `tailwind-merge`. En código propio se importa desde `@/lib/utils`     |
| Íconos                   | `lucide-react`                            | Default de shadcn. No mezclar sets de íconos                                                                                      |
| Internacionalización     | `next-intl`                               | Ver `i18n.md`                                                                                                                     |
| Validación               | `zod`                                     | Todo input externo: formularios, actions, API, env, params                                                                        |
| Formularios              | `react-hook-form` + `@hookform/resolvers` | Con el componente `Form` de shadcn                                                                                                |
| Variables de entorno     | `@t3-oss/env-nextjs`                      | Validadas con zod en build                                                                                                        |
| Estado en la URL         | `nuqs`                                    | Filtros, paginación, tabs, búsqueda                                                                                               |
| Fechas                   | `date-fns`                                | Para cálculos. El formato visible al usuario, con `next-intl`                                                                     |
| Toasts                   | `sonner`                                  | El de shadcn                                                                                                                      |
| Tema claro/oscuro        | `next-themes`                             | Sin parpadeo al cargar, acepta el nonce de la CSP. Claro por defecto (D-02 en `specs/foundation`)                                 |
| Errores en producción    | `@sentry/nextjs`                          | Ver `engineering-principles.md`. En el navegador se carga diferido y solo con DSN (JS budget, `seo.md`)                           |
| Código solo de servidor  | `server-only`                             | En los módulos de acceso a datos. Rompe el build si se importan desde el cliente (ver `security.md`)                              |

Testing y tooling: ver `testing.md` y `tooling.md`.

## Solo si hace falta

| Necesidad                 | Librería                | Cuándo                                                                                                                       |
| ------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Estado global de cliente  | `zustand`               | Solo si el estado no puede vivir en el servidor, la URL ni un componente padre                                               |
| Fetching desde el cliente | `@tanstack/react-query` | Solo para datos que cambian en el cliente (polling, infinite scroll). Por defecto los datos se obtienen en Server Components |
| Animaciones complejas     | `motion`                | Las simples, con Tailwind. Siempre respetando `prefers-reduced-motion`                                                       |

## Dónde vive el estado

En este orden de preferencia:

1. **Servidor**: un Server Component obtiene los datos.
2. **URL** (`nuqs`): todo lo que el usuario querría compartir o recuperar con "atrás".
3. **Estado local** (`useState`) del componente que lo necesita.
4. **Estado elevado** al padre común más cercano.
5. **Store global** (`zustand`): último recurso.

## Variables de entorno

- Definidas y validadas en `src/env.ts` con `@t3-oss/env-nextjs`. **Nunca `process.env` directo** fuera de ese archivo, con una sola excepción: `src/env.client.ts`, que lee las `NEXT_PUBLIC_*` que necesita código del navegador sin cargar zod en el bundle (ya las valida `env.ts` en el build).
- Las variables del cliente llevan prefijo `NEXT_PUBLIC_` y **nunca** contienen secretos.
- `.env.example` versionado con todas las variables y valores de ejemplo (ver `security.md`).

## Criterio para agregar una dependencia

Antes de sumar una librería nueva, responder en el PR:

1. **¿Ya existe algo que lo resuelva?** Esta lista, la plataforma web o Next.js.
2. **¿Se resuelve en menos de ~50 líneas propias?** Entonces no hace falta la dependencia.
3. **Mantenimiento**: releases en los últimos 6 meses, issues atendidos.
4. **Peso**: impacto en el bundle del cliente (ver [bundlephobia](https://bundlephobia.com/)). Si solo corre en el servidor, importa menos.
5. **Licencia**: MIT, Apache 2.0, BSD o ISC. Otras requieren aprobación del lead técnico.
6. **Tipos**: TypeScript nativo o `@types/*` mantenidos.

La librería aprobada se agrega a esta guía en el mismo PR.

## Mantenimiento de dependencias

- **Renovate** (o Dependabot) abre PRs de actualización; los parches se agrupan semanalmente.
- `pnpm audit` corre en CI: una vulnerabilidad alta o crítica bloquea el merge.
- Versiones exactas en `package.json` para dependencias críticas (`next`, `react`); el lockfile fija el resto.
