// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ apiRequest: vi.fn() }))
vi.mock('@/lib/api', () => api)

const { createProfile, isUsernameTaken } = await import('./profile-api')

const expected = (code: string, status = 422) => ({ ok: false, kind: 'expected', code, status })

describe('profile-api (specs/auth design.md § 6)', () => {
  beforeEach(() => api.apiRequest.mockReset())

  it('creates the profile with age and terms accepted, and the given Bearer', async () => {
    api.apiRequest.mockResolvedValue({ ok: true, data: { username: 'ana_92' } })
    expect(await createProfile('ana_92', 'es', 'access')).toEqual({ ok: true, username: 'ana_92' })
    expect(api.apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/api/v1/users',
        body: { username: 'ana_92', ageConfirmed: true, termsAccepted: true, language: 'es' },
        accessToken: 'access',
      }),
    )
  })

  it.each([
    ['USERNAME_TAKEN', 'usernameTaken'],
    ['INVALID_USERNAME', 'usernameInvalid'],
    ['TERMS_NOT_ACCEPTED', 'termsRequired'],
    ['SOMETHING_ELSE', 'unavailable'],
  ])('turns %s into %s', async (code, reason) => {
    api.apiRequest.mockResolvedValue(expected(code))
    expect(await createProfile('ana_92', 'en')).toEqual({ ok: false, reason })
  })

  it('says a backend down is unavailable', async () => {
    api.apiRequest.mockResolvedValue({ ok: false, kind: 'unexpected', code: 'HTTP', status: 503 })
    expect(await createProfile('ana_92', 'en')).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('knows a username is taken by its public profile, free by a 404, and unknown otherwise', async () => {
    api.apiRequest.mockResolvedValueOnce({ ok: true, data: { username: 'maria' } })
    expect(await isUsernameTaken('maria')).toBe(true)
    api.apiRequest.mockResolvedValueOnce(expected('NOT_FOUND', 404))
    expect(await isUsernameTaken('ana_92')).toBe(false)
    api.apiRequest.mockResolvedValueOnce({
      ok: false,
      kind: 'unexpected',
      code: 'HTTP',
      status: 500,
    })
    expect(await isUsernameTaken('ana_92')).toBeNull()
  })
})
