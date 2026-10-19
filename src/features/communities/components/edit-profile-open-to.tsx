'use client'

import { CheckIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { FieldError } from '@/components/ui/field'
import { OPEN_TO } from '../open-to.constants'

/**
 * "Open to" in "Edit profile" (specs/profile-showcase PS-09): the list's options as pills, any
 * number at once. Each one is a real checkbox under its group's legend, its check drawn on the
 * pill; the focus ring goes around the pill. Its help and a refusal of the server describe the
 * group (WCAG 3.3.1).
 */
export function OpenToField({
  id,
  field,
  error,
}: {
  id: string
  field: UseFormRegisterReturn
  /** Already translated. */
  error?: string
}) {
  const t = useTranslations('communities.openTo')

  return (
    <fieldset
      id={id}
      aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
      className="flex flex-col gap-1.5"
    >
      <legend className="mb-1.5 type-action">{t('title')}</legend>
      <p id={`${id}-help`} className="type-meta text-muted-foreground">
        {t('help')}
      </p>
      <div className="flex flex-wrap gap-2">
        {OPEN_TO.map((value) => (
          <label
            key={value}
            className="group inline-flex h-10 tap cursor-pointer items-center gap-1.5 rounded-full border border-input px-3.5 type-action has-checked:border-foreground has-checked:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/50 md:h-9"
          >
            <input
              type="checkbox"
              value={value}
              aria-invalid={error ? true : undefined}
              {...field}
              className="peer sr-only"
            />
            <CheckIcon aria-hidden className="hidden size-3.5 peer-checked:block" />
            {t(`options.${value}`)}
          </label>
        ))}
      </div>
      <FieldError
        id={`${id}-error`}
        errors={error ? [{ message: error }] : undefined}
        className="type-meta"
      />
    </fieldset>
  )
}
