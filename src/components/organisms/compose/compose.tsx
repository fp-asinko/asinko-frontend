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
  /** Where the editor expands in place: the page's composer box (ComposeSlot). */
  registerSlot: (element: HTMLElement | null) => void
  /** The editor is open inside the box: the box hides its prompt. */
  expanded: boolean
}

// Without a provider (isolated component tests) nothing happens.
export const ComposeContext = createContext<Compose>({
  openCompose: () => {},
  setScope: () => {},
  registerSlot: () => {},
  expanded: false,
})

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

/**
 * The composer box of a page, as X (PC-03): the editor expands inside it, next to the avatar.
 * Closed, it shows the prompt and the actions row; open, both give their place to the editor.
 */
export function ComposeSlot({
  avatar,
  prompt,
  actions,
}: {
  avatar: ReactNode
  prompt: ReactNode
  actions: ReactNode
}) {
  const { registerSlot, expanded } = useCompose()
  return (
    <div data-compose-box>
      <div className="flex items-start gap-3">
        {/* As tall as the closed prompt (43px): centered with it, at the top when open. */}
        <div className="flex h-10.75 shrink-0 items-center">{avatar}</div>
        <div className="min-w-0 flex-1">
          <div hidden={expanded} className="flex">
            {prompt}
          </div>
          <div ref={registerSlot} />
        </div>
      </div>
      <div hidden={expanded}>{actions}</div>
    </div>
  )
}
