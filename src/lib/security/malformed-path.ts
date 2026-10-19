/**
 * Whether a request path cannot be decoded: a lone `%` (`/%zz`), or one that comes out of `%25`
 * (`/macro%25zz`), which Next.js decodes once more and answers with a 500. No slug, username or
 * symbol has a `%`, so a path that does not survive two decodings is a bad request (400).
 */
export function isMalformedPath(pathname: string): boolean {
  try {
    decodeURIComponent(decodeURIComponent(pathname))
    return false
  } catch {
    return true
  }
}
