'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'
import { WIDGET_LIMITS as L } from '@/lib/api/contract/widgets'
import type { WidgetDraft } from '../../../lib/widget-drafts'
import { rulesWidgetSchema } from '../../../schemas/widget.schema'
import { CountedField } from '../../edit-profile-fields'
import { AddItem, focusAfterRemove, ListError, ListItem, useWidgetError } from './form-parts'

type Draft = Extract<WidgetDraft, { type: 'RULES' }>

/** A rules widget's form (CW-06, CW-10): its title and up to 15 rules, each with a description. */
export function RulesWidgetForm({
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
    z.input<typeof rulesWidgetSchema>,
    unknown,
    z.output<typeof rulesWidgetSchema>
  >({
    resolver: zodResolver(rulesWidgetSchema),
    defaultValues: { type: 'RULES', title: draft.title, rules: draft.rules },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'rules' })
  const [title = '', rules = []] = useWatch({ control: form.control, name: ['title', 'rules'] })
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
      {fields.map((item, index) => (
        <ListItem
          key={item.id}
          legend={t('rule', { number: index + 1 })}
          removeLabel={t('removeRule', { number: index + 1 })}
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
            id={`${ids}-rule-${index}`}
            label={t('ruleTitle')}
            max={L.ruleTitle}
            value={rules[index]?.title ?? ''}
            field={form.register(`rules.${index}.title`)}
            error={error(errors.rules?.[index]?.title?.message)}
          />
          <CountedField
            id={`${ids}-description-${index}`}
            label={t('ruleDescription')}
            max={L.ruleDescription}
            value={rules[index]?.description ?? ''}
            field={form.register(`rules.${index}.description`)}
            error={error(errors.rules?.[index]?.description?.message)}
            multiline
          />
        </ListItem>
      ))}
      {fields.length < L.rules && (
        <AddItem id={`${ids}-add`} onClick={() => append({ title: '', description: '' })}>
          {t('addRule')}
        </AddItem>
      )}
      <ListError message={error(errors.rules?.message ?? errors.rules?.root?.message)} />
    </form>
  )
}
