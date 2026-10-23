// The left column's open or folded state (specs/sidebar-toggle § 1): cookies, so the server draws
// the page as it was left and nothing jumps on load. A display preference, nothing personal.

/** The whole site's: `folded` once folded; open without it. */
export const LEFT_COLUMN_COOKIE = 'asinko-left-column'
/** The page to create a post's: `open` once opened; folded without it (specs/submit-tools ST-08). */
export const LEFT_COLUMN_SUBMIT_COOKIE = 'asinko-left-column-submit'

/** Folded on the site: only the exact value counts; anything else is the default, open. */
export const siteFolded = (value: string | undefined) => value === 'folded'
/** Open on the page to create a post: only the exact value counts; else folded. */
export const submitOpen = (value: string | undefined) => value === 'open'

/** Remembered for a year, for the whole site; the browser writes it. */
export function writeLeftColumnCookie(name: string, value: 'open' | 'folded') {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`
}
