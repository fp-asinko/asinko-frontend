/** Emojis per row of each section's grid. */
export const COLUMNS = 8

/**
 * Where an arrow, Home or End takes the focus among the emojis (specs/emoji-picker EP-07). The
 * emojis are one flat list split into sections of `lengths`; each section wraps in rows of 8, so
 * ↑ and ↓ keep the column, also into the next or the previous section. ↑ from the first row goes
 * back to the search. Unknown keys: null.
 */
export function gridMove(
  lengths: readonly number[],
  index: number,
  key: string,
): number | 'search' | null {
  const total = lengths.reduce((sum, length) => sum + length, 0)
  if (total === 0) return null
  const clamp = (value: number) => Math.max(0, Math.min(value, total - 1))
  if (key === 'ArrowRight') return clamp(index + 1)
  if (key === 'ArrowLeft') return clamp(index - 1)
  if (key === 'Home') return 0
  if (key === 'End') return total - 1
  if (key !== 'ArrowDown' && key !== 'ArrowUp') return null

  // The section, its first index, and the place inside it.
  let section = 0
  let start = 0
  while (section < lengths.length - 1 && index >= start + (lengths[section] ?? 0)) {
    start += lengths[section] ?? 0
    section += 1
  }
  const length = lengths[section] ?? 0
  const offset = index - start
  const row = Math.floor(offset / COLUMNS)
  const column = offset % COLUMNS

  if (key === 'ArrowDown') {
    const below = (row + 1) * COLUMNS + column
    if (below < length) return start + below
    // A shorter last row: its last emoji.
    if ((row + 1) * COLUMNS < length) return start + length - 1
    const next = lengths[section + 1]
    if (next === undefined) return index
    return start + length + Math.min(column, next - 1)
  }

  if (row > 0) return start + (row - 1) * COLUMNS + column
  const previous = lengths[section - 1]
  if (previous === undefined) return 'search'
  const lastRow = Math.floor((previous - 1) / COLUMNS) * COLUMNS
  return start - previous + Math.min(lastRow + column, previous - 1)
}
