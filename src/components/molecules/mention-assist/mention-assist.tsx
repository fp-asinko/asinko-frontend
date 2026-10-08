'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { activeMention, type ActiveMention, type MentionKind } from '@/lib/mentions/active-mention'
import type { MentionOption } from '@/lib/mentions/mentions.types'
import type { ActionResult } from '@/lib/result'
import { cn } from '@/lib/utils'
import { caretPosition } from './caret'
import { MentionHighlight } from './mention-highlight'

/** A short pause before searching while the person types (specs/mention-autocomplete § 3). */
const SEARCH_DELAY = 100
/** One option's height (44px, MA-08) plus the panel's padding: to decide above or below. */
const OPTION_HEIGHT = 44
const PANEL_WIDTH = 288
/** The panel never touches the screen's edges. */
const EDGE = 8

export type MentionSearch = (input: {
  kind: MentionKind
  q: string
}) => Promise<ActionResult<MentionOption[]>>

type Status = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

/** Whether an option matches what was typed after the symbol (to filter what is already known). */
function matches(option: MentionOption, query: string) {
  const q = query.toLowerCase()
  return (
    option.handle.slice(1).toLowerCase().includes(q) ||
    Boolean(option.label?.toLowerCase().includes(q))
  )
}

/** Writes a value as if typed: React and react-hook-form see a normal change. */
function typeValue(field: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  setter?.call(field, value)
  field.dispatchEvent(new Event('input', { bubbles: true }))
}

/**
 * The mention list of a textarea (specs/mention-autocomplete): `$`, `#` or `@` and a letter open
 * suggestions right under the caret; ↑ ↓ move, Enter or Tab choose, Esc closes the list only.
 * Choosing writes the whole mention and a space. It hooks onto a textarea that already exists
 * (its value, focus and history stay its own), and knows no business: the search comes by props.
 *
 * Accessibility: a textarea cannot take the combobox role, so it stays a textbox with
 * `aria-autocomplete`, `aria-controls` and `aria-activedescendant` while the list is open, and a
 * live region says how many suggestions there are and which one was added.
 */
export function MentionAssist({
  field,
  search,
}: {
  field: HTMLTextAreaElement
  search: MentionSearch
}) {
  const t = useTranslations('mentions')
  const listId = useId()
  const [mention, setMention] = useState<ActiveMention | null>(null)
  const [options, setOptions] = useState<MentionOption[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [active, setActive] = useState(0)
  const [place, setPlace] = useState({ top: 0, left: 0, width: PANEL_WIDTH })
  // Inside the dialog when there is one: outside it, a modal dialog makes everything inert.
  const container = field.closest<HTMLElement>('[role="dialog"]') ?? document.body
  const [announcement, setAnnouncement] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const asked = useRef<string | null>(null)
  // Every answer of this field, by symbol and query: asked again, it shows at once.
  const cache = useRef(new Map<string, MentionOption[]>())

  const open = mention !== null && status !== 'idle'

  function close() {
    clearTimeout(timer.current)
    asked.current = null
    setMention(null)
    setStatus('idle')
    setOptions([])
  }

  /**
   * Where the panel goes, in the screen's coordinates (it is fixed, in a portal: no folded reply
   * nor scrolling column can cut it). Under the caret's line, or above it when there is no room
   * below (a phone's keyboard); always inside the screen.
   */
  function where(found: ActiveMention, count: number) {
    const caret = caretPosition(field, found.start)
    const box = field.getBoundingClientRect()
    const lineHeight = parseFloat(getComputedStyle(field).lineHeight) || 20
    const height = Math.max(count, 1) * OPTION_HEIGHT + 8
    const screenHeight = window.visualViewport?.height ?? window.innerHeight
    const screenWidth = window.visualViewport?.width ?? window.innerWidth
    const below = box.top + caret.top + 4
    const above = below + height > screenHeight && below - lineHeight - height - 8 > 0
    // A fixed element inside a transformed one (the full screen dialog) is placed against it.
    const frame =
      container === document.body ? { top: 0, left: 0 } : container.getBoundingClientRect()
    const width = Math.min(PANEL_WIDTH, screenWidth - 2 * EDGE)
    return {
      top: (above ? below - lineHeight - height - 8 : below) - frame.top,
      left:
        Math.max(EDGE, Math.min(box.left + caret.left, screenWidth - width - EDGE)) - frame.left,
      width,
    }
  }

  const evaluate = useEffectEvent(() => {
    const found =
      document.activeElement === field ? activeMention(field.value, field.selectionStart) : null
    if (!found) return close()
    setMention(found)
    setPlace(where(found, options.length))
    const key = `${found.kind}:${found.query}`
    if (asked.current === key) return
    asked.current = key
    clearTimeout(timer.current)

    function show(next: MentionOption[], failed = false) {
      setOptions(next)
      setActive(0)
      setStatus(failed ? 'error' : next.length === 0 ? 'empty' : 'ready')
      setPlace(where(found!, next.length))
      // Every outcome is announced, not only the suggestions (WCAG 4.1.3).
      setAnnouncement(
        failed ? t('error') : next.length > 0 ? t('count', { count: next.length }) : t('empty'),
      )
    }

    // Asked before: at once, no request.
    const known = cache.current.get(key)
    if (known) return show(known)
    // Meanwhile, what a shorter query already found ("bit" while "bitc" travels), or "Searching…".
    const shorter = [...cache.current.entries()]
      .filter(([each]) => each.startsWith(`${found.kind}:`) && key.startsWith(each))
      .sort(([a], [b]) => b.length - a.length)[0]
    const interim = shorter?.[1].filter((option) => matches(option, found.query)) ?? []
    if (interim.length > 0) {
      setOptions(interim)
      setStatus('ready')
      setPlace(where(found, interim.length))
    } else {
      setStatus('loading')
      setPlace(where(found, 1))
    }

    timer.current = setTimeout(async () => {
      const result = await search({ kind: found.kind, q: found.query })
      if (result.ok) cache.current.set(key, result.data)
      // A newer search went out meanwhile: this answer is stale.
      if (asked.current !== key) return
      show(result.ok ? result.data : [], !result.ok)
    }, SEARCH_DELAY)
  })

  function choose(option: MentionOption) {
    if (!mention) return
    const end = field.selectionStart
    const text = `${option.handle} `
    typeValue(field, field.value.slice(0, mention.start) + text + field.value.slice(end))
    const caret = mention.start + text.length
    field.setSelectionRange(caret, caret)
    close()
    setAnnouncement(t('added', { handle: option.handle }))
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!open) return
    const handled = ['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape']
    if (!handled.includes(event.key)) return
    if ((event.key === 'Enter' || event.key === 'Tab') && status !== 'ready') return
    // The list answers these keys: not the form, nor the editor's Esc.
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'ArrowDown') setActive((index) => (index + 1) % options.length || 0)
    else if (event.key === 'ArrowUp')
      setActive((index) => (index - 1 + options.length) % options.length || 0)
    else if (event.key === 'Escape') close()
    else if (options[active]) choose(options[active])
  })

  const onBlur = useEffectEvent(() => close())

  useEffect(() => {
    const check = () => evaluate()
    const keydown = (event: KeyboardEvent) => onKeyDown(event)
    const keyup = (event: KeyboardEvent) => {
      // Moving the caret can enter or leave a mention; the list's own keys change nothing there.
      if (!['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(event.key)) evaluate()
    }
    const blur = () => onBlur()
    field.setAttribute('aria-autocomplete', 'list')
    field.addEventListener('input', check)
    field.addEventListener('click', check)
    field.addEventListener('keyup', keyup)
    field.addEventListener('keydown', keydown)
    field.addEventListener('blur', blur)
    // What was typed while this was downloading.
    const first = requestAnimationFrame(check)
    return () => {
      cancelAnimationFrame(first)
      clearTimeout(timer.current)
      field.removeAttribute('aria-autocomplete')
      field.removeEventListener('input', check)
      field.removeEventListener('click', check)
      field.removeEventListener('keyup', keyup)
      field.removeEventListener('keydown', keydown)
      field.removeEventListener('blur', blur)
    }
  }, [field])

  const follow = useEffectEvent(() => {
    if (mention) setPlace(where(mention, options.length))
  })
  useEffect(() => {
    if (!open) return
    const update = () => follow()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [open])

  // The textbox points at the list and at the marked option while it is open.
  useEffect(() => {
    if (open && status === 'ready') {
      field.setAttribute('aria-controls', listId)
      field.setAttribute('aria-activedescendant', `${listId}-${active}`)
    } else {
      field.removeAttribute('aria-controls')
      field.removeAttribute('aria-activedescendant')
    }
  }, [field, open, status, listId, active])

  return (
    <>
      <MentionHighlight field={field} />
      <span role="status" className="sr-only">
        {announcement}
      </span>
      {open &&
        createPortal(
          <div
            // The panel of the community list: border (the system has no shadows), popover color.
            className="fixed z-50 animate-fade-in rounded-xl border bg-popover p-1 text-popover-foreground"
            style={{ top: place.top, left: place.left, width: place.width }}
          >
            {status === 'ready' ? (
              <ul id={listId} role="listbox" aria-label={t('label')}>
                {options.map((option, index) => (
                  // The keyboard lives in the textarea (aria-activedescendant): options never take the focus.
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keys handled by the textbox
                  <li
                    key={option.handle}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                    // Keep the focus in the textarea: choosing must not blur it.
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseMove={() => setActive(index)}
                    onClick={() => choose(option)}
                    className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 aria-selected:bg-muted aria-selected:ring-1 aria-selected:ring-input aria-selected:ring-inset"
                  >
                    <UserAvatar
                      name={option.handle}
                      colorKey={option.colorKey}
                      imageUrl={option.avatarUrl}
                      size="sm"
                      // People round; communities and assets square, as on the cards.
                      className={cn(option.kind !== 'user' && 'rounded-md')}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate type-small font-bold">{option.handle}</span>
                      {/* A space between the parts: read as "$BTC Bitcoin", not "$BTCBitcoin". */}{' '}
                      {option.label && (
                        <span className="truncate type-meta text-muted-foreground">
                          {option.label}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2.5 py-2 type-meta text-muted-foreground">
                {status === 'error' ? t('error') : status === 'loading' ? t('loading') : t('empty')}
              </p>
            )}
          </div>,
          container,
        )}
    </>
  )
}
