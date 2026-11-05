'use client'

import { ChevronDownIcon, ListFilterIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { FeedParams } from '../schemas/feed-params.schema'

// The Base UI Menu is heavy and only needed on tap: loaded on the first open, fetched ahead when
// the pointer or the focus reaches the button (as the comments' order, seo.md).
const loadMenu = () => import('./feed-type-menu-popup')
const FeedTypeMenuPopup = dynamic(() => loadMenu().then((mod) => mod.FeedTypeMenuPopup), {
  ssr: false,
})

/**
 * "All ▾", the feed's type (specs/feed-type-filter FT-04 to FT-07): a pill that says what it shows
 * and opens All, Posts, Theses and Polls. The choice goes in the URL; the tab, the order and the
 * community stay.
 */
export function FeedTypeMenu({
  params,
  pagePath,
}: {
  params: FeedParams
  /** On a community page, it stays on it (FT-11). */
  pagePath?: string
}) {
  const t = useTranslations('feed.type')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [requested, setRequested] = useState(false)
  // Pressing the trigger while open closes the menu (outside press): the click must not reopen it.
  const wasOpen = useRef(false)
  const filtered = params.type !== 'all'

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('trigger', { type: t(params.type) })}
        onPointerEnter={loadMenu}
        onFocus={loadMenu}
        onPointerDown={() => (wasOpen.current = open)}
        onClick={() => {
          setRequested(true)
          setOpen(!wasOpen.current)
          wasOpen.current = false
        }}
        className={cn(
          'inline-flex h-8 min-w-8 shrink-0 tap items-center justify-center gap-1 rounded-full px-2 type-action font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:pr-2.5 sm:pl-3.5',
          // Filtered, it stands out as the active pill; on All, it is quiet.
          filtered
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-surface hover:text-foreground',
        )}
      >
        {/* In a phone, the icon: the row keeps one line (FT-02); its name says the type. */}
        <ListFilterIcon aria-hidden className="size-4 sm:hidden" />
        <span aria-hidden className="hidden sm:inline">
          {t(params.type)}
        </span>
        <ChevronDownIcon aria-hidden className="hidden size-4 sm:block" />
      </button>
      {requested && (
        <FeedTypeMenuPopup
          params={params}
          pagePath={pagePath}
          open={open}
          onOpenChange={setOpen}
          anchor={triggerRef}
        />
      )}
    </>
  )
}
