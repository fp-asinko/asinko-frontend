'use client'

import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Asks before leaving a community (specs/community-pages CP-05, security.md § 7: every
 * destructive action is confirmed). Loaded on first use (next/dynamic), off the first-load JS.
 */
export function LeaveDialog({
  variant = 'leave',
  handle,
  open,
  onConfirm,
  onClose,
}: {
  /** Leaving a community, or unfollowing a user (specs/community-pages CP-12). */
  variant?: 'leave' | 'unfollow'
  handle: string
  open: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const t = useTranslations(`communities.actions.${variant}`)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('title', { handle })}</DialogTitle>
          <DialogDescription>{t('body')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose className="inline-flex h-10 tap items-center justify-center rounded-full bg-muted px-4 type-action outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50">
            {t('cancel')}
          </DialogClose>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-10 tap items-center justify-center rounded-full bg-primary px-4 type-action text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t('confirm')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
