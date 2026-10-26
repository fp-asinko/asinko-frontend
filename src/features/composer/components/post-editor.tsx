'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlignLeftIcon, ImageIcon, LinkIcon, QuoteIcon } from 'lucide-react'
import { useFormatter, useLocale, useNow, useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { EmojiButton } from '@/components/molecules/emoji-picker'
import { applyFormat, FormatToolbar, formatShortcut } from '@/components/molecules/format-toolbar'
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
import type { CommunityOption, SavedDraft } from '../composer.types'
import {
  createPostSchema,
  IMAGE_ALT_MAX,
  THOUGHT_MAX,
  TITLE_MAX,
  type CreatePostForm,
  type CreatePostInput,
} from '../schemas/create-post.schema'
import {
  clearDraft,
  discardDraft,
  forgetOpenedDraft,
  hasText,
  useStoredDraft,
  writeDraft,
} from '../hooks/use-post-draft'
import { useSavedDraft } from '../hooks/use-saved-draft'
import { CommunityPicker } from './community-picker'
import { DraftsButton } from './drafts-button'
import { DRAFT_LIMIT } from './drafts-dialog'
import { ImageField, type TakeImage } from './image-field'
import { BodyTabs, type PreviewAction } from './body-tabs'
import { RelatedPicker } from './related-picker'
import { TagPicker } from './tag-picker'

/** A field without its own box: the composer box around them is the box, as X. */
const BARE =
  'h-auto rounded-none border-0 bg-transparent p-0 text-foreground shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent'

/**
 * A format, as Reddit's tabs: its name, a line under the chosen one (SF-02), on the row's border
 * (shadcn's sits 5px below it). Narrower in phones: the four fit 360px in every language.
 */
const FORMAT =
  'h-10 flex-none gap-1.5 rounded-none border-0 px-2 type-action text-muted-foreground hover:text-foreground data-active:text-foreground group-data-horizontal/tabs:after:-bottom-px sm:px-3 [&_svg]:size-4'

/** A field in its own box, as Reddit's title (SF-03, SF-05): the border darkens while writing. */
const FIELD_BOX =
  'rounded-2xl border border-input bg-background px-4 text-base shadow-none transition-colors duration-150 focus-visible:border-foreground/60 focus-visible:ring-0 aria-invalid:border-destructive aria-invalid:ring-0 md:text-base dark:bg-transparent dark:aria-invalid:ring-0'

const PILL =
  'inline-flex h-11 tap items-center justify-center rounded-full px-3 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 sm:px-4 md:h-9'

const ERROR_NAMES = [
  'community',
  'titleRequired',
  'titleTooLong',
  'bodyRequired',
  'thoughtRequired',
  'thoughtTooLong',
  'url',
  'ownProfileOnly',
  'invalidCommunity',
  'invalidTag',
  'invalidRelated',
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

const DRAFT_ERRORS = ['limit', 'gone', 'invalid', 'general'] as const

/** A draft's error key (composer.drafts.errors.*), or the general one. */
function draftError(key: string) {
  const name = key.replace(/^composer.drafts.errors./, '')
  return DRAFT_ERRORS.find((each) => each === name) ?? 'general'
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
  related: initialRelated = [],
  onRelatedChange,
  preview,
}: {
  /** The feed's card for the post being written (specs/submit-tools ST-01): from the page. */
  preview?: PreviewAction
  type: 'TEXT' | 'LINK' | 'IMAGE' | 'THOUGHT'
  community: CommunityOption | null
  /** The related ones on arrival, as handles (the page's URL, specs/related-aside RA-04). */
  related?: string[]
  /** The related ones changed: the page follows them in its URL. */
  onRelatedChange?: (handles: string[]) => void
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
  const locale = useLocale()
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
  // The account's draft open in the form (specs/drafts-tags DT-01, DT-03).
  const saved = useSavedDraft()
  // An opened draft's image, already uploaded: the image field starts again with it.
  const [draftImage, setDraftImage] = useState<{ key: string; url: string | null }>({
    key: 'none',
    url: null,
  })
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
      related: initialRelated,
      tag: '',
    },
    // As X: no errors while writing; Publish says what is missing, then they follow the typing.
    // (On blur, an error appearing above would also move the format row under the pointer.)
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const { register, control, handleSubmit, setValue, setError, getValues, formState } = form
  const [
    title = '',
    body = '',
    url = '',
    current = type,
    imageUrl = '',
    related = [],
    tag = '',
    communityId = '',
    imageAlt = '',
  ] = useWatch({
    control,
    name: ['title', 'body', 'url', 'type', 'imageUrl', 'related', 'tag', 'communityId', 'imageAlt'],
  })
  // A thought: only its text, no title (specs/thoughts TH-03).
  const thought = current === 'THOUGHT'
  // What a draft of the account keeps (DT-01): "Saved" holds while the form still says it.
  const snapshot = JSON.stringify([
    communityId,
    current,
    title,
    body,
    url,
    imageUrl,
    imageAlt,
    tag,
    related,
  ])
  const savedNow = saved.savedAs === snapshot

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
        tag,
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
  }, [storageKey, offered, chosen, related, current, title, body, url, tag])
  useEffect(() => {
    if (!storageKey) return
    return () => forgetOpenedDraft(storageKey)
  }, [storageKey])

  // On arrival the focus goes where the person starts (SU-09): the title, or the community when
  // none is chosen yet. Once: the page is opened, not re-rendered.
  useEffect(() => {
    // A thought starts at its text: it has no title (TH-03).
    const field = current === 'THOUGHT' ? 'body' : 'title'
    document.getElementById(chosen ? `${ids}-${field}` : `${ids}-community`)?.focus()
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
      tag: offered.tag,
    })
    setChosen(offered.community)
    onCommunityChange?.(offered.community)
    onRelatedChange?.(offered.related)
    setAnswered(true)
    focusTitle()
  }

  // A draft of the account takes the form's place (DT-03), its related ones too (BA-05).
  function openSaved(draft: SavedDraft) {
    form.reset({
      communityId: draft.community?.id ?? '',
      type: draft.type,
      title: draft.title,
      body: draft.body,
      url: draft.url,
      imageUrl: draft.imageUrl ?? '',
      imageAlt: draft.imageAlt,
      related: draft.related,
      tag: draft.community?.tags?.includes(draft.tag) ? draft.tag : '',
    })
    setChosen(draft.community)
    setDraftImage({ key: draft.id, url: draft.imageUrl })
    setServerError(null)
    saved.open(draft.id)
    onCommunityChange?.(draft.community)
    onRelatedChange?.(draft.related)
    setAnswered(true)
    focusTitle()
  }

  function discardStored() {
    if (storageKey) clearDraft(storageKey)
    setAnswered(true)
    focusTitle()
  }
  // Publish waits until nothing is missing, and while sending (PC-10, no double posts).
  // A thought needs its text; a post, its title, and its body is optional (specs/thoughts).
  const complete = Boolean(
    chosen &&
    (thought ? body.trim() : title.trim()) &&
    (current !== 'LINK' || url.trim()) &&
    (current !== 'IMAGE' || imageUrl),
  )
  const blocked = !complete || uploading || formState.isSubmitting
  // A draft needs something written (DT-01), and waits for an image going up.
  const unsaveable =
    !(title.trim() || body.trim() || url.trim() || imageUrl) || uploading || saved.saving

  async function publish(values: CreatePostInput) {
    setServerError(null)
    const result = await (saved.draftId ? createPost(values, saved.draftId) : createPost(values))
    if (result.ok) {
      // Published: gone, and no save still pending brings it back as a draft.
      if (storageKey) discardDraft(storageKey)
      // A thought's readable path comes from its text, as its page will (TH-05, TH-08).
      onPublished(postPath(result.data.id, values.type === 'THOUGHT' ? values.body : values.title))
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
            : key === 'thoughtTooLong'
              ? t('errors.thoughtTooLong', { max: THOUGHT_MAX })
              : t(`errors.${key}`),
      },
    ]
  }
  const invalid = (name: (typeof FIELDS)[number]) => Boolean(formState.errors[name])
  const bodyField = register('body')
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  // What the preview shows (ST-01): what is written now; null while the title or the body is
  // missing, so the preview says so.
  function draftForPreview() {
    const values = getValues()
    const isThought = values.type === 'THOUGHT'
    if (isThought ? !values.body.trim() : !values.title.trim()) return null
    return {
      title: values.title,
      body: values.body,
      type: values.type,
      url: values.url || undefined,
      imageUrl: values.imageUrl || undefined,
      imageAlt: values.imageAlt || undefined,
      tag: values.tag || undefined,
      community: chosen
        ? { slug: chosen.slug, handle: chosen.handle, name: chosen.name, own: chosen.own }
        : null,
      locale,
    }
  }
  // Where an emoji goes: the last field used, title or body; the body until one is focused.
  const emojiTarget = useRef<TextField | null>(null)
  // A thought: how much room is left, as the prototype's (TH-03).
  const thoughtLeft = THOUGHT_MAX - body.trim().length

  // The same field for a post's body and a thought's text: switching keeps what was typed.
  // $ # @ suggest assets, communities and people (specs/mention-autocomplete).
  const bodyInput = (
    <div className="relative">
      <Textarea
        id={`${ids}-body`}
        placeholder={thought ? t('fields.thoughtPlaceholder') : t('fields.bodyPlaceholder')}
        aria-required={thought || undefined}
        {...bodyField}
        ref={(element) => {
          bodyField.ref(element)
          bodyRef.current = element
          emojiTarget.current ??= element
        }}
        onFocus={(event) => (emojiTarget.current = event.currentTarget)}
        // Ctrl/⌘ + B, I and K format the chosen text (ST-05).
        onKeyDown={(event) => {
          const kind = formatShortcut(event)
          if (!kind) return
          event.preventDefault()
          applyFormat(event.currentTarget, kind)
        }}
        aria-invalid={invalid('body') || undefined}
        aria-describedby={`${ids}-body-help ${ids}-body-error`}
        className={cn(
          BARE,
          'resize-none text-base md:text-base',
          // A thought reads as a quote, as its card (the prototype's: 18 px, italic).
          thought
            ? 'min-h-32 text-lg leading-normal font-semibold italic md:text-lg'
            : 'min-h-36 leading-[1.55]',
        )}
      />
      <MentionField fieldRef={bodyRef} search={searchMentions} />
    </div>
  )

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
      {/* Also "Draft saved" (specs/drafts-tags DT-01): one region, so nothing is announced twice. */}
      <p role="status" className="sr-only">
        {offered
          ? t('draft.notice', { when: format.relativeTime(new Date(offered.savedAt), now) })
          : savedNow && t('drafts.saved')}
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
          if (next === 'TEXT' || next === 'LINK' || next === 'IMAGE' || next === 'THOUGHT') {
            setValue('type', next)
          }
        }}
        className="flex flex-1 flex-col gap-0"
      >
        {/* The parts arrive one after the other, quickly (specs/home-motion: stagger). */}
        <div className="flex stagger flex-col gap-4">
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
                      // A tag the new one does not have goes (specs/drafts-tags DT-08).
                      if (tag && !next?.tags?.includes(tag)) setValue('tag', '')
                      // The new main one is no longer a related one (RT-05).
                      if (next && related.includes(next.handle)) {
                        const rest = related.filter((handle) => handle !== next.handle)
                        setValue('related', rest)
                        onRelatedChange?.(rest)
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
                      onChange={(handles) => {
                        setValue('related', handles)
                        onRelatedChange?.(handles)
                      }}
                    />
                  )}
                  {/* The account's drafts, at the row's end (DT-02). */}
                  <DraftsButton
                    written={() => draftRef.current?.() ?? false}
                    onOpen={openSaved}
                    onDeleted={saved.forget}
                    openedFocus={() => document.getElementById(`${ids}-title`)}
                  />
                </div>
              )}
            />
            <FieldError
              id={`${ids}-community-error`}
              errors={fieldError('communityId')}
              className="type-meta"
            />
          </Field>

          {/* The formats on top, as Reddit's (SF-02). Icons and names: room enough here. */}
          <TabsList
            variant="line"
            aria-label={t('type.label')}
            className="h-auto w-full justify-start gap-1 border-b p-0"
          >
            {/* First, as the prototype's; Text stays the one chosen on arrival. Only its text, no
                title (specs/thoughts TH-03). */}
            <TabsTrigger value="THOUGHT" className={FORMAT}>
              <QuoteIcon aria-hidden />
              {t('type.thought')}
            </TabsTrigger>
            <TabsTrigger value="TEXT" className={FORMAT}>
              <AlignLeftIcon aria-hidden />
              {t('type.text')}
            </TabsTrigger>
            <TabsTrigger value="LINK" className={FORMAT}>
              <LinkIcon aria-hidden />
              {t('type.link')}
            </TabsTrigger>
            <TabsTrigger value="IMAGE" className={FORMAT}>
              <ImageIcon aria-hidden />
              {t('type.image')}
            </TabsTrigger>
          </TabsList>

          {/* A thought has no title: hidden, still mounted, so what was typed is back on a switch
              (the action leaves it out of a thought, TH-03). */}
          <Field data-invalid={invalid('title') || undefined} hidden={thought} className="gap-1">
            <FieldLabel htmlFor={`${ids}-title`} className="sr-only">
              {t('fields.title')}
            </FieldLabel>
            <Input
              id={`${ids}-title`}
              placeholder={t('fields.titlePlaceholder')}
              {...register('title')}
              onFocus={(event) => (emojiTarget.current = event.currentTarget)}
              aria-invalid={invalid('title') || undefined}
              aria-required
              aria-describedby={`${ids}-title-count ${ids}-title-error`}
              // Its own box, as Reddit's: where the title goes is plain at a glance (SF-03).
              className={cn(FIELD_BOX, 'h-14 font-semibold')}
            />
            <div className="flex justify-between gap-2 px-1 type-meta">
              <FieldError id={`${ids}-title-error`} errors={fieldError('title')} />
              {/* Always, as Reddit's: how much room is left (SF-03). */}
              <span
                id={`${ids}-title-count`}
                className={cn(
                  'ml-auto tabular-nums',
                  title.length > TITLE_MAX ? 'font-bold text-destructive' : 'text-muted-foreground',
                )}
              >
                {t('fields.counter', { count: title.length, max: TITLE_MAX })}
              </span>
            </div>
          </Field>

          {/* Below the title, as Reddit's flair (specs/drafts-tags DT-07). */}
          <TagPicker
            tags={chosen?.tags ?? []}
            hasCommunity={Boolean(chosen)}
            value={tag}
            onChange={(next) => setValue('tag', next)}
          />

          {/* Title and body stay outside the panels, mounted across formats: a field remounted
              on a switch could drop what was just typed. Link only adds its URL. */}
          <TabsContent value="TEXT" />
          <TabsContent value="THOUGHT" />
          <TabsContent value="LINK">
            <Field data-invalid={invalid('url') || undefined} className="gap-1">
              <FieldLabel htmlFor={`${ids}-url`} className="sr-only">
                {t('fields.url')}
              </FieldLabel>
              <div className="relative">
                <LinkIcon
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id={`${ids}-url`}
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder={t('fields.urlPlaceholder')}
                  {...register('url')}
                  aria-invalid={invalid('url') || undefined}
                  aria-describedby={`${ids}-url-error`}
                  className={cn(FIELD_BOX, 'h-12 pl-11')}
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
                key={draftImage.key}
                initialUrl={draftImage.url}
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
                  className={cn(FIELD_BOX, 'h-12')}
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
              {thought ? t('fields.thought') : t('fields.body')}
            </FieldLabel>
            {thought ? (
              // A thought, as the prototype's: its own box, a big quote mark, the text and, under
              // a line, what makes a good one and how much room is left (TH-03).
              <div
                className={cn(
                  'rounded-2xl border border-input px-5 pt-4 pb-3 transition-colors duration-150 focus-within:border-foreground/60',
                  invalid('body') && 'border-destructive',
                )}
              >
                <div className="relative pl-9">
                  {/* The card's quote mark (PostCard): typographic, light. */}
                  <span
                    aria-hidden
                    className="absolute -top-3 left-0 text-[2.5rem] leading-none font-extrabold text-faint not-italic select-none"
                  >
                    “
                  </span>
                  {bodyInput}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2.5">
                  <p id={`${ids}-body-help`} className="type-caption text-muted-foreground">
                    {t('fields.thoughtHelp')}
                  </p>
                  <span
                    className={cn(
                      'type-meta font-bold tabular-nums',
                      thoughtLeft < 0 ? 'text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {t('fields.counter', { count: thoughtLeft, max: THOUGHT_MAX })}
                  </span>
                </div>
              </div>
            ) : (
              // Write, with its format toolbar, and Preview (specs/submit-tools).
              <BodyTabs
                preview={preview}
                draft={draftForPreview}
                // The format toolbar and the emojis, inside the box on top (SF-04). Emojis go into
                // the title or the body, the last one used, at its caret (EP-01).
                toolbar={
                  <div className="flex items-center gap-0.5">
                    <FormatToolbar fieldRef={bodyRef} />
                    <EmojiButton fieldRef={emojiTarget} />
                  </div>
                }
              >
                {bodyInput}
              </BodyTabs>
            )}
            <FieldError
              id={`${ids}-body-error`}
              errors={fieldError('body')}
              className="type-meta"
            />
            {!thought && (
              <p id={`${ids}-body-help`} className="px-1 type-meta text-muted-foreground">
                {t('fields.bodyHelp')}
              </p>
            )}
          </Field>
        </div>

        {serverError && (
          <p role="alert" className="mt-3 type-small text-destructive">
            {t(`errors.${serverError}`)}
          </p>
        )}

        {/* Why a draft was not saved (DT-05). */}
        {/* Why a draft was not saved (DT-05), as the server's errors above. */}
        {saved.error && (
          <p role="alert" className="mt-3 type-small text-destructive">
            {t(`drafts.errors.${draftError(saved.error)}`, { max: DRAFT_LIMIT })}
          </p>
        )}

        {/* Only Cancel, Save draft and Publish, on the right (SF-06, DT-01). In phones it sticks over the bottom bar
            while a long post is written (specs/submit-tools ST-07), edge to edge; from md, in its
            place. */}
        <div
          data-sticky-actions
          className="sticky bottom-[calc(3.5625rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-4 flex items-center justify-end border-t bg-background px-4 py-3 md:static md:mx-0 md:border-t-0 md:px-0 md:pt-0 md:pb-0"
        >
          {/* Wraps before overflowing at 360px, whatever the language's words. */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className={cn(PILL, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              aria-disabled={unsaveable || undefined}
              onClick={() => {
                if (unsaveable) return
                // With its related ones (P-018, specs/backend-answer-1020 BA-05).
                saved.save(getValues(), snapshot)
              }}
              className={cn(PILL, 'bg-muted text-foreground hover:bg-muted-hover')}
            >
              {saved.saving
                ? t('drafts.saving')
                : savedNow
                  ? t('drafts.savedShort')
                  : t('drafts.save')}
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
