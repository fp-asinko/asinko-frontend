'use client'

import { useEffect } from 'react'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'

/**
 * Puts the focus on a form's first field when it takes another form's place (specs/auth AU-18,
 * specs/password-recovery PR-16): the control that switched it leaves with the form before, and
 * the focus would fall to the page. Not on a page's first load: it would open the phone's keyboard.
 */
export function useFocusFirst<Values extends FieldValues>(
  form: UseFormReturn<Values>,
  field: Path<Values>,
  when: boolean,
) {
  useEffect(() => {
    if (!when) return
    // After the frame: the field mounts inside Base UI's Field, which settles its control first.
    const frame = requestAnimationFrame(() => form.setFocus(field))
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the form arrives
  }, [])
}
