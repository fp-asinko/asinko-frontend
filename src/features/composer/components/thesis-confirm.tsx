'use client'

import { useFormatter, useNow, useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { ThesisBadge } from '@/components/organisms/thesis-ticket/thesis-badge'
import { ThesisTicket } from '@/components/organisms/thesis-ticket/thesis-ticket'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ThesisTicketData } from '@/lib/theses/ticket.types'
import { cn } from '@/lib/utils'
import { markdownText } from '../lib/markdown-text'
import { PILL } from './editor-styles'

/**
 * What the confirmation shows (TC-11): the claim, and the ticket as it will be published (PO
 * 2026-11-06), built from the form's values.
 */
export type ThesisSummary = {
  claim: string
  reasoning: string
  /** Its header, as every card's; none when the page did not say. */
  author: ThesisAuthor | null
  ticket: ThesisTicketData
}

/** Who publishes, from the session. */
export type ThesisAuthor = { username: string; avatarUrl: string | null }

/**
 * The last step before publishing a thesis (specs/thesis-create TC-11, TC-12): what is being
 * published, that it can never be edited or deleted, and the "not financial advice" checkbox
 * (MVP-143; TODO(legal): placeholder copy until the legal review, item 42). In phones a panel from
 * the bottom, from sm a window: the same Dialog, its focus trapped and given back on close.
 */
export function ThesisConfirm({
  summary,
  pending,
  error,
  onBack,
  onConfirm,
}: {
  /** Null: closed. */
  summary: ThesisSummary | null
  pending: boolean
  /** A translated message: the disclaimer's, or the publication's. */
  error: string | null
  onBack: () => void
  onConfirm: () => void
}) {
  const t = useTranslations('composer.thesis')
  const ids = useId()
  const format = useFormatter()
  const now = useNow()
  const [accepted, setAccepted] = useState(false)
  // Publish pressed without the checkbox: it says why (WCAG 3.3.1), as the form does.
  const [missing, setMissing] = useState(false)
  const shown = error ?? (missing && !accepted ? t('errors.disclaimer') : null)

  return (
    <Dialog
      open={summary !== null}
      onOpenChange={(open) => {
        if (open || pending) return
        setAccepted(false)
        setMissing(false)
        onBack()
      }}
    >
      <DialogContent
        showCloseButton={false}
        // The checkbox is where the person goes: the focus starts there.
        initialFocus={() => document.getElementById(`${ids}-disclaimer`)}
        className={cn(
          // Wide enough from sm for the ticket's three cells side by side.
          'gap-5 p-5 sm:max-w-xl',
          // A panel from the bottom in phones, edge to edge (TC-16): max-sm: reads best here, against
          // the shadcn window it overrides. The same in cancelling a thesis (specs/thesis-detail).
          'max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))]',
        )}
      >
        {summary && (
          <>
            <DialogHeader>
              <DialogTitle className="text-[1.0625rem] leading-[1.3] font-bold">
                {t('confirm.title')}
              </DialogTitle>
              <DialogDescription>{t('confirm.final')}</DialogDescription>
            </DialogHeader>
            {/* What is published, as its card will look (TC-11, PO 2026-11-06): who publishes and
                THESIS, the ticket, the claim and the start of the reasoning. */}
            <div className="min-w-0 wrap-anywhere">
              <div className="flex items-center gap-2">
                {summary.author && (
                  <>
                    <UserAvatar
                      name={summary.author.username}
                      colorKey={summary.author.username}
                      imageUrl={summary.author.avatarUrl}
                      size="md"
                      className="size-8 text-[0.6875rem]"
                    />
                    <p className="flex min-w-0 flex-1 items-center gap-x-1.25 type-meta text-muted-foreground">
                      <span className="truncate type-ui font-bold text-foreground">
                        {summary.author.username}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="shrink-0">{format.relativeTime(now, now)}</span>
                    </p>
                  </>
                )}
                <span className="ml-auto">
                  <ThesisBadge />
                </span>
              </div>
              <ThesisTicket thesis={summary.ticket} variant="preview" />
              <p className="mt-3 type-post-title">{summary.claim}</p>
              {summary.reasoning.trim() && (
                // Its first lines, as text: the real render is the server's (markdown-text.ts).
                <p className="mt-1.5 line-clamp-3 type-post-body whitespace-pre-line text-muted-foreground">
                  {markdownText(summary.reasoning)}
                </p>
              )}
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id={`${ids}-disclaimer`}
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked === true)}
                aria-describedby={shown ? `${ids}-error` : undefined}
                aria-invalid={Boolean(shown) || undefined}
                className="mt-0.5"
              />
              <label htmlFor={`${ids}-disclaimer`} className="cursor-pointer type-small">
                {t('confirm.disclaimer')}
              </label>
            </div>
            {shown && (
              <p id={`${ids}-error`} role="alert" className="type-small text-destructive">
                {shown}
              </p>
            )}
            <DialogFooter className="flex-row justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setAccepted(false)
                  setMissing(false)
                  onBack()
                }}
                className={cn(PILL, 'bg-muted text-foreground hover:bg-muted-hover')}
              >
                {t('confirm.back')}
              </button>
              <button
                type="button"
                aria-disabled={!accepted || pending || undefined}
                aria-busy={pending || undefined}
                onClick={() => {
                  if (pending) return
                  if (accepted) onConfirm()
                  else setMissing(true)
                }}
                className={cn(PILL, 'bg-primary text-primary-foreground hover:bg-primary/85')}
              >
                {pending ? t('confirm.submitting') : t('confirm.submit')}
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
