# Estados vacíos con imagen — Design

## 1. `EmptyState` (organismo, `components/organisms/empty-state.tsx`)

```tsx
<EmptyState
  icon={<MessageCircleIcon />} // Q1: un ícono de lucide; se dibuja en un círculo bg-muted
  title="Be the first to comment"
  description="Nobody has replied yet…"
  action={<Button …/>} // opcional
  size="page" | "section" // cva: page centrado (py-12, círculo 64 px), section compacto (py-6, 40 px)
/>
```

- Sin lógica de negocio: recibe textos y acción ya traducidos (Atomic Design). Server Component.
- La firma de hoy (`message`, `action`) se reemplaza; los usos se migran todos en el mismo cambio.
- El círculo: `bg-muted text-muted-foreground`, el ícono a 50 % del círculo, `aria-hidden`.
- Título `type-ui font-bold`, descripción `type-small text-muted-foreground`, máximo 36 caracteres por línea (`max-w-xs`).

## 2. Usos

Cada lugar de la tabla de `requirements.md` pasa a `EmptyState` con su ícono, sus textos y su acción. Las acciones reusan lo que ya existe: `ComposeTrigger` (crear post), los botones de cuenta (`GateButtons`), links con `Link`, y el foco en la caja de comentario (un botón que la enfoca: `document.getElementById`).

## 3. Tests

- `empty-state.test.tsx`: los dos tamaños, imagen oculta para lectores, acción.
- Los tests de cada lugar migrado verifican el título nuevo.
- E2E: los existentes que buscan los textos viejos se actualizan; axe en el feed Siguiendo vacío y en los comentarios vacíos, claro y oscuro.

## 4. Ajustes al implementar (2026-10-09)

- **Tercer tamaño, `inline`:** el ícono (32 px) al lado del texto, para los lugares angostos: la columna izquierda y los comentarios dentro de una tarjeta (ES-01, "imagen chica al lado").
- **`FocusButton`** es una molécula (`components/molecules/focus-button.tsx`) con la píldora negra de las acciones (`ACTION_PILL`: 44 px en el teléfono, 36 desde `md`, hover con el token `primary-hover`). El `id` de la caja de comentario vive en un módulo sin `'use client'` (`comment-box.ts`), así el servidor lo lee como texto.
- **Post borrado:** sin caja de comentario, el vacío no ofrece "Comentar".
- **Feed de comunidad vacío sin acción:** el encabezado de la página ya tiene "Crear post" donde se puede publicar (PC-03).
- **Búsqueda sin resultados:** el resumen se dice una vez, como título del vacío.
- Pendiente: Reintentar en los errores de tesis y de la columna izquierda (hoy solo lo tienen las listas de seguidores); los comentarios piden recargar la página.
