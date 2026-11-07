import { z } from 'zod'
import { isHttpUrl } from '@/lib/profile-links'

/** Our own limits (specs/community-create CG-03, proposed in P-048): stricter than the backend's. */
export const NAME_MIN = 3
export const NAME_MAX = 50
export const SLUG_MIN = 3
export const SLUG_MAX = 30
export const DESCRIPTION_MAX = 500
export const RULES_MAX = 2000
export const URL_MAX = 300

/** Lowercase letters and digits, single hyphens between them (the backend: ^[a-z0-9-]{1,50}$). */
export const GROUP_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const groupSlugSchema = z
  .string()
  .min(SLUG_MIN, { message: 'createGroup.errors.slugFormat' })
  .max(SLUG_MAX, { message: 'createGroup.errors.slugFormat' })
  .regex(GROUP_SLUG, { message: 'createGroup.errors.slugFormat' })

/** The texts of a group, trimmed and checked; what an empty one means is up to each schema. */
const text = (max: number, message: string) => z.string().trim().max(max, { message })

const nameSchema = z
  .string()
  .trim()
  .min(NAME_MIN, { message: 'createGroup.errors.nameLength' })
  .max(NAME_MAX, { message: 'createGroup.errors.nameLength' })

/** Only http(s), as a profile's links (security.md § 1); empty is no link. */
const urlSchema = text(URL_MAX, 'createGroup.errors.url').refine(
  (value) => value === '' || isHttpUrl(value),
  { message: 'createGroup.errors.url' },
)

const descriptionSchema = text(DESCRIPTION_MAX, 'createGroup.errors.descriptionMax')
const rulesSchema = text(RULES_MAX, 'createGroup.errors.rulesMax')

/** Empty is not given: a new group starts without it. */
const orUndefined = (value: string) => value || undefined
/** Empty removes what there was (specs/community-edit CE-05). */
const orNull = (value: string) => value || null

/**
 * A new group (specs/community-create design § 2): the same rules in the form and in the Server
 * Action. Messages are translation keys (i18n.md).
 */
export const createGroupSchema = z.object({
  name: nameSchema,
  slug: groupSlugSchema,
  description: descriptionSchema.transform(orUndefined),
  rules: rulesSchema.transform(orUndefined),
  mainUrl: urlSchema.transform(orUndefined),
})

export type CreateGroupForm = z.input<typeof createGroupSchema>
export type CreateGroupInput = z.output<typeof createGroupSchema>

/**
 * A group's fields as "Edit group" has them (specs/community-edit § 2): the same rules, without
 * the handle (Q2). The form keeps empty texts as "".
 */
export const editGroupSchema = z.object({
  name: nameSchema,
  description: descriptionSchema.transform(orNull),
  rules: rulesSchema.transform(orNull),
  mainUrl: urlSchema.transform(orNull),
})

/**
 * What the Server Action takes: only what changed. An empty text is null, which removes it; the
 * photo or banner, only null (to remove it): a new one is saved by its upload.
 */
export const editGroupChangesSchema = editGroupSchema
  .extend({ avatarUrl: z.null(), bannerUrl: z.null() })
  .partial()

export type EditGroupForm = z.input<typeof editGroupSchema>
export type EditGroupChanges = z.output<typeof editGroupChangesSchema>
export type EditGroupInput = z.output<typeof editGroupSchema>
