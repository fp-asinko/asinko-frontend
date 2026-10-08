'use client'

import { ChevronDownIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import type { CommentSort } from '../schemas/comments-query.schema'

// The Base UI Menu is heavy and only needed on tap: loaded on the first open, fetched ahead when
// the pointer or the focus reaches the button (as the top bar's "⋯", seo.md).
const loadMenu = () => import('./comments-sort-menu')
const CommentsSortMenu = dynamic(() => loadMenu().then((mod) => mod.CommentsSortMenu), {
  ssr: false,
})

/**
 * "Sort by: Best ▾" over a post's comments (specs/post-detail-refresh PD-03), as Reddit's. The
 * order goes in the URL (PD-04): the server sorts and renders the list.
 */
export function CommentsSort({ current }: { current: CommentSort }) {
  const t = useTranslations('postDetail.sort')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [requested, setRequested] = useState(false)
  // Pressing the trigger while open closes the menu (outside press): the click must not reopen it.
  const wasOpen = useRef(false)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onPointerEnter={loadMenu}
        onFocus={loadMenu}
        onPointerDown={() => (wasOpen.current = open)}
        onClick={() => {
          setRequested(true)
          setOpen(!wasOpen.current)
          wasOpen.current = false
        }}
        className="inline-flex h-11 tap items-center gap-1.5 rounded-full px-3 type-small outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9"
      >
        <span className="text-muted-foreground">{t('label')}:</span>{' '}
        <span className="font-bold">{t(current)}</span>
        <ChevronDownIcon aria-hidden className="size-4 text-muted-foreground" />
      </button>
      {requested && (
        <CommentsSortMenu
          current={current}
          open={open}
          onOpenChange={setOpen}
          anchor={triggerRef}
        />
      )}
    </>
  )
}
