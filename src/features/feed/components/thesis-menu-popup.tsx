'use client'

import { BanIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId, useState, useTransition, type RefObject } from 'react'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { cancelThesis } from '../actions/cancel-thesis.action'
import { CANCEL_REASON_MAX } from '../schemas/cancel-thesis.schema'

/**
 * The menu of a thesis's "⋯" and its confirmation (specs/thesis-detail TD-12 to TD-15), loaded on
 * the first open. Cancelling asks why (Q4), says it stays as Cancelled in the record and cannot be
 * undone; once done, the page asks for the thesis again.
 */
export function ThesisMenuPopup({
  id,
  open,
  onOpenChange,
  anchor,
}: {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
  anchor: RefObject<HTMLButtonElement | null>
}) {
  const t = useTranslations('feed.thesis.cancel')
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuContent anchor={anchor} finalFocus={anchor} align="end" className="w-56">
          <DropdownMenuItem
            className="min-h-10 text-destructive"
            onClick={() => {
              onOpenChange(false)
              setConfirming(true)
            }}
          >
            <BanIcon aria-hidden />
            {t('action')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CancelThesisDialog
        id={id}
        open={confirming}
        onClose={() => {
          setConfirming(false)
          anchor.current?.focus()
        }}
      />
    </>
  )
}

/** The confirmation (TD-13): a panel from the bottom in phones, a window from sm. */
export function CancelThesisDialog({
  id,
  open,
  onClose,
}: {
  id: string
  open: boolean
  onClose: () => void
}) {
  const t = useTranslations('feed.thesis.cancel')
  const ids = useId()
  const router = useRouter()
  const { openGate } = useAuthGate()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const length = reason.trim().length

  function close() {
    if (pending) return
    setReason('')
    setError(null)
    onClose()
  }

  function confirm() {
    if (pending) return
    if (length === 0 || length > CANCEL_REASON_MAX) {
      // Said in words, not only by the red counter (WCAG 3.3.1).
      setError(t(length === 0 ? 'errors.reasonRequired' : 'errors.reasonTooLong'))
      return
    }
    startTransition(async () => {
      const result = await cancelThesis({ thesisId: id, reason })
      if (result.ok) {
        setReason('')
        onClose()
        // The card and the page come again from the server, Cancelled and with the reason.
        router.refresh()
        return
      }
      if (result.error === 'api.errors.UNAUTHENTICATED') {
        onClose()
        // The session ended meanwhile: log in again, back to this page.
        openGate('login')
        return
      }
      const notCancellable = result.error === 'feed.thesis.cancel.errors.notCancellable'
      setError(t(notCancellable ? 'errors.notCancellable' : 'errors.generic'))
      // No longer cancellable: the refreshed card drops "⋯".
      if (notCancellable) router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent
        showCloseButton={false}
        initialFocus={() => document.getElementById(`${ids}-reason`)}
        className={cn(
          'gap-5 p-5 sm:max-w-md',
          // A panel from the bottom in phones, as the confirmation to publish (TC-16).
          'max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))]',
        )}
      >
        <DialogHeader>
          <DialogTitle className="type-post-title">{t('title')}</DialogTitle>
          <DialogDescription>{t('body')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor={`${ids}-reason`} className="type-small font-semibold">
              {t('reason')}
            </label>
            <span
              id={`${ids}-count`}
              className={cn(
                'type-meta tabular-nums',
                length > CANCEL_REASON_MAX ? 'font-bold text-destructive' : 'text-muted-foreground',
              )}
            >
              {t('counter', { count: length, max: CANCEL_REASON_MAX })}
            </span>
          </div>
          <Textarea
            id={`${ids}-reason`}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              setError(null)
            }}
            maxLength={CANCEL_REASON_MAX + 20}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? `${ids}-count ${ids}-error` : `${ids}-count`}
            placeholder={t('reasonPlaceholder')}
            className="min-h-20 text-base"
          />
          {error && (
            <p id={`${ids}-error`} role="alert" className="type-small text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter className="flex-row justify-end gap-2">
          <Button type="button" variant="ghost" disabled={pending} onClick={close}>
            {t('back')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            // Solid, as the action it is: the shadcn tint did not reach 4.5:1 (axe).
            className="bg-destructive text-background hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90"
            aria-disabled={pending || undefined}
            aria-busy={pending || undefined}
            onClick={confirm}
          >
            {pending ? t('confirming') : t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
