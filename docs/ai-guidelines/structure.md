# Estructura del proyecto

> Next.js (App Router) + shadcn/ui. Organización por dominio + Atomic Design para la UI compartida.

## Principio central

**Organizar por dominio, no por tipo de archivo.** Todo lo que pertenece a un feature vive junto (componentes, lógica, esquemas, tipos, tests), no disperso en carpetas globales por tipo.

## Árbol general

```
e2e/                      # Tests end to end (Playwright), ver testing.md
messages/                 # Traducciones: en.json (default), es.json, pt.json (ver i18n.md)
specs/                    # Specs SDD: specs/<feature>/{requirements,design,tasks}.md
src/
├── app/                  # Rutas (App Router): layouts = templates, pages = pages
│   ├── [locale]/         # Todas las rutas cuelgan del idioma
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── not-found.tsx
│   ├── globals.css       # Tokens del tema (ver design-system.md)
│   ├── global-error.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/           # UI compartida, organizada con Atomic Design
│   ├── ui/               # Átomos — shadcn (lo escribe el CLI)
│   ├── molecules/
│   └── organisms/
├── features/             # Un directorio por dominio de negocio
│   └── <feature>/
├── hooks/                # Hooks transversales (use-mobile.ts, etc.)
├── i18n/                 # routing.ts, navigation.ts, request.ts (next-intl)
├── lib/                  # Utilidades transversales (utils.ts con cn(), result.ts, etc.)
├── test/                 # Helpers de tests unitarios (renderWithIntl, setup)
├── env.ts                # Variables de entorno validadas (ver libraries.md)
└── proxy.ts              # Locale (next-intl). Antes middleware.ts
```

## Estructura por feature

```
features/<feature>/
├── components/                  # Organismos de negocio del feature
├── actions/                     # Server Actions / casos de uso
├── schemas/                     # Esquemas de validación (zod)
├── hooks/                       # Hooks específicos del feature
├── lib/                         # Acceso a datos y utilidades del feature
├── <feature>.types.ts           # Tipos públicos del feature
└── index.ts                     # Barrel export controlado
```

Solo se exporta desde `index.ts` lo que otros módulos pueden consumir.

## Server y Client Components

- **Server Components por defecto.** Todo componente es de servidor salvo que necesite interactividad.
- `'use client'` solo en las **hojas** interactivas del árbol (un botón con estado, un formulario), nunca en layouts ni pages completas.
- Los datos se obtienen en el servidor (page, layout o Server Component) y bajan por props.
- Las mutaciones van por Server Actions en `features/<feature>/actions/`, con el input validado por un esquema.

## Convenciones de nombres

### Archivos

**Todos los archivos en kebab-case**, igual que los que genera shadcn. Evita conflictos de mayúsculas entre Windows/macOS y Linux (CI).

- Componentes: `product-card.tsx` (el componente exportado es `ProductCard`)
- Hooks: `use-product-search.ts`
- Acciones: `create-quote.action.ts`
- Esquemas: `quote-form.schema.ts`
- Tipos: `quote.types.ts`
- Constantes: `quote.constants.ts` (valores en SCREAMING_SNAKE_CASE)
- Tests: al lado del archivo (`product-card.test.tsx`)

### Carpetas

- kebab-case (`payment-gateway/`, `reservation-system/`)
- Rutas de `app/` en el idioma de las URLs públicas (ver `seo.md`)

### Código

- camelCase para variables y funciones
- PascalCase para tipos, interfaces, enums y componentes
- SCREAMING_SNAKE_CASE para constantes globales

### Imports

- Alias `@/` para `src/` (`@/components/ui/button`, `@/features/quote`)
- Entre features se importa **solo** desde su `index.ts`, nunca archivos internos

## Reglas de dependencias

```
app/  →  features/  →  components/  →  lib/
                   ↘                 ↗
                        hooks/
```

- `app/` puede importar de cualquier lado; nadie importa de `app/`.
- `components/` no importa de `features/` (no conoce el negocio).
- Los features **no se importan entre sí**. Si dos features necesitan compartir algo, se sube a `components/`, `hooks/` o `lib/`.
- Dentro de `components/`, las dependencias van solo hacia abajo: `organisms → molecules → ui` (ver `design-system.md`).

## Si el proyecto crece a monorepo

Con pnpm workspaces (ver `conventions.md`). Las apps dependen de los packages, **jamás al revés**; los packages base son hojas.

| Package | Propósito |
|---|---|
| `ui` | `components/` compartidos (shadcn + moléculas + organismos) |
| `api-client` | Cliente HTTP tipado (solo consumo) |
| `config-eslint` | Config compartida de linter |
| `config-typescript` | tsconfig base |
