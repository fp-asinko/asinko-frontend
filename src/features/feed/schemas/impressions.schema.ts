import { impressionsRequestSchema } from '@/lib/api/contract'

/**
 * What the browser sends to /api/impressions (specs/explore-v1 EX-08): the page's requestId and its
 * events. Never a userId: the server takes it from the session.
 */
export const impressionsInputSchema = impressionsRequestSchema.omit({ userId: true }).strict()
