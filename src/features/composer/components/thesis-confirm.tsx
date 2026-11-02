'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ThesisFormValues } from '../schemas/create-thesis.schema'
import { PILL } from './editor-styles'

/** What the confirmation sums up (TC-11): the form's values and the asset's handle. */
export type ThesisSummary = Pick<
  ThesisFormValues,
  'claim' | 'direction' | 'targetPrice' | 'deadline' | 'conviction'
> & { asset: string }

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
  const format = useFormatter()
  const ids = useId()
  const [accepted, setAccepted] = useState(false)

  return (
    <Dialog
      open={summary !== null}
      onOpenChange={(open) => {
        if (open || pending) return
        setAccepted(false)
        onBack()
      }}
    >
      <DialogContent
        showCloseButton={false}
        // The checkbox is where the person goes: the focus starts there.
        initialFocus={() => document.getElementById(`${ids}-disclaimer`)}
        className={cn(
          'gap-5 p-5 sm:max-w-md',
          // A panel from the bottom in phones, edge to edge (TC-16): the one place max-sm: reads
          // best, against the shadcn window it overrides.
          'max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))]',
        )}
      >
        {summary && (
          <>
            <DialogHeader>
              <DialogTitle className="type-post-title">{t('confirm.title')}</DialogTitle>
              <DialogDescription>{t('confirm.final')}</DialogDescription>
            </DialogHeader>
            {/* What is published, as one block (TC-11). */}
            <div className="flex flex-col gap-1.5 rounded-xl bg-surface p-4">
              <p className="type-action font-bold">{summary.asset}</p>
              <p className="type-post-body wrap-anywhere">{summary.claim}</p>
              <p className="type-small text-muted-foreground">
                {t('confirm.target', {
                  direction: summary.direction,
                  price: format.number(summary.targetPrice, { maximumFractionDigits: 8 }),
                  date: format.dateTime(new Date(`${summary.deadline}T12:00:00`), {
                    dateStyle: 'medium',
                  }),
                })}
              </p>
              <p className="type-small text-muted-foreground">
                {t('confirm.conviction', { level: t(`conviction.${summary.conviction}`) })}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id={`${ids}-disclaimer`}
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked === true)}
                aria-describedby={error ? `${ids}-error` : undefined}
                aria-invalid={Boolean(error) || undefined}
                className="mt-0.5"
              />
              <label htmlFor={`${ids}-disclaimer`} className="cursor-pointer type-small">
                {t('confirm.disclaimer')}
              </label>
            </div>
            {error && (
              <p id={`${ids}-error`} role="alert" className="type-small text-destructive">
                {error}
              </p>
            )}
            <DialogFooter className="flex-row justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setAccepted(false)
                  onBack()
                }}
                className={cn(PILL, 'bg-muted text-foreground hover:bg-muted-hover')}
              >
                {t('confirm.back')}
              </button>
              <button
                type="button"
                aria-disabled={!accepted || pending || undefined}
                onClick={() => {
                  if (accepted && !pending) onConfirm()
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
