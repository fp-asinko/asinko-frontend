'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { z } from 'zod'

// The browser draft of an editor (specs/submit-page SU-12), whatever its shape: a post's
// (use-post-draft) or a thesis's (use-thesis-draft, specs/thesis-create TC-10).

// Storage can throw (private mode, blocked site data): then there is no draft and nothing breaks.
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

// Drafts discarded on the way out: a save still pending (the typing had not rested) must not write
// them back. The key opens again when the editor leaves (forgetOpenedDraft).
const discarded = new Set<string>()

// The draft as it was when the page opened, per key: what is saved while writing is not offered back.
const opened = new Map<string, string | null>()

export function writeDraft(key: string, draft: unknown) {
  if (discarded.has(key)) return
  try {
    window.localStorage.setItem(key, JSON.stringify(draft))
  } catch {
    // Not kept: the page still works.
  }
}

export function clearDraft(key: string) {
  opened.delete(key)
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Nothing to clear.
  }
}

/** Discards the draft on the way out: gone, and no pending save brings it back (a bug, 2026-10-22). */
export function discardDraft(key: string) {
  clearDraft(key)
  discarded.add(key)
}

/** The editor left: the next visit reads the draft again, and keeps a new one. */
export function forgetOpenedDraft(key: string) {
  opened.delete(key)
  discarded.delete(key)
}

function openedDraft(key: string): string | null {
  if (!opened.has(key)) opened.set(key, read(key))
  return opened.get(key) ?? null
}

const subscribe = () => () => {}

/**
 * The draft kept for `key` when the page opens, or null (none, unreadable, not worth offering, or
 * no key: without a session nothing is kept). Read once per page load from the browser; on the
 * server, none.
 */
export function useLocalDraft<Schema extends z.ZodType>(
  key: string | null,
  schema: Schema,
  worthKeeping: (draft: z.output<Schema>) => boolean,
): z.output<Schema> | null {
  const getSnapshot = useCallback(() => (key ? openedDraft(key) : null), [key])
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null)
  return useMemo(() => {
    if (!raw) return null
    try {
      const parsed = schema.safeParse(JSON.parse(raw))
      return parsed.success && worthKeeping(parsed.data) ? parsed.data : null
    } catch {
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the schema and the check are module constants
  }, [raw])
}
