/** Longest meta description: what search engines show (specs/post-create-detail § 4). */
const EXCERPT_MAX = 160

/**
 * A Markdown body as plain text: links keep their text, the formatting marks go, and the lines
 * join. Also what a comment search shows (specs/post-detail-refresh PD-05).
 */
export function markdownText(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_~`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The first 160 characters of a Markdown body, for the meta description. Cut at a word, "…". */
export function postExcerpt(markdown: string): string {
  const text = markdownText(markdown)
  if (text.length <= EXCERPT_MAX) return text
  const cut = text.slice(0, EXCERPT_MAX - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`
}
