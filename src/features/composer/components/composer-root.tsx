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

// Loaded the first time it opens (PC-19): readers who never post never download the editor.
const ComposerDialog = dynamic(
  () => import('./composer-dialog').then((mod) => mod.ComposerDialog),
  { ssr: false },
)

/**
 * The post editor behind every "Create" (specs/post-create-detail § 2). Without a session, the
 * account modal opens instead (PC-04). The page's community (ComposeScope) comes preselected.
 */
export function ComposerRoot({ children }: { children: ReactNode }) {
  const { requireAccount } = useAuthGate()
  const [scope, setScope] = useState<ComposeCommunity | null>(null)
  const [session, setSession] = useState<ComposeSession | null>(null)
  const [open, setOpen] = useState(false)

  const openCompose = useCallback(
    (request: ComposeRequest = {}) => {
      if (!requireAccount('post')) return
      setSession((last) => ({
        key: (last?.key ?? 0) + 1,
        type: request.type ?? 'TEXT',
        community: scope,
      }))
      setOpen(true)
    },
    [requireAccount, scope],
  )
  const value = useMemo(() => ({ openCompose, setScope }), [openCompose])

  return (
    <ComposeContext value={value}>
      {children}
      {session && <ComposerDialog open={open} onOpenChange={setOpen} session={session} />}
    </ComposeContext>
  )
}
