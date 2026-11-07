'use client'

import { SearchIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { UserAvatar } from '@/components/molecules/user-avatar'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
} from '@/components/ui/combobox'
import { cn } from '@/lib/utils'
import { searchCommunities } from '../actions/search-communities.action'
import type { CommunityOption } from '../composer.types'
import { FIELD_BOX } from './editor-styles'

/** Typing rests this long before the search goes out. */
const SEARCH_DELAY = 200

/**
 * The thesis's asset as a search (specs/thesis-form-steps FS-01, FS-02): typing lists the catalog's
 * assets that match, below; arrows and Enter, or a click, choose one. Chosen, the field becomes its
 * card (TC-29, `renderValue`) with × to change it, which brings the empty field back, focused.
 */
export function AssetSearch({
  id,
  value,
  onChange,
  renderValue,
  invalid = false,
  describedBy,
  labelledBy,
}: {
  id: string
  /** The field's label: chosen, it names the card. */
  labelledBy?: string
  value: CommunityOption | null
  onChange: (asset: CommunityOption | null) => void
  /** The chosen asset's card: its logo, name, price and day (TC-29). */
  renderValue: (asset: CommunityOption) => ReactNode
  invalid?: boolean
  describedBy?: string
}) {
  const t = useTranslations('composer.thesis.asset')
  const [text, setText] = useState('')
  const [options, setOptions] = useState<CommunityOption[]>([])
  const [failed, setFailed] = useState(false)
  const [loading, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const asked = useRef('')
  const field = useRef<HTMLInputElement>(null)
  const refocus = useRef(false)

  useEffect(() => () => clearTimeout(timer.current), [])
  // Back from × to the empty field: the focus goes to it.
  useEffect(() => {
    if (value === null && refocus.current) {
      refocus.current = false
      field.current?.focus()
    }
  }, [value])

  function search(next: string) {
    const query = next.trim()
    asked.current = query
    if (!query) {
      setOptions([])
      return
    }
    startTransition(async () => {
      const result = await searchCommunities(query, 'assets')
      // A newer search went out meanwhile: this answer is stale.
      if (asked.current !== query) return
      setFailed(!result.ok)
      setOptions(result.ok ? result.data : [])
    })
  }

  if (value) {
    return (
      <div
        id={id}
        role="group"
        aria-labelledby={labelledBy}
        // Filled, as the other fields (PO 2026-11-06); the day's change goes on its own white pill,
        // where its green reads (TC-29).
        className={cn(FIELD_BOX, 'flex min-h-12 items-center gap-2 py-1.5 pr-2')}
        aria-describedby={describedBy}
      >
        {renderValue(value)}
        <button
          type="button"
          aria-label={t('change', { asset: value.handle })}
          onClick={() => {
            refocus.current = true
            setText('')
            setOptions([])
            onChange(null)
          }}
          className="inline-flex size-8 shrink-0 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4"
        >
          <XIcon aria-hidden />
        </button>
      </div>
    )
  }

  const query = text.trim()
  const status = !query
    ? ''
    : loading
      ? t('searching')
      : failed
        ? t('searchFailed')
        : options.length === 0
          ? t('none')
          : t('results', { count: options.length })

  return (
    <Combobox<CommunityOption>
      items={options}
      // The server filters: the list shows what it answers.
      filter={null}
      value={null}
      onValueChange={(next) => {
        if (next) onChange(next)
      }}
      itemToStringLabel={(option) => option.handle}
      isItemEqualToValue={(option, selected) => option.id === selected.id}
      inputValue={text}
      onInputValueChange={(next, details) => {
        setText(next)
        if (details.reason !== 'input-change') return
        clearTimeout(timer.current)
        timer.current = setTimeout(() => search(next), SEARCH_DELAY)
      }}
    >
      <ComboboxInput
        ref={field}
        id={id}
        showTrigger={false}
        placeholder={t('search')}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          FIELD_BOX,
          'h-12 w-full px-3 [&_input]:text-base',
          // Focused, the line of every field, without the input group's ring.
          'has-[[data-slot=input-group-control]:focus-visible]:border-foreground/60 has-[[data-slot=input-group-control]:focus-visible]:ring-0',
          // With the results open, the field goes on below: its bottom corners square, no line, and
          // the floating cards' shadow, over the form (PO 2026-11-06). `!` over the focus line and the
          // list's shadcn shadow, written after it, as the hover cards do.
          'has-[[aria-expanded=true]]:rounded-b-none has-[[aria-expanded=true]]:border-transparent! has-[[aria-expanded=true]]:shadow-float',
          invalid && 'border-destructive',
        )}
      >
        <SearchIcon
          aria-hidden
          className="order-first ml-1 size-4 shrink-0 text-muted-foreground"
        />
      </ComboboxInput>
      {/* Only once something is typed: with nothing, the rail beside is the shortcut (FS-04). */}
      {text.trim() && (
        <ComboboxContent
          align="start"
          // Against the field, its width, its fill and its shadow: the field unfolds down into the
          // results (PO 2026-11-06), a hairline between them. clip-path, not height (design-system.md).
          sideOffset={0}
          // The whole field, not its <input>: the list as wide as the box it continues.
          anchor={() => field.current?.closest<HTMLElement>('[data-slot=input-group]') ?? null}
          className="min-w-0 rounded-t-none rounded-b-2xl bg-surface p-1 shadow-float! ring-0 before:pointer-events-none before:absolute before:inset-x-3 before:top-0 before:border-t before:border-border data-open:animate-unfold-in data-closed:animate-unfold-out"
        >
          {/* Inside the list: while it is open, the rest of the page is hidden from a screen
                reader. It says each change: searching, how many, none (WCAG 4.1.3, FS-01). */}
          <ComboboxStatus className="sr-only">{status}</ComboboxStatus>
          {/* Seen only: the status says it. */}
          <ComboboxEmpty aria-hidden className="px-3 py-2.5 type-meta">
            {loading ? t('searching') : failed ? t('searchFailed') : t('none')}
          </ComboboxEmpty>
          <ComboboxList className="max-h-64">
            {(option: CommunityOption) => (
              <ComboboxItem
                key={option.id}
                value={option}
                className="min-h-11 gap-2.5 rounded-lg px-2.5"
              >
                <UserAvatar
                  name={option.handle}
                  colorKey={option.slug}
                  imageUrl={option.avatarUrl}
                  size="xs"
                  className="shrink-0 rounded-md"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate type-small font-bold">{option.handle}</span>
                  <span className="truncate type-meta text-muted-foreground">{option.name}</span>
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      )}
    </Combobox>
  )
}
