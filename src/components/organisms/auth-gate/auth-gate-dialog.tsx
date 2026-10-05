'use client'

import { useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { GateRequest } from './auth-gate'

/**
 * The account modal (G-05 to G-08): says what the visitor was about to do and offers to create an
 * account or log in. A bottom panel on phones, a centered dialog from md, closable with Esc, the
 * backdrop or ×; Base UI traps the focus and gives it back to the control that opened it. Both
 * buttons are "Coming soon" until the auth spec, which also uses `request.next` to come back.
 */
export function AuthGateDialog({
  request,
  open,
  onClose,
}: {
  request: GateRequest
  open: boolean
  onClose: () => void
}) {
  const t = useTranslations('authGate')

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        closeLabel={t('close')}
        data-action={request.action}
        // For the auth spec (G-09): where to come back after logging in.
        data-next={request.next}
        className="top-auto bottom-0 left-0 max-w-none translate-x-0 translate-y-0 gap-5 rounded-b-none px-5 pt-7 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:top-1/2 md:bottom-auto md:left-1/2 md:max-w-sm md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-b-xl md:px-6 md:pb-6 data-open:slide-in-from-bottom-10 data-open:zoom-in-100 md:data-open:slide-in-from-bottom-0 md:data-open:zoom-in-95 data-closed:slide-out-to-bottom-10 data-closed:zoom-out-100 md:data-closed:slide-out-to-bottom-0 md:data-closed:zoom-out-95"
      >
        <div className="flex flex-col gap-2 pr-6">
          <DialogTitle className="type-page-title leading-tight">
            {t(`title.${request.action}`)}
          </DialogTitle>
          <DialogDescription className="type-ui text-muted-foreground">
            {t('value')}
          </DialogDescription>
        </div>
        {/* Column flex: stretches each coming-soon wrapper (and its button) to the full width. */}
        <div className="flex flex-col gap-2">
          <ComingSoon
            label={t('signup')}
            placement="above"
            className="flex h-11 w-full tap items-center justify-center rounded-full bg-primary type-ui font-semibold text-primary-foreground"
          >
            {t('signup')}
          </ComingSoon>
          <ComingSoon
            label={t('login')}
            className="flex h-11 w-full tap items-center justify-center rounded-full border type-ui font-semibold"
          >
            {t('login')}
          </ComingSoon>
        </div>
      </DialogContent>
    </Dialog>
  )
}
