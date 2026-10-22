'use client'

import { PlusIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { LinkMark } from '@/components/ui/link-marks'
import { toProfileLink } from '@/lib/profile-links'
import { cn } from '@/lib/utils'
import {
  LINKS_MAX,
  type EditProfileForm,
  type EditProfileInput,
} from '../schemas/edit-profile.schema'
import { FIELD } from './edit-profile-fields'

/** A translation key of the schema, as the window's own (communities.edit.errors.link: errors.link). */
const own = (key: string | undefined) =>
  key?.replace(/^communities\.edit\./, '') as 'errors.link' | 'errors.tooManyLinks' | undefined

/**
 * The profile's links (specs/profile-presentation PP-06): up to five URLs, each with its site's
 * mark as soon as it is one, a × to take it out (the focus goes to the link that takes its place,
 * the one before, or "Add link") and "Add link" while there is room. Only http(s): anything
 * else says what is missing.
 */
export function LinksField({
  control,
  register,
  errors,
  legendClassName = 'mb-1.5 type-action',
}: {
  control: Control<EditProfileForm, unknown, EditProfileInput>
  register: UseFormRegister<EditProfileForm>
  errors: FieldErrors<EditProfileForm>['links']
  /** `sr-only` under a section that already shows the same title (specs/profile-edit-flow EF-09). */
  legendClassName?: string
}) {
  const t = useTranslations('communities.edit')
  const ids = useId()
  const { fields, append, remove } = useFieldArray({ control, name: 'links' })
  const values = useWatch({ control, name: 'links' }) ?? []
  const addId = `${ids}-add`
  const inputId = (index: number) => `${ids}-link-${index}`

  function take(index: number) {
    const left = fields.length - 1
    remove(index)
    // After the list re-renders: the link that takes its place, the one before, or "Add link"
    // (which is back if the list was full).
    const next = index < left ? inputId(index) : index > 0 ? inputId(index - 1) : addId
    requestAnimationFrame(() => document.getElementById(next)?.focus())
  }

  const listError = own(errors?.message ?? errors?.root?.message)

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={legendClassName}>{t('links')}</legend>
      {fields.map((item, index) => {
        const value = values[index]?.url ?? ''
        const site = toProfileLink(value)?.site ?? 'web'
        const error = own(errors?.[index]?.url?.message)
        return (
          <div key={item.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <LinkMark site={site} className="size-4 shrink-0 text-muted-foreground" />
              <Input
                id={inputId(index)}
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder={t('linkPlaceholder')}
                aria-label={t('linkLabel', { number: index + 1 })}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${inputId(index)}-error` : undefined}
                {...register(`links.${index}.url`)}
                className={cn('h-10 text-base', FIELD)}
              />
              <button
                type="button"
                aria-label={t('removeLink', { number: index + 1 })}
                onClick={() => take(index)}
                className="inline-flex size-9 shrink-0 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <XIcon aria-hidden className="size-4" />
              </button>
            </div>
            {error && (
              <FieldError id={`${inputId(index)}-error`} className="pl-6 type-meta">
                {t(error)}
              </FieldError>
            )}
          </div>
        )
      })}
      {fields.length < LINKS_MAX && (
        <button
          id={addId}
          type="button"
          onClick={() => append({ url: '' })}
          className="inline-flex h-9 w-fit tap items-center gap-1.5 rounded-full bg-muted px-3.5 type-action outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <PlusIcon aria-hidden className="size-4" />
          {t('addLink')}
        </button>
      )}
      {listError && <FieldError className="type-meta">{t(listError)}</FieldError>}
    </fieldset>
  )
}
