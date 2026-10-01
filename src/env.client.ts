// Public variables for browser code that must stay light (JS budget, seo.md). Reading them through
// src/env.ts would ship zod and every schema to the client. They are already validated at build
// time by src/env.ts (imported by next.config.ts), and Next.js inlines NEXT_PUBLIC_* values.
// The only other file allowed to read process.env (libraries.md § Variables de entorno).
export const clientEnv = {
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  NODE_ENV: process.env.NODE_ENV,
} as const
