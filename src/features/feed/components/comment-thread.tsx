'use client'

import { useTranslations } from 'next-intl'
import { createContext, useContext, useOptimistic, type ReactNode } from 'react'
import { useAuthGate } from '@/components/organisms/auth-gate'

/** A comment on its way: shown at once, as plain text, where the server will put it (PC-15). */
export type PendingComment = { key: string; parentId: string | null; body: string }

type Thread = { pending: PendingComment[]; addPending: (comment: PendingComment) => void }

const ThreadContext = createContext<Thread>({ pending: [], addPending: () => {} })

export function useThread() {
  return useContext(ThreadContext)
}

/**
 * The comments of a post's page (specs/post-create-detail § 4). Holds the comments being sent:
 * an optimistic list, so each one lasts exactly until the action ends, and the action's refresh
 * brings the server's comment in the same render. No duplicate, no gap.
 */
export function CommentThread({ children }: { children: ReactNode }) {
  const [pending, addPending] = useOptimistic<PendingComment[], PendingComment>(
    [],
    (list, comment) => [...list, comment],
  )
  return <ThreadContext value={{ pending, addPending }}>{children}</ThreadContext>
}

/**
 * The comments being sent under `parentId` (null: the post), at the end of that level: the
 * backend lists comments oldest first, so that is where they land.
 */
export function PendingComments({ parentId }: { parentId: string | null }) {
  const t = useTranslations('comments')
  const { pending } = useThread()
  const { viewerAvatar } = useAuthGate()
  const mine = pending.filter((comment) => comment.parentId === parentId)
  if (mine.length === 0) return null

  return (
    <ul className="flex flex-col gap-4">
      {mine.map((comment) => (
        <li key={comment.key} aria-busy="true" className="flex gap-2.5 opacity-70">
          <span className="shrink-0">{viewerAvatar}</span>
          <div className="min-w-0 flex-1 wrap-anywhere">
            <p className="mb-0.75 flex gap-1.25 type-meta text-muted-foreground">
              <span className="font-bold text-foreground">{t('you')}</span>
              <span aria-hidden>·</span>
              <span>{t('sending')}</span>
            </p>
            <p className="type-small whitespace-pre-wrap">{comment.body}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
