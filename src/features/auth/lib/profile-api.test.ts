// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ apiRequest: vi.fn() }))
vi.mock('@/lib/api', () => api)

const { createProfile, saveAvatar, saveDisplayName, usernameAvailability } =
  await import('./profile-api')

const expected = (code: string, status = 422) => ({ ok: false, kind: 'expected', code, status })

describe('profile-api (specs/auth design.md § 6)', () => {
  beforeEach(() => api.apiRequest.mockReset())

  it('creates the profile with age and terms accepted, and the given Bearer', async () => {
    api.apiRequest.mockResolvedValue({ ok: true, data: { username: 'ana_92' } })
    expect(await createProfile('ana_92', 'es', 'access')).toEqual({
      ok: true,
      username: 'ana_92',
    })
    expect(api.apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/api/v1/users',
        body: { username: 'ana_92', ageConfirmed: true, termsAccepted: true, language: 'es' },
        accessToken: 'access',
      }),
    )
  })

  it('asks whether a username is free, and says unknown when it cannot tell (AU-24, P-035)', async () => {
    api.apiRequest.mockResolvedValue({ ok: true, data: { available: true } })
    expect(await usernameAvailability('ana_92')).toBe('available')
    expect(api.apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/api/v1/usernames/:username',
        params: { username: 'ana_92' },
      }),
    )
    api.apiRequest.mockResolvedValue({ ok: true, data: { available: false } })
    expect(await usernameAvailability('maria')).toBe('taken')
    api.apiRequest.mockResolvedValue(expected('RATE_LIMITED', 429))
    expect(await usernameAvailability('maria')).toBe('unknown')
  })

  it('saves the display name with PATCH, as POST /users does not keep it (AU-23, P-037)', async () => {
    api.apiRequest.mockResolvedValue({ ok: true, data: { username: 'ana_92' } })
    expect(await saveDisplayName('user-id', 'Ana Pérez')).toBe('saved')
    expect(api.apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        path: '/api/v1/users/:userId',
        params: { userId: 'user-id' },
        body: { displayName: 'Ana Pérez' },
      }),
    )
    api.apiRequest.mockResolvedValue(expected('DISPLAY_NAME_TOO_LONG'))
    expect(await saveDisplayName('user-id', 'x')).toBe('tooLong')
    api.apiRequest.mockResolvedValue({ ok: false, kind: 'unexpected', code: 'HTTP', status: 500 })
    expect(await saveDisplayName('user-id', 'x')).toBe('unavailable')
  })

  it.each([
    ['USERNAME_TAKEN', 'usernameTaken'],
    ['DISPLAY_NAME_TOO_LONG', 'displayNameTooLong'],
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

  it('saves the uploaded photo in the profile (AU-21)', async () => {
    api.apiRequest.mockResolvedValueOnce({ ok: true, data: { avatarUrl: 'https://img/a.webp' } })
    // The URL the profile keeps (the backend re-encodes it, P-021).
    expect(await saveAvatar('user-1', 'https://img/a.webp')).toBe('https://img/a.webp')
    expect(api.apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        params: { userId: 'user-1' },
        body: { avatarUrl: 'https://img/a.webp' },
      }),
    )
    api.apiRequest.mockResolvedValueOnce(expected('INVALID', 422))
    expect(await saveAvatar('user-1', 'x')).toBeNull()
  })
})
