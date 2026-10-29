/**
 * Where to go after logging in (specs/auth AU-03): only a path of this site. `next` comes from the
 * query, so it is user input: an absolute URL, `//host` or `/\host` would be an open redirect
 * (security.md § 5). Anything else is the Home.
 */
export function safeNext(next: unknown, fallback = '/'): string {
  if (typeof next !== 'string' || next.length > 2048) return fallback
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  // Control characters (a tab or a newline inside a URL) are dropped by browsers: refuse them.
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback
  return next
}
