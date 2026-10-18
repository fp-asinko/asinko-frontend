/** What the format toolbar writes (specs/submit-tools ST-04): the Markdown Asinko shows. */
export type FormatKind = 'bold' | 'italic' | 'code' | 'link' | 'list' | 'quote'

/** A replacement of the field's text: from `start` to `end` goes `text`, then `select` is chosen. */
export type FormatEdit = { start: number; end: number; text: string; select: [number, number] }

const MARKS = { bold: '**', italic: '_', code: '`' } as const
const PREFIXES = { list: '- ', quote: '> ' } as const
const URL_PLACEHOLDER = 'https://'

/**
 * The Markdown for a format over a selection (specs/submit-tools ST-04). Bold, italic and code wrap
 * what is chosen, or leave the caret between their marks; a link wraps it as `[text](https://)`
 * and chooses the address to type over (without text, the caret goes inside the brackets); a list
 * or a quote marks every line the selection touches.
 */
export function formatMarkdown(
  value: string,
  start: number,
  end: number,
  kind: FormatKind,
): FormatEdit {
  const chosen = value.slice(start, end)

  if (kind === 'list' || kind === 'quote') {
    const from = value.lastIndexOf('\n', start - 1) + 1
    const newline = value.indexOf('\n', Math.max(end - (end > start ? 1 : 0), start))
    const to = newline === -1 ? value.length : newline
    const prefix = PREFIXES[kind]
    const text = value
      .slice(from, to)
      .split('\n')
      .map((line) => prefix + line)
      .join('\n')
    return { start: from, end: to, text, select: [from + text.length, from + text.length] }
  }

  if (kind === 'link') {
    const text = `[${chosen}](${URL_PLACEHOLDER})`
    if (!chosen) return { start, end, text, select: [start + 1, start + 1] }
    const url = start + chosen.length + 3
    return { start, end, text, select: [url, url + URL_PLACEHOLDER.length] }
  }

  const mark = MARKS[kind]
  const inner = start + mark.length
  return {
    start,
    end,
    text: `${mark}${chosen}${mark}`,
    select: [inner, inner + chosen.length],
  }
}
