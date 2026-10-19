'use client'

import { ArrowLeftIcon, FileTextIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import { useEffect, useState, useTransition, type RefObject } from 'react'
import { EmptyState } from '@/components/organisms/empty-state'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { deleteDraft, listDrafts } from '../actions/drafts.action'
import type { SavedDraft } from '../composer.types'

/** As many as the account keeps (P-022). */
export const DRAFT_LIMIT = 20

/** Phones: the whole screen, as "Edit profile" and the people lists. */
const SHEET =
  'inset-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 pt-[env(safe-area-inset-top)] sm:max-w-none data-open:slide-in-from-bottom-10 data-open:zoom-in-100 data-closed:slide-out-to-bottom-10 data-closed:zoom-out-100'

/** Desktop: a window near the top. */
const MODAL =
  'top-[8dvh] flex h-[min(36rem,84dvh)] w-[calc(100%-2rem)] max-w-120 -translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-120'

type Load = { status: 'loading' } | { status: 'failed' } | { status: 'ready'; drafts: SavedDraft[] }

/**
 * The drafts of the account, as Reddit's (specs/drafts-tags DT-02 to DT-04): how many of 20, the
 * newest first, each with its title (or "Untitled"), where it goes and when it was saved. Touching
 * one opens it in the editor; its trash can deletes it, after asking. Asked each time it opens: a
 * draft saved in another device shows. Closing gives the focus back to "Drafts".
 */
export function DraftsDialog({
  layout,
  open,
  onOpenChange,
  onOpen,
  onDeleted,
  returnFocusTo,
}: {
  layout: 'sheet' | 'modal'
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpen: (draft: SavedDraft) => void
  /** A draft is gone: if the editor has it open, it is a new one again. */
  onDeleted: (id: string) => void
  /** Where the focus goes on closing: "Drafts", or the title once a draft is opened. */
  returnFocusTo?: RefObject<HTMLElement | null>
}) {
  const t = useTranslations('composer.drafts')
  const format = useFormatter()
  const now = useNow()
  const modal = layout === 'modal'
  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const [asked, setAsked] = useState(0)
  const [deleting, setDeleting] = useState<SavedDraft | null>(null)
  const [deleteFailed, setDeleteFailed] = useState(false)
  const [busy, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    let current = true
    void listDrafts().then((result) => {
      if (!current) return
      setLoad(result.ok ? { status: 'ready', drafts: result.data } : { status: 'failed' })
    })
    return () => {
      current = false
    }
  }, [open, asked])

  function remove(draft: SavedDraft) {
    startTransition(async () => {
      const result = await deleteDraft(draft.id)
      setDeleting(null)
      setDeleteFailed(!result.ok)
      if (!result.ok) return
      setLoad((now) =>
        now.status === 'ready'
          ? { status: 'ready', drafts: now.drafts.filter((each) => each.id !== draft.id) }
          : now,
      )
      onDeleted(draft.id)
    })
  }

  const drafts = load.status === 'ready' ? load.drafts : null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setDeleteFailed(false)
      }}
    >
      <DialogContent
        showCloseButton={false}
        finalFocus={returnFocusTo}
        className={modal ? MODAL : SHEET}
      >
        <div className="flex min-h-14 shrink-0 items-center gap-2 border-b px-2">
          <button
            type="button"
            aria-label={modal ? t('close') : undefined}
            onClick={() => onOpenChange(false)}
            className={cn(
              'inline-flex tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
              modal ? 'size-9' : 'h-11 gap-1.5 px-3 type-action',
            )}
          >
            {modal ? (
              <XIcon aria-hidden className="size-5" />
            ) : (
              <ArrowLeftIcon aria-hidden className="size-4" />
            )}
            {!modal && t('close')}
          </button>
          <DialogTitle className="min-w-0 flex-1 type-post-title">{t('title')}</DialogTitle>
          {drafts && (
            <span className="pr-2 type-meta text-muted-foreground tabular-nums">
              <span aria-hidden>{t('count', { count: drafts.length, max: DRAFT_LIMIT })}</span>
              <span className="sr-only">
                {t('countLabel', { count: drafts.length, max: DRAFT_LIMIT })}
              </span>
            </span>
          )}
        </div>

        {/* Always there, so a failed delete is announced (WCAG 4.1.3). */}
        <p role="alert" className="mx-4 mt-3 type-small text-destructive empty:hidden">
          {deleteFailed ? t('errors.delete') : ''}
        </p>

        {/* Always there, so the loading is announced; the rows show its shape. */}
        <p role="status" className="sr-only">
          {load.status === 'loading' ? t('loading') : ''}
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {load.status === 'loading' ? (
            // The shape of the rows: the list arrives without moving (no CLS).
            <ul aria-hidden className="py-1">
              {[0, 1, 2].map((row) => (
                <li key={row} className="flex items-center gap-1 px-2">
                  <span className="flex min-h-14 flex-1 flex-col justify-center gap-1.5 px-2 py-2">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </span>
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                </li>
              ))}
            </ul>
          ) : load.status === 'failed' ? (
            <EmptyState
              size="section"
              title={t('failed')}
              action={
                <button
                  type="button"
                  onClick={() => {
                    setLoad({ status: 'loading' })
                    setAsked((count) => count + 1)
                  }}
                  className="inline-flex h-9 tap items-center rounded-full bg-muted px-4 type-action font-bold outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {t('retry')}
                </button>
              }
            />
          ) : load.drafts.length === 0 ? (
            <EmptyState
              icon={<FileTextIcon />}
              title={t('emptyTitle')}
              description={t('emptyBody')}
            />
          ) : (
            <ul className="py-1">
              {load.drafts.map((draft) => {
                const title = draft.title || t('untitled')
                const where = draft.community
                  ? draft.community.own
                    ? t('yourProfile')
                    : draft.community.handle
                  : t('noCommunity')
                return (
                  <li key={draft.id} className="flex items-center gap-1 px-2">
                    <button
                      type="button"
                      onClick={() => onOpen(draft)}
                      className="flex min-h-14 min-w-0 flex-1 tap flex-col justify-center rounded-lg px-2 py-2 text-left outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span
                        className={cn(
                          'truncate type-small font-bold',
                          !draft.title && 'text-muted-foreground',
                        )}
                      >
                        {title}
                      </span>{' '}
                      <span className="truncate type-meta text-muted-foreground">
                        {t('meta', {
                          where,
                          when: format.relativeTime(new Date(draft.updatedAt), now),
                        })}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={t('delete', { title })}
                      onClick={() => setDeleting(draft)}
                      className="inline-flex size-10 shrink-0 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4"
                    >
                      <Trash2Icon aria-hidden />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Deleting cannot be undone: it asks first (security.md § 7). */}
        <AlertDialog open={deleting !== null} onOpenChange={(next) => !next && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('deleteBody')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                aria-disabled={busy || undefined}
                onClick={() => {
                  if (deleting && !busy) remove(deleting)
                }}
              >
                {t('deleteConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
