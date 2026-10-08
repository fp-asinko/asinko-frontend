/** The styles that decide where the text wraps and lands inside a textarea. */
export const COPIED = [
  'boxSizing',
  'width',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'lineHeight',
  'textTransform',
  'wordSpacing',
  'tabSize',
] as const

/**
 * Where the caret of a textarea is, relative to the textarea's box (specs/mention-autocomplete
 * § 4): a hidden copy with the same styles holds the text up to the caret and a marker, and the
 * marker's position is the caret's. `top` is the bottom of the caret's line, already scrolled.
 */
export function caretPosition(field: HTMLTextAreaElement, caret: number) {
  const style = getComputedStyle(field)
  const mirror = document.createElement('div')
  for (const property of COPIED) mirror.style[property] = style[property]
  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.top = '0'
  mirror.style.left = '-9999px'
  mirror.style.whiteSpace = 'pre-wrap'
  mirror.style.overflowWrap = 'break-word'
  mirror.textContent = field.value.slice(0, caret)
  const marker = document.createElement('span')
  marker.textContent = '​'
  mirror.append(marker)
  document.body.append(mirror)
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4
  const position = {
    left: marker.offsetLeft - field.scrollLeft,
    top: marker.offsetTop - field.scrollTop + lineHeight,
  }
  mirror.remove()
  return position
}
