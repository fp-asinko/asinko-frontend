'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import dynamic from 'next/dynamic'
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
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { updateProfile } from '../actions/update-profile.action'
import type { EditableProfile, EditProfileField } from '../communities.types'
import {
  BIO_MAX,
  CITY_MAX,
  DISPLAY_NAME_MAX,
  editProfileSchema,
  HEADLINE_MAX,
  type EditProfileForm,
  type EditProfileInput,
} from '../schemas/edit-profile.schema'
import { CountedField, CountryField } from './edit-profile-fields'
import { changeImageId, ProfileImages, type ProfileImageKind } from './edit-profile-images'
import { LinksField } from './edit-profile-links'
import { OpenToField } from './edit-profile-open-to'

/** The cropper (and its library) comes when an image is picked (seo.md). */
const ImageCropper = dynamic(
  () => import('./image-cropper').then((module) => module.ImageCropper),
  {
    // Its place while it comes, the cropper's height: the window does not jump.
    loading: () => <Skeleton className="h-72 rounded-lg sm:h-88" />,
  },
)

const IMAGE_FIELD = { avatar: 'avatarUrl', banner: 'bannerUrl' } as const

/** Phones: the whole screen, as the post editor (specs/post-create-detail PC-02). */
const SHEET =
  'inset-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 pt-[env(safe-area-inset-top)] sm:max-w-none data-open:slide-in-from-bottom-10 data-open:zoom-in-100 data-closed:slide-out-to-bottom-10 data-closed:zoom-out-100'

/** Desktop: a window near the top, as LinkedIn's "Edit intro"; its body scrolls, not the page. */
const MODAL =
  'top-[8dvh] flex max-h-[84dvh] w-[calc(100%-2rem)] max-w-140 -translate-y-0 flex-col gap-0 rounded-2xl p-0 sm:max-w-140'

const PILL =
  'inline-flex h-11 tap items-center rounded-full px-4 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 md:h-9'

/** The fields the window's sections hold, in their order. */
type Name = Exclude<keyof EditProfileForm, 'links'>

/**
 * "Edit profile", as LinkedIn's "Edit intro" (specs/profile-edit, specs/profile-presentation PP-05
 * to PP-09): one window with the name, the headline, the location, the bio and the links. Save
 * sends only what changed and closes; the page shows it after `onSaved` refreshes it. A refusal
 * about a field is said under it, and what is written stays. Cancel, × or Esc close, asking first
 * if something changed. A window in desktop, the full screen in phones, Save always at hand on top.
 * Loaded on first use (EditProfileProvider); opened on a field when a prompt asked (PP-04).
 */
export function EditProfileDialog({
  layout,
  open,
  onOpenChange,
  profile,
  field,
  onSaved,
  returnFocusTo,
}: {
  layout: 'sheet' | 'modal'
  open: boolean
  onOpenChange: (open: boolean) => void
  /** What the profile has now: the fields start with it. */
  profile: EditableProfile
  /** Where the focus goes in: the field a prompt offered, or the name. */
  field: EditProfileField | null
  onSaved: () => void
  /** Where the focus goes back when it closes: what opened it (WCAG 2.4.3). */
  returnFocusTo?: RefObject<HTMLElement | null>
}) {
  const t = useTranslations('communities.edit')
  const ids = useId()
  const [confirming, setConfirming] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  // An image being cropped (PP-07): the cropper takes the window's body until Apply or Back.
  const [cropping, setCropping] = useState<{
    kind: ProfileImageKind
    file: File
    source: string
  } | null>(null)
  // What was cut, shown at once (the uploaded URL may be the mocks' fixture).
  const [previews, setPreviews] = useState<Partial<Record<ProfileImageKind, string | null>>>({})
  const form = useForm<EditProfileForm, unknown, EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: profile.displayName ?? '',
      headline: profile.headline ?? '',
      countryCode: profile.countryCode ?? '',
      city: profile.city ?? '',
      bio: profile.bio ?? '',
      links: profile.links.map((url) => ({ url })),
      openTo: profile.openTo,
      avatarUrl: profile.avatarUrl,
      bannerUrl: profile.bannerUrl,
    },
    mode: 'onChange',
  })
  const { register, handleSubmit, formState, control, setError, setValue } = form
  const [displayName = '', headline = '', city = '', bio = '', avatarUrl, bannerUrl] = useWatch({
    control,
    name: ['displayName', 'headline', 'city', 'bio', 'avatarUrl', 'bannerUrl'],
  })
  const blocked = !formState.isValid || formState.isSubmitting || cropping !== null
  const modal = layout === 'modal'
  const id = (name: string) => `${ids}-${name}`
  // A schema key is the window's own: communities.edit.errors.x is errors.x.
  const error = (name: Name) => {
    const key = formState.errors[name]?.message?.replace(/^communities\.edit\./, '')
    return key ? t(key as 'errors.general') : undefined
  }

  function requestClose() {
    if (formState.isDirty) setConfirming(true)
    else onOpenChange(false)
  }

  async function save(values: EditProfileInput) {
    setServerError(null)
    // Only what changed (PP-08): a removed link marks the list as changed too.
    const dirty = formState.dirtyFields as Partial<Record<keyof EditProfileInput, unknown>>
    const changes = Object.fromEntries(
      Object.entries(values).filter(([key]) => dirty[key as keyof EditProfileInput]),
    )
    if (Object.keys(changes).length === 0) return onOpenChange(false)

    const result = await updateProfile(changes)
    if (result.ok) {
      onSaved()
      onOpenChange(false)
      return
    }
    // Only the window's own messages go under a field; anything else is the general failure.
    const fields = Object.entries(result.fieldErrors ?? {}).filter(([, messages]) =>
      messages?.[0]?.startsWith('communities.edit.errors.'),
    )
    for (const [name, messages] of fields) setError(name as Name, { message: messages![0] })
    if (fields.length === 0) setServerError(t('errors.general'))
  }

  // Back from cropping, the focus goes to the "Change" that started it (WCAG 2.4.3), once the
  // form shows again: a hidden button cannot take it.
  const refocus = useRef<string | null>(null)
  useEffect(() => {
    if (cropping || !refocus.current) return
    document.getElementById(refocus.current)?.focus()
    refocus.current = null
  }, [cropping])

  function stopCropping() {
    if (!cropping) return
    URL.revokeObjectURL(cropping.source)
    refocus.current = changeImageId(`${ids}-images`, cropping.kind)
    setCropping(null)
  }

  function setImage(kind: ProfileImageKind, imageUrl: string | null, preview: string | null) {
    setValue(IMAGE_FIELD[kind], imageUrl, { shouldDirty: true })
    setPreviews((current) => ({ ...current, [kind]: preview }))
  }

  // Into the field a prompt or a step offered (PP-04, specs/profile-showcase PS-02), else the name.
  function initialFocus() {
    switch (field) {
      case 'links':
      case 'openTo':
        return document.getElementById(id(field))?.querySelector<HTMLElement>('input, button')
      case 'avatar':
      case 'banner':
        return document.getElementById(changeImageId(`${ids}-images`, field))
      case 'location':
        return document.getElementById(id('countryCode'))
      default:
        return document.getElementById(id(field ?? 'displayName'))
    }
  }

  return (
    <Dialog
      open={open}
      // Esc while cropping is Back: it leaves the cropper, not the window.
      onOpenChange={(next) =>
        next ? onOpenChange(true) : cropping ? stopCropping() : requestClose()
      }
    >
      <DialogContent
        showCloseButton={false}
        initialFocus={initialFocus}
        finalFocus={returnFocusTo}
        className={modal ? MODAL : SHEET}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b px-2">
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
          <DialogTitle className="min-w-0 truncate type-post-title">{t('title')}</DialogTitle>
          <div className="ml-auto pr-2">
            <button
              type="submit"
              form={`${ids}-form`}
              aria-disabled={blocked || undefined}
              className={cn(PILL, 'bg-primary text-primary-foreground hover:bg-primary/85')}
            >
              {formState.isSubmitting ? t('saving') : t('save')}
            </button>
            {/* What the button says while saving, also announced (PP-08). */}
            <span role="status" className="sr-only">
              {formState.isSubmitting ? t('saving') : ''}
            </span>
          </div>
        </div>

        <form
          id={`${ids}-form`}
          noValidate
          onSubmit={(event) => {
            // aria-disabled, not disabled: the focused button keeps the focus (WCAG 2.4.3).
            if (blocked) return event.preventDefault()
            void handleSubmit(save)(event)
          }}
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-4 pb-6"
        >
          {cropping && (
            <ImageCropper
              kind={cropping.kind}
              file={cropping.file}
              source={cropping.source}
              onBack={stopCropping}
              onApply={({ imageUrl, preview }) => {
                setImage(cropping.kind, imageUrl, preview)
                stopCropping()
              }}
            />
          )}
          {/* Hidden, not gone, while cropping: what is written stays (PP-08). */}
          <div hidden={cropping !== null} className="contents">
            <ProfileImages
              idPrefix={`${ids}-images`}
              username={profile.username}
              avatar={previews.avatar !== undefined ? previews.avatar : avatarUrl}
              banner={previews.banner !== undefined ? previews.banner : bannerUrl}
              onPick={(kind, file) =>
                setCropping({ kind, file, source: URL.createObjectURL(file) })
              }
              onRemove={(kind) => setImage(kind, null, null)}
            />
            <CountedField
              id={id('displayName')}
              label={t('name')}
              max={DISPLAY_NAME_MAX}
              value={displayName}
              field={register('displayName')}
              error={error('displayName')}
            />
            <CountedField
              id={id('headline')}
              label={t('headline')}
              placeholder={t('headlinePlaceholder')}
              max={HEADLINE_MAX}
              value={headline}
              field={register('headline')}
              error={error('headline')}
            />
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="mb-1.5 type-action">{t('location')}</legend>
              <CountryField id={id('countryCode')} field={register('countryCode')} />
              <CountedField
                id={id('city')}
                label={t('city')}
                max={CITY_MAX}
                value={city}
                field={register('city')}
                error={error('city')}
              />
            </fieldset>
            <CountedField
              id={id('bio')}
              label={t('bio')}
              placeholder={t('bioPlaceholder')}
              max={BIO_MAX}
              value={bio}
              field={register('bio')}
              error={error('bio')}
              multiline
              alwaysCount
            />
            <OpenToField id={id('openTo')} field={register('openTo')} error={error('openTo')} />
            <div id={id('links')}>
              <LinksField control={control} register={register} errors={formState.errors.links} />
            </div>
            {serverError && (
              <p role="alert" className="type-small text-destructive">
                {serverError}
              </p>
            )}
          </div>
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
