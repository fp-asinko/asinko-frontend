'use client'

import { z } from 'zod'
import { RELATED_MAX, relatedHandleSchema } from '../schemas/create-post.schema'
import { useLocalDraft, writeDraft as writeLocalDraft } from './use-local-draft'

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
  type: z.enum(['TEXT', 'LINK', 'IMAGE', 'THOUGHT']),
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

export { clearDraft, discardDraft, forgetOpenedDraft } from './use-local-draft'

export function writeDraft(key: string, draft: PostDraftInput) {
  writeLocalDraft(key, draft)
}

/** Something worth keeping: a title, a body or a link. */
export function hasText(draft: Pick<PostDraft, 'title' | 'body' | 'url'>) {
  return Boolean(draft.title.trim() || draft.body.trim() || draft.url.trim())
}

/**
 * The draft kept for `key` when the page opens, or null (none, unreadable, or no key: without a
 * session nothing is kept). Read once per page load from the browser; on the server, none.
 */
export function useStoredDraft(key: string | null): PostDraft | null {
  return useLocalDraft(key, draftSchema, hasText)
}
