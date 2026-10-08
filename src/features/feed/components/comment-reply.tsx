'use client'

import { MessageCircleIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState, type ReactNode } from 'react'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { CommentComposer } from './comment-composer'

/** A text action of the row, as Reddit's: 32px, 12px semibold, no background until hovered. */
export const COMMENT_ACTION =
  'inline-flex h-8 tap items-center gap-1.5 rounded-full px-2 type-meta font-semibold text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4'

/**
 * The actions row of a comment, as Reddit's (specs/comment-threads CT-03): its votes
 * (`children`), "Reply", which opens a box right under it (PC-15), and the rest (`actions`:
 * Share). `lead` sits on the thread's line (⊖). Closing the box, by Cancel, Esc or sending, gives
 * the focus back to "Reply". Without a session, the account modal opens instead.
 */
export function CommentReply({
  postId,
  commentId,
  lead,
  actions,
  children,
}: {
  postId: string
  commentId: string
  lead?: ReactNode
  actions?: ReactNode
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
      <div className="relative flex flex-wrap items-center gap-1">
        {lead}
        {children}
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          onClick={() => {
            if (open) close()
            else if (requireAccount('comment')) setOpen(true)
          }}
          className={COMMENT_ACTION}
        >
          <MessageCircleIcon aria-hidden />
          {t('reply')}
        </button>
        {actions}
      </div>
      {open && (
        <div className="mt-2">
          <CommentComposer postId={postId} parentId={commentId} onCancel={close} onSent={close} />
        </div>
      )}
    </>
  )
}
