'use client'

import { ArrowLeftIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { RefObject } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { FollowKind } from '../communities.types'
import { FollowList } from './follow-list'

/** Phones: the whole screen, as "Edit profile" and the post editor. */
const SHEET =
  'inset-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 pt-[env(safe-area-inset-top)] sm:max-w-none data-open:slide-in-from-bottom-10 data-open:zoom-in-100 data-closed:slide-out-to-bottom-10 data-closed:zoom-out-100'

/** Desktop: a window near the top, as Instagram's. */
const MODAL =
  'top-[8dvh] flex h-[min(36rem,84dvh)] w-[calc(100%-2rem)] max-w-120 -translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-120'

/** The shadcn line tabs: the chosen one underlined in black, at the list's edge. */
const TAB =
  'h-11 flex-1 rounded-none border-0 type-ui font-semibold group-data-horizontal/tabs:after:bottom-0'

/**
 * A person's followers and following, as Instagram's window (specs/follow-lists FL-01, FL-06):
 * two real tabs (arrows move between them), the touched one chosen and focused. A tab asks its
 * list when it first shows. Closing gives the focus back to the number that opened it.
 */
export function FollowListDialog({
  layout,
  open,
  onOpenChange,
  tab,
  onTabChange,
  userId,
  handle,
  isSelf,
  returnFocusTo,
}: {
  layout: 'sheet' | 'modal'
  open: boolean
  onOpenChange: (open: boolean) => void
  tab: FollowKind
  onTabChange: (tab: FollowKind) => void
  userId: string
  handle: string
  isSelf: boolean
  returnFocusTo?: RefObject<HTMLButtonElement | null>
}) {
  const t = useTranslations('communities.follows')
  const modal = layout === 'modal'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        initialFocus={() => document.querySelector<HTMLElement>('[data-follow-tabs] [data-active]')}
        finalFocus={returnFocusTo}
        className={modal ? MODAL : SHEET}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 px-2">
          <button
            type="button"
            aria-label={modal ? t('close') : undefined}
            onClick={() => onOpenChange(false)}
            className={cn(
              'inline-flex tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
              modal ? 'size-9' : 'h-11 gap-1.5 px-3 type-action',
            )}
          >
            {modal ? (
              <XIcon aria-hidden className="size-5" />
            ) : (
              <ArrowLeftIcon aria-hidden className="size-4" />
            )}
            {!modal && t('close')}
          </button>
          <DialogTitle className="type-post-title">{handle}</DialogTitle>
        </div>
        <Tabs
          value={tab}
          onValueChange={(next) => {
            if (next === 'followers' || next === 'following') onTabChange(next)
          }}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <TabsList
            data-follow-tabs
            variant="line"
            // The arrows choose the tab too, as a tablist is expected to (WAI-ARIA, FL-06).
            activateOnFocus
            aria-label={t('tabsLabel')}
            className="h-auto w-full shrink-0 rounded-none border-b bg-transparent p-0"
          >
            <TabsTrigger value="followers" className={TAB}>
              {t('tabs.followers')}
            </TabsTrigger>
            <TabsTrigger value="following" className={TAB}>
              {t('tabs.following')}
            </TabsTrigger>
          </TabsList>
          {(['followers', 'following'] as const).map((kind) => (
            <TabsContent
              key={kind}
              value={kind}
              // Kept when the other tab shows: its pages and its scroll stay.
              keepMounted
              // The scrolling panel is a Tab stop: its focus shows (WCAG 2.4.7).
              className="min-h-0 flex-1 overflow-y-auto focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
            >
              <FollowList userId={userId} kind={kind} handle={handle} isSelf={isSelf} />
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
