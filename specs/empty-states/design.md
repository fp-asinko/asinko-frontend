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
