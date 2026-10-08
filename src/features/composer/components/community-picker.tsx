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
import type { CommunityOption } from '../composer.types'

/** A pause before searching while the person types (specs/post-create-detail § 3). */
const SEARCH_DELAY = 250

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
 * browser never calls the API.
 */
export function CommunityPicker({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  firstFocus = false,
}: {
  id: string
  value: CommunityOption | null
  onChange: (community: CommunityOption | null) => void
  invalid: boolean
  describedBy?: string
  /** The editor's first focus when no community is chosen yet. */
  firstFocus?: boolean
}) {
  const t = useTranslations('composer.community')
  const [options, setOptions] = useState<CommunityOption[]>(value ? [value] : [])
  const [failed, setFailed] = useState(false)
  const [loading, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const asked = useRef<string | null>(null)

  function load(search: string) {
    if (asked.current === search) return
    asked.current = search
    startTransition(async () => {
      const result = await searchCommunities(search)
      // A newer search went out meanwhile: this answer is stale.
      if (asked.current !== search) return
      setFailed(!result.ok)
      if (result.ok) setOptions(result.data)
    })
  }

  useEffect(() => () => clearTimeout(timer.current), [])

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
        if (open && asked.current === null) load('')
      }}
      onInputValueChange={(text, details) => {
        // Choosing an option writes its label in the input: that is not a search.
        if (details.reason !== 'input-change') return
        clearTimeout(timer.current)
        timer.current = setTimeout(() => load(text.trim()), SEARCH_DELAY)
      }}
    >
      {/* Its own box: Field stretches its children, and the chip fits its text. */}
      <div>
        <ComboboxTrigger
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          data-autofocus={firstFocus || undefined}
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
        <ComboboxEmpty className="px-3 py-2.5 type-meta">
          {loading ? t('loading') : failed ? t('error') : t('empty')}
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
