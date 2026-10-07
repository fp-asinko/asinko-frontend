'use client'

import { ChevronDownIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useTransition } from 'react'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { InputGroupAddon } from '@/components/ui/input-group'
import { searchCommunities } from '../actions/search-communities.action'
import type { CommunityOption } from '../composer.types'

/** A pause before searching while the person types (specs/post-create-detail § 3). */
const SEARCH_DELAY = 250

/**
 * Where the post goes (PC-06): a combobox with the viewer's communities on open, "Your profile"
 * first, and a server search while typing. The options come from a Server Action: the browser
 * never calls the API. Starts with the page's community when there is one.
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
      {/* The input opens the list when tapped: no separate arrow button without a name (axe). */}
      <ComboboxInput
        id={id}
        showTrigger={false}
        placeholder={t('placeholder')}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="h-11 w-full [&_input]:text-foreground"
      >
        <InputGroupAddon align="inline-end">
          <ChevronDownIcon aria-hidden className="size-4 text-muted-foreground" />
        </InputGroupAddon>
      </ComboboxInput>
      <ComboboxContent>
        <ComboboxEmpty>{loading ? t('loading') : failed ? t('error') : t('empty')}</ComboboxEmpty>
        <ComboboxList>
          {(option: CommunityOption) => (
            <ComboboxItem key={option.id} value={option} className="min-h-10">
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-bold">
                  {option.own ? t('yourProfile') : option.handle}
                </span>
                <span className="truncate type-meta text-muted-foreground">
                  {option.own ? option.handle : option.name}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
