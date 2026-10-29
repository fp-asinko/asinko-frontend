'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import type { ActionResult } from '@/lib/result'

/**
 * Sends an auth form to its Server Action (specs/auth design.md § 7): no double submit while it
 * runs, the backend's refusals next to their field (and the focus on the first), and what belongs
 * to no field in the form's alert. Keys are translated here; the schema's too.
 */
export function useAuthForm<Values extends FieldValues, Data>(
  form: UseFormReturn<Values>,
  action: (values: Values) => Promise<ActionResult<Data>>,
  onDone: (data: Data) => void,
) {
  const translate = useTranslations('auth')
  // The keys come from the schemas and the actions, all of them under auth.
  const t = (key: string) =>
    translate(key.replace(/^auth\./, '') as Parameters<typeof translate>[0])
  const [pending, startTransition] = useTransition()
  const [alert, setAlert] = useState<string | null>(null)

  const submit = form.handleSubmit((values) => {
    setAlert(null)
    startTransition(async () => {
      const result = await action(values)
      if (result.ok) {
        onDone(result.data)
        return
      }
      const fields = Object.entries(result.fieldErrors ?? {})
      for (const [name, [key] = []] of fields) {
        if (key) form.setError(name as Path<Values>, { message: key })
      }
      const [first] = fields
      if (first) form.setFocus(first[0] as Path<Values>)
      else setAlert(t(result.error))
    })
  })

  /** A field's error, translated. */
  const error = (name: Path<Values>): string | undefined => {
    const key = form.getFieldState(name, form.formState).error?.message
    return key ? t(key) : undefined
  }

  return { submit, pending, alert, error }
}
