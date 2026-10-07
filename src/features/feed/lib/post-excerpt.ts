/** Longest meta description: what search engines show (specs/post-create-detail § 4). */
const EXCERPT_MAX = 160

/**
 * The first 160 characters of a Markdown body as plain text, for the meta description: links keep
 * their text, the formatting marks go, and the lines join. Cut at a word, with "…".
 */
export function postExcerpt(markdown: string): string {
  const text = markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_~`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= EXCERPT_MAX) return text
  const cut = text.slice(0, EXCERPT_MAX - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`
}
