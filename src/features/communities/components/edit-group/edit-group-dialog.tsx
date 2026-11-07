'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { notify } from '@/components/organisms/toaster/notify'
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
import { cn } from '@/lib/utils'
import { updateGroup } from '../../actions/update-group.action'
import { uploadGroupImage } from '../../actions/upload-group-image.action'
import type { EditableGroup, EditGroupField } from '../../communities.types'
import {
  DESCRIPTION_MAX,
  editGroupSchema,
  NAME_MAX,
  RULES_MAX,
  URL_MAX,
  type EditGroupForm,
  type EditGroupInput,
} from '../../schemas/create-group.schema'
import { GroupImageCropper } from '../create-group/group-image-cropper'
import { NO_NAME } from '../create-group/group-preview'
import { changeImageId, ProfileImages, type ProfileImageKind } from '../edit-profile-images'
import { CountedField } from '../edit-profile-fields'

/** Phones: the whole screen, as "Edit profile". */
const SHEET =
  'inset-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 pt-[env(safe-area-inset-top)] sm:max-w-none data-open:slide-in-from-bottom-10 data-open:zoom-in-100 data-closed:slide-out-to-bottom-10 data-closed:zoom-out-100'

/** Desktop: a window near the top, one column; its body scrolls, never the page. */
const MODAL =
  'top-[8dvh] flex max-h-[84dvh] w-[calc(100%-2rem)] max-w-140 -translate-y-0 flex-col gap-0 rounded-2xl p-0 sm:max-w-140'

const PILL =
  'inline-flex h-11 tap items-center rounded-full px-4 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 md:h-9'

const TEXT_FIELDS = ['name', 'description', 'rules', 'mainUrl'] as const

/** A chosen image waiting for Save, or the removal of the one there was. */
type Pending = { blob: Blob; url: string } | null

/**
 * "Edit group" (specs/community-edit CE-02 to CE-06): the group's photo and banner, name,
 * description, rules and website, with the limits of a new group; the handle shown, not edited
 * (Q2). Save uploads the images chosen, then sends only the rest that changed, and closes; a
 * refusal about a field is said under it, and what is written stays. Cancel, × or Esc ask first if
 * something is unsaved. A window in desktop, the full screen in phones. Loaded on first use.
 */
export function EditGroupDialog({
  layout,
  open,
  onOpenChange,
  group,
  field,
  onSaved,
  returnFocusTo,
}: {
  layout: 'sheet' | 'modal'
  open: boolean
  onOpenChange: (open: boolean) => void
  group: EditableGroup
  /** Where the focus goes in: the step that opened it, or the name. */
  field: EditGroupField | null
  onSaved: () => void
  returnFocusTo?: RefObject<HTMLElement | null>
}) {
  const t = useTranslations('communities.editGroup')
  const tFields = useTranslations('createGroup')
  const ids = useId()
  const id = (name: string) => `${ids}-${name}`
  const [confirming, setConfirming] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // The images changed and not saved yet: a new one, or null to remove it.
  const [pending, setPending] = useState<Partial<Record<ProfileImageKind, Pending>>>({})
  const [cropping, setCropping] = useState<{
    kind: ProfileImageKind
    file: File
    source: string
  } | null>(null)

  const form = useForm<EditGroupForm, unknown, EditGroupInput>({
    resolver: zodResolver(editGroupSchema),
    mode: 'onChange',
    defaultValues: {
      name: group.name,
      description: group.description ?? '',
      rules: group.rules ?? '',
      mainUrl: group.mainUrl ?? '',
    },
  })
  const { register, formState, control, setError, handleSubmit } = form
  const [name = '', description = '', rules = '', mainUrl = ''] = useWatch({
    control,
    name: ['name', 'description', 'rules', 'mainUrl'],
  })
  const { isDirty, isValid } = formState
  const changed = isDirty || Object.keys(pending).length > 0
  const blocked = !changed || !isValid || saving

  // The previews' URLs go with what they show.
  const latest = useRef(pending)
  useEffect(() => {
    latest.current = pending
  }, [pending])
  useEffect(
    () => () =>
      Object.values(latest.current).forEach((image) => image && URL.revokeObjectURL(image.url)),
    [],
  )

  const shown = (kind: ProfileImageKind) => {
    const key = kind === 'avatar' ? 'avatarUrl' : 'bannerUrl'
    return kind in pending ? (pending[kind]?.url ?? null) : group[key]
  }

  function setImage(kind: ProfileImageKind, blob: Blob | null) {
    setPending((current) => {
      const previous = current[kind]
      if (previous) URL.revokeObjectURL(previous.url)
      return { ...current, [kind]: blob && { blob, url: URL.createObjectURL(blob) } }
    })
  }

  /** A field's error, translated: the window's keys are a new group's (createGroup.errors.x). */
  const error = (name: (typeof TEXT_FIELDS)[number]) => {
    const message = formState.errors[name]?.message
    return message?.startsWith('createGroup.')
      ? tFields(message.slice('createGroup.'.length) as 'errors.nameLength')
      : undefined
  }

  function requestClose() {
    if (changed) setConfirming(true)
    else onOpenChange(false)
  }

  /** Uploads each new image (its upload saves it on the group); false if one failed. */
  async function saveImages(): Promise<boolean> {
    for (const kind of ['avatar', 'banner'] as const) {
      const image = pending[kind]
      if (!image) continue
      const data = new FormData()
      data.set('communityId', group.id)
      data.set('slug', group.slug)
      data.set('kind', kind)
      data.set('file', image.blob)
      const result = await uploadGroupImage(data).catch(() => null)
      if (!result?.ok) {
        setServerError(t('errors.image', { kind }))
        return false
      }
      // Saved: Save again does not upload it twice.
      setPending(({ [kind]: _saved, ...rest }) => rest)
    }
    return true
  }

  async function save() {
    // As written: the action applies the schema (an empty text removes it).
    const values = form.getValues()
    setServerError(null)
    setSaving(true)
    try {
      if (!(await saveImages())) return
      // Only what changed (CE-03); an image removed goes as null.
      const dirty = formState.dirtyFields
      const changes: Record<string, unknown> = Object.fromEntries(
        TEXT_FIELDS.filter((key) => dirty[key]).map((key) => [key, values[key]]),
      )
      if (pending.avatar === null) changes.avatarUrl = null
      if (pending.banner === null) changes.bannerUrl = null
      if (Object.keys(changes).length > 0) {
        const result = await updateGroup(group.slug, changes).catch(() => null)
        if (!result?.ok) {
          // Only the keys the fields can say; anything else is the general failure.
          const fields = TEXT_FIELDS.filter((key) =>
            result?.fieldErrors?.[key]?.[0]?.startsWith('createGroup.'),
          )
          for (const key of fields) setError(key, { message: result!.fieldErrors![key]![0] })
          if (fields.length > 0) return
          return setServerError(
            result?.error === 'communities.editGroup.errors.notModerator'
              ? t('errors.notModerator')
              : t('errors.general'),
          )
        }
      }
      onSaved()
      notify({ message: t('saved'), kind: 'success' })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  // Into the field a step offered (CE-07), else the name.
  function initialFocus() {
    if (field === 'images') return document.getElementById(changeImageId(id('images'), 'avatar'))
    return document.getElementById(id(field ?? 'name'))
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
      <DialogContent
        showCloseButton={false}
        initialFocus={initialFocus}
        finalFocus={returnFocusTo}
        overlay="solid"
        className={layout === 'modal' ? MODAL : SHEET}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b pr-2 pl-4">
          <DialogTitle className="min-w-0 truncate type-post-title">{t('title')}</DialogTitle>
          <button
            type="button"
            aria-label={t('close')}
            onClick={requestClose}
            className="ml-auto inline-flex size-11 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:size-9"
          >
            <XIcon aria-hidden className="size-5" />
          </button>
        </div>

        <form
          id={id('form')}
          noValidate
          onSubmit={(event) => {
            // aria-disabled, not disabled: the focused button keeps the focus (WCAG 2.4.3).
            if (blocked) return event.preventDefault()
            void handleSubmit(save)(event)
          }}
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-4 pb-6"
        >
          <ProfileImages
            idPrefix={id('images')}
            colorKey={group.slug}
            name={name.trim() || NO_NAME}
            shape="square"
            avatar={shown('avatar')}
            banner={shown('banner')}
            onPick={(kind, file) => setCropping({ kind, file, source: URL.createObjectURL(file) })}
            onRemove={(kind) => setImage(kind, null)}
          />
          <div className="flex flex-col gap-1">
            <p className="type-action">{t('handle')}</p>
            <p className="type-ui wrap-anywhere">{group.handle}</p>
            <p className="type-meta text-muted-foreground">{t('handleNote')}</p>
          </div>
          <CountedField
            id={id('name')}
            label={tFields('fields.name.label')}
            max={NAME_MAX}
            value={name}
            field={register('name')}
            error={error('name')}
          />
          <CountedField
            id={id('description')}
            label={tFields('fields.description.label')}
            placeholder={tFields('fields.description.placeholder')}
            max={DESCRIPTION_MAX}
            value={description}
            field={register('description')}
            error={error('description')}
            multiline
          />
          <CountedField
            id={id('rules')}
            label={tFields('fields.rules.label')}
            placeholder={tFields('fields.rules.placeholder')}
            max={RULES_MAX}
            value={rules}
            field={register('rules')}
            error={error('rules')}
            multiline
          />
          <CountedField
            id={id('mainUrl')}
            label={tFields('fields.mainUrl.label')}
            placeholder={tFields('fields.mainUrl.placeholder')}
            max={URL_MAX}
            value={mainUrl}
            field={register('mainUrl')}
            error={error('mainUrl')}
          />
          {serverError && (
            <p role="alert" className="type-small text-destructive">
              {serverError}
            </p>
          )}
        </form>

        {/* Always at hand, out of the scroll, as "Edit profile". */}
        <div className="flex shrink-0 justify-end gap-2 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={requestClose}
            className={cn(PILL, 'bg-muted hover:bg-muted-hover')}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            form={id('form')}
            aria-disabled={blocked || undefined}
            className={cn(PILL, 'bg-primary text-primary-foreground hover:bg-primary/85')}
          >
            {saving ? t('saving') : t('save')}
          </button>
          <span role="status" className="sr-only">
            {saving ? t('saving') : ''}
          </span>
        </div>

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

        {/* Nested in the window: its own dialog, over this one. */}
        {cropping && (
          <GroupImageCropper
            kind={cropping.kind}
            file={cropping.file}
            source={cropping.source}
            onApply={(blob) => {
              setImage(cropping.kind, blob)
              URL.revokeObjectURL(cropping.source)
              setCropping(null)
            }}
            onBack={() => {
              URL.revokeObjectURL(cropping.source)
              setCropping(null)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
