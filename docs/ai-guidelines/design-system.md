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

### Tokens de Asinko (sistema del prototipo)

El sistema visual sale del prototipo (`docs/references/prototype.html`), medido en el navegador. Valores y motivos en `specs/home/design.md § 2`.

- **Monocromático**: `--primary` es casi negro (`#17181A`) en claro y casi blanco en oscuro. El único azul es el punto del logo (`--brand-dot`), con una excepción: las menciones mientras se escriben (`--mention`, `specs/mention-autocomplete` MA-12).
- **Grises fríos** (los de Reddit, `specs/header-refresh`; antes eran cálidos):
  - `--surface` (`#F6F8F9`): buscador, caja para publicar, comentarios, tarjetas de la columna y hovers.
  - `--muted` (`#EEF1F3`): chips y píldoras grises.
  - `--border` (`#E5E8EB`).
  - Barra superior blanca.
- **Píldora gris** (como Reddit): todo lo que se toca dentro de una tarjeta (votos, comentarios, compartir, chips, "Join", botones secundarios) va `rounded-full bg-muted hover:bg-muted-hover`, relleno y **sin borde**. Las opciones de encuesta son cajas `bg-surface`. El borde queda para separar capas, no para dibujar botones.
- **Texto secundario**: `--muted-foreground` (`#5C5D60`). **`--faint` (`#8A8B8E`) no es para texto chico** (3,4:1): solo íconos, separadores y texto de 18 px o más.
- **Verde en texto** (`--success`/`--bullish`) sobre fondos blancos, no sobre `--surface`. El color nunca es la única señal: siempre con flecha, ícono o texto.
- **Sin sombras**: las capas se separan con borde. Radios de 4 / 8 / 12 / 16 px y `rounded-full` para píldoras.
- **Bordes de campos activos** con `--input` (3:1); el borde suave del prototipo solo en elementos deshabilitados o decorativos.
- `src/test/tokens-contrast.test.ts` mide cada par en los dos temas: un token que baja del mínimo rompe el build.

### Color de las tarjetas (`specs/feed-cards`)

- **Identidad**: 8 tonos (`--avatar-0…7`, gradiente a `-to` y texto `-foreground`). `UserAvatar` elige el tono con `identityIndex` (`src/lib/identity-color.ts`) sobre una clave estable: el username de una persona y el **slug** de una comunidad (`colorKey`), nunca el nombre visible.
- **Precisión por tramos** (`--accuracy-high|mid|low`): fondo tintado con texto del mismo tono.
- **Encuestas, menos es más** (`specs/feed-cards § 13`): un solo color. Cada opción es la caja limpia del prototipo, con el fondo relleno según el porcentaje (`bg-primary/10`). La que gana va plena y en negrita; las demás, al 50 % y con texto secundario. Tu voto lleva un ✓, y el consenso es una línea gris.
- **Sin verde ni rojo de sube/baja** en los avatares: lo verifica el test de contraste. Las encuestas son monocromas.
- **Cabecera de la tarjeta** (`specs/community-first`): el grupo es el protagonista. Su avatar (cuadrado redondeado) y su handle van en la primera línea; el autor va en la segunda, en gris y sin foto. A la derecha, la píldora negra **Unirse** (`JoinButton`, organismo con variantes `card` y `compact`). Un post del canal personal muestra al autor con su foto, en una sola línea.
- **Páginas de comunidad, activo y perfil** (`specs/community-pages`): banner (su imagen o el degradé del tono de identidad, `IdentityBanner`), avatar superpuesto, el handle como H1, acciones a la derecha (Unirse; siendo miembro, "Unido" pide confirmación para salir, y la estrella de favorito) y un desplegable debajo (reglas del grupo, o los datos del activo con su estado vacío). Un avatar con imagen va sobre fondo neutro.
- Las clases por tono van escritas completas en un array (`IDENTITY_CLASSES[i]`), nunca interpoladas: Tailwind solo genera las clases que encuentra escritas.

### Tipografía

- **Figtree** con `next/font/google`: se descarga en el build y se sirve desde el sitio, sin requests a Google.
- Escala del prototipo como utilidades: `type-page-title`, `type-post-title` (17 px, 700), `type-post-body` (15 px), `type-ui` (14 px, base del `body`), `type-action` (13 px, 600), `type-small` (13 px, regular: comentarios y nombres de la columna izquierda), `type-meta` (12 px), `type-section` (11 px, mayúsculas).
- **Prefijo `type-`, no `text-`**: `cn` trata cualquier `text-<algo>` desconocido como un color y lo descarta al combinarlo con `text-muted-foreground`. Con `type-` no hay conflicto y no hace falta configurar `cn` (configurarlo sumaba ~20 KB al bundle). Como `cn` no las combina, no se ponen junto a otra clase que pise lo mismo (`text-[…]`, `font-*`): en ese caso se escriben las clases sueltas.

### Materiales

- Barra superior translúcida: `bg-header/92` con `backdrop-blur` y `reduced-transparency:` para pasar a sólido.
- Áreas seguras del iPhone con `env(safe-area-inset-*)` (`viewport-fit=cover`); alturas de pantalla con `dvh`, nunca `vh`.
- Del estilo de Apple (skill `apple-design`) se toma el criterio de **movimiento e interacción**, no la paleta.

## Movimiento

Definido en `specs/home-motion`. Los valores salen del prototipo y el criterio, de las skills `emil-design-eng` y `review-animations`.

- **Tokens** en `globals.css`: `--ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`, salidas e interacciones) y `--ease-bars` (`cubic-bezier(0.4, 0, 0.2, 1)`, las barras del prototipo); animaciones `animate-vote-pop`, `animate-count-up/down`, `animate-bar-grow`, `animate-fade-up`, `animate-fade-in`, `animate-underline-in` y `animate-live-pulse`. Un valor nuevo se agrega ahí, no suelto en un componente.
- **Utilidades**: `tap` (hover de color en 150 ms y presión a `scale(0.97)` en 120 ms) para todo lo interactivo, `stagger` (entrada escalonada de los primeros 5 hijos) y `delay-after-bars` (400 ms: lo que entra después de las barras de encuesta). Un control bloqueado (`aria-disabled`) no se hunde al tocarlo: `aria-disabled:active:scale-100`.
- **Escalas al hover** con `motion-safe:`: la red de seguridad acorta duraciones pero no quita la escala, que saltaría al instante.
- **Reglas**:
  - Transiciones para cambios de estado (se pueden interrumpir); `@keyframes` solo para entradas de una vez.
  - Todo ≤ 300 ms con salidas `ease-out`; nunca `ease-in`. Excepción: barras de encuesta (600 ms, del prototipo).
  - Solo `transform` y `opacity`; la altura se anima únicamente en los desplegables. Nada desde `scale(0)`.
  - Abrir es más lento que cerrar (200 / 150 ms): lo que la persona pidió ver se muestra con calma; la respuesta del sistema es inmediata.
  - Lo que solo se mueve con hover usa la variante `hover:` (Tailwind 4 la limita a dispositivos con hover).
  - Un estado con fondo nuevo (hover, activo) respeta el contraste: el verde de las variaciones va sobre blanco (por eso un mosaico de activo no cambia de fondo).
- **Reducir movimiento**: una regla global en `globals.css` termina al instante toda animación y transición con `prefers-reduced-motion: reduce`, incluidas las de terceros.
- **Desplegables**: `Collapsible` de shadcn (alto animado en todos los navegadores; el `<details>` nativo solo se anima en Chrome y Edge).

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
- **Foco no tapado** (WCAG 2.4.11): `html` tiene `scroll-padding` del alto de la barra superior y, en mobile, de la inferior. Un elemento fijo nuevo que tape contenido suma su alto ahí.
- **Links con varias partes** (handle, etiqueta, descripción): el nombre accesible sale del contenido, sin `aria-label` que lo tape, y con un espacio (`{' '}`) entre `<span>` para que no se lea todo junto.
- **Globo "Próximamente"**: `ComingSoon` tiene `placement` (`below`, `below-end`, `above`, `above-end`). Contra el borde derecho se usa `-end`; en la barra inferior, `above`. Si igual lo cortaría una columna con scroll o la pantalla, el globo se corre hacia adentro solo, por ejemplo en los links del pie, donde cada idioma corta las filas en otro lugar.
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
