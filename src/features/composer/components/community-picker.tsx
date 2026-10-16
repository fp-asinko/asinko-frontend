'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useTransition } from 'react'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox'
import { cn } from '@/lib/utils'
import { searchCommunities } from '../actions/search-communities.action'
import type { CommunityKind, CommunityOption } from '../composer.types'
import { readSearch } from '../lib/picker-search'

/** A pause before searching while the person types (specs/post-create-detail § 3). */
const SEARCH_DELAY = 250

const KINDS: readonly CommunityKind[] = ['all', 'groups', 'assets']

/** The empty list says what was missing (specs/picker-filters PF-05). */
const EMPTY = { all: 'empty', groups: 'emptyGroups', assets: 'emptyAssets' } as const

/** The name under the handle, only when it says more than the handle (#Macro under #macro). */
function subtitle(option: CommunityOption) {
  if (option.own) return option.handle
  const bare = option.name.replace(/^[#$@]/, '').toLowerCase()
  return bare === option.handle.replace(/^[#$@]/, '').toLowerCase() ? null : option.name
}

/**
 * Where the post goes (PC-06), minimal: a chip ("#defi ▾") that opens a short list right under
 * it, fading in with a small slide. A search on top; the viewer's communities on open, "Your
 * profile" first, and a server search while typing. The options come from a Server Action: the
 * browser never calls the API. Chips under the search keep only groups or only assets, and a
 * leading `#` or `$` in the search picks them too, as in mentions (specs/picker-filters).
 */
export function CommunityPicker({
  id,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  id: string
  value: CommunityOption | null
  onChange: (community: CommunityOption | null) => void
  invalid: boolean
  describedBy?: string
}) {
  const t = useTranslations('composer.community')
  const [options, setOptions] = useState<CommunityOption[]>(value ? [value] : [])
  const [failed, setFailed] = useState(false)
  const [loading, startTransition] = useTransition()
  const [kind, setKind] = useState<CommunityKind>('all')
  const [text, setText] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const asked = useRef<string | null>(null)
  /** The kind came from a symbol typed in the search: erasing it goes back to All (PF-03). */
  const bySymbol = useRef(false)

  function load(search: string, of: CommunityKind) {
    const key = `${of}:${search}`
    if (asked.current === key) return
    asked.current = key
    startTransition(async () => {
      const result = await searchCommunities(search, of)
      // A newer search went out meanwhile: this answer is stale.
      if (asked.current !== key) return
      setFailed(!result.ok)
      if (result.ok) setOptions(result.data)
    })
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  function choose(next: CommunityKind) {
    bySymbol.current = false
    // A symbol in the search gives way to the chip: what is left is the search.
    const { kind: typed, search } = readSearch(text)
    if (typed) setText(search)
    setKind(next)
    clearTimeout(timer.current)
    load(search, next)
  }

  const label = value ? (value.own ? t('yourProfile') : value.handle) : t('placeholder')

  return (
    <Combobox<CommunityOption>
      items={options}
      // The server filters: the list shows what it answers.
      filter={null}
      value={value}
      onValueChange={(next) => onChange(next)}
      itemToStringLabel={(option) => (option.own ? t('yourProfile') : option.handle)}
      isItemEqualToValue={(option, selected) => option.id === selected.id}
      onOpenChange={(open) => {
        if (!open) return
        // Every opening starts on All (PF-01): the search is empty again.
        bySymbol.current = false
        setKind('all')
        load('', 'all')
      }}
      inputValue={text}
      onInputValueChange={(next, details) => {
        setText(next)
        // Choosing an option writes its label in the input: that is not a search.
        if (details.reason !== 'input-change') return
        const { kind: typed, search } = readSearch(next)
        let of = kind
        if (typed) {
          of = typed
          bySymbol.current = true
        } else if (bySymbol.current) {
          of = 'all'
          bySymbol.current = false
        }
        setKind(of)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => load(search, of), SEARCH_DELAY)
      }}
    >
      {/* Its own box: Field stretches its children, and the chip fits its text. */}
      <div>
        <ComboboxTrigger
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            'inline-flex h-8 max-w-full tap items-center gap-1 rounded-full bg-muted pr-2.5 pl-3 type-meta font-bold outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:ring-2 aria-invalid:ring-destructive/40 [&_svg]:size-3.5',
            value ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          <span className="truncate">{label}</span>
        </ComboboxTrigger>
      </div>
      {/* A border, not shadcn's ring: with the system's shadows at none, the ring's shared
          box-shadow is invalid and the panel showed white on white, without an edge. */}
      <ComboboxContent
        align="start"
        className="w-72 min-w-0 rounded-xl border p-1 shadow-none ring-0 duration-150 ease-out data-open:slide-in-from-top-1"
      >
        <ComboboxInput
          showTrigger={false}
          placeholder={t('search')}
          aria-label={t('search')}
          // Light: the surface gray, no ring; the active field's border only while typing.
          className="h-9! rounded-lg border-transparent! bg-surface! has-[[data-slot=input-group-control]:focus-visible]:border-input! has-[[data-slot=input-group-control]:focus-visible]:ring-0 [&_input]:text-foreground"
        />
        <div
          role="group"
          aria-label={t('filter')}
          className="flex flex-wrap gap-1.5 px-1 pt-2 pb-1"
        >
          {KINDS.map((each) => (
            <button
              key={each}
              type="button"
              aria-pressed={kind === each}
              // The search keeps the focus on a tap: the list stays open and typing goes on.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(each)}
              className={cn(
                // 28px tall, 24px+ target (WCAG 2.5.8); the profile's tabs.
                'inline-flex h-7 tap items-center rounded-full border px-3 type-meta font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                kind === each
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border-strong bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground',
              )}
            >
              {t(`kinds.${each}`)}
            </button>
          ))}
        </div>
        <ComboboxEmpty className="px-3 py-2.5 type-meta">
          {loading ? t('loading') : failed ? t('error') : t(EMPTY[kind])}
        </ComboboxEmpty>
        <ComboboxList className="max-h-64">
          {(option: CommunityOption) => (
            <ComboboxItem key={option.id} value={option} className="min-h-10 rounded-lg px-2.5">
              <span className="flex min-w-0 flex-col">
                <span className="truncate type-small font-bold">
                  {option.own ? t('yourProfile') : option.handle}
                </span>
                {subtitle(option) && (
                  <span className="truncate type-meta text-muted-foreground">
                    {subtitle(option)}
                  </span>
                )}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
