'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId, useState, type RefObject } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { updateProfile } from '../actions/update-profile.action'
import {
  BIO_MAX,
  editProfileSchema,
  type EditProfileForm,
  type EditProfileInput,
} from '../schemas/edit-profile.schema'

/** Phones: the whole screen, as the post editor (specs/post-create-detail PC-02). */
const SHEET =
  'inset-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 pt-[env(safe-area-inset-top)] sm:max-w-none data-open:slide-in-from-bottom-10 data-open:zoom-in-100 data-closed:slide-out-to-bottom-10 data-closed:zoom-out-100'

/** Desktop: a window near the top, as X's "Edit profile". */
const MODAL =
  'top-[10dvh] flex w-[calc(100%-2rem)] max-w-120 -translate-y-0 flex-col gap-0 rounded-2xl p-0 sm:max-w-120'

const PILL =
  'inline-flex h-11 tap items-center rounded-full px-4 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 md:h-9'

/**
 * "Edit profile", as X's (specs/profile-edit PE-02 to PE-05): the bio with what it says now and a
 * counter. Save sends it and closes; the page shows it after `onSaved` refreshes it. Cancel, × or
 * Esc close it, asking first if something changed. A window in desktop, the full screen in phones.
 * Loaded on first use (EditProfileButton).
 */
export function EditProfileDialog({
  layout,
  open,
  onOpenChange,
  bio,
  onSaved,
  returnFocusTo,
}: {
  layout: 'sheet' | 'modal'
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The bio it has now: the field starts with it. */
  bio: string | null
  onSaved: () => void
  /** Where the focus goes back when it closes: the button that opened it (WCAG 2.4.3). */
  returnFocusTo?: RefObject<HTMLButtonElement | null>
}) {
  const t = useTranslations('communities.edit')
  const ids = useId()
  const [confirming, setConfirming] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<EditProfileForm, unknown, EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { bio: bio ?? '' },
    mode: 'onChange',
  })
  const { register, handleSubmit, formState, control } = form
  const current = useWatch({ control, name: 'bio' }) ?? ''
  const length = current.trim().length
  const tooLong = length > BIO_MAX
  const blocked = tooLong || formState.isSubmitting
  const modal = layout === 'modal'

  function requestClose() {
    if (formState.isDirty) setConfirming(true)
    else onOpenChange(false)
  }

  async function save(values: EditProfileInput) {
    setServerError(null)
    const result = await updateProfile(values)
    if (result.ok) {
      onSaved()
      onOpenChange(false)
      return
    }
    setServerError(
      result.error === 'communities.edit.errors.bioTooLong'
        ? t('errors.bioTooLong')
        : t('errors.general'),
    )
  }

  const saveButton = (
    <button
      type="submit"
      form={`${ids}-form`}
      aria-disabled={blocked || undefined}
      className={cn(PILL, 'ml-auto bg-primary text-primary-foreground hover:bg-primary/85')}
    >
      {formState.isSubmitting ? t('saving') : t('save')}
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
      <DialogContent
        showCloseButton={false}
        // Into the bio, at its end, as X.
        initialFocus={() => document.getElementById(`${ids}-bio`)}
        finalFocus={returnFocusTo}
        className={modal ? MODAL : SHEET}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 px-2">
          {modal ? (
            <button
              type="button"
              aria-label={t('cancel')}
              onClick={requestClose}
              className="inline-flex size-9 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <XIcon aria-hidden className="size-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={requestClose}
              className="inline-flex h-11 tap items-center gap-1.5 rounded-full px-3 type-action text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ArrowLeftIcon aria-hidden className="size-4" />
              {t('cancel')}
            </button>
          )}
          <DialogTitle className="type-post-title">{t('title')}</DialogTitle>
          <div className="ml-auto pr-2">{saveButton}</div>
        </div>

        <form
          id={`${ids}-form`}
          noValidate
          onSubmit={(event) => {
            // aria-disabled, not disabled: the focused button keeps the focus (WCAG 2.4.3).
            if (blocked) return event.preventDefault()
            void handleSubmit(save)(event)
          }}
          className="flex flex-col gap-1.5 px-4 pt-2 pb-5"
        >
          <Field data-invalid={tooLong || undefined} className="gap-1.5">
            <FieldLabel htmlFor={`${ids}-bio`} className="type-action">
              {t('bio')}
            </FieldLabel>
            <Textarea
              id={`${ids}-bio`}
              placeholder={t('bioPlaceholder')}
              {...register('bio')}
              aria-invalid={tooLong || undefined}
              aria-describedby={tooLong ? `${ids}-count ${ids}-error` : `${ids}-count`}
              // One thin border, also when invalid: the PO does not want the 3px halo.
              className="min-h-24 resize-none text-base focus-visible:border-foreground/60 focus-visible:ring-0 aria-invalid:ring-0 dark:aria-invalid:ring-0"
            />
            <div className="flex justify-between gap-2 type-meta">
              <FieldError
                id={`${ids}-error`}
                errors={tooLong ? [{ message: t('errors.bioTooLong') }] : undefined}
              />
              <span
                id={`${ids}-count`}
                className={cn(
                  'ml-auto tabular-nums',
                  tooLong ? 'font-bold text-destructive' : 'text-muted-foreground',
                )}
              >
                {t('counter', { count: length, max: BIO_MAX })}
              </span>
            </div>
          </Field>
          {serverError && (
            <p role="alert" className="type-small text-destructive">
              {serverError}
            </p>
          )}
        </form>

        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('discard.title')}</AlertDialogTitle>
              <AlertDialogDescription>{t('discard.body')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('discard.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  setConfirming(false)
                  onOpenChange(false)
                }}
              >
                {t('discard.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
