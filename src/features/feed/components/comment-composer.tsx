'use client'

import { useTranslations } from 'next-intl'
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { MentionField } from '@/components/molecules/mention-assist'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { searchMentions } from '@/lib/mentions/search-mentions.action'
import { createComment } from '../actions/create-comment.action'
import { useThread } from './comment-thread'

// 44px in mobile (the main action, design-system.md § Mobile first), 32px from md.
const PILL =
  'inline-flex h-11 md:h-8 tap items-center justify-center rounded-full px-3.5 type-action outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-60 aria-disabled:active:scale-100'

/**
 * The box to comment a post, or to reply to a comment when `parentId` is set (PC-15). The comment
 * shows at once where it will land (PendingComments) and the box empties; if sending fails, the
 * text comes back with the reason. Without a session, the account modal opens.
 */
export function CommentComposer({
  postId,
  parentId = null,
  onCancel,
  onSent,
}: {
  postId: string
  parentId?: string | null
  /** Replies only: closes the box (Esc or Cancel). */
  onCancel?: () => void
  /** Replies only: closes the box once the reply is in. */
  onSent?: () => void
}) {
  const t = useTranslations('comments')
  const { addPending } = useThread()
  const { requireAccount, openGate } = useAuthGate()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  // Read by screen readers: the comment shows at once, but only visually.
  const [announcement, setAnnouncement] = useState('')
  const [sending, startTransition] = useTransition()
  const sent = useRef(0)
  const errorId = useId()
  const field = useRef<HTMLTextAreaElement>(null)
  const reply = parentId !== null
  const blocked = sending || !text.trim()

  // The reply box opens because the person asked for it: it takes the focus.
  useEffect(() => {
    if (reply) field.current?.focus()
  }, [reply])

  function submit(event: FormEvent) {
    event.preventDefault()
    const body = text.trim()
    // aria-disabled, not disabled: the focused button keeps the focus while sending (WCAG 2.4.3).
    if (blocked || !requireAccount('comment')) return
    setError(null)
    setAnnouncement(t('sending'))
    setText('')
    sent.current += 1
    const key = `${parentId ?? 'post'}-${sent.current}`
    startTransition(async () => {
      addPending({ key, parentId, body })
      const result = await createComment({ postId, parentCommentId: parentId, body })
      if (result.ok) {
        setAnnouncement(t('sent'))
        if (onSent) startTransition(onSent)
        return
      }
      setAnnouncement('')
      setText(body)
      if (result.error === 'api.errors.UNAUTHENTICATED') openGate('comment')
      else setError(t('error'))
    })
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape' && onCancel) onCancel()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      {/* $ # @ suggest assets, communities and people (specs/mention-autocomplete). */}
      <div className="relative">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          aria-label={t(reply ? 'replyLabel' : 'label')}
          placeholder={t(reply ? 'replyPlaceholder' : 'placeholder')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          ref={field}
          className="min-h-20 bg-background"
        />
        <MentionField fieldRef={field} search={searchMentions} />
      </div>
      <span role="status" className="sr-only">
        {announcement}
      </span>
      {error && (
        <p id={errorId} role="alert" className="type-meta text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={cn(PILL, 'bg-muted text-muted-foreground hover:bg-muted-hover')}
          >
            {t('cancel')}
          </button>
        )}
        <button
          type="submit"
          aria-disabled={blocked || undefined}
          className={cn(PILL, 'bg-primary text-primary-foreground hover:bg-primary/85')}
        >
          {t(reply ? 'sendReply' : 'submit')}
        </button>
      </div>
    </form>
  )
}
