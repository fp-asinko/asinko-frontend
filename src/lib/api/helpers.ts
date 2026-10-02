import type { z } from 'zod'
import { ApiRequestError } from './errors'
import type { ApiResult } from './create-client'

/**
 * For data a page cannot render without (the main content): returns the data or throws, so
 * error.tsx shows the page error. Secondary sections handle the failure locally instead.
 */
export function getOrThrow<T>(result: ApiResult<T>): T {
  if (!result.ok) throw new ApiRequestError(result)
  return result.data
}

/**
 * Graceful degradation for lists: keeps the items that match the schema and reports how many were
 * dropped, so one malformed item does not take down a whole feed. Dropping is never silent.
 */
export function keepValidItems<T>(
  items: readonly unknown[],
  schema: z.ZodType<T>,
  onDropped: (count: number, fields: string[]) => void,
): T[] {
  const valid: T[] = []
  const brokenFields = new Set<string>()

  for (const item of items) {
    const parsed = schema.safeParse(item)
    if (parsed.success) valid.push(parsed.data)
    else for (const issue of parsed.error.issues) brokenFields.add(issue.path.join('.') || '(root)')
  }

  const dropped = items.length - valid.length
  if (dropped > 0) onDropped(dropped, [...brokenFields])
  return valid
}
