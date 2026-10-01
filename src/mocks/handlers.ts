import { PROFILES, profileSchema } from './fixtures/profiles'
import type { MockRoute } from './types'

const notFound = { status: 404, body: { error: { code: 'NOT_FOUND', message: 'mock' } } }

// Registry of mocked endpoints (api-integration.md § Mocks). Only routes listed here are mocked;
// the rest go to the real API. Remove a route here when the backend implements it.
export const MOCK_ROUTES: readonly MockRoute[] = [
  {
    method: 'GET',
    path: '/api/v1/profiles/:identifier',
    kind: 'contract',
    schema: profileSchema,
    example: { params: { identifier: 'demo' }, query: {}, body: undefined },
    handler: ({ params }) => {
      const profile = PROFILES.find(
        (each) => each.id === params.identifier || each.username === params.identifier,
      )
      return profile ? { status: 200, body: profile } : notFound
    },
  },
]
