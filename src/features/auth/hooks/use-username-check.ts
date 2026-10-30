'use client'

import { useEffect, useState } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { checkUsername } from '../actions/check-username.action'
import { USERNAME_PATTERN, type ProfileInput } from '../schemas/auth.schema'

/** After the last key: one question per pause, not per letter (P-035). */
export const CHECK_DELAY_MS = 400

/**
 * Says whether the username being typed is free (specs/auth AU-24, design.md § 17): a taken one
 * shows as the field's error at once, a free one as a confirmation. Only a hint: the backend's 409
 * on sending still decides. An answer for a username no longer in the field is dropped.
 */
export function useUsernameCheck(form: UseFormReturn<ProfileInput>): { available: string | null } {
  const username = useWatch({ control: form.control, name: 'username' }).trim()
  const [available, setAvailable] = useState<string | null>(null)

  useEffect(() => {
    // "Taken" was about what the field had before: another one is asked again.
    if (form.getFieldState('username').error?.type === 'taken') form.clearErrors('username')
    if (!USERNAME_PATTERN.test(username)) return
    let gone = false
    const timer = setTimeout(() => {
      void checkUsername(username).then((answer) => {
        if (gone) return
        if (answer === 'available') setAvailable(username)
        if (answer === 'taken') {
          form.setError('username', { type: 'taken', message: 'auth.errors.usernameTaken' })
        }
      })
    }, CHECK_DELAY_MS)
    return () => {
      gone = true
      clearTimeout(timer)
    }
  }, [username, form])

  return { available: available === username ? available : null }
}
