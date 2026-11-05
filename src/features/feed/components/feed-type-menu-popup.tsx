'use client'

import { ChartBarIcon, LayersIcon, PenLineIcon, TargetIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { RefObject } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { useRouter } from '@/i18n/navigation'
import { feedHref } from '../lib/feed-href'
import { FEED_TYPES, type FeedParams, type FeedType } from '../schemas/feed-params.schema'

/** Each type's icon, as elsewhere: the thesis's badge, the poll's, the post's pen. */
const ICONS = { all: LayersIcon, posts: PenLineIcon, theses: TargetIcon, polls: ChartBarIcon }

/**
 * The feed's types (specs/feed-type-filter FT-04, FT-05), downloaded on the first open. Choosing
 * one navigates with `?type=` (All without it): shareable, and "back" returns. The page keeps its
 * scroll.
 */
export function FeedTypeMenuPopup({
  params,
  pagePath,
  open,
  onOpenChange,
  anchor,
}: {
  params: FeedParams
  pagePath?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  anchor: RefObject<HTMLButtonElement | null>
}) {
  const t = useTranslations('feed.type')
  const router = useRouter()

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuContent anchor={anchor} finalFocus={anchor} align="end" className="w-44">
        <DropdownMenuRadioGroup
          value={params.type}
          onValueChange={(value) => {
            // A radio item keeps a Base UI menu open: choosing a type is done with it.
            onOpenChange(false)
            router.push(feedHref({ ...params, type: value as FeedType }, pagePath), {
              scroll: false,
            })
          }}
        >
          {FEED_TYPES.map((type) => {
            const Icon = ICONS[type]
            return (
              <DropdownMenuRadioItem key={type} value={type} className="min-h-10 gap-2.5">
                <Icon aria-hidden className="size-4 text-muted-foreground" />
                {t(type)}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
