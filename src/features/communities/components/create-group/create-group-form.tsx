'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useForm, useWatch } from 'react-hook-form'
import { ACTIONS_BAR, FIELD_BOX } from '@/components/molecules/field-styles'
import { StepTitle } from '@/components/molecules/step-title'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Link } from '@/i18n/navigation'
import { toProfileLink } from '@/lib/profile-links'
import { cn } from '@/lib/utils'
import { useCreateGroup } from '../../hooks/use-create-group'
import { useSimilarGroups } from '../../hooks/use-similar-groups'
import { useSlugAvailability } from '../../hooks/use-slug-availability'
import { slugAlternatives, slugify } from '../../lib/slugify'
import {
  createGroupSchema,
  DESCRIPTION_MAX,
  GROUP_SLUG,
  NAME_MAX,
  NAME_MIN,
  RULES_MAX,
  SLUG_MAX,
  SLUG_MIN,
  type CreateGroupForm as FormValues,
  type CreateGroupInput,
} from '../../schemas/create-group.schema'
import { ProfileImages, type ProfileImageKind } from '../edit-profile-images'
// The cropper (react-easy-crop) comes with the form, itself loaded after the page: one more
// deferred import would cost every route its entry in the manifest (seo.md § Performance).
import { GroupImageCropper } from './group-image-cropper'
import { GroupPreview, NO_NAME } from './group-preview'

const STEPS = 6
const PREVIEW_SLOT = 'group-preview-slot'

/** The counter shows from 80% of the limit (CG-04). */
const near = (length: number, max: number) => length >= max * 0.8

type Image = { blob: Blob; url: string }

/**
 * The form to create a group (specs/community-create CG-03 to CG-12): six numbered steps, the
 * handle that follows the name until edited and says whether it is free, the images cropped here
 * and uploaded once the group exists, and a preview of its header. From lg the preview goes to the
 * right column, through a portal; narrower, before the button.
 */
export function CreateGroupForm() {
  const t = useTranslations('createGroup')
  const ids = useId()
  const form = useForm<FormValues, unknown, CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    mode: 'onTouched',
    defaultValues: { name: '', slug: '', description: '', rules: '', mainUrl: '' },
  })
  const { register, setValue, formState, control } = form
  const [name, slug, description, rules, mainUrl] = useWatch({
    control,
    name: ['name', 'slug', 'description', 'rules', 'mainUrl'],
  })
  const { available } = useSlugAvailability(form)
  const similar = useSimilarGroups(name)
  const { state, submit } = useCreateGroup(form)
  // The handle follows the name until it is edited; emptied, it follows again (CG-05).
  const [slugTouched, setSlugTouched] = useState(false)
  const [images, setImages] = useState<Partial<Record<ProfileImageKind, Image>>>({})
  const [cropping, setCropping] = useState<{
    kind: ProfileImageKind
    file: File
    source: string
  } | null>(null)
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  // The right column's place for the preview: another React tree, there after hydrating.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the slot is in the DOM only after hydrating
    setSlot(document.getElementById(PREVIEW_SLOT))
  }, [])

  // The previews' URLs go with what they show.
  const latest = useRef(images)
  useEffect(() => {
    latest.current = images
  }, [images])
  useEffect(
    () => () => Object.values(latest.current).forEach((image) => URL.revokeObjectURL(image.url)),
    [],
  )

  // Leaving with something written asks first (CG-12): a group has no drafts.
  const busy = state.status === 'creating' || state.status === 'created'
  const dirty = formState.isDirty || Object.keys(images).length > 0
  const guard = dirty && state.status !== 'created'
  useEffect(() => {
    if (!guard) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [guard])

  const nameField = register('name', {
    onChange: (event: { target: { value: string } }) => {
      if (slugTouched) return
      setValue('slug', slugify(event.target.value), {
        shouldDirty: true,
        shouldValidate: formState.isSubmitted || Boolean(formState.touchedFields.slug),
      })
    },
  })
  const slugField = register('slug', {
    onChange: (event: { target: { value: string } }) => {
      setSlugTouched(event.target.value !== '')
    },
  })

  /** A field's error, as a key of this namespace (or of the api's, said generally). */
  const fieldError = (field: keyof FormValues) => {
    const message = formState.errors[field]?.message
    if (!message) return undefined
    const key = message.startsWith('createGroup.') ? message.slice(12) : 'errors.unexpected'
    return [{ message: t(key as 'errors.unexpected') }]
  }
  const invalid = (field: keyof FormValues) => Boolean(formState.errors[field])

  const slugOk =
    slug.length >= SLUG_MIN && slug.length <= SLUG_MAX && GROUP_SLUG.test(slug) && !invalid('slug')
  const taken = formState.errors.slug?.message === 'createGroup.errors.slugTaken'
  const done = {
    name: name.trim().length >= NAME_MIN && name.trim().length <= NAME_MAX,
    slug: slugOk,
    description: description.trim().length > 0 && !invalid('description'),
    images: Object.keys(images).length > 0,
    rules: rules.trim().length > 0 && !invalid('rules'),
    mainUrl: mainUrl.trim().length > 0 && !invalid('mainUrl'),
  }
  const ready = name.trim().length > 0 && slug.length > 0 && !busy

  function setImage(kind: ProfileImageKind, blob: Blob | null) {
    setImages((current) => {
      const previous = current[kind]
      if (previous) URL.revokeObjectURL(previous.url)
      const next = { ...current }
      if (blob) next[kind] = { blob, url: URL.createObjectURL(blob) }
      else delete next[kind]
      return next
    })
  }

  const preview = (className?: string) => (
    <GroupPreview
      handle={slugOk ? slug : ''}
      name={name.trim()}
      description={description.trim()}
      rules={rules.trim()}
      website={invalid('mainUrl') ? null : (toProfileLink(mainUrl)?.host ?? null)}
      avatarUrl={images.avatar?.url ?? null}
      bannerUrl={images.banner?.url ?? null}
      className={className}
    />
  )

  const counter = (id: string, length: number, max: number) =>
    near(length, max) && (
      <span
        id={id}
        className={cn(
          'type-meta tabular-nums',
          length > max ? 'font-bold text-destructive' : 'text-muted-foreground',
        )}
      >
        {t('counter', { count: length, max })}
      </span>
    )

  const title = (n: number, isDone: boolean, label: string, optional = false): ReactNode => (
    <StepTitle n={n} total={STEPS} done={isDone}>
      {label}
      {optional && (
        <>
          {' '}
          <span className="font-normal text-muted-foreground">{t('optional')}</span>
        </>
      )}
    </StepTitle>
  )

  return (
    <>
      <form
        noValidate
        onSubmit={form.handleSubmit(() =>
          submit(form.getValues(), {
            avatar: images.avatar?.blob,
            banner: images.banner?.blob,
          }),
        )}
        className="flex flex-col gap-6"
      >
        <Field data-invalid={invalid('name') || undefined} className="gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <FieldLabel htmlFor={`${ids}-name`}>
              {title(1, done.name, t('fields.name.label'))}
            </FieldLabel>
            {counter(`${ids}-name-count`, name.trim().length, NAME_MAX)}
          </div>
          <Input
            id={`${ids}-name`}
            placeholder={t('fields.name.placeholder')}
            autoComplete="off"
            {...nameField}
            aria-invalid={invalid('name') || undefined}
            aria-required
            aria-describedby={`${ids}-name-count ${ids}-name-error`}
            className={cn(FIELD_BOX, 'h-12 font-semibold')}
          />
          <FieldError id={`${ids}-name-error`} errors={fieldError('name')} className="type-meta" />
          {/* What already exists with a name like it, before a duplicate is made (CG-22). */}
          {similar.length > 0 && (
            <section
              aria-labelledby={`${ids}-similar`}
              className="rounded-xl bg-surface px-3.5 py-3"
            >
              <h2 id={`${ids}-similar`} className="type-meta font-semibold text-muted-foreground">
                {t('fields.name.similar')}
              </h2>
              <ul className="mt-1.5 flex flex-col gap-1">
                {similar.map((group) => (
                  <li key={group.path}>
                    <Link
                      href={group.path}
                      target="_blank"
                      className="inline-flex min-h-6 flex-wrap items-baseline gap-x-1.5 rounded-sm type-small outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span className="font-semibold">{group.handle}</span>{' '}
                      <span className="text-muted-foreground">
                        {t('fields.name.members', { count: group.memberCount })}
                      </span>
                      <span className="sr-only">{t('fields.name.newTab')}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Field>

        <Field data-invalid={invalid('slug') || undefined} className="gap-2">
          <FieldLabel htmlFor={`${ids}-slug`}>
            {title(2, done.slug, t('fields.slug.label'))}
          </FieldLabel>
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-base font-semibold text-muted-foreground"
            >
              #
            </span>
            <Input
              id={`${ids}-slug`}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={SLUG_MAX}
              {...slugField}
              aria-invalid={invalid('slug') || undefined}
              aria-required
              aria-describedby={`${ids}-slug-hint ${ids}-slug-status ${ids}-slug-error`}
              className={cn(FIELD_BOX, 'h-12 pl-8')}
            />
          </div>
          {/* With a valid handle, where the group will live; before, how to write one (CG-19). */}
          <p id={`${ids}-slug-hint`} className="type-meta wrap-anywhere text-muted-foreground">
            {slugOk ? t('fields.slug.address', { path: `/hub/${slug}` }) : t('fields.slug.hint')}
          </p>
          {/* Whether it is free, announced politely (CG-06); a taken one is the field's error. */}
          <p
            id={`${ids}-slug-status`}
            aria-live="polite"
            className="flex items-center gap-1 type-meta font-semibold text-success empty:hidden"
          >
            {available && !invalid('slug') && (
              <>
                <CheckIcon aria-hidden className="size-3.5" strokeWidth={3} />
                {t('fields.slug.available', { slug: available })}
              </>
            )}
          </p>
          <FieldError id={`${ids}-slug-error`} errors={fieldError('slug')} className="type-meta" />
          {/* Taken: others like it, chosen with a tap and asked again (CG-19). */}
          {taken && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="type-meta text-muted-foreground">{t('fields.slug.try')}</span>
              {slugAlternatives(slug).map((each) => (
                <button
                  key={each}
                  type="button"
                  onClick={() => {
                    setSlugTouched(true)
                    setValue('slug', each, { shouldDirty: true, shouldValidate: true })
                  }}
                  // Its own color: the invalid Field paints what it holds red (a choice, not an error).
                  className="inline-flex h-8 tap items-center rounded-full bg-muted px-3 type-action text-foreground outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  #{each}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field data-invalid={invalid('description') || undefined} className="gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <FieldLabel htmlFor={`${ids}-description`}>
              {title(3, done.description, t('fields.description.label'), true)}
            </FieldLabel>
            {counter(`${ids}-description-count`, description.trim().length, DESCRIPTION_MAX)}
          </div>
          <Textarea
            id={`${ids}-description`}
            placeholder={t('fields.description.placeholder')}
            {...register('description')}
            aria-invalid={invalid('description') || undefined}
            aria-describedby={`${ids}-description-count ${ids}-description-error`}
            className={cn(FIELD_BOX, 'field-sizing-content max-h-60 min-h-20 resize-none py-3')}
          />
          <FieldError
            id={`${ids}-description-error`}
            errors={fieldError('description')}
            className="type-meta"
          />
        </Field>

        <div className="flex flex-col gap-2">
          {/* The images' own names are their camera buttons; the step titles the group. */}
          <p className="type-ui font-medium">
            {title(4, done.images, t('fields.images.label'), true)}
          </p>
          {/* Up to 512px: the banner as tall as the group's header, not the whole form (CG-16). */}
          <ProfileImages
            idPrefix={`${ids}-images`}
            colorKey={slugOk ? slug : 'your-group'}
            name={name.trim() || NO_NAME}
            shape="square"
            className="max-w-lg"
            avatar={images.avatar?.url ?? null}
            banner={images.banner?.url ?? null}
            onPick={(kind, file) => setCropping({ kind, file, source: URL.createObjectURL(file) })}
            onRemove={(kind) => setImage(kind, null)}
          />
        </div>

        <Field data-invalid={invalid('rules') || undefined} className="gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <FieldLabel htmlFor={`${ids}-rules`}>
              {title(5, done.rules, t('fields.rules.label'), true)}
            </FieldLabel>
            {counter(`${ids}-rules-count`, rules.trim().length, RULES_MAX)}
          </div>
          <Textarea
            id={`${ids}-rules`}
            placeholder={t('fields.rules.placeholder')}
            {...register('rules')}
            aria-invalid={invalid('rules') || undefined}
            aria-describedby={`${ids}-rules-count ${ids}-rules-error`}
            className={cn(FIELD_BOX, 'field-sizing-content max-h-80 min-h-24 resize-none py-3')}
          />
          <FieldError
            id={`${ids}-rules-error`}
            errors={fieldError('rules')}
            className="type-meta"
          />
        </Field>

        <Field data-invalid={invalid('mainUrl') || undefined} className="gap-2">
          <FieldLabel htmlFor={`${ids}-mainUrl`}>
            {title(6, done.mainUrl, t('fields.mainUrl.label'), true)}
          </FieldLabel>
          <Input
            id={`${ids}-mainUrl`}
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder={t('fields.mainUrl.placeholder')}
            {...register('mainUrl')}
            aria-invalid={invalid('mainUrl') || undefined}
            aria-describedby={`${ids}-mainUrl-error`}
            className={cn(FIELD_BOX, 'h-12')}
          />
          <FieldError
            id={`${ids}-mainUrl-error`}
            errors={fieldError('mainUrl')}
            className="type-meta"
          />
        </Field>

        {/* Where there is no right column, the preview before the button (Q3). */}
        {preview('lg:hidden')}

        {state.status === 'error' && (
          <p role="alert" className="type-small text-destructive">
            {t('errors.unexpected')}
          </p>
        )}

        {/* In phones it sticks over the bottom bar while the form is filled (CG-20). */}
        <div data-sticky-actions className={cn(ACTIONS_BAR, 'mt-0')}>
          <button
            type="submit"
            aria-disabled={!ready || undefined}
            onClick={(event) => {
              if (!ready) event.preventDefault()
            }}
            className="inline-flex h-11 tap items-center justify-center rounded-full bg-primary px-5 type-action font-bold text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 md:h-9"
          >
            {busy ? t('creating') : t('submit')}
          </button>
        </div>
      </form>

      {/* From lg, at the top of the right column (CG-08). */}
      {slot && createPortal(preview(), slot)}

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
    </>
  )
}
