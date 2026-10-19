'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { z } from 'zod'
import { RELATED_MAX, relatedHandleSchema } from '../schemas/create-post.schema'

/**
 * What a draft keeps (specs/submit-page SU-12): where, the related ones (specs/related-tags RT-06),
 * the format and the text. Not the image: its upload is single-use and the field cannot rebuild its
 * preview from a URL. Older drafts have no related ones.
 */
const draftSchema = z.object({
  community: z
    .object({
      id: z.string(),
      slug: z.string(),
      handle: z.string(),
      name: z.string(),
      own: z.boolean(),
      tags: z.array(z.string()).optional(),
    })
    .nullable(),
  // Checked as on Publish: a broken one would make it fail without saying why.
  related: z.array(relatedHandleSchema).max(RELATED_MAX).default([]),
  type: z.enum(['TEXT', 'LINK', 'IMAGE']),
  title: z.string(),
  body: z.string(),
  url: z.string(),
  /** Its tag (specs/drafts-tags); older drafts have none. */
  tag: z.string().default(''),
  savedAt: z.number(),
})

export type PostDraft = z.output<typeof draftSchema>

/** What is written: a draft from before related ones existed has none. */
type PostDraftInput = z.input<typeof draftSchema>

// Storage can throw (private mode, blocked site data): then there is no draft and nothing breaks.
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeDraft(key: string, draft: PostDraftInput) {
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

/** Something worth keeping: a title, a body or a link. */
export function hasText(draft: Pick<PostDraft, 'title' | 'body' | 'url'>) {
  return Boolean(draft.title.trim() || draft.body.trim() || draft.url.trim())
}

const subscribe = () => () => {}

// The draft as it was when the page opened, per key: what is saved while writing is not offered back.
const opened = new Map<string, string | null>()

/** The editor left: the next visit reads the draft again. */
export function forgetOpenedDraft(key: string) {
  opened.delete(key)
}

function openedDraft(key: string): string | null {
  if (!opened.has(key)) opened.set(key, read(key))
  return opened.get(key) ?? null
}

/**
 * The draft kept for `key` when the page opens, or null (none, unreadable, or no key: without a
 * session nothing is kept). Read once per page load from the browser; on the server, none.
 */
export function useStoredDraft(key: string | null): PostDraft | null {
  const getSnapshot = useCallback(() => (key ? openedDraft(key) : null), [key])
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null)
  return useMemo(() => {
    if (!raw) return null
    try {
      const parsed = draftSchema.safeParse(JSON.parse(raw))
      return parsed.success && hasText(parsed.data) ? parsed.data : null
    } catch {
      return null
    }
  }, [raw])
}
