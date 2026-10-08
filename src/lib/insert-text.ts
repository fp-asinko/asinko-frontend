/** A field that takes text: a title (input) or a body (textarea). */
export type TextField = HTMLInputElement | HTMLTextAreaElement

/**
 * Writes text into a field as if typed (specs/emoji-picker § 1, specs/mention-autocomplete
 * § 6): it replaces the selection (or the range given), goes through the native value setter and
 * an `input` event, so React and react-hook-form see a normal change, and leaves the caret right
 * after it.
 */
export function insertText(
  field: TextField,
  text: string,
  range: { start: number; end: number } = {
    start: field.selectionStart ?? field.value.length,
    end: field.selectionEnd ?? field.value.length,
  },
) {
  const value = field.value.slice(0, range.start) + text + field.value.slice(range.end)
  const prototype =
    field instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  setter?.call(field, value)
  field.dispatchEvent(new Event('input', { bubbles: true }))
  const caret = range.start + text.length
  field.setSelectionRange(caret, caret)
}
