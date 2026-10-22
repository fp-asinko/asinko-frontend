'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react'
import dynamic from 'next/dynamic'
import { useForm, useWatch } from 'react-hook-form'
import { useRouter } from '@/i18n/navigation'
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
import { readChecklistHidden, writeChecklistHidden } from '../lib/checklist-cookie'
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

/**
 * Desktop: a window near the top, as LinkedIn's "Edit intro", wide enough for two columns that fit
 * without scrolling (specs/profile-edit-flow EF-09); its body scrolls if not, never the page.
 */
const MODAL =
  'top-[8dvh] flex max-h-[84dvh] w-[calc(100%-2rem)] max-w-220 -translate-y-0 flex-col gap-0 rounded-2xl p-0 sm:max-w-220'

const PILL =
  'inline-flex h-11 tap items-center rounded-full px-4 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 md:h-9'

/** The fields the window's sections hold, in their order. */
type Name = Exclude<keyof EditProfileForm, 'links'>

/** A titled part of the window (specs/profile-edit-flow EF-09); its line, from who places it. */
function Section({
  id,
  title,
  className,
  children,
}: {
  id: string
  title: string
  className?: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className={cn('flex flex-col gap-5', className)}>
      <h3 id={id} className="type-section text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  )
}

/**
 * "Edit profile", as LinkedIn's "Edit intro" (specs/profile-edit, specs/profile-presentation PP-05
 * to PP-09, specs/profile-edit-flow): one window in three sections. The photo and the banner are
 * saved as soon as they are applied or removed (EF-02, EF-03); Save, in a footer always at hand,
 * sends only the rest that changed and closes, and waits dimmed until something did (EF-07). The
 * page shows it after `onSaved` refreshes it. A refusal about a field is said under it, and what
 * is written stays. Cancel, × or Esc close, asking first if something is unsaved. A window in
 * desktop, the full screen in phones. Loaded on first use (EditProfileProvider); opened on a field
 * when a prompt asked (PP-04).
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
  const router = useRouter()
  // "Complete your profile" hidden in this browser (PS-14): read once, when the window opens.
  const [checklist, setChecklist] = useState<'hidden' | 'shown' | null>(() =>
    readChecklistHidden() ? 'hidden' : null,
  )
  const checklistLine = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (checklist === 'shown') checklistLine.current?.focus()
  }, [checklist])
  // An image being cropped (PP-07): the cropper takes the window's body until Apply or Back.
  const [cropping, setCropping] = useState<{
    kind: ProfileImageKind
    file: File
    source: string
  } | null>(null)
  // The images as saved: saved apart from the form, at once (EF-02). What was cut is shown, not
  // its URL (the mocks' fixture).
  const [images, setImages] = useState<Record<ProfileImageKind, string | null>>({
    avatar: profile.avatarUrl,
    banner: profile.bannerUrl,
  })
  // Removing an image, while its confirmation is open (EF-03).
  const [removing, setRemoving] = useState<ProfileImageKind | null>(null)
  // Which one, still while its confirmation closes: its title and where the focus goes back.
  const [removed, setRemoved] = useState<ProfileImageKind>('avatar')
  const [imageStatus, setImageStatus] = useState('')
  const [imageBusy, setImageBusy] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
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
  const { register, handleSubmit, formState, control, setError } = form
  const [displayName = '', headline = '', city = '', bio = ''] = useWatch({
    control,
    name: ['displayName', 'headline', 'city', 'bio'],
  })
  // Each read on every render: react-hook-form only keeps what was read up to date, and a `||`
  // that stops at !isDirty would leave isValid unread, stale after the first change.
  const { isDirty, isValid, isSubmitting } = formState
  const blocked = !isDirty || !isValid || isSubmitting || cropping !== null
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
    // Only what changed (PP-08): a removed link marks the list as changed too. The images are
    // never here: they were saved on their own (EF-02).
    const dirty = formState.dirtyFields as Partial<Record<keyof EditProfileInput, unknown>>
    const changes = Object.fromEntries(
      Object.entries(values).filter(([key]) => dirty[key as keyof EditProfileInput]),
    )
    // Emptied, the list is not marked dirty (react-hook-form unsets it): compared by value.
    if (values.links.join('\n') !== profile.links.join('\n')) changes.links = values.links
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

  /** Saves an image (or its removal) in the profile at once (EF-02, EF-03); false if it failed. */
  async function saveImage(
    kind: ProfileImageKind,
    imageUrl: string | null,
    preview: string | null,
  ) {
    setImageStatus(t('saving'))
    setImageError(null)
    setImageBusy(true)
    const result = await updateProfile({ [IMAGE_FIELD[kind]]: imageUrl })
    setImageBusy(false)
    if (!result.ok) {
      setImageStatus('')
      return false
    }
    setImages((current) => ({ ...current, [kind]: preview }))
    onSaved()
    setImageStatus(kind === 'avatar' ? t('photoUpdated') : t('bannerUpdated'))
    return true
  }

  async function confirmRemove() {
    if (!removing) return
    const kind = removing
    setRemoving(null)
    if (!(await saveImage(kind, null, null))) setImageError(t('errors.imageSave'))
  }

  // Back from cropping, the focus goes to the camera that started it (WCAG 2.4.3), once the
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
        // Without the page blurred behind: a window this large stuttered while it opened and
        // closed, the blur redrawn on every frame (EF-12).
        overlay="solid"
        className={modal ? MODAL : SHEET}
      >
        {/* The title and ×; Cancel and Save wait in the footer (EF-06). */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b pr-2 pl-4">
          <DialogTitle className="min-w-0 truncate type-post-title">{t('title')}</DialogTitle>
          {/* Gone while cropping: the cropper has its own Back, and two would read the same. */}
          {!cropping && (
            <button
              type="button"
              aria-label={t('close')}
              onClick={requestClose}
              className="ml-auto inline-flex size-11 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:size-9"
            >
              <XIcon aria-hidden className="size-5" />
            </button>
          )}
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
              onApply={async ({ imageUrl, preview }) => {
                const saved = await saveImage(cropping.kind, imageUrl, preview)
                if (saved) stopCropping()
                return saved
              }}
            />
          )}
          {/* Hidden, not gone, while cropping: what is written stays (PP-08). */}
          <div hidden={cropping !== null} className="contents">
            <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:items-start md:gap-x-8">
              <Section id={id('profile')} title={t('sections.profile')}>
                <div className="flex flex-col gap-2">
                  <ProfileImages
                    idPrefix={`${ids}-images`}
                    username={profile.username}
                    avatar={images.avatar}
                    banner={images.banner}
                    onPick={(kind, file) => {
                      if (imageBusy) return
                      setCropping({ kind, file, source: URL.createObjectURL(file) })
                    }}
                    onRemove={(kind) => {
                      if (imageBusy) return
                      setRemoved(kind)
                      setRemoving(kind)
                    }}
                  />
                  {imageError && (
                    <p role="alert" className="type-small text-destructive">
                      {imageError}
                    </p>
                  )}
                </div>
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
              </Section>
              <div className="flex flex-col gap-5 border-t pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                <Section id={id('about')} title={t('sections.about')}>
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
                  <OpenToField
                    id={id('openTo')}
                    field={register('openTo')}
                    error={error('openTo')}
                  />
                </Section>
                <Section
                  id={id('links-title')}
                  title={t('sections.links')}
                  className="border-t pt-5"
                >
                  <div id={id('links')}>
                    <LinksField
                      control={control}
                      register={register}
                      errors={formState.errors.links}
                      legendClassName="sr-only"
                    />
                  </div>
                </Section>
              </div>
            </div>
            {serverError && (
              <p role="alert" className="type-small text-destructive">
                {serverError}
              </p>
            )}
            {checklist && (
              <div className="border-t pt-4">
                {/* Shown, the button gives way to the line that says so: the focus goes to it. */}
                {/* Read as it takes the focus: no live region, or it would be said twice. */}
                <p
                  tabIndex={-1}
                  ref={checklistLine}
                  className="type-small text-muted-foreground outline-none"
                >
                  {checklist === 'shown' ? t('checklistShown') : ''}
                </p>
                {checklist === 'hidden' && (
                  <button
                    type="button"
                    onClick={() => {
                      writeChecklistHidden(false)
                      setChecklist('shown')
                      // The profile behind the window shows it again.
                      router.refresh()
                    }}
                    className="inline-flex h-11 tap items-center rounded-full bg-muted px-4 type-action outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9"
                  >
                    {t('showChecklist')}
                  </button>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Always at hand, out of the scroll (EF-06); the cropper has its own Back and Apply. */}
        <div
          hidden={cropping !== null}
          className="flex shrink-0 justify-end gap-2 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            onClick={requestClose}
            className={cn(PILL, 'bg-muted hover:bg-muted-hover')}
          >
            {t('cancel')}
          </button>
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
        {/* An image saved, said without moving the focus (EF-02). Out of what hides while cropping:
            a live region that shows up already with its text is not read. */}
        <p role="status" className="sr-only">
          {imageStatus}
        </p>

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

        {/* Removing saves at once: asked first (EF-03, security.md § 7). */}
        <AlertDialog open={removing !== null} onOpenChange={(next) => !next && setRemoving(null)}>
          <AlertDialogContent
            finalFocus={() => document.getElementById(changeImageId(`${ids}-images`, removed))}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>
                {removed === 'banner'
                  ? t('removeConfirm.bannerTitle')
                  : t('removeConfirm.photoTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {removed === 'banner'
                  ? t('removeConfirm.bannerBody')
                  : t('removeConfirm.photoBody')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('removeConfirm.cancel')}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => void confirmRemove()}>
                {t('removeConfirm.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
