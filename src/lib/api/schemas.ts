import { z } from 'zod'

// Common shapes of the asinko-app API (docs/references/api/README.md § Convenciones).

/** Error envelope: { "error": { "code", "message", ...extra } }. `message` is for debugging only. */
export const apiErrorSchema = z.object({
  error: z.looseObject({
    code: z.string(),
    message: z.string().optional(),
    retryAfter: z.string().optional(),
    /** Which item of a list and which field were refused (P-028's INVALID_WIDGET). */
    index: z.number().int().min(0).max(1000).optional(),
    field: z.string().max(50).optional(),
  }),
})

/** Cursor-paginated list: { "items": T[], "nextCursor": string | null }. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), nextCursor: z.string().nullable() })
}

/** 204 No Content. */
export const noContentSchema = z.undefined()
