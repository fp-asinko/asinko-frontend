'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { useFieldArray, useForm, useWatch, type UseFormRegisterReturn } from 'react-hook-form'
import type { z } from 'zod'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { WIDGET_LIMITS as L } from '@/lib/api/contract/widgets'
import { cn } from '@/lib/utils'
import type { WidgetDraft } from '../../../lib/widget-drafts'
import { calendarWidgetSchema } from '../../../schemas/widget.schema'
import { CountedField, FIELD } from '../../edit-profile-fields'
import { AddItem, focusAfterRemove, ListError, ListItem, useWidgetError } from './form-parts'

type Draft = Extract<WidgetDraft, { type: 'CALENDAR' }>
type DraftEvent = Draft['events'][number]

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * An event's time as its field takes it: an all-day one, its date (the same anywhere, in UTC);
 * the rest, the local date and time of who edits (datetime-local).
 */
export function toFieldValue(iso: string, allDay: boolean): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  if (allDay) return iso.slice(0, 10)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** The field's value back to an instant (ISO 8601): an all-day date at 00:00 UTC. */
export function fromFieldValue(value: string, allDay: boolean): string {
  if (!value) return ''
  if (allDay) return `${value.slice(0, 10)}T00:00:00.000Z`
  return new Date(value).toISOString()
}

function DateField({
  id,
  label,
  allDay,
  field,
  error,
}: {
  id: string
  label: string
  allDay: boolean
  field: UseFormRegisterReturn
  error?: string
}) {
  return (
    <Field data-invalid={error ? true : undefined} className="gap-1.5">
      <FieldLabel htmlFor={id} className="type-action">
        {label}
      </FieldLabel>
      {/* The phone's own picker; type date for a whole day. */}
      <Input
        id={id}
        type={allDay ? 'date' : 'datetime-local'}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...field}
        className={cn('h-10 text-base', FIELD)}
      />
      {error && (
        <FieldError id={`${id}-error`} className="type-meta">
          {error}
        </FieldError>
      )}
    </Field>
  )
}

/**
 * A calendar widget's form (CW-06, CW-10): its title and up to 20 events, each with its name,
 * "All day", when it starts and (optional) ends, where and an optional link. Times in the zone of
 * who edits; they go as instants (ISO 8601).
 */
export function CalendarWidgetForm({
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
    z.input<typeof calendarWidgetSchema>,
    unknown,
    z.output<typeof calendarWidgetSchema>
  >({
    resolver: zodResolver(calendarWidgetSchema),
    defaultValues: {
      type: 'CALENDAR',
      title: draft.title,
      events: draft.events.map((event) => ({
        ...event,
        startsAt: toFieldValue(event.startsAt, event.allDay),
        endsAt: toFieldValue(event.endsAt, event.allDay),
      })),
    },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'events' })
  const [title = '', events = []] = useWatch({ control: form.control, name: ['title', 'events'] })
  const { errors } = form.formState
  const empty: DraftEvent = {
    title: '',
    startsAt: '',
    endsAt: '',
    allDay: false,
    location: '',
    url: '',
  }

  return (
    <form
      id={formId}
      noValidate
      onSubmit={form.handleSubmit((values) =>
        onDone({
          ...draft,
          title: values.title,
          events: values.events.map((event) => ({
            ...event,
            startsAt: fromFieldValue(event.startsAt, event.allDay),
            endsAt: fromFieldValue(event.endsAt, event.allDay),
          })),
        }),
      )}
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
        const allDay = events[index]?.allDay ?? false
        const eventErrors = errors.events?.[index]
        const linkId = `${ids}-link-${index}`
        const linkError = error(eventErrors?.url?.message)
        return (
          <ListItem
            key={item.id}
            legend={t('event', { number: index + 1 })}
            removeLabel={t('removeEvent', { number: index + 1 })}
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
              id={`${ids}-name-${index}`}
              label={t('eventTitle')}
              max={L.eventTitle}
              value={events[index]?.title ?? ''}
              field={form.register(`events.${index}.title`)}
              error={error(eventErrors?.title?.message)}
            />
            <label className="inline-flex min-h-10 w-fit cursor-pointer items-center gap-2 type-action">
              <input
                type="checkbox"
                {...form.register(`events.${index}.allDay`, {
                  // The fields change type: what they had no longer fits.
                  onChange: () => {
                    form.setValue(`events.${index}.startsAt`, '')
                    form.setValue(`events.${index}.endsAt`, '')
                  },
                })}
                className="size-4 accent-primary"
              />
              {t('allDay')}
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <DateField
                id={`${ids}-start-${index}`}
                label={t('startsAt')}
                allDay={allDay}
                field={form.register(`events.${index}.startsAt`)}
                error={error(eventErrors?.startsAt?.message)}
              />
              <DateField
                id={`${ids}-end-${index}`}
                label={t('endsAt')}
                allDay={allDay}
                field={form.register(`events.${index}.endsAt`)}
                error={error(eventErrors?.endsAt?.message ?? eventErrors?.root?.message)}
              />
            </div>
            <CountedField
              id={`${ids}-location-${index}`}
              label={t('location')}
              max={L.eventLocation}
              value={events[index]?.location ?? ''}
              field={form.register(`events.${index}.location`)}
              error={error(eventErrors?.location?.message)}
            />
            <Field data-invalid={linkError ? true : undefined} className="gap-1.5">
              <FieldLabel htmlFor={linkId} className="type-action">
                {t('eventLink')}
              </FieldLabel>
              <Input
                id={linkId}
                inputMode="url"
                placeholder={t('urlPlaceholder')}
                aria-invalid={linkError ? true : undefined}
                aria-describedby={linkError ? `${linkId}-error` : undefined}
                {...form.register(`events.${index}.url`)}
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
      {fields.length < L.events && (
        <AddItem id={`${ids}-add`} onClick={() => append(empty)}>
          {t('addEvent')}
        </AddItem>
      )}
      <ListError message={error(errors.events?.message ?? errors.events?.root?.message)} />
    </form>
  )
}
