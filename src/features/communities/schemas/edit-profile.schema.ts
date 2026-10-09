import { z } from 'zod'

/** The backend's limit for a bio (PATCH /users/{userId}, E01). */
export const BIO_MAX = 160

/**
 * Your own profile's edit (specs/profile-edit PE-03, PE-04): the same schema helps in the form and
 * decides in the Server Action. An empty bio is valid: it removes the one there was.
 */
export const editProfileSchema = z.object({
  bio: z.string().trim().max(BIO_MAX, { message: 'communities.edit.errors.bioTooLong' }),
})

export type EditProfileForm = z.input<typeof editProfileSchema>
export type EditProfileInput = z.output<typeof editProfileSchema>
