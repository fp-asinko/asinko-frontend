'use client'

import dynamic from 'next/dynamic'
import { useRef, useState, type ReactNode } from 'react'
import type { FollowKind } from '../communities.types'

/** The window comes on first use: most visits never open it (seo.md). */
const loadDialog = () => import('./follow-list-dialog').then((module) => module.FollowListDialog)
// ssr: false gives it its own Suspense: while its code comes, the nearest one (a feed's) does not
// go back to its skeleton (the PO saw Share "loading", 2026-10-21). It opens on a click: no SSR.
const FollowListDialog = dynamic(loadDialog, { ssr: false })

const DESKTOP = '(min-width: 48rem)'

// The touch area grows to 24px without moving the line (WCAG 2.5.8).
const NUMBER =
  'relative -mx-1 rounded-sm px-1 text-left outline-none after:absolute after:inset-x-0 after:-inset-y-1 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'

/**
 * "1,204 followers" and "180 following" as buttons (specs/follow-lists FL-01): each opens the
 * lists on its tab. They read as they did; the text comes rendered from the server.
 */
export function FollowCounts({
  userId,
  handle,
  isSelf,
  followers,
  following,
}: {
  userId: string
  handle: string
  isSelf: boolean
  followers: ReactNode
  following: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<FollowKind>('followers')
  const [layout, setLayout] = useState<'sheet' | 'modal'>('modal')
  const [opened, setOpened] = useState(false)
  // The number that opened it: the focus goes back there, whatever tab it closes on.
  const [opener, setOpener] = useState<FollowKind>('followers')
  const followersButton = useRef<HTMLButtonElement>(null)
  const followingButton = useRef<HTMLButtonElement>(null)

  function show(kind: FollowKind) {
    setLayout(window.matchMedia(DESKTOP).matches ? 'modal' : 'sheet')
    setTab(kind)
    setOpener(kind)
    setOpened(true)
    setOpen(true)
  }

  return (
    <>
      <span>
        <button
          ref={followersButton}
          type="button"
          aria-haspopup="dialog"
          onPointerEnter={() => void loadDialog()}
          onFocus={() => void loadDialog()}
          onClick={() => show('followers')}
          className={NUMBER}
        >
          {followers}
        </button>
      </span>{' '}
      <span>
        <button
          ref={followingButton}
          type="button"
          aria-haspopup="dialog"
          onPointerEnter={() => void loadDialog()}
          onFocus={() => void loadDialog()}
          onClick={() => show('following')}
          className={NUMBER}
        >
          {following}
        </button>
      </span>
      {opened && (
        <FollowListDialog
          view="follows"
          layout={layout}
          open={open}
          onOpenChange={setOpen}
          tab={tab}
          onTabChange={setTab}
          userId={userId}
          handle={handle}
          isSelf={isSelf}
          returnFocusTo={opener === 'followers' ? followersButton : followingButton}
        />
      )}
    </>
  )
}
