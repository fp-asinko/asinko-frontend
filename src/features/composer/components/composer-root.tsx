'use client'

import dynamic from 'next/dynamic'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuthGate } from '@/components/organisms/auth-gate'
import {
  ComposeContext,
  type ComposeCommunity,
  type ComposeRequest,
} from '@/components/organisms/compose'
import { useRouter } from '@/i18n/navigation'

/** One opening of the editor: a new key starts a blank form. */
export type ComposeSession = {
  key: number
  type: NonNullable<ComposeRequest['type']>
  community: ComposeCommunity | null
}

type Mode = 'closed' | 'inline' | 'sheet'

/** From md the editor expands in the page's box; below, it takes the whole screen (as X). */
const DESKTOP = '(min-width: 48rem)'

// Loaded on the first intent to open it (PC-19): readers who never post never download the
// editor. One loader for both views, the box and the full screen (JS budget, seo.md).
const loadView = () => import('./composer-view').then((mod) => mod.ComposerView)
const ComposerView = dynamic(loadView, { ssr: false })

/**
 * The post editor behind every "Create" (specs/post-create-detail § 2). Without a session, the
 * account modal opens instead (PC-04). The page's community (ComposeScope) comes preselected.
 *
 * - Desktop, with a composer box in the page: the editor expands inside it, and the page scrolls
 *   up to it.
 * - Desktop, without a box (a post's page, someone else's profile): to the Home, where it opens
 *   as soon as its box is there.
 * - Mobile: full screen.
 */
export function ComposerRoot({ children }: { children: ReactNode }) {
  const { requireAccount, signedIn } = useAuthGate()
  const router = useRouter()
  const [scope, setScope] = useState<ComposeCommunity | null>(null)
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [session, setSession] = useState<ComposeSession | null>(null)
  const [mode, setMode] = useState<Mode>('closed')
  // "Create" from a page without a box: opens on the Home as soon as its box registers.
  const pending = useRef<ComposeRequest | null>(null)
  // Read by the stable registerSlot without re-creating it (a new ref callback would detach the
  // box and drop what is written).
  const scopeRef = useRef<ComposeCommunity | null>(null)
  const changeScope = useCallback((community: ComposeCommunity | null) => {
    scopeRef.current = community
    setScope(community)
  }, [])
  // The full screen only exists once used: desktop never downloads it.
  const [sheetUsed, setSheetUsed] = useState(false)
  // The session whose editor is already drawn in the box. Until then the box keeps its prompt:
  // the first time, the editor is still downloading, and the box would be empty meanwhile.
  const [shown, setShown] = useState<number | null>(null)

  const start = useCallback(
    (request: ComposeRequest, next: Mode, community: ComposeCommunity | null) => {
      setSession((last) => ({
        key: (last?.key ?? 0) + 1,
        type: request.type ?? 'TEXT',
        community,
      }))
      setMode(next)
      if (next === 'sheet') setSheetUsed(true)
    },
    [],
  )

  const openCompose = useCallback(
    (request: ComposeRequest = {}) => {
      if (!requireAccount('post')) return
      if (!window.matchMedia(DESKTOP).matches) return start(request, 'sheet', scope)
      if (slot) {
        // Already open here: just bring it into view, without losing what is written.
        if (mode !== 'inline') start(request, 'inline', scope)
        slot.closest('[data-compose-box]')?.scrollIntoView({ block: 'nearest' })
        return
      }
      pending.current = request
      router.push('/')
    },
    [requireAccount, start, scope, slot, mode, router],
  )

  const registerSlot = useCallback(
    (element: HTMLElement | null) => {
      setSlot(element)
      if (element && pending.current) {
        start(pending.current, 'inline', scopeRef.current)
        pending.current = null
      }
    },
    [start],
  )

  // The box left with its page: nothing to expand into any more.
  const inline = mode === 'inline' && slot !== null

  function close() {
    setMode('closed')
    // Back to where the person started: the box's prompt.
    if (mode === 'inline') {
      requestAnimationFrame(() =>
        slot?.closest('[data-compose-box]')?.querySelector<HTMLElement>('button')?.focus(),
      )
    }
  }

  const expanded = inline && session !== null && shown === session.key
  const prepare = useCallback(() => {
    if (signedIn) void loadView()
  }, [signedIn])

  const value = useMemo(
    () => ({ openCompose, setScope: changeScope, registerSlot, expanded, prepare }),
    [openCompose, changeScope, registerSlot, expanded, prepare],
  )

  return (
    <ComposeContext value={value}>
      {children}
      {session && (
        <ComposerView
          mode={inline ? 'inline' : mode === 'sheet' ? 'sheet' : 'closed'}
          slot={slot}
          session={session}
          sheetUsed={sheetUsed}
          onShown={setShown}
          onClose={close}
        />
      )}
    </ComposeContext>
  )
}
