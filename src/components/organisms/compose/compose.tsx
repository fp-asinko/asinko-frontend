'use client'

import { createContext, useContext, type ReactNode } from 'react'

/** The community a page is about, to preselect it in the editor (specs/post-create-detail PC-06). */
export type ComposeCommunity = {
  id: string
  handle: string
  name: string
  /** The viewer's own channel: shown as "Your profile". */
  own?: boolean
}

/** How the editor opens: on a tab (the composer's "Post" opens it on Text). */
export type ComposeRequest = { type?: 'TEXT' | 'LINK' }

type Compose = {
  /** Opens the post editor; without a session, the account modal instead. */
  openCompose: (request?: ComposeRequest) => void
  /** The page's community while the page is open (ComposeScope); null when it leaves. */
  setScope: (community: ComposeCommunity | null) => void
}

// Without a provider (isolated component tests) nothing happens.
export const ComposeContext = createContext<Compose>({ openCompose: () => {}, setScope: () => {} })

/**
 * Opening the post editor from anywhere (specs/post-create-detail § 2). No business here: the
 * composer feature provides it (ComposerRoot) and loads the editor the first time.
 */
export function useCompose() {
  return useContext(ComposeContext)
}

/**
 * A button that opens the editor: "+ Create" in the top bar, "Create" in the bottom bar and the
 * feed's composer box. The look comes from where it sits.
 */
export function ComposeTrigger({
  type,
  className,
  children,
  'aria-label': ariaLabel,
}: {
  type?: ComposeRequest['type']
  className?: string
  children: ReactNode
  'aria-label'?: string
}) {
  const { openCompose } = useCompose()
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      onClick={() => openCompose({ type })}
      className={className}
    >
      {children}
    </button>
  )
}
