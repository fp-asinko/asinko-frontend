import type { HttpMethod } from '@/lib/api/create-client'
import type { MockRoute } from './types'

export type MockMatch = { route: MockRoute; params: Record<string, string> }

/** Matches `/api/v1/profiles/:identifier` against `/api/v1/profiles/juan` → { identifier: 'juan' }. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (const [index, part] of patternParts.entries()) {
    const actual = pathParts[index] as string
    if (part.startsWith(':')) params[part.slice(1)] = decodeURIComponent(actual)
    else if (part !== actual) return null
  }
  return params
}

export function findMock(routes: readonly MockRoute[], method: HttpMethod, path: string) {
  for (const route of routes) {
    if (route.method !== method) continue
    const params = matchPath(route.path, path)
    if (params) return { route, params } satisfies MockMatch
  }
  return null
}
