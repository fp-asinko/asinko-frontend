'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlignLeftIcon, ImageIcon, LinkIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { EmojiButton } from '@/components/molecules/emoji-picker'
import { MentionField } from '@/components/molecules/mention-assist'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { searchMentions } from '@/lib/mentions/search-mentions.action'
import { postPath } from '@/lib/posts/paths'
import type { TextField } from '@/lib/insert-text'
import { cn } from '@/lib/utils'
import { createPost } from '../actions/create-post.action'
import type { CommunityOption } from '../composer.types'
import {
  createPostSchema,
  IMAGE_ALT_MAX,
  TITLE_MAX,
  type CreatePostForm,
  type CreatePostInput,
} from '../schemas/create-post.schema'
import {
  clearDraft,
  forgetOpenedDraft,
  hasText,
  useStoredDraft,
  writeDraft,
} from '../hooks/use-post-draft'
import { CommunityPicker } from './community-picker'
import { ImageField, type TakeImage } from './image-field'
import { RelatedPicker } from './related-picker'

/** A field without its own box: the composer box around them is the box, as X. */
const BARE =
  'h-auto rounded-none border-0 bg-transparent p-0 text-foreground shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent'

/** A format: the gray pill of the system when chosen, plain otherwise. */
const FORMAT =
  'h-8 flex-none gap-1.5 rounded-full border-0 px-3 type-meta font-bold text-muted-foreground hover:bg-muted data-active:bg-muted data-active:text-foreground data-active:shadow-none dark:data-active:bg-muted [&_svg]:size-3.5'

const PILL =
  'inline-flex h-11 tap items-center justify-center rounded-full px-3 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 sm:px-4 md:h-9'

/** The title's counter shows near the limit (PC-08). */
const COUNTER_FROM = 250

const ERROR_NAMES = [
  'community',
  'titleRequired',
  'titleTooLong',
  'bodyRequired',
  'url',
  'ownProfileOnly',
  'invalidCommunity',
  'invalid',
  'imageRequired',
  'imageType',
  'imageUpload',
  'imageTooLarge',
  'imageUnreadable',
  'imageAltTooLong',
  'general',
] as const
type ErrorName = (typeof ERROR_NAMES)[number]

/** A translation key from the schema or the action, as one of the editor's messages. */
function errorName(key: string | undefined): ErrorName {
  const name = key?.replace(/^composer\.errors\./, '')
  return ERROR_NAMES.find((each) => each === name) ?? 'general'
}

const FIELDS = ['communityId', 'title', 'body', 'url', 'imageUrl', 'imageAlt'] as const

/** The first image file of a paste or a drop, if any (PI-02). */
function imageFile(files: FileList | undefined): File | null {
  return [...(files ?? [])].find((file) => file.type.startsWith('image/')) ?? null
}

/** How long the text rests before it is kept as the draft. */
const SAVE_AFTER_MS = 500

/**
 * The post editor of the page to create a post (specs/post-create-detail § 3, specs/submit-page),
 * minimal as X: where it goes (a chip), the title and the body without boxes, and a footer with
 * the formats (Text, Link, Image) and the actions. An image can be pasted or dropped anywhere on it
 * too (specs/post-image PI-02). The schema helps while typing and decides in the Server Action; the
 * server's answer shows next to each field, and the text is never lost: with `storageKey`, it is
 * kept in the browser as a draft while writing, and offered back when the page opens (SU-12).
 */
export function PostEditor({
  type,
  community,
  storageKey = null,
  draftRef,
  onCancel,
  onPublished,
  onCommunityChange,
}: {
  type: 'TEXT' | 'LINK' | 'IMAGE'
  community: CommunityOption | null
  /** Where the draft is kept (draftKey); null keeps nothing (no session). */
  storageKey?: string | null
  /**
   * Filled with a check of whether something is written, read when leaving (PC-05). Asked at that
   * moment from the form itself: a state passed up in an effect could arrive late.
   */
  draftRef: RefObject<(() => boolean) | null>
  /** Cancel: the parent asks before discarding. */
  onCancel: () => void
  onPublished: (path: string) => void
  /** Another community chosen: the page follows it in its URL (SU-03). */
  onCommunityChange?: (community: CommunityOption | null) => void
}) {
  const t = useTranslations('composer')
  const format = useFormatter()
  const now = useNow()
  const stored = useStoredDraft(storageKey)
  // The draft offered when the page opened: answered (recovered or discarded), it goes.
  const [answered, setAnswered] = useState(false)
  const offered = stored && !answered ? stored : null
  const { openGate } = useAuthGate()
  const ids = useId()
  const [chosen, setChosen] = useState<CommunityOption | null>(community)
  const [serverError, setServerError] = useState<ErrorName | null>(null)
  // The image is uploading: Publish waits (PI-06).
  const [uploading, setUploading] = useState(false)
  const takeImage = useRef<TakeImage | null>(null)
  const form = useForm<CreatePostForm, unknown, CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      communityId: community?.id ?? '',
      type,
      title: '',
      body: '',
      url: '',
      imageUrl: '',
      imageAlt: '',
      related: [],
    },
    // As X: no errors while writing; Publish says what is missing, then they follow the typing.
    // (On blur, an error appearing above would also move the format row under the pointer.)
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const { register, control, handleSubmit, setValue, setError, getValues, formState } = form
  const [title = '', body = '', url = '', current = type, imageUrl = '', related = []] = useWatch({
    control,
    name: ['title', 'body', 'url', 'type', 'imageUrl', 'related'],
  })

  useEffect(() => {
    draftRef.current = () => {
      const values = getValues()
      return Boolean(
        values.title.trim() || values.body.trim() || values.url?.trim() || values.imageUrl,
      )
    }
    return () => {
      draftRef.current = null
    }
  }, [draftRef, getValues])

  // The draft (SU-12): kept a moment after the typing rests, and at once when the tab closes. Not
  // while an older one waits for an answer: typing would overwrite it unasked.
  useEffect(() => {
    if (!storageKey || offered) return
    const keep = () => {
      const draft = {
        community: chosen,
        related,
        type: current,
        title,
        body,
        url,
        savedAt: Date.now(),
      }
      if (hasText(draft)) writeDraft(storageKey, draft)
    }
    const timer = setTimeout(keep, SAVE_AFTER_MS)
    window.addEventListener('pagehide', keep)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pagehide', keep)
    }
  }, [storageKey, offered, chosen, related, current, title, body, url])
  useEffect(() => {
    if (!storageKey) return
    return () => forgetOpenedDraft(storageKey)
  }, [storageKey])

  // On arrival the focus goes where the person starts (SU-09): the title, or the community when
  // none is chosen yet. Once: the page is opened, not re-rendered.
  useEffect(() => {
    document.getElementById(chosen ? `${ids}-title` : `${ids}-community`)?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on arrival
  }, [])

  // The notice goes with the button that had the focus: it goes to the title (WCAG 2.4.3).
  const focusTitle = () => document.getElementById(`${ids}-title`)?.focus()

  function recover() {
    if (!offered) return
    form.reset({
      ...getValues(),
      communityId: offered.community?.id ?? '',
      type: offered.type,
      title: offered.title,
      body: offered.body,
      url: offered.url,
      related: offered.related,
    })
    setChosen(offered.community)
    onCommunityChange?.(offered.community)
    setAnswered(true)
    focusTitle()
  }

  function discardStored() {
    if (storageKey) clearDraft(storageKey)
    setAnswered(true)
    focusTitle()
  }
  // Publish waits until nothing is missing, and while sending (PC-10, no double posts).
  const complete = Boolean(
    chosen &&
    title.trim() &&
    body.trim() &&
    (current !== 'LINK' || url.trim()) &&
    (current !== 'IMAGE' || imageUrl),
  )
  const blocked = !complete || uploading || formState.isSubmitting

  async function publish(values: CreatePostInput) {
    setServerError(null)
    const result = await createPost(values)
    if (result.ok) {
      if (storageKey) clearDraft(storageKey)
      onPublished(postPath(result.data.id, result.data.title))
      return
    }
    if (result.error === 'api.errors.UNAUTHENTICATED') {
      openGate('post')
      return
    }
    for (const field of FIELDS) {
      const key = result.fieldErrors?.[field]?.[0]
      if (key) setError(field, { message: key })
    }
    setServerError(errorName(result.error))
  }

  const fieldError = (name: (typeof FIELDS)[number]) => {
    const message = formState.errors[name]?.message
    if (!message) return undefined
    const key = errorName(message)
    return [
      {
        message:
          key === 'titleTooLong'
            ? t('errors.titleTooLong', { max: TITLE_MAX })
            : t(`errors.${key}`),
      },
    ]
  }
  const invalid = (name: (typeof FIELDS)[number]) => Boolean(formState.errors[name])
  const bodyField = register('body')
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  // Where an emoji goes: the last field used, title or body; the body until one is focused.
  const emojiTarget = useRef<TextField | null>(null)

  return (
    <form
      noValidate
      onSubmit={(event) => {
        // aria-disabled, not disabled: the focused button keeps the focus (WCAG 2.4.3). Pressed
        // with something missing, the schema fails and every field says what it needs (WCAG
        // 3.3.1); from then on the errors follow the typing. Never twice while sending.
        if (formState.isSubmitting || uploading) return event.preventDefault()
        void handleSubmit(publish)(event)
      }}
      // A pasted or dropped image goes to the Image format (PI-02); text pastes as always.
      onPaste={(event) => {
        const file = imageFile(event.clipboardData?.files)
        if (!file) return
        event.preventDefault()
        setValue('type', 'IMAGE')
        takeImage.current?.(file)
      }}
      onDragOver={(event) => {
        if ([...event.dataTransfer.types].includes('Files')) event.preventDefault()
      }}
      onDrop={(event) => {
        const file = imageFile(event.dataTransfer.files)
        if (!file) return
        event.preventDefault()
        setValue('type', 'IMAGE')
        takeImage.current?.(file)
      }}
      className="flex flex-col"
    >
      {/* Always there, so what arrives in it is announced; only the words, not the buttons. */}
      <p role="status" className="sr-only">
        {offered &&
          t('draft.notice', { when: format.relativeTime(new Date(offered.savedAt), now) })}
      </p>
      {offered && (
        // An unpublished draft from before (SU-12): offered, never applied unasked.
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-surface px-3 py-2.5 type-small">
          <span aria-hidden className="min-w-0 flex-1">
            {t('draft.notice', { when: format.relativeTime(new Date(offered.savedAt), now) })}
          </span>
          <span className="flex gap-1.5">
            <button
              type="button"
              onClick={recover}
              className={cn(
                PILL,
                'h-9 bg-primary text-primary-foreground hover:bg-primary/85 md:h-8',
              )}
            >
              {t('draft.recover')}
            </button>
            <button
              type="button"
              onClick={discardStored}
              className={cn(
                PILL,
                'h-9 text-muted-foreground hover:bg-muted hover:text-foreground md:h-8',
              )}
            >
              {t('draft.discard')}
            </button>
          </span>
        </div>
      )}
      <Tabs
        value={current}
        onValueChange={(next) => {
          if (next === 'TEXT' || next === 'LINK' || next === 'IMAGE') setValue('type', next)
        }}
        className="flex flex-1 flex-col gap-0"
      >
        {/* The parts arrive one after the other, quickly (specs/home-motion: stagger). */}
        <div className="flex stagger flex-col gap-3">
          <Field
            data-invalid={invalid('communityId') || undefined}
            // In the box, as tall as the avatar beside it (43px): the title starts below both.
            className="gap-1"
          >
            <FieldLabel htmlFor={`${ids}-community`} className="sr-only">
              {t('community.label')}
            </FieldLabel>
            <Controller
              control={control}
              name="communityId"
              render={({ field }) => (
                // Where the post goes, and beside it what else it is about (specs/related-tags).
                <div className="flex flex-wrap items-center gap-1.5">
                  <CommunityPicker
                    id={`${ids}-community`}
                    value={chosen}
                    onChange={(next) => {
                      setChosen(next)
                      field.onChange(next?.id ?? '')
                      // The new main one is no longer a related one (RT-05).
                      if (next && related.includes(next.handle)) {
                        setValue(
                          'related',
                          related.filter((handle) => handle !== next.handle),
                        )
                      }
                      onCommunityChange?.(next)
                    }}
                    invalid={invalid('communityId')}
                    describedBy={`${ids}-community-error`}
                  />
                  {chosen && (
                    <RelatedPicker
                      main={chosen.handle}
                      value={related}
                      onChange={(handles) => setValue('related', handles)}
                    />
                  )}
                </div>
              )}
            />
            <FieldError
              id={`${ids}-community-error`}
              errors={fieldError('communityId')}
              className="type-meta"
            />
          </Field>

          <Field data-invalid={invalid('title') || undefined} className="gap-1">
            <FieldLabel htmlFor={`${ids}-title`} className="sr-only">
              {t('fields.title')}
            </FieldLabel>
            <Input
              id={`${ids}-title`}
              placeholder={t('fields.titlePlaceholder')}
              {...register('title')}
              onFocus={(event) => (emojiTarget.current = event.currentTarget)}
              aria-invalid={invalid('title') || undefined}
              aria-describedby={`${ids}-title-count ${ids}-title-error`}
              className={cn(BARE, 'text-[1.0625rem] leading-[1.3] font-bold md:text-[1.0625rem]')}
            />
            <FieldError
              id={`${ids}-title-error`}
              errors={fieldError('title')}
              className="type-meta"
            />
          </Field>

          {/* Title and body stay outside the panels, mounted across formats: a field remounted
              on a switch could drop what was just typed. Link only adds its URL. */}
          <TabsContent value="TEXT" />
          <TabsContent value="LINK">
            <Field data-invalid={invalid('url') || undefined} className="gap-1">
              <FieldLabel htmlFor={`${ids}-url`} className="sr-only">
                {t('fields.url')}
              </FieldLabel>
              <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
                <LinkIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <Input
                  id={`${ids}-url`}
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder={t('fields.urlPlaceholder')}
                  {...register('url')}
                  aria-invalid={invalid('url') || undefined}
                  aria-describedby={`${ids}-url-error`}
                  className={BARE}
                />
              </div>
              <FieldError
                id={`${ids}-url-error`}
                errors={fieldError('url')}
                className="type-meta"
              />
            </Field>
          </TabsContent>

          {/* Always mounted: a paste or a drop hands it the file while it opens, and what was
              uploaded stays across formats. */}
          <TabsContent value="IMAGE" keepMounted>
            <Field data-invalid={invalid('imageUrl') || undefined} className="gap-1">
              {/* No label: the button is named by what it says, "Choose image" (WCAG 2.5.3). */}
              <ImageField
                id={`${ids}-image`}
                takeRef={takeImage}
                onChange={(next) => {
                  // Another image (or none): the description said what the last one showed.
                  if (next !== getValues('imageUrl')) setValue('imageAlt', '')
                  setValue('imageUrl', next, { shouldValidate: formState.isSubmitted })
                }}
                onBusy={setUploading}
                onUnauthenticated={() => openGate('post')}
                invalid={invalid('imageUrl')}
                describedBy={`${ids}-image-error`}
              />
              <FieldError
                id={`${ids}-image-error`}
                errors={fieldError('imageUrl')}
                className="type-meta"
              />
            </Field>
            {/* Once there is an image: what it shows, for who cannot see it (BA-04). */}
            {imageUrl && (
              <Field data-invalid={invalid('imageAlt') || undefined} className="mt-2 gap-1">
                <FieldLabel htmlFor={`${ids}-image-alt`} className="type-meta font-semibold">
                  {t('fields.imageAlt')}
                </FieldLabel>
                <Input
                  id={`${ids}-image-alt`}
                  maxLength={IMAGE_ALT_MAX}
                  placeholder={t('fields.imageAltPlaceholder')}
                  {...register('imageAlt')}
                  aria-invalid={invalid('imageAlt') || undefined}
                  aria-describedby={`${ids}-image-alt-error`}
                  className="h-11 rounded-lg bg-surface px-3 text-base md:h-10 md:text-sm"
                />
                <FieldError
                  id={`${ids}-image-alt-error`}
                  errors={fieldError('imageAlt')}
                  className="type-meta"
                />
              </Field>
            )}
          </TabsContent>

          <Field data-invalid={invalid('body') || undefined} className="gap-1">
            <FieldLabel htmlFor={`${ids}-body`} className="sr-only">
              {t('fields.body')}
            </FieldLabel>
            {/* $ # @ suggest assets, communities and people (specs/mention-autocomplete). */}
            <div className="relative">
              <Textarea
                id={`${ids}-body`}
                placeholder={t('fields.bodyPlaceholder')}
                {...bodyField}
                ref={(element) => {
                  bodyField.ref(element)
                  bodyRef.current = element
                  emojiTarget.current ??= element
                }}
                onFocus={(event) => (emojiTarget.current = event.currentTarget)}
                aria-invalid={invalid('body') || undefined}
                aria-describedby={`${ids}-body-help ${ids}-body-error`}
                className={cn(BARE, 'min-h-24 resize-none leading-[1.55]')}
              />
              <MentionField fieldRef={bodyRef} search={searchMentions} />
            </div>
            <FieldError
              id={`${ids}-body-error`}
              errors={fieldError('body')}
              className="type-meta"
            />
            <div className="flex justify-between gap-2 type-meta text-muted-foreground">
              <span id={`${ids}-body-help`}>{t('fields.bodyHelp')}</span>
              <span id={`${ids}-title-count`} className="font-bold tabular-nums">
                {title.length >= COUNTER_FROM &&
                  t('fields.counter', { count: title.length, max: TITLE_MAX })}
              </span>
            </div>
          </Field>
        </div>

        {serverError && (
          <p role="alert" className="mt-3 type-small text-destructive">
            {t(`errors.${serverError}`)}
          </p>
        )}

        {/* Formats on the left, actions on the right. */}
        {/* Tighter in phones: formats, emoji, Cancel and Publish fit 360px in every language. */}
        <div className="mt-3 flex items-center gap-1 border-t pt-3 sm:gap-2">
          <TabsList aria-label={t('type.label')} className="h-auto gap-0.5 bg-transparent p-0">
            <TabsTrigger value="TEXT" className={FORMAT}>
              <AlignLeftIcon aria-hidden />
              {/* Icons only at 360px: the three names and Publish do not fit (PI-12). */}
              <span className="sr-only sm:not-sr-only">{t('type.text')}</span>
            </TabsTrigger>
            <TabsTrigger value="LINK" className={FORMAT}>
              <LinkIcon aria-hidden />
              {/* Icons only at 360px: the three names and Publish do not fit (PI-12). */}
              <span className="sr-only sm:not-sr-only">{t('type.link')}</span>
            </TabsTrigger>
            <TabsTrigger value="IMAGE" className={FORMAT}>
              <ImageIcon aria-hidden />
              {/* Icons only at 360px: the three names and Publish do not fit (PI-12). */}
              <span className="sr-only sm:not-sr-only">{t('type.image')}</span>
            </TabsTrigger>
          </TabsList>
          {/* Emojis go into the title or the body, the last one used, at its caret (EP-01). */}
          <EmojiButton fieldRef={emojiTarget} />
          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={onCancel}
              className={cn(PILL, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
            >
              {t('cancel')}
            </button>
            {/* The black pill of the main actions (JoinButton, comments): written out as there,
                not a Button variant (Button has no full pill of this size). */}
            <button
              type="submit"
              aria-disabled={blocked || undefined}
              className={cn(PILL, 'bg-primary text-primary-foreground hover:bg-primary/85')}
            >
              {formState.isSubmitting ? t('submitting') : t('submit')}
            </button>
          </div>
        </div>
      </Tabs>
    </form>
  )
}
