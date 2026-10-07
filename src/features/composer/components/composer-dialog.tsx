'use client'

import { XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from '@/i18n/navigation'
import type { ComposeSession } from './composer-root'
import { PostEditor } from './post-editor'

/**
 * The editor's window (PC-05): full screen in mobile, a centered modal from md. Esc, × or a tap
 * outside close it; with something written, they ask first. Published, it closes and opens the
 * new post's page (PC-10).
 */
export function ComposerDialog({
  open,
  onOpenChange,
  session,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: ComposeSession
}) {
  const t = useTranslations('composer')
  const router = useRouter()
  const draftRef = useRef<(() => boolean) | null>(null)
  const [confirming, setConfirming] = useState(false)

  function requestClose() {
    if (draftRef.current?.()) setConfirming(true)
    else onOpenChange(false)
  }

  function discard() {
    setConfirming(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
      <DialogContent
        showCloseButton={false}
        // Into the form, not onto Close: the community, or the title when it comes chosen.
        initialFocus={() => document.querySelector<HTMLElement>('[data-composer] [data-autofocus]')}
        data-composer
        className="inset-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 pt-[env(safe-area-inset-top)] sm:max-w-none md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[min(90dvh,48rem)] md:max-w-xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:pt-0"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b pr-1.5 pl-4 md:pl-6">
          <DialogTitle className="type-post-title">{t('title')}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={t('close')}
            onClick={requestClose}
          >
            <XIcon aria-hidden className="size-5" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PostEditor
            key={session.key}
            type={session.type}
            community={
              session.community && { ...session.community, own: Boolean(session.community.own) }
            }
            draftRef={draftRef}
            onPublished={(path) => {
              onOpenChange(false)
              router.push(path)
            }}
          />
        </div>

        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('discard.title')}</AlertDialogTitle>
              <AlertDialogDescription>{t('discard.body')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('discard.cancel')}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={discard}>
                {t('discard.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
