// Result of a Server Action (engineering-principles.md § Manejo de errores). `error` is always a
// translation key, never a raw message.
export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> }
