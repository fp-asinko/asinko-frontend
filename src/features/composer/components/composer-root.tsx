'use client'

import dynamic from 'next/dynamic'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useAuthGate } from '@/components/organisms/auth-gate'
import {
  ComposeContext,
  type ComposeCommunity,
  type ComposeRequest,
} from '@/components/organisms/compose'

/** One opening of the editor: a new key starts a blank form. */
export type ComposeSession = {
  key: number
  type: NonNullable<ComposeRequest['type']>
  community: ComposeCommunity | null
}

/** Where the editor is open: in the page's box, the full screen (mobile) or a window (desktop). */
export type ComposeMode = 'closed' | 'inline' | 'sheet' | 'modal'

/** From md the editor expands in the page's box or opens a window; below, the whole screen. */
const DESKTOP = '(min-width: 48rem)'

// Loaded on the first intent to open it (PC-19): readers who never post never download the
// editor. One loader for every view (JS budget, seo.md).
const loadView = () => import('./composer-view').then((mod) => mod.ComposerView)
const ComposerView = dynamic(loadView, { ssr: false })

/**
 * The post editor behind every "Create" (specs/post-create-detail § 2). Without a session, the
 * account modal opens instead (PC-04). The page's community (ComposeScope) comes preselected.
 *
 * - Desktop, the page's composer box: the editor expands inside it.
 * - Desktop, "+ Create" in the top bar (or a page without a box): a window over the page, as X's
 *   "Post", without moving the page.
 * - Mobile: full screen.
 */
export function ComposerRoot({ children }: { children: ReactNode }) {
  const { requireAccount, signedIn } = useAuthGate()
  const [scope, setScope] = useState<ComposeCommunity | null>(null)
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [session, setSession] = useState<ComposeSession | null>(null)
  const [mode, setMode] = useState<ComposeMode>('closed')
  // The windows (full screen or modal) only exist once used, so closing them can animate.
  const [dialogUsed, setDialogUsed] = useState(false)
  const [windowLayout, setWindowLayout] = useState<'sheet' | 'modal'>('modal')
  // The session whose editor is already drawn in the box. Until then the box keeps its prompt:
  // the first time, the editor is still downloading, and the box would be empty meanwhile.
  const [shown, setShown] = useState<number | null>(null)

  const start = useCallback(
    (request: ComposeRequest, next: ComposeMode, community: ComposeCommunity | null) => {
      setSession((last) => ({
        key: (last?.key ?? 0) + 1,
        type: request.type ?? 'TEXT',
        community,
      }))
      setMode(next)
      if (next === 'sheet' || next === 'modal') {
        setDialogUsed(true)
        setWindowLayout(next)
      }
    },
    [],
  )

  const openCompose = useCallback(
    (request: ComposeRequest = {}) => {
      if (!requireAccount('post')) return
      if (!window.matchMedia(DESKTOP).matches) return start(request, 'sheet', scope)
      if (request.view === 'modal' || !slot) return start(request, 'modal', scope)
      // Already open in the box: keep what is written.
      if (mode !== 'inline') start(request, 'inline', scope)
    },
    [requireAccount, start, scope, slot, mode],
  )

  // The box left with its page: nothing to expand into any more.
  const inline = mode === 'inline' && slot !== null

  // The focus goes back where the person started: the box gives it to its prompt (ComposeSlot),
  // and the windows to the button that opened them.
  function close() {
    setMode('closed')
  }

  const expanded = inline && session !== null && shown === session.key
  const prepare = useCallback(() => {
    if (signedIn) void loadView()
  }, [signedIn])

  const value = useMemo(
    () => ({ openCompose, setScope, registerSlot: setSlot, expanded, prepare }),
    [openCompose, expanded, prepare],
  )

  return (
    <ComposeContext value={value}>
      {children}
      {session && (
        <ComposerView
          mode={inline ? 'inline' : mode === 'inline' ? 'closed' : mode}
          windowLayout={windowLayout}
          slot={slot}
          session={session}
          dialogUsed={dialogUsed}
          onShown={setShown}
          onClose={close}
        />
      )}
    </ComposeContext>
  )
}
