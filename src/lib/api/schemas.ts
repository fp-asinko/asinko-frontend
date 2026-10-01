import { z } from 'zod'

// Common shapes of the asinko-app API (docs/references/api/README.md § Convenciones).

/** Error envelope: { "error": { "code", "message", ...extra } }. `message` is for debugging only. */
export const apiErrorSchema = z.object({
  error: z.looseObject({
    code: z.string(),
    message: z.string().optional(),
    retryAfter: z.string().optional(),
  }),
})

/** Cursor-paginated list: { "items": T[], "nextCursor": string | null }. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), nextCursor: z.string().nullable() })
}

/** 204 No Content. */
export const noContentSchema = z.undefined()
