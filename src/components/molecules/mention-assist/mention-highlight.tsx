'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { COPIED } from './caret'
import { mentionSegments } from './mention-segments'

/**
 * Listens to every way a textarea's value changes: typing (`input`) and code (a controlled
 * textarea emptied after sending sets `value` with no event). The setter is wrapped on this one
 * element, chained to what was there (React's value tracker), and restored on unmount.
 */
function watchValue(field: HTMLTextAreaElement, onChange: () => void) {
  const own = Object.getOwnPropertyDescriptor(field, 'value')
  const base = own ?? Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
  if (base?.get && base.set) {
    const { get, set } = base
    Object.defineProperty(field, 'value', {
      configurable: true,
      enumerable: base.enumerable,
      get() {
        return get.call(this)
      },
      set(value: string) {
        set.call(this, value)
        onChange()
      },
    })
  }
  field.addEventListener('input', onChange)
  return () => {
    field.removeEventListener('input', onChange)
    if (own) Object.defineProperty(field, 'value', own)
    else Reflect.deleteProperty(field, 'value')
  }
}

/**
 * Paints the mentions blue while writing (specs/mention-autocomplete MA-12). A textarea only has
 * one color, so a copy of its text lies exactly over it, with the same box and type, and draws
 * the text: plain parts in the text color, mentions in `--mention`. The textarea's own text turns
 * transparent and keeps its caret, selection and placeholder; the copy lets the pointer through
 * and is hidden from screen readers (the textarea is what they read).
 */
export function MentionHighlight({ field }: { field: HTMLTextAreaElement }) {
  const layer = useRef<HTMLDivElement>(null)
  // The field's value as a store: React reads it again once subscribed, so a box emptied while
  // this was downloading is seen too.
  const subscribe = useCallback((change: () => void) => watchValue(field, change), [field])
  const text = useSyncExternalStore(
    subscribe,
    () => field.value,
    () => '',
  )

  useEffect(() => {
    // Its own text turns transparent (globals.css): the layer draws it.
    field.setAttribute('data-mention-painted', '')
    return () => field.removeAttribute('data-mention-painted')
  }, [field])

  // Same box and same type as the textarea, after every change: it grows with the text
  // (field-sizing), changes size with the screen and scrolls on its own.
  useLayoutEffect(() => {
    const copy = layer.current
    if (!copy) return
    function align() {
      if (!copy) return
      const style = getComputedStyle(field)
      for (const property of COPIED) copy.style[property] = style[property]
      // A scrollbar narrows the textarea's text: the copy wraps at the same place.
      const scrollbar =
        field.offsetWidth -
        field.clientWidth -
        parseFloat(style.borderLeftWidth) -
        parseFloat(style.borderRightWidth)
      copy.style.paddingRight = `${parseFloat(style.paddingRight) + Math.max(scrollbar, 0)}px`
      copy.style.top = `${field.offsetTop}px`
      copy.style.left = `${field.offsetLeft}px`
      copy.style.width = `${field.offsetWidth}px`
      copy.style.height = `${field.offsetHeight}px`
      copy.scrollTop = field.scrollTop
      copy.scrollLeft = field.scrollLeft
    }
    align()
    const resize = new ResizeObserver(align)
    resize.observe(field)
    field.addEventListener('scroll', align)
    return () => {
      resize.disconnect()
      field.removeEventListener('scroll', align)
    }
  }, [field, text])

  return (
    <div
      ref={layer}
      aria-hidden
      data-mention-highlight
      className="pointer-events-none absolute overflow-hidden border-solid border-transparent break-words whitespace-pre-wrap text-foreground"
    >
      {mentionSegments(text).map((segment, index) =>
        segment.mention ? (
          <span key={index} className="text-mention">
            {segment.text}
          </span>
        ) : (
          segment.text
        ),
      )}
      {/* A last line break takes a line in the textarea: here it needs something after it. */}
      {'​'}
    </div>
  )
}
