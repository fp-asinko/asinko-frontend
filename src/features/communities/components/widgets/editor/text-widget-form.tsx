'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'
import { WIDGET_LIMITS as L } from '@/lib/api/contract/widgets'
import type { WidgetDraft } from '../../../lib/widget-drafts'
import { textWidgetSchema } from '../../../schemas/widget.schema'
import { CountedField } from '../../edit-profile-fields'
import { useWidgetError } from './form-parts'

type Draft = Extract<WidgetDraft, { type: 'TEXT' }>

/** A text widget's form (specs/community-widgets CW-06, CW-10): its title and its Markdown. */
export function TextWidgetForm({
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
    z.input<typeof textWidgetSchema>,
    unknown,
    z.output<typeof textWidgetSchema>
  >({
    resolver: zodResolver(textWidgetSchema),
    defaultValues: { type: 'TEXT', title: draft.title, body: draft.body },
  })
  const [title = '', body = ''] = useWatch({ control: form.control, name: ['title', 'body'] })
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
      <CountedField
        id={`${ids}-body`}
        label={t('body')}
        placeholder={t('bodyHelp')}
        max={L.textBody}
        value={body}
        field={form.register('body')}
        error={error(errors.body?.message)}
        multiline
      />
    </form>
  )
}
