'use client'

import { useTranslations } from 'next-intl'
import type { RefObject } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { usePathname, useRouter } from '@/i18n/navigation'
import { COMMENT_SORTS, type CommentSort } from '../schemas/comments-query.schema'

/**
 * The orders of the comments (PD-03), downloaded on the first open. Choosing one navigates to the
 * same page with `?sort=` (the default one without it): shareable, and "back" returns (PD-04).
 * The page keeps its scroll; a search in progress is left.
 */
export function CommentsSortMenu({
  current,
  open,
  onOpenChange,
  anchor,
}: {
  current: CommentSort
  open: boolean
  onOpenChange: (open: boolean) => void
  anchor: RefObject<HTMLButtonElement | null>
}) {
  const t = useTranslations('postDetail.sort')
  const router = useRouter()
  const pathname = usePathname()

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuContent anchor={anchor} finalFocus={anchor} align="start" className="w-44">
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => {
            const sort = value as CommentSort
            router.push(sort === 'best' ? pathname : `${pathname}?sort=${sort}`, { scroll: false })
          }}
        >
          {COMMENT_SORTS.map((sort) => (
            <DropdownMenuRadioItem key={sort} value={sort} className="min-h-10">
              {t(sort)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
