'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { countryOptions } from '@/lib/countries'
import { cn } from '@/lib/utils'

/** One thin border, also when invalid: the PO does not want the 3px halo (specs/profile-edit). */
export const FIELD =
  'focus-visible:border-foreground/60 focus-visible:ring-0 aria-invalid:ring-0 dark:aria-invalid:ring-0'

/**
 * A text of the profile with its limit (specs/profile-presentation PP-05): the counter shows near
 * the limit (from 80%), or always when asked (the bio, as before), and turns red past it.
 */
export function CountedField({
  id,
  label,
  max,
  value,
  field,
  error,
  placeholder,
  multiline = false,
  alwaysCount = false,
}: {
  id: string
  label: string
  max: number
  value: string
  field: UseFormRegisterReturn
  /** Already translated. */
  error?: string
  placeholder?: string
  multiline?: boolean
  alwaysCount?: boolean
}) {
  const t = useTranslations('communities.edit')
  const length = value.trim().length
  const over = length > max
  const counted = alwaysCount || length >= max * 0.8
  const invalid = over || Boolean(error)
  const describedBy = [counted && `${id}-count`, invalid && `${id}-error`].filter(Boolean).join(' ')
  const control = {
    id,
    placeholder,
    ...field,
    'aria-invalid': invalid || undefined,
    'aria-describedby': describedBy || undefined,
  }

  return (
    <Field data-invalid={invalid || undefined} className="gap-1.5">
      <FieldLabel htmlFor={id} className="type-action">
        {label}
      </FieldLabel>
      {multiline ? (
        <Textarea {...control} className={cn('min-h-24 resize-none text-base', FIELD)} />
      ) : (
        <Input {...control} className={cn('h-10 text-base', FIELD)} />
      )}
      {(counted || invalid) && (
        <div className="flex justify-between gap-2 type-meta">
          <FieldError
            id={`${id}-error`}
            errors={invalid ? [{ message: error ?? t('errors.tooLong', { max }) }] : undefined}
          />
          {counted && (
            <span
              id={`${id}-count`}
              className={cn(
                'ml-auto tabular-nums',
                over ? 'font-bold text-destructive' : 'text-muted-foreground',
              )}
            >
              {t('counter', { count: length, max })}
            </span>
          )}
        </div>
      )}
    </Field>
  )
}

/**
 * The country, from a list (specs/profile-presentation Q2): the native select (the phone's own
 * picker), every country named and ordered in the page's language; the first option leaves it out.
 */
export function CountryField({ id, field }: { id: string; field: UseFormRegisterReturn }) {
  const t = useTranslations('communities.edit')
  const locale = useLocale()
  const options = useMemo(() => countryOptions(locale), [locale])

  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor={id} className="type-action">
        {t('country')}
      </FieldLabel>
      {/* The same thin border as the other fields when focused, without the halo. */}
      <NativeSelect
        id={id}
        {...field}
        className="w-full [&_select]:h-10 [&_select]:focus-visible:border-foreground/60 [&_select]:focus-visible:ring-0"
      >
        <NativeSelectOption value="">{t('noCountry')}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.code} value={option.code}>
            {option.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  )
}
