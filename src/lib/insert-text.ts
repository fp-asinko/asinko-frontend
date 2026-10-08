/**
 * Writes text into a textarea as if typed (specs/emoji-picker § 1, specs/mention-autocomplete
 * § 6): it replaces the selection (or the range given), goes through the native value setter and
 * an `input` event, so React and react-hook-form see a normal change, and leaves the caret right
 * after it.
 */
export function insertText(
  field: HTMLTextAreaElement,
  text: string,
  range: { start: number; end: number } = { start: field.selectionStart, end: field.selectionEnd },
) {
  const value = field.value.slice(0, range.start) + text + field.value.slice(range.end)
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  setter?.call(field, value)
  field.dispatchEvent(new Event('input', { bubbles: true }))
  const caret = range.start + text.length
  field.setSelectionRange(caret, caret)
}
