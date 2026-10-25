import { z } from 'zod'
import {
  IMAGE_ALT_MAX,
  RELATED_MAX,
  relatedHandleSchema,
  TAG_MAX,
  TITLE_MAX,
} from './create-post.schema'

/**
 * What "Save draft" sends (specs/drafts-tags DT-01, P-022): the editor's fields as they are, none
 * required, with the draft's id when it updates one (DT-03). Empty ones are left out. User input:
 * a public action checks it again.
 */
export const saveDraftSchema = z
  .object({
    draftId: z.uuid().optional(),
    communityId: z.union([z.uuid(), z.literal('')]).default(''),
    type: z.enum(['TEXT', 'LINK', 'IMAGE', 'THOUGHT']),
    title: z.string().trim().max(TITLE_MAX).default(''),
    body: z.string().trim().max(40_000).default(''),
    url: z.string().trim().max(2048).default(''),
    imageUrl: z.string().max(2048).default(''),
    imageAlt: z.string().trim().max(IMAGE_ALT_MAX).default(''),
    tag: z.string().trim().max(TAG_MAX).default(''),
    /** Its related ones too (P-018, specs/backend-answer-1020 BA-05): saved as ids by the server. */
    related: z.array(relatedHandleSchema).max(RELATED_MAX).default([]),
  })
  .refine((draft) => draft.title || draft.body || draft.url || draft.imageUrl, {
    message: 'composer.drafts.errors.empty',
  })
  .transform(({ draftId, communityId, imageUrl, tag, ...rest }) => ({
    draftId,
    fields: {
      ...rest,
      ...(communityId && { communityId }),
      ...(imageUrl && { imageUrl }),
      ...(tag && { tag }),
    },
  }))

export type SaveDraftInput = z.input<typeof saveDraftSchema>
export type DraftFields = z.output<typeof saveDraftSchema>['fields']
