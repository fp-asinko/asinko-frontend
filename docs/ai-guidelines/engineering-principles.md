# Principios de ingeniería

> SOLID aplicado a TypeScript + React + Next.js. Los principios son un medio, no un fin: si aplicar uno complica el código sin un beneficio concreto, gana KISS.

## S — Single Responsibility

Cada unidad tiene **una sola razón para cambiar**.

- Un componente **renderiza**. La lógica de estado va a un hook; el acceso a datos va a `actions/` o `lib/` del feature.
- Un hook hace una cosa (`useQuoteForm`, no `useQuoteEverything`).
- Señal de alarma: un componente de más de ~150 líneas, o que mezcla fetching, validación y UI.

```tsx
// ❌ El componente valida, llama a la API y renderiza
function QuoteForm() {
  const [data, setData] = useState({})
  async function submit() {
    if (!data.email.includes('@')) return
    await fetch('/api/quote', { method: 'POST', body: JSON.stringify(data) })
  }
  // ...
}

// ✅ Cada pieza en su lugar
function QuoteForm() {
  const { form, onSubmit } = useQuoteForm() // estado + validación (quote-form.schema.ts)
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
// onSubmit invoca create-quote.action.ts
```

## O — Open/Closed

Abierto a extensión, cerrado a modificación. **Se extiende por composición y variantes, no agregando `if`.**

```tsx
// ❌ Cada caso nuevo agrega un booleano
<Button isDanger isSmall isOutline />

// ✅ Variantes declaradas con cva (patrón shadcn)
<Button variant="destructive" size="sm" />

// ✅ Composición en vez de props de configuración
<Card>
  <CardHeader><CardTitle>Plan Pro</CardTitle></CardHeader>
  <CardContent>...</CardContent>
</Card>
```

## L — Liskov Substitution

Un componente que envuelve o extiende a otro **respeta su contrato**: acepta las mismas props, reenvía el resto y no cambia el significado de las heredadas.

```tsx
// ✅ Se puede usar en cualquier lugar donde va un Button
type SubmitButtonProps = React.ComponentProps<typeof Button> & { pending?: boolean }

function SubmitButton({ pending, disabled, children, ...props }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {children}
    </Button>
  )
}

// ❌ Ignora props del contrato base (className, onClick...) o les cambia el sentido
```

## I — Interface Segregation

**Props mínimas.** Un componente recibe solo lo que usa.

```tsx
// ❌ Depende de todo el objeto: cualquier cambio en User lo afecta
<UserAvatar user={user} />

// ✅ Depende solo de lo que necesita
<UserAvatar name={user.name} imageUrl={user.avatarUrl} />
```

Si una interfaz de props crece mucho, es señal de que el componente tiene más de una responsabilidad (volver a S).

## D — Dependency Inversion

Los features dependen de **abstracciones**, no de detalles de infraestructura.

- Los componentes y actions no llaman a `fetch`, al ORM ni a SDKs externos directamente: pasan por funciones de `lib/` del feature (o por el `api-client` compartido).
- Cambiar de proveedor (pagos, CMS, email) toca un solo archivo.
- Facilita los tests: se reemplaza la función de `lib/`, no la red.

```ts
// features/quote/lib/quote-repository.ts
export async function saveQuote(input: QuoteInput): Promise<Quote> { /* ORM / API acá */ }

// features/quote/actions/create-quote.action.ts
export async function createQuote(raw: unknown) {
  const input = quoteFormSchema.parse(raw)
  return saveQuote(input) // no sabe si hay una DB, una API o un mock
}
```

## Contrapesos

- **KISS**: la solución más simple que cumple el spec.
- **YAGNI**: no abstraer para casos que el spec no pide. Nada de "por si algún día…".
- **DRY con regla de tres**: se duplica una vez; a la tercera repetición, se extrae.
- **Composición sobre herencia**: en React no se usan clases ni herencia de componentes.

## Manejo de errores

### Errores esperables vs inesperados

| Tipo | Ejemplos | Cómo se maneja |
|---|---|---|
| **Esperable** | Validación fallida, recurso no encontrado, regla de negocio | Se **devuelve** como resultado tipado |
| **Inesperado** | Caída de la DB, bug, timeout de un servicio | Se **lanza** (`throw`), lo captura `error.tsx` y se reporta a Sentry |

### Server Actions

Las actions devuelven un resultado discriminado, nunca lanzan por errores esperables:

```ts
// src/lib/result.ts
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

// features/quote/actions/create-quote.action.ts
export async function createQuote(raw: unknown): Promise<ActionResult<Quote>> {
  const parsed = quoteFormSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: 'quote.errors.invalid', fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  return { ok: true, data: await saveQuote(parsed.data) }
}
```

- `error` es una **clave de traducción** (ver `i18n.md`), no un texto.
- Nunca devolver al cliente mensajes internos, stack traces ni errores de la DB.

### Rutas

Cada segmento de ruta relevante tiene sus archivos especiales de Next.js:

- `loading.tsx`: skeleton mientras carga (con componentes `Skeleton` de shadcn, respetando el layout final para no generar CLS).
- `error.tsx`: error inesperado, con opción de reintentar. Siempre Client Component.
- `not-found.tsx`: recurso inexistente (se dispara con `notFound()`).
- `app/global-error.tsx`: último recurso si falla el layout raíz.

### Observabilidad

- **Sentry** (`@sentry/nextjs`) captura errores inesperados en cliente y servidor, con source maps subidos en el build.
- Nunca enviar datos personales ni secretos en el contexto del error.
- `console.log` no llega a producción: lo bloquea ESLint (`no-console`, permitiendo solo `warn` y `error`).
