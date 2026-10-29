'use client'

import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, type ComponentProps } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * A field of the auth forms (specs/auth AU-06, AU-18): label, input of 16px or more (iOS does not
 * zoom), an optional hint, and its error tied to the input and announced. A password can be shown.
 */
export function AuthField({
  id,
  label,
  hint,
  error,
  field,
  type = 'text',
  reveal = false,
  ...input
}: {
  id: string
  label: string
  hint?: string
  /** Already translated. */
  error?: string
  field: UseFormRegisterReturn
  reveal?: boolean
} & Pick<ComponentProps<'input'>, 'type' | 'autoComplete' | 'inputMode' | 'autoCapitalize'>) {
  const t = useTranslations('auth.fields.password')
  const [shown, setShown] = useState(false)
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  return (
    <Field data-invalid={error ? true : undefined} className="gap-1.5">
      <FieldLabel htmlFor={id} className="type-action">
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={reveal && shown ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
          }
          // 16px: iOS does not zoom (design-system.md). Room on the right for the eye.
          className={cn('h-11 rounded-xl px-3.5 text-base md:text-base', reveal && 'pr-11')}
          spellCheck={false}
          {...input}
          {...field}
        />
        {reveal && (
          <button
            type="button"
            aria-pressed={shown}
            aria-label={t(shown ? 'hide' : 'show')}
            onClick={() => setShown((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {shown ? (
              <EyeOffIcon aria-hidden className="size-4" />
            ) : (
              <EyeIcon aria-hidden className="size-4" />
            )}
          </button>
        )}
      </div>
      {hint && !error && (
        <FieldDescription id={hintId} className="type-meta">
          {hint}
        </FieldDescription>
      )}
      {error && (
        <FieldError id={errorId} className="type-meta">
          {error}
        </FieldError>
      )}
    </Field>
  )
}

/** A form's error that belongs to no field (credentials, too many tries, unavailable): AU-04. */
export function FormAlert({ message }: { message: string | null }) {
  return (
    <p role="alert" className="type-ui text-destructive empty:hidden">
      {message}
    </p>
  )
}
