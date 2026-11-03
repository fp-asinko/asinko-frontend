'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from 'react'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { createThesisUpdate } from '../actions/create-thesis-update.action'
import { THESIS_UPDATE_MAX } from '../schemas/thesis-update.schema'

const PILL =
  'inline-flex h-9 tap items-center justify-center rounded-full px-4 type-action outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-60'

/**
 * The form of an update (specs/thesis-arguments TA-10 to TA-12), loaded on the first open: what
 * changed, up to 2,000 characters with its counter, the warning that it cannot be edited nor
 * deleted, and Cancel and Post. Once posted, the page comes again with it first (the action
 * refreshes) and the form closes.
 */
export function ThesisUpdateForm({ thesisId, onClose }: { thesisId: string; onClose: () => void }) {
  const t = useTranslations('feed.thesis.updates')
  const ids = useId()
  const field = useRef<HTMLTextAreaElement>(null)
  const { openGate } = useAuthGate()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const length = text.trim().length

  // Opened because the author asked for it: the focus goes to the field.
  useEffect(() => field.current?.focus(), [])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    if (length === 0 || length > THESIS_UPDATE_MAX) {
      // Said in words, not only by the red counter (WCAG 3.3.1).
      setError(t(length === 0 ? 'errors.required' : 'errors.tooLong'))
      return
    }
    startTransition(async () => {
      const result = await createThesisUpdate({ thesisId, body: text })
      if (result.ok) {
        setText('')
        onClose()
        return
      }
      if (result.error === 'api.errors.UNAUTHENTICATED') {
        openGate('login')
        return
      }
      setError(
        t(
          result.error === 'feed.thesis.updates.errors.notOpen'
            ? 'errors.notOpen'
            : 'errors.generic',
        ),
      )
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={`${ids}-update`} className="type-small font-semibold">
          {t('label')}
        </label>
        <span
          id={`${ids}-count`}
          className={cn(
            'type-meta tabular-nums',
            length > THESIS_UPDATE_MAX ? 'font-bold text-destructive' : 'text-muted-foreground',
          )}
        >
          {t('counter', { count: length, max: THESIS_UPDATE_MAX })}
        </span>
      </div>
      <Textarea
        ref={field}
        id={`${ids}-update`}
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setError(null)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !pending) onClose()
        }}
        placeholder={t('placeholder')}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={`${ids}-count ${ids}-note${error ? ` ${ids}-error` : ''}`}
        className="min-h-24 text-base"
      />
      <p id={`${ids}-note`} className="type-meta text-muted-foreground">
        {t('note')}
      </p>
      {error && (
        <p id={`${ids}-error`} role="alert" className="type-small text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          className={cn(PILL, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          aria-disabled={pending || undefined}
          aria-busy={pending || undefined}
          className={cn(PILL, 'bg-primary text-primary-foreground hover:bg-primary/85')}
        >
          {pending ? t('submitting') : t('submit')}
        </button>
      </div>
    </form>
  )
}
