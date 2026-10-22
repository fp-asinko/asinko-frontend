'use client'

import dynamic from 'next/dynamic'
import { useRef, useState, type ReactNode } from 'react'

/** The window comes on first use: most visits never open it (seo.md). */
const loadDialog = () => import('./follow-list-dialog').then((module) => module.FollowListDialog)
// ssr: false gives it its own Suspense: while its code comes, the nearest one (a feed's) does not
// go back to its skeleton (the PO saw Share "loading", 2026-10-21). It opens on a click: no SSR.
const FollowListDialog = dynamic(loadDialog, { ssr: false })

const DESKTOP = '(min-width: 48rem)'

/**
 * "1,204 members" as a button (specs/community-members CM-01): opens the community's members in
 * the people window, as a profile's followers. It reads as it did; the text comes rendered from
 * the server. The focus comes back here on closing (CM-06).
 */
export function MembersButton({
  slug,
  handle,
  children,
}: {
  slug: string
  /** #defi or $BTC: the window's title. */
  handle: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [opened, setOpened] = useState(false)
  const [layout, setLayout] = useState<'sheet' | 'modal'>('modal')
  const button = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        onPointerEnter={() => void loadDialog()}
        onFocus={() => void loadDialog()}
        onClick={() => {
          setLayout(window.matchMedia(DESKTOP).matches ? 'modal' : 'sheet')
          setOpened(true)
          setOpen(true)
        }}
        // The touch area grows to 24px without moving the line (WCAG 2.5.8).
        className="relative -mx-1 rounded-sm px-1 text-left outline-none after:absolute after:inset-x-0 after:-inset-y-1 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {children}
      </button>
      {opened && (
        <FollowListDialog
          view="members"
          slug={slug}
          handle={handle}
          layout={layout}
          open={open}
          onOpenChange={setOpen}
          returnFocusTo={button}
        />
      )}
    </>
  )
}
