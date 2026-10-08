'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, type RefObject } from 'react'
import type { MentionSearch } from './mention-assist'

// Downloaded the first time a field with mentions gets the focus (MA-09): pages carry only this.
const MentionAssist = dynamic(() => import('./mention-assist').then((mod) => mod.MentionAssist), {
  ssr: false,
})

/**
 * Turns on mention suggestions for a textarea (specs/mention-autocomplete § 1). Put it next to
 * the textarea, inside a `relative` box (the list is placed against it). Nothing is downloaded
 * until the textarea is focused; the textarea is never replaced, so it keeps its focus and text.
 */
export function MentionField({
  fieldRef,
  search,
}: {
  fieldRef: RefObject<HTMLTextAreaElement | null>
  search: MentionSearch
}) {
  const [field, setField] = useState<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const element = fieldRef.current
    if (!element) return
    const activate = () => setField(element)
    element.addEventListener('focus', activate, { once: true })
    return () => element.removeEventListener('focus', activate)
  }, [fieldRef])

  return field ? <MentionAssist field={field} search={search} /> : null
}
