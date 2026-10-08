'use client'

import { ArrowLeftIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from '@/i18n/navigation'
import type { ComposeSession } from './composer-root'
import { DiscardDialog } from './discard-dialog'
import { PostEditor } from './post-editor'

/**
 * The editor in mobile (PC-02, PC-05): the whole screen, rising from the bottom, as X. "← Cancel"
 * and the title at the top, Publish at the bottom. Cancel or Esc close it, asking first if
 * something is written. Published, it closes and opens the new post's page.
 */
export function ComposerSheet({
  open,
  onClose,
  session,
}: {
  open: boolean
  onClose: () => void
  session: ComposeSession
}) {
  const t = useTranslations('composer')
  const router = useRouter()
  const draftRef = useRef<(() => boolean) | null>(null)
  const [confirming, setConfirming] = useState(false)

  function requestClose() {
    if (draftRef.current?.()) setConfirming(true)
    else onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && requestClose()}>
      <DialogContent
        showCloseButton={false}
        // Into the form, not onto Cancel: the community, or the title when it comes chosen.
        initialFocus={() => document.querySelector<HTMLElement>('[data-composer] [data-autofocus]')}
        data-composer
        className="inset-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 pt-[env(safe-area-inset-top)] sm:max-w-none data-open:slide-in-from-bottom-10 data-open:zoom-in-100 data-closed:slide-out-to-bottom-10 data-closed:zoom-out-100"
      >
        <div className="flex h-14 shrink-0 items-center gap-2 px-2">
          <button
            type="button"
            onClick={requestClose}
            className="inline-flex h-11 tap items-center gap-1.5 rounded-full px-3 type-action text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeftIcon aria-hidden className="size-4" />
            {t('cancel')}
          </button>
          <DialogTitle className="type-post-title">{t('title')}</DialogTitle>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pt-2">
          <PostEditor
            key={session.key}
            variant="sheet"
            type={session.type}
            community={
              session.community && { ...session.community, own: Boolean(session.community.own) }
            }
            draftRef={draftRef}
            onCancel={requestClose}
            onPublished={(path) => {
              onClose()
              router.push(path)
            }}
          />
        </div>
        <DiscardDialog
          open={confirming}
          onOpenChange={setConfirming}
          onDiscard={() => {
            setConfirming(false)
            onClose()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
