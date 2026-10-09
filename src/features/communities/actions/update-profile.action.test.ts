// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { editProfileSchema } from '../schemas/edit-profile.schema'
import { updateProfile } from './update-profile.action'

const deps = vi.hoisted(() => ({
  viewer: { id: '00000000-0000-4000-8000-000000000100', username: 'demo' } as {
    id: string
    username: string
  } | null,
  updateProfileAs: vi.fn(),
}))
vi.mock('@/lib/session', () => ({ getViewer: async () => deps.viewer }))
vi.mock('../lib/profile-api', () => ({ updateProfileAs: deps.updateProfileAs }))

describe('editProfileSchema (specs/profile-edit PE-04)', () => {
  it('trims the bio, takes an empty one and refuses more than 160 characters', () => {
    expect(editProfileSchema.parse({ bio: '  Macro and rates.  ' })).toEqual({
      bio: 'Macro and rates.',
    })
    expect(editProfileSchema.parse({ bio: '' })).toEqual({ bio: '' })
    expect(editProfileSchema.safeParse({ bio: 'x'.repeat(160) }).success).toBe(true)
    const tooLong = editProfileSchema.safeParse({ bio: 'x'.repeat(161) })
    expect(tooLong.success).toBe(false)
    expect(tooLong.error?.issues[0]?.message).toBe('communities.edit.errors.bioTooLong')
  })
})

describe('updateProfile (PE-03 to PE-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.viewer = { id: '00000000-0000-4000-8000-000000000100', username: 'demo' }
    deps.updateProfileAs.mockResolvedValue({ ok: true, data: { bio: 'Macro and rates.' } })
  })

  it('saves the bio as the viewer of the session, never as someone the form says', async () => {
    expect(
      await updateProfile({
        bio: ' Macro and rates. ',
        userId: '00000000-0000-4000-8000-000000000999',
      }),
    ).toEqual({ ok: true, data: { bio: 'Macro and rates.' } })
    expect(deps.updateProfileAs).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000100', {
      bio: 'Macro and rates.',
    })
  })

  it('refuses a bio too long before asking, with the field error', async () => {
    const result = await updateProfile({ bio: 'x'.repeat(161) })
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { bio: ['communities.edit.errors.bioTooLong'] },
    })
    expect(deps.updateProfileAs).not.toHaveBeenCalled()
  })

  it('asks for a session', async () => {
    deps.viewer = null
    expect(await updateProfile({ bio: 'Hi' })).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
  })

  it("says the backend's refusal with the editor's message", async () => {
    deps.updateProfileAs.mockResolvedValue({
      ok: false,
      code: 'BIO_TOO_LONG',
      errorKey: 'api.errors.UNKNOWN',
    })
    expect(await updateProfile({ bio: 'Hi' })).toEqual({
      ok: false,
      error: 'communities.edit.errors.bioTooLong',
    })
    deps.updateProfileAs.mockResolvedValue({
      ok: false,
      code: 'HTTP',
      errorKey: 'api.errors.UNAVAILABLE',
    })
    expect(await updateProfile({ bio: 'Hi' })).toEqual({
      ok: false,
      error: 'api.errors.UNAVAILABLE',
    })
  })
})
