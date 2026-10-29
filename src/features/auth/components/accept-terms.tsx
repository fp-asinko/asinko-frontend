'use client'

import { useTranslations } from 'next-intl'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

/**
 * "I'm 18 or older and I accept the Terms and the Privacy Policy" (specs/auth AU-05, Q1). The
 * links are "Coming soon" until there is a legal text.
 */
export function AcceptTerms<Values extends FieldValues & { accepted: boolean }>({
  id,
  control,
  error,
}: {
  id: string
  /** The form's control: sign up or choosing the username, both with `accepted`. */
  control: Control<Values>
  error?: string
}) {
  const t = useTranslations('auth.fields.accepted')
  const errorId = `${id}-error`

  return (
    <Field orientation="horizontal" data-invalid={error ? true : undefined}>
      <Controller
        control={control}
        name={'accepted' as Path<Values>}
        render={({ field }) => (
          <Checkbox
            id={id}
            name={field.name}
            inputRef={field.ref}
            checked={field.value === true}
            onCheckedChange={(checked) => field.onChange(checked === true)}
            onBlur={field.onBlur}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="mt-0.5"
          />
        )}
      />
      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor={id} className="type-ui leading-snug font-normal">
          {t.rich('label', {
            terms: (chunks) => (
              <ComingSoon label={t('terms')} className="underline underline-offset-2">
                {chunks}
              </ComingSoon>
            ),
            privacy: (chunks) => (
              <ComingSoon label={t('privacy')} className="underline underline-offset-2">
                {chunks}
              </ComingSoon>
            ),
          })}
        </FieldLabel>
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    </Field>
  )
}
