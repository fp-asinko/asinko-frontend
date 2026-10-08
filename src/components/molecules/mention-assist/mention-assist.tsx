'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { activeMention, type ActiveMention, type MentionKind } from '@/lib/mentions/active-mention'
import type { MentionOption } from '@/lib/mentions/mentions.types'
import type { ActionResult } from '@/lib/result'
import { cn } from '@/lib/utils'
import { caretPosition } from './caret'

/** A pause before searching while the person types (specs/mention-autocomplete § 3). */
const SEARCH_DELAY = 150
/** One option's height (44px, MA-08) plus the panel's padding: to decide above or below. */
const OPTION_HEIGHT = 44
const PANEL_WIDTH = 288

export type MentionSearch = (input: {
  kind: MentionKind
  q: string
}) => Promise<ActionResult<MentionOption[]>>

type Status = 'idle' | 'ready' | 'empty' | 'error'

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
  const [place, setPlace] = useState({ top: 0, left: 0 })
  const [announcement, setAnnouncement] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const asked = useRef<string | null>(null)

  const open = mention !== null && status !== 'idle'

  function close() {
    clearTimeout(timer.current)
    asked.current = null
    setMention(null)
    setStatus('idle')
    setOptions([])
  }

  function where(found: ActiveMention, count: number) {
    const caret = caretPosition(field, found.start)
    const top = field.offsetTop + caret.top + 4
    const height = Math.max(count, 1) * OPTION_HEIGHT + 8
    const room =
      (window.visualViewport?.height ?? window.innerHeight) - field.getBoundingClientRect().top
    // Not enough room below (a phone's keyboard): above the caret's line.
    const above = caret.top + height > room && caret.top > height
    const lineHeight = parseFloat(getComputedStyle(field).lineHeight) || 20
    const parent = field.offsetParent?.clientWidth ?? PANEL_WIDTH
    return {
      top: above ? top - height - lineHeight - 8 : top,
      left: Math.max(0, Math.min(field.offsetLeft + caret.left, parent - PANEL_WIDTH)),
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
    timer.current = setTimeout(async () => {
      const result = await search({ kind: found.kind, q: found.query })
      // A newer search went out meanwhile: this answer is stale.
      if (asked.current !== key) return
      const next = result.ok ? result.data : []
      setOptions(next)
      setActive(0)
      setStatus(!result.ok ? 'error' : next.length === 0 ? 'empty' : 'ready')
      setPlace(where(found, next.length))
      setAnnouncement(result.ok && next.length > 0 ? t('count', { count: next.length }) : '')
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
      <span role="status" className="sr-only">
        {announcement}
      </span>
      {open && (
        <div
          // The panel of the community list: border (the system has no shadows), popover color.
          className="absolute z-30 w-72 max-w-full animate-fade-in rounded-xl border bg-popover p-1 text-popover-foreground"
          style={{ top: place.top, left: place.left }}
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
                  className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 aria-selected:bg-muted"
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
              {status === 'error' ? t('error') : t('empty')}
            </p>
          )}
        </div>
      )}
    </>
  )
}
