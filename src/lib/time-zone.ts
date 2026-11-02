// The viewer's time zone (specs/local-time): the browser writes it in a cookie, the server formats
// every date with it.

export const TIME_ZONE_COOKIE = 'asinko-tz'

const SHAPE = /^[A-Za-z0-9_+\-/]{1,64}$/

/** An IANA zone that Intl knows, by its canonical name; null for anything else (LT-02). */
export function validTimeZone(raw: string | null | undefined): string | null {
  if (!raw || !SHAPE.test(raw)) return null
  try {
    return new Intl.DateTimeFormat('en', { timeZone: raw }).resolvedOptions().timeZone
  } catch {
    return null
  }
}
