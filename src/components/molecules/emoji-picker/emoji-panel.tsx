'use client'

import { SearchIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import type { TextField } from '@/lib/insert-text'
import { Popover, PopoverContent, PopoverTitle } from '@/components/ui/popover'
import { EMOJI_CATEGORIES, type EmojiRow } from './emoji-data'
import { emojiLabel, findEmoji, searchEmojis, type EmojiLocale } from './emoji-search'
import { gridMove } from './grid-move'
import { readRecentEmojis } from './recent-emojis'

type Section = { id: string; title: string; rows: readonly EmojiRow[] }

/**
 * The emoji panel (specs/emoji-picker § 2), downloaded the first time the button is wanted: a
 * search on top, the categories to jump to, and the emojis by section (the recent ones first). The
 * focus starts in the search; ↓ goes to the emojis, where the arrows move (one tab stop for all of
 * them); Enter picks. Esc closes and gives the focus back to the field.
 */
export function EmojiPanel({
  anchor,
  field,
  open,
  onOpenChange,
  onPick,
}: {
  anchor: RefObject<HTMLButtonElement | null>
  field: RefObject<TextField | null>
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (emoji: string) => void
}) {
  const t = useTranslations('emoji')
  const raw = useLocale()
  const locale: EmojiLocale = raw === 'es' || raw === 'pt' ? raw : 'en'
  const titleId = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  // The category bar is one tab stop too (a toolbar): the arrows move among its buttons.
  const [activeCategory, setActiveCategory] = useState(0)
  const categoryButtons = useRef<Array<HTMLButtonElement | null>>([])
  const search = useRef<HTMLInputElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  // Read each time the panel opens (it stays mounted between openings): the last picked first.
  const recent = useMemo(
    () =>
      open
        ? readRecentEmojis()
            .map(findEmoji)
            .filter((row) => row !== undefined)
        : [],
    [open],
  )

  const searching = query.trim() !== ''
  const results = searching ? searchEmojis(query, locale) : []
  const sections: Section[] = searching
    ? [{ id: 'results', title: t('results', { count: results.length }), rows: results }]
    : [
        ...(recent.length > 0 ? [{ id: 'recent', title: t('recent'), rows: recent }] : []),
        ...EMOJI_CATEGORIES.map((category) => ({
          id: category.id,
          title: t(`categories.${category.id}`),
          rows: category.rows,
        })),
      ]
  const all = sections.flatMap((section) => section.rows)
  const current = Math.min(active, Math.max(all.length - 1, 0))

  function focusAt(index: number, options?: FocusOptions) {
    const next = Math.max(0, Math.min(index, all.length - 1))
    setActive(next)
    buttons.current[next]?.focus(options)
  }

  function onGridKey(event: KeyboardEvent) {
    const next = gridMove(
      sections.map((section) => section.rows.length),
      current,
      event.key,
    )
    if (next === null) return
    event.preventDefault()
    if (next === 'search') search.current?.focus()
    else focusAt(next)
  }

  /** A category: its section in view, and the focus (or the next Tab) on its first emoji. */
  function goToCategory(position: number) {
    const id = EMOJI_CATEGORIES[position]?.id
    const first = sections.slice(
      0,
      sections.findIndex((section) => section.id === id),
    )
    const start = first.reduce((sum, section) => sum + section.rows.length, 0)
    // Only the panel's list scrolls (scrollIntoView would move the page too, and focusing would
    // cut a smooth scroll short): its heading to the top of the list.
    const list = scroller.current
    const heading = document.getElementById(`${titleId}-${id}`)
    if (list && heading) {
      const top =
        list.scrollTop + heading.getBoundingClientRect().top - list.getBoundingClientRect().top
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (typeof list.scrollTo === 'function') {
        list.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
      } else list.scrollTop = top
    }
    setActiveCategory(position)
    focusAt(start, { preventScroll: true })
  }

  function onCategoryKey(event: KeyboardEvent, position: number) {
    const last = EMOJI_CATEGORIES.length - 1
    const moves: Record<string, number> = {
      ArrowRight: Math.min(position + 1, last),
      ArrowLeft: Math.max(position - 1, 0),
      Home: 0,
      End: last,
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    setActiveCategory(next)
    categoryButtons.current[next]?.focus()
  }

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && all.length > 0) {
      event.preventDefault()
      focusAt(0)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (results[0]) onPick(results[0][0])
    }
  }

  let index = -1
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverContent
        anchor={anchor}
        side="bottom"
        align="start"
        sideOffset={6}
        initialFocus={search}
        finalFocus={field}
        aria-labelledby={titleId}
        // A box that closes when the focus leaves it knows this panel is its own (comment box).
        data-emoji-panel
        // The panels of the system: border, no shadow (design-system.md § Tokens).
        // Never taller than the room on screen (Base UI's --available-height): the page never scrolls.
        className="max-h-[min(28rem,var(--available-height))] w-[min(22rem,calc(100vw-1rem))] gap-0 overflow-hidden rounded-2xl border p-0 shadow-none ring-0"
      >
        <PopoverTitle id={titleId} className="sr-only">
          {t('dialog')}
        </PopoverTitle>
        <div className="relative p-2.5 pb-2">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-5.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            ref={search}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
              if (scroller.current) scroller.current.scrollTop = 0
            }}
            onKeyDown={onSearchKey}
            aria-label={t('search')}
            placeholder={t('search')}
            // 16px in phones: iOS zooms into smaller fields (design-system.md § Mobile first).
            className="h-10 w-full rounded-full border border-input bg-background pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:text-sm"
          />
        </div>
        {!searching && (
          <div
            role="toolbar"
            aria-label={t('categoriesLabel')}
            className="flex justify-between border-b px-1.5 pb-1.5"
          >
            {EMOJI_CATEGORIES.map((category, position) => (
              <button
                key={category.id}
                ref={(element) => {
                  categoryButtons.current[position] = element
                }}
                type="button"
                tabIndex={position === activeCategory ? 0 : -1}
                aria-label={t(`categories.${category.id}`)}
                onKeyDown={(event) => onCategoryKey(event, position)}
                onClick={() => goToCategory(position)}
                className="flex size-9 tap items-center justify-center rounded-lg font-emoji text-lg outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span aria-hidden>{category.icon}</span>
              </button>
            ))}
          </div>
        )}
        <span role="status" className="sr-only">
          {searching ? t('results', { count: results.length }) : ''}
        </span>
        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={`${titleId}-${section.id}`} className="pt-2">
              <h3
                id={`${titleId}-${section.id}`}
                className="scroll-mt-2 px-1 pb-1 type-section text-muted-foreground"
              >
                {section.title}
              </h3>
              <div className="grid grid-cols-8">
                {section.rows.map((row) => {
                  index += 1
                  const position = index
                  return (
                    <button
                      key={row[0]}
                      ref={(element) => {
                        buttons.current[position] = element
                      }}
                      type="button"
                      tabIndex={position === current ? 0 : -1}
                      aria-label={emojiLabel(row, locale)}
                      onFocus={() => setActive(position)}
                      // One tab stop for all the emojis; the arrows move among them.
                      onKeyDown={onGridKey}
                      onClick={() => onPick(row[0])}
                      className="flex aspect-square min-h-10 tap items-center justify-center rounded-lg font-emoji text-2xl outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span aria-hidden>{row[0]}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
