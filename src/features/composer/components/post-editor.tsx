'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useState, type RefObject } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { postPath } from '@/lib/posts/paths'
import { createPost } from '../actions/create-post.action'
import type { CommunityOption } from '../composer.types'
import {
  createPostSchema,
  TITLE_MAX,
  type CreatePostForm,
  type CreatePostInput,
} from '../schemas/create-post.schema'
import { CommunityPicker } from './community-picker'

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
 * The post editor (specs/post-create-detail § 3): community, Text or Link, title, link and body.
 * The schema helps while typing and decides in the Server Action; the server's answer shows next
 * to each field, and the text is never lost. Published, it hands the post's page to its parent.
 */
export function PostEditor({
  type,
  community,
  draftRef,
  onPublished,
}: {
  type: 'TEXT' | 'LINK'
  community: CommunityOption | null
  /**
   * Filled with a check of whether something is written, read when closing (PC-05). Asked at that
   * moment from the form itself: a state passed up in an effect could arrive after an Esc.
   */
  draftRef: RefObject<(() => boolean) | null>
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
    mode: 'onTouched',
  })
  const { register, control, handleSubmit, setValue, setError, getValues, trigger, formState } =
    form
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

  const titleAndBody = (
    <>
      <Field data-invalid={invalid('title') || undefined}>
        <FieldLabel htmlFor={`${ids}-title`}>{t('fields.title')}</FieldLabel>
        <Input
          id={`${ids}-title`}
          {...register('title')}
          aria-invalid={invalid('title') || undefined}
          aria-describedby={`${ids}-title-count ${ids}-title-error`}
          data-autofocus={chosen ? true : undefined}
          className="h-11 text-foreground"
        />
        <div className="flex justify-between gap-2">
          <FieldError id={`${ids}-title-error`} errors={fieldError('title')} />
          <span
            id={`${ids}-title-count`}
            className="ml-auto type-meta text-muted-foreground tabular-nums"
          >
            {title.length >= COUNTER_FROM &&
              t('fields.counter', { count: title.length, max: TITLE_MAX })}
          </span>
        </div>
      </Field>
      <Field data-invalid={invalid('body') || undefined}>
        <FieldLabel htmlFor={`${ids}-body`}>{t('fields.body')}</FieldLabel>
        <Textarea
          id={`${ids}-body`}
          {...register('body')}
          aria-invalid={invalid('body') || undefined}
          aria-describedby={`${ids}-body-help ${ids}-body-error`}
          className="min-h-36 text-foreground"
        />
        <FieldDescription id={`${ids}-body-help`}>{t('fields.bodyHelp')}</FieldDescription>
        <FieldError id={`${ids}-body-error`} errors={fieldError('body')} />
      </Field>
    </>
  )

  return (
    <form
      noValidate
      onSubmit={(event) => {
        // aria-disabled, not disabled: the focused button keeps the focus (WCAG 2.4.3). Pressed
        // with something missing, every field says what it needs (WCAG 3.3.1).
        if (!blocked) return void handleSubmit(publish)(event)
        event.preventDefault()
        if (!formState.isSubmitting) void trigger()
      }}
      className="flex min-h-full flex-col gap-5 px-4 pt-4 md:px-6"
    >
      <Field data-invalid={invalid('communityId') || undefined}>
        <FieldLabel htmlFor={`${ids}-community`}>{t('community.label')}</FieldLabel>
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
        <FieldError id={`${ids}-community-error`} errors={fieldError('communityId')} />
      </Field>

      <Tabs
        value={current}
        onValueChange={(next) => {
          if (next === 'TEXT' || next === 'LINK') setValue('type', next)
        }}
        className="gap-4"
      >
        <TabsList aria-label={t('type.label')} className="h-10 w-full">
          <TabsTrigger value="TEXT" className="text-muted-foreground data-active:shadow-none">
            {t('type.text')}
          </TabsTrigger>
          <TabsTrigger value="LINK" className="text-muted-foreground data-active:shadow-none">
            {t('type.link')}
          </TabsTrigger>
          {/* Image waits for uploads (P-013): visible, not selectable. */}
          <TabsTrigger
            value="IMAGE"
            disabled
            className="text-muted-foreground data-active:shadow-none"
          >
            {t('type.image')}
            <span className="rounded-full bg-background px-1.5 type-meta">{t('type.soon')}</span>
          </TabsTrigger>
        </TabsList>
        {/* Text adds nothing; Link adds its URL. Title and body stay outside the panels, mounted
            across tabs: a field remounted on a tab switch could drop what was just typed. */}
        <TabsContent value="TEXT" />
        <TabsContent value="LINK" className="flex flex-col gap-5">
          <Field data-invalid={invalid('url') || undefined}>
            <FieldLabel htmlFor={`${ids}-url`}>{t('fields.url')}</FieldLabel>
            <Input
              id={`${ids}-url`}
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder={t('fields.urlPlaceholder')}
              {...register('url')}
              aria-invalid={invalid('url') || undefined}
              aria-describedby={`${ids}-url-error`}
              className="h-11 text-foreground"
            />
            <FieldError id={`${ids}-url-error`} errors={fieldError('url')} />
          </Field>
        </TabsContent>
      </Tabs>
      {titleAndBody}

      {serverError && (
        <p role="alert" className="type-small text-destructive">
          {t(`errors.${serverError}`)}
        </p>
      )}

      {/* Always in reach, also with the phone's keyboard open (PC-18). */}
      <div className="sticky bottom-0 -mx-4 mt-auto flex justify-end border-t bg-popover px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:-mx-6 md:px-6">
        {/* The black pill of the main actions (JoinButton, comments), 44px in mobile: written
            out as there, not a Button variant (Button has no full pill of that size). */}
        <button
          type="submit"
          aria-disabled={blocked || undefined}
          className="inline-flex h-11 min-w-28 tap items-center justify-center rounded-full bg-primary px-5 type-action text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-60 aria-disabled:active:scale-100 md:h-10"
        >
          {formState.isSubmitting ? t('submitting') : t('submit')}
        </button>
      </div>
    </form>
  )
}
