import { z } from 'zod'
import { isHttpUrl } from '@/lib/profile-links'

/** The backend's limits (PATCH /users/{userId}, E01; P-011 and P-019 for name, headline, city). */
export const BIO_MAX = 160
export const DISPLAY_NAME_MAX = 50
export const HEADLINE_MAX = 100
export const CITY_MAX = 60
export const LINKS_MAX = 5

/**
 * Your own profile's edit (specs/profile-edit, specs/profile-presentation PP-05, PP-06): the same
 * schema helps in the form and decides in the Server Action. An empty text is valid: it removes
 * what there was. Links go as objects for the form's list, and leave as plain URLs. Messages are
 * translation keys (i18n.md).
 */
export const editProfileSchema = z.object({
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
  links: z
    .array(
      z.object({
        url: z.string().trim().refine(isHttpUrl, { message: 'communities.edit.errors.link' }),
      }),
    )
    .max(LINKS_MAX, { message: 'communities.edit.errors.tooManyLinks' })
    .transform((links) => links.map((link) => link.url)),
  /** An uploaded image's URL, or null to go back to the initials or the color (PP-07). */
  avatarUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
})

/** What changed: the window sends only that (PP-08). */
export const editProfileChangesSchema = editProfileSchema.partial()

export type EditProfileForm = z.input<typeof editProfileSchema>
export type EditProfileInput = z.output<typeof editProfileSchema>
export type EditProfileChanges = z.output<typeof editProfileChangesSchema>
