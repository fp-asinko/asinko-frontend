'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlignLeftIcon, ImageIcon, LinkIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
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
import { cn } from '@/lib/utils'
import { createPost } from '../actions/create-post.action'
import type { CommunityOption } from '../composer.types'
import {
  createPostSchema,
  TITLE_MAX,
  type CreatePostForm,
  type CreatePostInput,
} from '../schemas/create-post.schema'
import { CommunityPicker } from './community-picker'

/** A field without its own box: the composer box around them is the box, as X. */
const BARE =
  'h-auto rounded-none border-0 bg-transparent p-0 text-foreground shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent'

/** A format: the gray pill of the system when chosen, plain otherwise. */
const FORMAT =
  'h-8 flex-none gap-1.5 rounded-full border-0 px-3 type-meta font-bold text-muted-foreground hover:bg-muted data-active:bg-muted data-active:text-foreground data-active:shadow-none dark:data-active:bg-muted [&_svg]:size-3.5'

const PILL =
  'inline-flex h-11 tap items-center justify-center rounded-full px-4 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 md:h-9'

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
  'general',
] as const
type ErrorName = (typeof ERROR_NAMES)[number]

/** A translation key from the schema or the action, as one of the editor's messages. */
function errorName(key: string | undefined): ErrorName {
  const name = key?.replace(/^composer\.errors\./, '')
  return ERROR_NAMES.find((each) => each === name) ?? 'general'
}

const FIELDS = ['communityId', 'title', 'body', 'url'] as const

/**
 * The post editor (specs/post-create-detail § 3), minimal as X: where it goes (a chip), the title
 * and the body without boxes, and a footer with the formats (Text, Link, Image soon) and the
 * actions. The same form in the expanded box (`inline`, with Cancel next to Publish) and in the
 * full screen of mobile (`sheet`, whose Cancel is at the top). The schema helps while typing and
 * decides in the Server Action; the server's answer shows next to each field, and the text is
 * never lost.
 */
export function PostEditor({
  variant,
  type,
  community,
  draftRef,
  onCancel,
  onPublished,
}: {
  variant: 'inline' | 'sheet'
  type: 'TEXT' | 'LINK'
  community: CommunityOption | null
  /**
   * Filled with a check of whether something is written, read when closing (PC-05). Asked at that
   * moment from the form itself: a state passed up in an effect could arrive after an Esc.
   */
  draftRef: RefObject<(() => boolean) | null>
  /** Cancel: the parent asks before discarding (and handles Esc). */
  onCancel: () => void
  onPublished: (path: string) => void
}) {
  const t = useTranslations('composer')
  const { openGate } = useAuthGate()
  const ids = useId()
  const [chosen, setChosen] = useState<CommunityOption | null>(community)
  const [serverError, setServerError] = useState<ErrorName | null>(null)
  const form = useForm<CreatePostForm, unknown, CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { communityId: community?.id ?? '', type, title: '', body: '', url: '' },
    // As X: no errors while writing; Publish says what is missing, then they follow the typing.
    // (On blur, an error appearing above would also move the format row under the pointer.)
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const { register, control, handleSubmit, setValue, setError, getValues, formState } = form
  const [title = '', body = '', url = '', current = type] = useWatch({
    control,
    name: ['title', 'body', 'url', 'type'],
  })

  useEffect(() => {
    draftRef.current = () => {
      const values = getValues()
      return Boolean(values.title.trim() || values.body.trim() || values.url?.trim())
    }
    return () => {
      draftRef.current = null
    }
  }, [draftRef, getValues])
  // Publish waits until nothing is missing, and while sending (PC-10, no double posts).
  const complete = Boolean(
    chosen && title.trim() && body.trim() && (current !== 'LINK' || url.trim()),
  )
  const blocked = !complete || formState.isSubmitting

  async function publish(values: CreatePostInput) {
    setServerError(null)
    const result = await createPost(values)
    if (result.ok) {
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
  // In the box, the editor starts next to the avatar (40px + 12px). Only the community chip stays
  // there; the fields and the footer reach back under it, to the column's edge, as the posts.
  const wide = variant === 'inline' ? '-ml-13' : undefined

  return (
    <form
      noValidate
      onSubmit={(event) => {
        // aria-disabled, not disabled: the focused button keeps the focus (WCAG 2.4.3). Pressed
        // with something missing, the schema fails and every field says what it needs (WCAG
        // 3.3.1); from then on the errors follow the typing. Never twice while sending.
        if (formState.isSubmitting) return event.preventDefault()
        void handleSubmit(publish)(event)
      }}
      className={cn('flex flex-col', variant === 'sheet' && 'min-h-full px-4')}
    >
      <Tabs
        value={current}
        onValueChange={(next) => {
          if (next === 'TEXT' || next === 'LINK') setValue('type', next)
        }}
        className="flex flex-1 flex-col gap-0"
      >
        {/* The parts arrive one after the other, quickly (specs/home-motion: stagger). */}
        <div className="flex stagger flex-col gap-3">
          <Field
            data-invalid={invalid('communityId') || undefined}
            // In the box, as tall as the avatar beside it (43px): the title starts below both.
            className={cn('gap-1', variant === 'inline' && 'min-h-10.75 justify-center')}
          >
            <FieldLabel htmlFor={`${ids}-community`} className="sr-only">
              {t('community.label')}
            </FieldLabel>
            <Controller
              control={control}
              name="communityId"
              render={({ field }) => (
                <CommunityPicker
                  id={`${ids}-community`}
                  value={chosen}
                  onChange={(next) => {
                    setChosen(next)
                    field.onChange(next?.id ?? '')
                  }}
                  invalid={invalid('communityId')}
                  describedBy={`${ids}-community-error`}
                  firstFocus={!chosen}
                />
              )}
            />
            <FieldError
              id={`${ids}-community-error`}
              errors={fieldError('communityId')}
              className="type-meta"
            />
          </Field>

          <Field data-invalid={invalid('title') || undefined} className={cn('gap-1', wide)}>
            <FieldLabel htmlFor={`${ids}-title`} className="sr-only">
              {t('fields.title')}
            </FieldLabel>
            <Input
              id={`${ids}-title`}
              placeholder={t('fields.titlePlaceholder')}
              {...register('title')}
              aria-invalid={invalid('title') || undefined}
              aria-describedby={`${ids}-title-count ${ids}-title-error`}
              data-autofocus={chosen ? true : undefined}
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
          <TabsContent value="LINK" className={wide}>
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

          <Field data-invalid={invalid('body') || undefined} className={cn('gap-1', wide)}>
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
                }}
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
          <p role="alert" className={cn('mt-3 type-small text-destructive', wide)}>
            {t(`errors.${serverError}`)}
          </p>
        )}

        {/* Formats on the left, actions on the right. In the full screen it stays in reach,
            also with the phone's keyboard open (PC-18). */}
        <div
          className={cn(
            'mt-3 flex items-center gap-2 border-t pt-3',
            wide,
            variant === 'sheet' &&
              'sticky bottom-0 -mx-4 mt-auto bg-popover px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
          )}
        >
          <TabsList aria-label={t('type.label')} className="h-auto gap-0.5 bg-transparent p-0">
            <TabsTrigger value="TEXT" className={FORMAT}>
              <AlignLeftIcon aria-hidden />
              {t('type.text')}
            </TabsTrigger>
            <TabsTrigger value="LINK" className={FORMAT}>
              <LinkIcon aria-hidden />
              {t('type.link')}
            </TabsTrigger>
            {/* Image waits for uploads (P-013): visible, not selectable. */}
            <TabsTrigger value="IMAGE" disabled className={FORMAT}>
              <ImageIcon aria-hidden />
              <span className="sr-only">
                {t('type.image')} {t('type.soon')}
              </span>
            </TabsTrigger>
          </TabsList>
          {/* Emojis go into the body, at its caret (specs/emoji-picker EP-01). */}
          <EmojiButton fieldRef={bodyRef} />
          <div className="ml-auto flex items-center gap-1.5">
            {variant === 'inline' && (
              <button
                type="button"
                onClick={onCancel}
                className={cn(PILL, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
              >
                {t('cancel')}
              </button>
            )}
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
