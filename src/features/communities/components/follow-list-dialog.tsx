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

/** A tab's scrolling panel is a Tab stop: its focus shows (WCAG 2.4.7). */
const PANEL =
  'min-h-0 flex-1 overflow-y-auto focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset'

/** A person's two lists, on tabs (specs/follow-lists). */
type Follows = {
  view: 'follows'
  tab: FollowKind
  onTabChange: (tab: FollowKind) => void
  userId: string
  isSelf: boolean
}

/** A community's members, one list (specs/community-members). */
type Members = { view: 'members'; slug: string }

/**
 * A list of people in a window, as Instagram's: a person's followers and following on two real
 * tabs (specs/follow-lists FL-01, FL-06: arrows move between them, the touched one chosen and
 * focused, each asking its list when it first shows), or a community's members (specs/
 * community-members CM-01, CM-06). Closing gives the focus back to what opened it.
 */
export function FollowListDialog({
  layout,
  open,
  onOpenChange,
  handle,
  returnFocusTo,
  ...props
}: {
  layout: 'sheet' | 'modal'
  open: boolean
  onOpenChange: (open: boolean) => void
  /** @maria or #defi. */
  handle: string
  returnFocusTo?: RefObject<HTMLButtonElement | null>
} & (Follows | Members)) {
  const t = useTranslations('communities.follows')
  const modal = layout === 'modal'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        initialFocus={
          props.view === 'follows'
            ? () => document.querySelector<HTMLElement>('[data-follow-tabs] [data-active]')
            : undefined
        }
        finalFocus={returnFocusTo}
        className={modal ? MODAL : SHEET}
      >
        <div className="flex min-h-14 shrink-0 items-center gap-2 px-2">
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
          {/* A long handle wraps instead of overflowing at 360px. */}
          <DialogTitle className="min-w-0 flex-1 type-post-title wrap-anywhere">
            {props.view === 'members' ? t('membersTitle', { handle }) : handle}
          </DialogTitle>
        </div>
        {props.view === 'members' ? (
          // Its rows are the Tab stops: the panel scrolls with them.
          <div className="min-h-0 flex-1 overflow-y-auto border-t">
            <FollowList
              source={{ list: 'members', slug: props.slug }}
              handle={handle}
              isSelf={false}
            />
          </div>
        ) : (
          <Tabs
            value={props.tab}
            onValueChange={(next) => {
              if (next === 'followers' || next === 'following') props.onTabChange(next)
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
                className={PANEL}
              >
                <FollowList
                  source={{ list: kind, userId: props.userId }}
                  handle={handle}
                  isSelf={props.isSelf}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
