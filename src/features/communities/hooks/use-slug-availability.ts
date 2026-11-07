'use client'

import { useEffect, useState } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { checkGroupSlug } from '../actions/check-group-slug.action'
import {
  GROUP_SLUG,
  SLUG_MAX,
  SLUG_MIN,
  type CreateGroupForm,
  type CreateGroupInput,
} from '../schemas/create-group.schema'

/** After the last key: one question per pause, not per letter (as the username's, P-035). */
export const CHECK_DELAY_MS = 400

/**
 * Says whether the handle being typed is free (specs/community-create CG-06, CG-07): a taken one
 * shows as the field's error at once, a free one as a confirmation. Only a hint: the backend's 409
 * on creating still decides. An answer for a handle no longer in the field is dropped.
 */
export function useSlugAvailability(
  form: UseFormReturn<CreateGroupForm, unknown, CreateGroupInput>,
): {
  available: string | null
} {
  const slug = useWatch({ control: form.control, name: 'slug' })
  const [available, setAvailable] = useState<string | null>(null)

  useEffect(() => {
    // "Taken" was about what the field had before: another one is asked again.
    if (form.getFieldState('slug').error?.type === 'taken') form.clearErrors('slug')
    if (slug.length < SLUG_MIN || slug.length > SLUG_MAX || !GROUP_SLUG.test(slug)) return
    let gone = false
    const timer = setTimeout(() => {
      void checkGroupSlug(slug).then((answer) => {
        if (gone) return
        if (answer === 'free') setAvailable(slug)
        if (answer === 'taken') {
          form.setError('slug', { type: 'taken', message: 'createGroup.errors.slugTaken' })
        }
      })
    }, CHECK_DELAY_MS)
    return () => {
      gone = true
      clearTimeout(timer)
    }
  }, [slug, form])

  return { available: available === slug ? available : null }
}
