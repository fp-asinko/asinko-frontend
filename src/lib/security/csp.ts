// Content Security Policy (security.md § Headers de seguridad y CSP, design.md §5). Pure: no I/O,
// so every directive is unit-tested.

export type CspOptions = {
  nonce: string
  /** Development needs 'unsafe-eval' (React debugging). Never in production (F-28). */
  isDev: boolean
  /** Public URL of the site. upgrade-insecure-requests is only sent when it is https. */
  siteUrl: string
  /** Optional Sentry DSN: its origin is added to connect-src. */
  sentryDsn?: string
}

/** Base64 of 16 cryptographically random bytes, new for every request. */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...bytes))
}

export function buildCsp({ nonce, isDev, siteUrl, sentryDsn }: CspOptions): string {
  const connectSrc = ["'self'"]
  if (sentryDsn) connectSrc.push(new URL(sentryDsn).origin)

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    // <style> and <link> need the nonce; style attributes are allowed because SSR markup from
    // Base UI (positioning) uses them and they cannot execute code.
    // Development: Next's dev tools inject <style> tags without a nonce, and browsers ignore
    // 'unsafe-inline' whenever a nonce is present, so dev uses 'unsafe-inline' alone.
    'style-src-elem': isDev ? ["'self'", "'unsafe-inline'"] : ["'self'", `'nonce-${nonce}'`],
    'style-src-attr': ["'unsafe-inline'"],
    'img-src': ["'self'", 'blob:', 'data:'],
    'font-src': ["'self'"],
    'connect-src': connectSrc,
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  }

  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`)
  if (siteUrl.startsWith('https://')) policy.push('upgrade-insecure-requests')

  return policy.join('; ')
}
