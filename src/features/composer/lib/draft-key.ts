/** One draft per person and browser: someone else signing in here does not see it (specs/submit-page SU-12). */
export const draftKey = (userId: string) => `asinko:post-draft:${userId}`

/** A thesis's draft, apart from the post's: switching tabs loses neither (specs/thesis-create TC-10). */
export const thesisDraftKey = (userId: string) => `asinko:thesis-draft:${userId}`
