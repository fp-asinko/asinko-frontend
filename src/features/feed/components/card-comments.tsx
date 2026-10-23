'use client'

import { useFormatter, useNow, useTranslations } from 'next-intl'
import { use, useState, type ReactNode } from 'react'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { commentFromCard } from '../actions/comment-from-card.action'
import { CommentComposer } from './comment-composer'
import { AddedComments } from './comment-count'
import { CommentThread, PendingComments } from './comment-thread'

type Sent = { id: string; body: string; at: Date }

/**
 * The comments panel of a card, with a box to comment without leaving the feed (specs/card-comment):
 * what is on its way and what was sent in this visit first (CC-02), then the server's preview, then
 * the box, the same as the post page's (CC-01). It arrives with the preview, when 💬 opens: none of
 * this loads with the page (CC-07).
 */
export function CardComments({
  kind,
  id,
  empty,
  children,
}: {
  kind: 'post' | 'poll'
  id: string
  /** The preview has no comments: its empty state goes once something is sent. */
  empty: boolean
  /** The server's preview. */
  children: ReactNode
}) {
  const t = useTranslations('comments')
  const format = useFormatter()
  const now = useNow()
  const { viewerAvatar } = useAuthGate()
  const { add } = use(AddedComments)
  const [sent, setSent] = useState<Sent[]>([])

  return (
    <CommentThread>
      <div className="flex flex-col gap-3.5">
        {/* --av: the preview's 20px avatars, for what is on its way too (PendingComments). */}
        <ul className="flex flex-col gap-3.5 [--av:1.25rem] empty:hidden">
          <PendingComments parentId={null} itemClassName="flex flex-col" />
          {sent.map((comment) => (
            <li key={comment.id} className="flex gap-2.5">
              <span className="flex size-5 shrink-0 *:size-5 *:text-[0.5rem]">{viewerAvatar}</span>
              <div className="min-w-0 flex-1 wrap-anywhere">
                <p className="mb-0.75 flex gap-1.25 type-meta text-muted-foreground">
                  <span className="font-bold text-foreground">{t('you')}</span>
                  <span aria-hidden>·</span>
                  <time dateTime={comment.at.toISOString()}>
                    {format.relativeTime(comment.at, now)}
                  </time>
                </p>
                <p className="type-small whitespace-pre-wrap text-foreground">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
        {!(empty && sent.length > 0) && children}
        <CommentComposer
          postId={id}
          boxId={null}
          send={({ body }) => commentFromCard({ kind, id, body })}
          onSent={({ id: commentId, body }) => {
            setSent((list) => [{ id: commentId, body, at: new Date() }, ...list])
            add()
          }}
        />
      </div>
    </CommentThread>
  )
}
