# Design System

> Next.js + [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS. Organizado con **Atomic Design** y diseñado **mobile first**.

## Fuente de verdad

- **Diseño** (Figma u otro): la fuente de verdad del diseño.
- **Tokens**: variables CSS en `src/app/globals.css` (tema de shadcn), expuestas a Tailwind con `@theme inline`.
- **Componentes**: `src/components/` (ver Atomic Design).

El código es una **representación implementada** del diseño. Ante discrepancia, el diseño manda.

## Reglas para asistentes de IA

1. **No inventar valores de tokens.** Usar las variables existentes (`bg-primary`, `text-muted-foreground`). Si un valor no existe, parar y preguntar.
2. **No escribir primitivos a mano**: si shadcn lo tiene, se agrega con `pnpm dlx shadcn@latest add <componente>`. El proyecto se inicializa con **Base UI** (default de shadcn, `components.json` lo registra); nunca agregar la variante Radix de un componente.
3. **No crear variantes nuevas** sin aprobación en el diseño. Las variantes se declaran con `cva`, no con props booleanas (ver `engineering-principles.md`).
4. **Mobile first siempre**: primero la vista de 360px, después se agregan breakpoints.
5. **Sin textos hardcodeados**: todo texto visible, `aria-label` y `alt` sale de `messages/` (ver `i18n.md`).
6. **Si diseño y código entran en conflicto**: ajustar el código, no el diseño.

## Tokens

shadcn define el tema con variables semánticas en `globals.css`:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --radius: 0.625rem;
  /* ... */
}
.dark {
  /* mismas variables, valores de dark mode */
}

@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  /* ... */
}
```

- Los colores del diseño se cargan **en estas variables**, no como valores sueltos en componentes.
- Se usan nombres **semánticos** (`primary`, `destructive`, `muted`), no de color (`blue-500`).
- Tokens nuevos (ej. `--success`) se agregan en `:root` **y** `.dark`, y se exponen en `@theme inline`. Un alias con `var()` definido solo en `:root` funciona porque `.dark` va únicamente en `<html>` (lo pone next-themes).

### Tokens de Asinko (estilo iOS)

Colores de sistema de iOS, claro por defecto y oscuro opcional (`docs/product/overview.md § Estilo`). Valores y motivos en `specs/foundation/design.md § 4`.

- **Texto y botones usan las variantes de alto contraste de Apple** (`--primary` `#0040DD` en claro, `#409CFF` en oscuro): los colores base de iOS no llegan a 4,5:1 sobre blanco.
- **`--tint` / `--ring` (`#007AFF` / `#0A84FF`) son solo para íconos, foco y estados no textuales** (3:1). Nunca para texto: un label activo va en `text-primary` con el ícono en `text-tint`.
- Semánticos de negocio: `--success`/`--bullish`, `--bearish`, `--warning`. El color nunca es la única señal: van con ícono o texto.
- `src/test/tokens-contrast.test.ts` mide cada par texto/fondo en los dos temas: un token que baja del mínimo rompe el build.

### Tipografía

- Fuente del sistema (SF Pro en Apple), sin descargas. Escala de iOS en `rem` como utilidades: `text-large-title`, `text-title-1`…`3`, `text-headline`, `text-body` (17px, base del `body`), `text-callout`, `text-subhead`, `text-footnote`, `text-caption`.
- Cada utilidad trae su tracking y leading: no se ajustan sueltos en los componentes.

### Materiales

- Barras de navegación translúcidas: `bg-card/90 backdrop-blur-xl`, con `reduced-transparency:` para pasar a fondo sólido (`prefers-reduced-transparency`).
- Áreas seguras del iPhone con `env(safe-area-inset-*)` (el layout declara `viewport-fit=cover`); alturas de pantalla con `dvh`, nunca `vh`.

```tsx
// ✅ Correcto: tokens semánticos vía utilidades
<div className="bg-primary text-primary-foreground p-4 rounded-lg">

// ❌ Incorrecto: valores hardcoded o colores crudos
<div style={{ backgroundColor: '#FF0000', padding: '16px' }}>
<div className="bg-[#FF0000] text-blue-500">
```

## Atomic Design

| Nivel                     | Qué es                                     | Dónde vive                           | Ejemplos                                     |
| ------------------------- | ------------------------------------------ | ------------------------------------ | -------------------------------------------- |
| **Átomos**                | Primitivos indivisibles                    | `src/components/ui/`                 | `button`, `input`, `label`, `badge` (shadcn) |
| **Moléculas**             | Combinación simple de átomos, reutilizable | `src/components/molecules/`          | `search-field`, `form-field`, `price-tag`    |
| **Organismos**            | Secciones completas sin lógica de negocio  | `src/components/organisms/`          | `site-header`, `site-footer`, `empty-state`  |
| **Organismos de feature** | Secciones con lógica de negocio            | `src/features/<feature>/components/` | `quote-form`, `product-grid`                 |
| **Templates**             | Esqueleto de página                        | `src/app/**/layout.tsx`              | layout del sitio, layout del checkout        |
| **Pages**                 | Template + datos reales                    | `src/app/**/page.tsx`                | `/`, `/products/[slug]`                      |

### Reglas

- **Las dependencias van solo hacia abajo**: un átomo no importa moléculas; una molécula no importa organismos.
- **`components/ui/` es de shadcn**: lo escribe el CLI. Se puede modificar (el código es nuestro), pero con cambios mínimos y sin romper la API original. Cada cambio lleva un comentario `asinko:` que lo explica (ej. `closeLabel` obligatorio en `sheet.tsx`: el original traía "Close" fijo en inglés).
- `components/ui/` también aloja **átomos de marca** que no son de shadcn (`asinko-logo.tsx`), con su test.
- Componentes pesados que no se ven al cargar (paneles, diálogos) se cargan con `next/dynamic` al primer uso (presupuesto de JS, `seo.md`). Ejemplo: `mobile-sidebar.tsx`.
- **Un feature nunca crea átomos ni moléculas propias.** Si necesita uno nuevo, se agrega a `components/` para que lo usen todos.
- **Los organismos de `components/organisms/` no conocen el negocio**: reciben datos por props, no hacen fetching ni llaman actions.
- **`page.tsx` solo compone**: obtiene datos y arma la página con organismos. Sin markup extenso ni lógica.

### Estructura de un componente

Un archivo por componente, en kebab-case, con su test al lado:

```
src/components/molecules/
├── search-field.tsx
├── search-field.test.tsx
└── index.ts               # barrel export del nivel
```

Si el componente crece (subcomponentes, variantes, helpers), pasa a carpeta:

```
src/components/organisms/site-header/
├── site-header.tsx
├── site-header-nav.tsx
├── site-header.test.tsx
└── index.ts
```

## Mobile first

El diseño y el código arrancan por la pantalla más chica y **se agregan** estilos a medida que crece.

- **Estilos sin prefijo = mobile.** Los breakpoints (`sm:`, `md:`, `lg:`, `xl:`) solo agregan o sobrescriben hacia arriba.
- **No usar variantes `max-*:`** salvo un caso justificado y comentado.
- **Viewport de referencia: 360px.** Todo tiene que funcionar ahí sin scroll horizontal.
- **Áreas táctiles**: mínimo 24×24px (WCAG 2.2 AA, criterio 2.5.8); recomendado 44×44px para acciones principales.
- **Nada solo con hover**: toda interacción debe funcionar con tap y teclado.
- **Inputs con `text-base` (16px) o más**: evita el zoom automático de iOS al enfocar.
- **Imágenes** con `next/image` y `sizes` definido según el layout mobile.
- **Patrones adaptativos**: por ejemplo, `Dialog` en desktop y `Drawer` en mobile (patrón de shadcn).

```tsx
// ✅ Mobile first: una columna, crece hacia arriba
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

// ❌ Desktop first: arranca en 3 y corrige hacia abajo
<div className="grid grid-cols-3 max-md:grid-cols-1">
```

Breakpoints: los de Tailwind por defecto (`sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px). No se agregan breakpoints custom sin aprobación del diseño.

## Accesibilidad

Los componentes de shadcn se construyen sobre Base UI, que resuelve buena parte de la accesibilidad (foco, teclado, ARIA). **No romperla** al modificar componentes. Todo componente debe:

- Cumplir WCAG 2.2 AA mínimo.
- Manejar focus visible (no quitar `focus-visible:ring`).
- Soportar navegación por teclado.
- Tener roles ARIA correctos y labels en todos los controles.
- Funcionar con screen readers (probado con NVDA o VoiceOver).
- Respetar `prefers-reduced-motion` (`motion-safe:` / `motion-reduce:`).

> Nota: la validación completa de WCAG requiere pruebas manuales con tecnologías asistivas y revisión experta de accesibilidad.
