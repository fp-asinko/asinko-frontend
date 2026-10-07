'use client'

import { MessageSquareIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState, type ReactNode } from 'react'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { CommentComposer } from './comment-composer'

/**
 * The actions row of a comment (`children`: its votes) with "Reply", which opens a box right
 * under it (PC-15). Closing it, by Cancel, Esc or sending, gives the focus back to "Reply".
 * Without a session, the account modal opens instead.
 */
export function CommentReply({
  postId,
  commentId,
  children,
}: {
  postId: string
  commentId: string
  children: ReactNode
}) {
  const t = useTranslations('comments')
  const { requireAccount } = useAuthGate()
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)

  function close() {
    setOpen(false)
    button.current?.focus()
  }

  return (
    <>
      <div className="mt-1.5 flex items-center gap-1.5">
        {children}
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          onClick={() => {
            if (open) close()
            else if (requireAccount('comment')) setOpen(true)
          }}
          className="inline-flex h-7 tap items-center gap-1 rounded-full px-2.5 type-meta font-bold text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <MessageSquareIcon aria-hidden className="size-3.5" />
          {t('reply')}
        </button>
      </div>
      {open && (
        <div className="mt-2">
          <CommentComposer postId={postId} parentId={commentId} onCancel={close} onSent={close} />
        </div>
      )}
    </>
  )
}
