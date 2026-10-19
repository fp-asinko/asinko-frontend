import { z } from 'zod'
import { isHttpUrl } from '@/lib/profile-links'
import { OPEN_TO } from '../open-to.constants'

/**
 * The backend's limits (PATCH /users/{userId}, E01; P-011 and P-019 for name, headline, city). The
 * bio is the "About" of P-024 (specs/profile-showcase PS-04): 2000, the backend's 160 today.
 */
export const BIO_MAX = 2000
export const DISPLAY_NAME_MAX = 50
export const HEADLINE_MAX = 100
export const CITY_MAX = 60
export const LINKS_MAX = 5

/** A profile link: only http(s) (security.md § 1). */
const linkSchema = z.string().trim().refine(isHttpUrl, { message: 'communities.edit.errors.link' })

/**
 * Your own profile's fields (specs/profile-edit, specs/profile-presentation PP-05, PP-06), the same
 * rules in the form and in the Server Action. An empty text is valid: it removes what there was.
 * Messages are translation keys (i18n.md).
 */
const profileFields = z.object({
  displayName: z
    .string()
    .trim()
    .max(DISPLAY_NAME_MAX, { message: 'communities.edit.errors.displayNameTooLong' }),
  headline: z
    .string()
    .trim()
    .max(HEADLINE_MAX, { message: 'communities.edit.errors.headlineTooLong' }),
  countryCode: z.union([z.literal(''), z.string().regex(/^[A-Z]{2}$/)]),
  city: z.string().trim().max(CITY_MAX, { message: 'communities.edit.errors.cityTooLong' }),
  bio: z.string().trim().max(BIO_MAX, { message: 'communities.edit.errors.bioTooLong' }),
  links: z.array(linkSchema).max(LINKS_MAX, { message: 'communities.edit.errors.tooManyLinks' }),
  /** P-026 (specs/profile-showcase PS-09): from the list, each once. */
  openTo: z.array(z.enum(OPEN_TO)).refine((values) => new Set(values).size === values.length, {
    message: 'communities.edit.errors.openTo',
  }),
  /** An uploaded image's URL, or null to go back to the initials or the color (PP-07). */
  avatarUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
})

/** The window's form: links as objects for its list, leaving as plain URLs. */
export const editProfileSchema = profileFields.extend({
  links: z
    .array(z.object({ url: linkSchema }))
    .max(LINKS_MAX, { message: 'communities.edit.errors.tooManyLinks' })
    .transform((links) => links.map((link) => link.url)),
})

/** What the Server Action takes: only what changed (PP-08), as the form leaves it. */
export const editProfileChangesSchema = profileFields.partial()

export type EditProfileForm = z.input<typeof editProfileSchema>
export type EditProfileInput = z.output<typeof editProfileSchema>
export type EditProfileChanges = z.output<typeof editProfileChangesSchema>
