'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { WIDGET_LIMITS as L } from '@/lib/api/contract/widgets'
import { cn } from '@/lib/utils'
import type { WidgetDraft } from '../../../lib/widget-drafts'
import { buttonsWidgetSchema } from '../../../schemas/widget.schema'
import { CountedField, FIELD } from '../../edit-profile-fields'
import { AddItem, focusAfterRemove, ListError, ListItem, useWidgetError } from './form-parts'

type Draft = Extract<WidgetDraft, { type: 'BUTTONS' }>

/**
 * A buttons widget's form (CW-06, CW-07, CW-10): its title and up to 10 buttons, each with its
 * text and a link, https:// or a page of Asinko.
 */
export function ButtonsWidgetForm({
  draft,
  formId,
  onDone,
}: {
  draft: Draft
  formId: string
  onDone: (draft: Draft) => void
}) {
  const t = useTranslations('communities.widgets.editor.fields')
  const error = useWidgetError()
  const ids = useId()
  const form = useForm<
    z.input<typeof buttonsWidgetSchema>,
    unknown,
    z.output<typeof buttonsWidgetSchema>
  >({
    resolver: zodResolver(buttonsWidgetSchema),
    defaultValues: { type: 'BUTTONS', title: draft.title, buttons: draft.buttons },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'buttons' })
  const [title = '', buttons = []] = useWatch({
    control: form.control,
    name: ['title', 'buttons'],
  })
  const { errors } = form.formState

  return (
    <form
      id={formId}
      noValidate
      onSubmit={form.handleSubmit((values) => onDone({ ...draft, ...values }))}
      className="flex flex-col gap-4"
    >
      <CountedField
        id={`${ids}-title`}
        label={t('title')}
        max={L.title}
        value={title}
        field={form.register('title')}
        error={error(errors.title?.message)}
      />
      {fields.map((item, index) => {
        const urlId = `${ids}-url-${index}`
        const urlError = error(errors.buttons?.[index]?.url?.message)
        return (
          <ListItem
            key={item.id}
            legend={t('button', { number: index + 1 })}
            removeLabel={t('removeButton', { number: index + 1 })}
            onRemove={
              fields.length > 1
                ? () => {
                    remove(index)
                    focusAfterRemove(document.getElementById(formId), index, `${ids}-add`)
                  }
                : undefined
            }
          >
            <CountedField
              id={`${ids}-label-${index}`}
              label={t('label')}
              max={L.buttonLabel}
              value={buttons[index]?.label ?? ''}
              field={form.register(`buttons.${index}.label`)}
              error={error(errors.buttons?.[index]?.label?.message)}
            />
            <Field data-invalid={urlError ? true : undefined} className="gap-1.5">
              <FieldLabel htmlFor={urlId} className="type-action">
                {t('url')}
              </FieldLabel>
              <Input
                id={urlId}
                inputMode="url"
                autoComplete="url"
                placeholder={t('urlPlaceholder')}
                aria-invalid={urlError ? true : undefined}
                aria-describedby={urlError ? `${urlId}-error` : undefined}
                {...form.register(`buttons.${index}.url`)}
                className={cn('h-10 text-base', FIELD)}
              />
              {urlError && (
                <FieldError id={`${urlId}-error`} className="type-meta">
                  {urlError}
                </FieldError>
              )}
            </Field>
          </ListItem>
        )
      })}
      {fields.length < L.buttons && (
        <AddItem id={`${ids}-add`} onClick={() => append({ label: '', url: '' })}>
          {t('addButton')}
        </AddItem>
      )}
      <ListError message={error(errors.buttons?.message ?? errors.buttons?.root?.message)} />
    </form>
  )
}
