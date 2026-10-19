'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useId, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { WIDGET_LIMITS as L } from '@/lib/api/contract/widgets'
import { IMAGE_TYPES, prepareImage } from '@/lib/prepare-image'
import { cn } from '@/lib/utils'
import { uploadWidgetImage } from '../../../actions/upload-widget-image.action'
import type { WidgetDraft } from '../../../lib/widget-drafts'
import { imagesWidgetSchema } from '../../../schemas/widget.schema'
import { CountedField, FIELD } from '../../edit-profile-fields'
import { AddItem, focusAfterRemove, ListError, ListItem, useWidgetError } from './form-parts'

type Draft = Extract<WidgetDraft, { type: 'IMAGES' }>

const PREPARE_ERRORS = {
  type: 'communities.widgets.errors.imageType',
  unreadable: 'communities.widgets.errors.imageType',
  tooLarge: 'communities.widgets.errors.imageTooLarge',
} as const

/**
 * An images widget's form (CW-06, CW-11): an optional title and up to 10 images, each chosen from
 * the device (JPEG, PNG, WebP; never SVG), prepared as a post's (WebP, no metadata) and uploaded at
 * once; then its description, what it shows, and an optional link. While one uploads, Done and
 * Save wait (`onBusy`).
 */
export function ImagesWidgetForm({
  draft,
  formId,
  communityId,
  onDone,
  onBusy,
}: {
  draft: Draft
  formId: string
  communityId: string
  onDone: (draft: Draft) => void
  onBusy: (busy: boolean) => void
}) {
  const t = useTranslations('communities.widgets.editor.fields')
  const error = useWidgetError()
  const ids = useId()
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | undefined>()
  const form = useForm<
    z.input<typeof imagesWidgetSchema>,
    unknown,
    z.output<typeof imagesWidgetSchema>
  >({
    resolver: zodResolver(imagesWidgetSchema),
    defaultValues: { type: 'IMAGES', title: draft.title, images: draft.images },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'images' })
  const [title = '', images = []] = useWatch({ control: form.control, name: ['title', 'images'] })
  const { errors } = form.formState

  async function take(file: File) {
    setUploadError(undefined)
    setUploading(true)
    onBusy(true)
    const prepared = await prepareImage(file)
    if (!prepared.ok) {
      setUploadError(error(PREPARE_ERRORS[prepared.error]))
    } else {
      const data = new FormData()
      data.set('file', prepared.blob, 'image')
      data.set('communityId', communityId)
      const result = await uploadWidgetImage(data)
      if (result.ok) append({ imageUrl: result.data.imageUrl, alt: '', linkUrl: '' })
      else setUploadError(error(result.error) ?? error('communities.widgets.errors.imageUpload'))
    }
    setUploading(false)
    onBusy(false)
  }

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        if (uploading) return event.preventDefault()
        void form.handleSubmit((values) => onDone({ ...draft, ...values }))(event)
      }}
      className="flex flex-col gap-4"
    >
      <CountedField
        id={`${ids}-title`}
        label={t('titleOptional')}
        max={L.title}
        value={title}
        field={form.register('title')}
        error={error(errors.title?.message)}
      />
      {fields.map((item, index) => {
        const linkId = `${ids}-link-${index}`
        const linkError = error(errors.images?.[index]?.linkUrl?.message)
        return (
          <ListItem
            key={item.id}
            legend={t('image', { number: index + 1 })}
            removeLabel={t('removeImage', { number: index + 1 })}
            onRemove={() => {
              remove(index)
              focusAfterRemove(document.getElementById(formId), index, `${ids}-add`)
            }}
          >
            <span className="relative block aspect-4/3 overflow-hidden rounded-lg border bg-surface">
              <Image
                src={item.imageUrl}
                alt=""
                fill
                sizes="(min-width: 640px) 480px, 100vw"
                className="object-contain"
              />
            </span>
            <CountedField
              id={`${ids}-alt-${index}`}
              label={t('alt')}
              placeholder={t('altHelp')}
              max={L.imageAlt}
              value={images[index]?.alt ?? ''}
              field={form.register(`images.${index}.alt`)}
              error={error(errors.images?.[index]?.alt?.message)}
            />
            <Field data-invalid={linkError ? true : undefined} className="gap-1.5">
              <FieldLabel htmlFor={linkId} className="type-action">
                {t('imageLink')}
              </FieldLabel>
              <Input
                id={linkId}
                inputMode="url"
                placeholder={t('urlPlaceholder')}
                aria-invalid={linkError ? true : undefined}
                aria-describedby={linkError ? `${linkId}-error` : undefined}
                {...form.register(`images.${index}.linkUrl`)}
                className={cn('h-10 text-base', FIELD)}
              />
              {linkError && (
                <FieldError id={`${linkId}-error`} className="type-meta">
                  {linkError}
                </FieldError>
              )}
            </Field>
          </ListItem>
        )
      })}
      {/* Hidden behind "Add image": the button is what the person uses. */}
      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) void take(file)
        }}
      />
      <p role="status" className="sr-only">
        {uploading ? t('uploading') : ''}
      </p>
      {/* It stays while uploading, saying so: the focus stays on it (WCAG 2.4.3). */}
      {(uploading || fields.length < L.images) && (
        <AddItem id={`${ids}-add`} pending={uploading} onClick={() => input.current?.click()}>
          {uploading ? (
            <>
              <LoaderCircleIcon
                aria-hidden
                className="size-4 animate-spin motion-reduce:animate-none"
              />
              {t('uploading')}
            </>
          ) : (
            t('addImage')
          )}
        </AddItem>
      )}
      <ListError message={uploadError} />
      <ListError message={error(errors.images?.message ?? errors.images?.root?.message)} />
    </form>
  )
}
