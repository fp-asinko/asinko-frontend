/**
 * A Markdown body as plain text, for a preview in the browser (specs/thesis-create TC-11): the
 * marks off (bold, italic, code, quotes, list bullets, headings), a link as its words. The real
 * render is the server's (post-markdown.tsx); this only reads well, it builds no HTML.
 */
export function markdownText(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+|\d+\.\s+)/gm, '')
    .replace(/(\*\*|__|~~|`)/g, '')
    .replace(/(^|\W)[*_](\S[^*_]*?)[*_](?=\W|$)/g, '$1$2')
    .trim()
}
