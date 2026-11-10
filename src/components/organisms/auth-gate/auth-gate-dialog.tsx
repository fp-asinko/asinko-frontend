'use client'

import { XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { AsinkoLogo } from '@/components/ui/asinko-logo'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { GateRequest, GateView } from './auth-gate'
import { SocialLogins } from './social-logins'

const PRIMARY =
  'flex h-11 w-full tap items-center justify-center rounded-full bg-primary type-ui font-semibold text-primary-foreground'
const SECONDARY =
  'flex h-11 w-full tap items-center justify-center rounded-full bg-muted type-ui font-semibold hover:bg-muted-hover'

/**
 * The account modal (G-05 to G-08, specs/auth AU-01): says what the visitor was about to do and
 * offers to create an account or log in, then shows that form (`forms`, from the auth feature) in
 * the same modal. Below, Google and Reddit (AU-10, AU-12). A bottom panel on phones, a centered
 * dialog from md, closable with Esc, the backdrop or ×; Base UI traps the focus and gives it back
 * to the control that opened it.
 */
export function AuthGateDialog({
  request,
  view,
  open,
  onClose,
  onViewChange,
  forms,
}: {
  request: GateRequest
  view: GateView
  open: boolean
  onClose: () => void
  onViewChange: (view: GateView) => void
  forms: ReactNode
}) {
  const t = useTranslations('authGate')
  const title = view === 'invite' ? t(`title.${request.action}`) : t(`title.${view}`)
  // The second step has its own line, and no way to switch or to another provider (AU-11).
  const second = view === 'profile'
  // Recovering a password is about the account it has: no other provider (password-recovery PR-01).
  const recover = view === 'recover'

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        // Own 44px close button, as the menu panel: on phones it is the main way out.
        showCloseButton={false}
        data-action={request.action}
        data-view={view}
        // Where to come back after logging in (G-09).
        data-next={request.next}
        // A long form scrolls inside the panel, never past the screen.
        className="top-auto bottom-0 left-0 max-h-[92dvh] max-w-none translate-x-0 translate-y-0 gap-5 overflow-y-auto overscroll-contain rounded-b-none px-5 pt-7 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-w-none md:top-1/2 md:bottom-auto md:left-1/2 md:max-w-sm md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-b-xl md:px-6 md:pb-6 data-open:slide-in-from-bottom-10 data-open:zoom-in-100 md:data-open:slide-in-from-bottom-0 md:data-open:zoom-in-95 data-closed:slide-out-to-bottom-10 data-closed:zoom-out-100 md:data-closed:slide-out-to-bottom-0 md:data-closed:zoom-out-95"
      >
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 size-11"
              aria-label={t('close')}
            />
          }
        >
          <XIcon aria-hidden />
        </DialogClose>
        {/* G-13: the brand on top of the invitation; not over the forms (PO, 2026-10-29). Decorative:
            the title says what the modal is about. */}
        {view === 'invite' && (
          <div aria-hidden className="flex justify-center">
            <AsinkoLogo label={t('brand')} />
          </div>
        )}
        <div className="flex flex-col gap-2 px-6 text-center">
          {/* Loose classes, not type-*: cn does not merge them with the base text-* (design-system.md). */}
          <DialogTitle className="text-[1.375rem] leading-tight font-bold">{title}</DialogTitle>
          {/* The reason to have an account, under every title: the forms too. */}
          <DialogDescription className="leading-normal">
            {second ? t('profileValue') : recover ? t('recoverValue') : t('value')}
          </DialogDescription>
        </div>

        {view === 'invite' ? (
          <div className="flex flex-col gap-2">
            <button type="button" className={PRIMARY} onClick={() => onViewChange('signup')}>
              {t('signup')}
            </button>
            <button type="button" className={SECONDARY} onClick={() => onViewChange('login')}>
              {t('login')}
            </button>
          </div>
        ) : (
          // One place for every form: the forms keep their state from one step to the next.
          forms
        )}
        {(view === 'login' || view === 'signup') && (
          <p className="text-center type-ui text-muted-foreground">
            {t.rich(view === 'login' ? 'switch.toSignup' : 'switch.toLogin', {
              link: (chunks) => (
                <button
                  type="button"
                  className="font-semibold text-foreground underline underline-offset-2"
                  onClick={() => onViewChange(view === 'login' ? 'signup' : 'login')}
                >
                  {chunks}
                </button>
              ),
            })}
          </p>
        )}

        {recover && (
          <button
            type="button"
            className="mx-auto min-h-6 type-ui font-semibold text-foreground underline underline-offset-2"
            onClick={() => onViewChange('login')}
          >
            {t('backToLogin')}
          </button>
        )}

        {!second && !recover && (
          <>
            <div className="flex items-center gap-3 type-meta text-muted-foreground">
              <span aria-hidden className="h-px flex-1 bg-border" />
              {t('or')}
              <span aria-hidden className="h-px flex-1 bg-border" />
            </div>
            <SocialLogins next={request.next} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
