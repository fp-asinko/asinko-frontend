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
import { EmojiButton } from '@/components/molecules/emoji-picker'
import { MentionField } from '@/components/molecules/mention-assist'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { searchMentions } from '@/lib/mentions/search-mentions.action'
import { createComment } from '../actions/create-comment.action'
import { useThread } from './comment-thread'
import { COMMENT_BOX } from './comment-box'

// 44px in mobile (the main action, design-system.md § Mobile first), 32px from md.
const PILL =
  'inline-flex h-11 md:h-8 tap items-center justify-center rounded-full px-3.5 type-action outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-60 aria-disabled:active:scale-100'

/**
 * The box to comment a post, or to reply to a comment when `parentId` is set (PC-15). The comment
 * shows at once where it will land (PendingComments) and the box empties; if sending fails, the
 * text comes back with the reason. Without a session, the account modal opens.
 *
 * The box of the post starts closed, as Reddit's: a one-line pill, "Join the conversation". The
 * same field opens on focus (taller, with Cancel and Comment) and closes again when the focus
 * leaves it with nothing written (specs/post-detail-refresh PD-02). Replies open already open.
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
  const [focused, setFocused] = useState(false)
  // Cancelled: closed with the focus still in the field, until it is clicked or typed in.
  const [held, setHeld] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Read by screen readers: the comment shows at once, but only visually.
  const [announcement, setAnnouncement] = useState('')
  const [sending, startTransition] = useTransition()
  const sent = useRef(0)
  const errorId = useId()
  const field = useRef<HTMLTextAreaElement>(null)
  const reply = parentId !== null
  const blocked = sending || !text.trim()
  const open = reply || (focused && !held) || text !== '' || error !== null

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

  /** The post's box: empties and closes back into the pill, the focus on it (WCAG 2.4.3). */
  function close() {
    setText('')
    setError(null)
    setHeld(true)
    field.current?.focus()
  }

  return (
    <form
      onSubmit={submit}
      onFocus={() => setFocused(true)}
      // Closed only when the focus leaves the whole box, not when it moves to its buttons.
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return
        // Nor when it goes into the emoji panel, which floats outside the form (specs/emoji-picker).
        if (
          event.relatedTarget instanceof Element &&
          event.relatedTarget.closest('[data-emoji-panel]')
        )
          return
        setFocused(false)
        setHeld(false)
      }}
      className="flex flex-col gap-2"
    >
      {/* $ # @ suggest assets, communities and people (specs/mention-autocomplete). */}
      <div className="relative">
        <Textarea
          id={reply ? undefined : COMMENT_BOX}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          onClick={() => setHeld(false)}
          aria-label={t(reply ? 'replyLabel' : 'label')}
          // The box of the post is named what it shows (WCAG 2.5.3): "Join the conversation".
          placeholder={t(reply ? 'replyPlaceholder' : 'label')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          ref={field}
          rows={1}
          className={cn(
            // The same padding open and closed: the text and its blue copy (mentions) never move
            // while the box grows. The pill's radius is half its height (22px), not "full": from
            // 9999px the corners would bulge all through the animation.
            'bg-background px-4 py-2.5 transition-[min-height,border-radius] duration-200 ease-out',
            // Focused, as Reddit's: one 1px border, darker, without the 3px halo (the PO: the
            // border and the halo together read as a thick double border).
            'focus-visible:border-foreground/60 focus-visible:ring-0',
            open
              ? 'min-h-20 rounded-2xl'
              : // The pill: one line, 44px (PD-02), the text of the placeholder centered on it.
                'min-h-11 resize-none rounded-[1.375rem]',
          )}
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
      {open && (
        <div className="flex items-center justify-end gap-2">
          {/* Emojis at the caret (specs/emoji-picker EP-01); the buttons stay on the right. */}
          <EmojiButton fieldRef={field} className="mr-auto" />
          {(onCancel || !reply) && (
            <button
              type="button"
              onClick={onCancel ?? close}
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
      )}
    </form>
  )
}
