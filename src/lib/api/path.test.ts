import { describe, expect, it } from 'vitest'
import { buildPath, InvalidPathParamError } from './path'

describe('buildPath', () => {
  it('fills named params', () => {
    expect(buildPath('/api/v1/profiles/:identifier', { identifier: 'maria' })).toBe(
      '/api/v1/profiles/maria',
    )
  })

  it('fills several params', () => {
    expect(
      buildPath('/api/v1/users/:userId/follow/:targetUserId', { userId: 'a', targetUserId: 'b' }),
    ).toBe('/api/v1/users/a/follow/b')
  })

  it('encodes values so user input cannot change the route', () => {
    expect(buildPath('/api/v1/profiles/:identifier', { identifier: '../users?x=1#y' })).toBe(
      '/api/v1/profiles/..%2Fusers%3Fx%3D1%23y',
    )
    expect(buildPath('/api/v1/communities/:slug', { slug: 'café' })).toBe(
      '/api/v1/communities/caf%C3%A9',
    )
  })

  it('leaves patterns without params unchanged', () => {
    expect(buildPath('/api/v1/feed/explore')).toBe('/api/v1/feed/explore')
  })

  it('throws on a missing or empty param (programming error)', () => {
    expect(() => buildPath('/api/v1/profiles/:identifier', {})).toThrow(InvalidPathParamError)
    expect(() => buildPath('/api/v1/profiles/:identifier', { identifier: '' })).toThrow(
      InvalidPathParamError,
    )
  })
})
