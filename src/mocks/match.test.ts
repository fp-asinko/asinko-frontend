import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { findMock, matchPath } from './match'
import type { MockRoute } from './types'

describe('matchPath', () => {
  it('extracts params', () => {
    expect(matchPath('/api/v1/profiles/:identifier', '/api/v1/profiles/juan')).toEqual({
      identifier: 'juan',
    })
  })

  it('decodes encoded params', () => {
    expect(matchPath('/api/v1/communities/:slug', '/api/v1/communities/caf%C3%A9')).toEqual({
      slug: 'café',
    })
  })

  it('rejects different segments or lengths', () => {
    expect(matchPath('/api/v1/profiles/:id', '/api/v1/users/juan')).toBeNull()
    expect(matchPath('/api/v1/profiles/:id', '/api/v1/profiles/juan/followers')).toBeNull()
  })
})

describe('findMock', () => {
  const route: MockRoute = {
    method: 'GET',
    path: '/api/v1/profiles/:identifier',
    kind: 'contract',
    schema: z.unknown(),
    example: { params: {}, query: {}, body: undefined },
    handler: () => ({ status: 200 }),
  }

  it('finds a route by method and path', () => {
    expect(findMock([route], 'GET', '/api/v1/profiles/juan')).toEqual({
      route,
      params: { identifier: 'juan' },
    })
  })

  it('does not match another method', () => {
    expect(findMock([route], 'DELETE', '/api/v1/profiles/juan')).toBeNull()
  })
})
