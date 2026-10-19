'use client'

import { TagIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef } from 'react'
import { TagPill } from '@/components/molecules/tag-pill'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const ADD =
  'inline-flex h-8 tap items-center gap-1.5 rounded-full bg-muted px-3 type-meta font-bold outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-not-allowed aria-disabled:text-muted-foreground aria-disabled:hover:bg-muted aria-disabled:active:scale-100 [&_svg]:size-3.5'

/**
 * A post's tag (specs/drafts-tags DT-07, DT-08): "Add tag" opens its community's tags and one is
 * chosen, then shown as a pill with its ×. Without a community, or with a community without tags,
 * the button stays (aria-disabled, in the tab order) and says why beside it.
 */
export function TagPicker({
  tags,
  hasCommunity,
  value,
  onChange,
}: {
  /** The chosen community's tags. */
  tags: readonly string[]
  hasCommunity: boolean
  value: string
  onChange: (tag: string) => void
}) {
  const t = useTranslations('composer.tag')
  const ids = useId()
  const focusNext = useRef<string | null>(null)
  const addId = `${ids}-add`
  const removeId = `${ids}-remove`
  const why = !hasCommunity ? t('noCommunity') : tags.length === 0 ? t('none') : null

  // After choosing or removing, the focus goes on with what replaced the button (WCAG 2.4.3).
  useEffect(() => {
    if (!focusNext.current) return
    document.getElementById(focusNext.current)?.focus()
    focusNext.current = null
  }, [value])

  if (value) {
    return (
      <div className="flex items-center gap-0.5">
        <TagPill label={value} />
        <button
          id={removeId}
          type="button"
          aria-label={t('remove', { tag: value })}
          onClick={() => {
            focusNext.current = addId
            onChange('')
          }}
          className="inline-flex size-6 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-3.5"
        >
          <XIcon aria-hidden />
        </button>
      </div>
    )
  }

  if (why) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <button
          id={addId}
          type="button"
          aria-disabled
          aria-describedby={`${ids}-why`}
          className={ADD}
        >
          <TagIcon aria-hidden />
          {t('add')}
        </button>
        <span id={`${ids}-why`} className="type-meta text-muted-foreground">
          {why}
        </span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger id={addId} className={cn(ADD, 'self-start')}>
        <TagIcon aria-hidden />
        {t('add')}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {tags.map((tag) => (
          <DropdownMenuItem
            key={tag}
            className="min-h-10"
            onClick={() => {
              focusNext.current = removeId
              onChange(tag)
            }}
          >
            {tag}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
