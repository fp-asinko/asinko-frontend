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

/** An optional text: trimmed, and empty is the same as not given. */
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, { message })
    .transform((value) => value || undefined)

/**
 * A new group (specs/community-create design § 2): the same rules in the form and in the Server
 * Action. Messages are translation keys (i18n.md).
 */
export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(NAME_MIN, { message: 'createGroup.errors.nameLength' })
    .max(NAME_MAX, { message: 'createGroup.errors.nameLength' }),
  slug: groupSlugSchema,
  description: optionalText(DESCRIPTION_MAX, 'createGroup.errors.descriptionMax'),
  rules: optionalText(RULES_MAX, 'createGroup.errors.rulesMax'),
  mainUrl: z
    .string()
    .trim()
    .max(URL_MAX, { message: 'createGroup.errors.url' })
    .refine((value) => value === '' || isHttpUrl(value), { message: 'createGroup.errors.url' })
    .transform((value) => value || undefined),
})

export type CreateGroupForm = z.input<typeof createGroupSchema>
export type CreateGroupInput = z.output<typeof createGroupSchema>
