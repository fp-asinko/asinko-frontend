/** A piece of the text: plain, or a mention to paint (specs/mention-autocomplete MA-12). */
export type TextSegment = { text: string; mention: boolean }

// The same mention the list completes (lib/mentions/active-mention): a symbol at the start or
// after whitespace, and up to 32 letters, digits, "_" or "-" that end the word. "$" and a digit
// is a price ("$100"), not an asset.
const MENTION = /(^|\s)((?:[#@][\p{L}\p{N}_-]|\$[\p{L}_-])[\p{L}\p{N}_-]{0,31})(?![\p{L}\p{N}_-])/gu

/** Splits the text into plain parts and mentions, to paint the mentions while writing. */
export function mentionSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  let from = 0
  for (const match of text.matchAll(MENTION)) {
    const start = match.index + (match[1]?.length ?? 0)
    const mention = match[2] ?? ''
    if (start > from) segments.push({ text: text.slice(from, start), mention: false })
    segments.push({ text: mention, mention: true })
    from = start + mention.length
  }
  if (from < text.length) segments.push({ text: text.slice(from), mention: false })
  return segments
}
