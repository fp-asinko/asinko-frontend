/** One draft per person and browser: someone else signing in here does not see it (specs/submit-page SU-12). */
export const draftKey = (userId: string) => `asinko:post-draft:${userId}`
