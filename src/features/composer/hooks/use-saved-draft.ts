'use client'

import { useState, useTransition } from 'react'
import { saveDraft } from '../actions/drafts.action'
import type { SaveDraftInput } from '../schemas/save-draft.schema'

/**
 * The draft of the account the editor has open (specs/drafts-tags DT-01, DT-03, DT-05): none
 * until it is saved or one is opened, then saving again updates it. `savedAs` is what was saved,
 * as the editor's snapshot: "Saved" holds only while the form still says that. `error` says why
 * not (a translation key).
 */
export function useSavedDraft() {
  const [draftId, setDraftId] = useState<string | null>(null)
  const [savedAs, setSavedAs] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, startTransition] = useTransition()

  function save(fields: Omit<SaveDraftInput, 'draftId'>, snapshot: string) {
    setSavedAs(null)
    setError(null)
    startTransition(async () => {
      const result = await saveDraft({ ...fields, ...(draftId && { draftId }) })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDraftId(result.data.id)
      setSavedAs(snapshot)
    })
  }

  return {
    draftId,
    saving,
    savedAs,
    error,
    save,
    /** One opened from the list: saving updates it. */
    open: (id: string) => {
      setDraftId(id)
      setSavedAs(null)
      setError(null)
    },
    /** One deleted from the list: if it was this one, saving makes a new one. */
    forget: (id: string) => setDraftId((current) => (current === id ? null : current)),
  }
}
