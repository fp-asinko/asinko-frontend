'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** The community a page is about, to preselect it in the editor (specs/post-create-detail PC-06). */
export type ComposeCommunity = {
  id: string
  handle: string
  name: string
  /** The viewer's own channel: shown as "Your profile". */
  own?: boolean
}

/**
 * How the editor opens: on a tab (the composer's "Post" opens it on Text), and where. `box` (the
 * default) expands the page's composer box; `modal` opens a window over the page, as X's "Post"
 * button ("+ Create" in the top bar). In mobile it is always the full screen.
 */
export type ComposeRequest = { type?: 'TEXT' | 'LINK'; view?: 'box' | 'modal' }

type Compose = {
  /** Opens the post editor; without a session, the account modal instead. */
  openCompose: (request?: ComposeRequest) => void
  /** The page's community while the page is open (ComposeScope); null when it leaves. */
  setScope: (community: ComposeCommunity | null) => void
  /** Where the editor expands in place: the page's composer box (ComposeSlot). */
  registerSlot: (element: HTMLElement | null) => void
  /** The editor is open inside the box: the box hides its prompt. */
  expanded: boolean
  /** The person is about to open it (hover, focus, touch): start downloading the editor. */
  prepare: () => void
}

// Without a provider (isolated component tests) nothing happens.
export const ComposeContext = createContext<Compose>({
  openCompose: () => {},
  setScope: () => {},
  registerSlot: () => {},
  expanded: false,
  prepare: () => {},
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
  view,
  className,
  children,
  'aria-label': ariaLabel,
}: {
  type?: ComposeRequest['type']
  view?: ComposeRequest['view']
  className?: string
  children: ReactNode
  'aria-label'?: string
}) {
  const { openCompose, prepare } = useCompose()
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      // Intent before the click: by the time it lands, the editor is usually there.
      onPointerEnter={prepare}
      onPointerDown={prepare}
      onFocus={prepare}
      onClick={() => openCompose({ type, view })}
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
  // Once it has been open, the prompt fades back in when the editor leaves; never on first paint.
  const [opened, setOpened] = useState(false)
  if (expanded && !opened) setOpened(true)
  const back = opened && !expanded ? 'animate-fade-in' : undefined
  const prompted = useRef<HTMLDivElement>(null)
  const wasExpanded = useRef(false)
  // Folded away with the focus inside it (Cancel, Esc): the focus goes back to the prompt, once
  // it shows again. Not when the person has already moved the focus elsewhere.
  useEffect(() => {
    if (wasExpanded.current && !expanded) {
      const lost = document.activeElement === null || document.activeElement === document.body
      if (lost) prompted.current?.querySelector<HTMLElement>('button')?.focus()
    }
    wasExpanded.current = expanded
  }, [expanded])
  return (
    <div data-compose-box>
      <div className="flex items-start gap-3">
        {/* As tall as the closed prompt (43px): centered with it, at the top when open. */}
        <div className="flex h-10.75 shrink-0 items-center">{avatar}</div>
        <div className="min-w-0 flex-1">
          <div ref={prompted} hidden={expanded} className={cn('flex', back)}>
            {prompt}
          </div>
          <div ref={registerSlot} />
        </div>
      </div>
      <div hidden={expanded} className={back}>
        {actions}
      </div>
    </div>
  )
}
