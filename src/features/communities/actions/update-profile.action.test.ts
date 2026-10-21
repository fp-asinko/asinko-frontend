// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { editProfileChangesSchema, editProfileSchema } from '../schemas/edit-profile.schema'
import { updateProfile } from './update-profile.action'

const ME = '00000000-0000-4000-8000-000000000100'
const deps = vi.hoisted(() => ({
  viewer: null as { id: string; username: string } | null,
  updateProfileAs: vi.fn(),
}))
vi.mock('@/lib/session', () => ({ getViewer: async () => deps.viewer }))
vi.mock('../lib/profile-api', () => ({ updateProfileAs: deps.updateProfileAs }))

const VALID = {
  displayName: ' Juan ',
  headline: ' Macro | Rates ',
  countryCode: 'AR',
  city: ' La Plata ',
  bio: '  Macro and rates.  ',
  links: [{ url: ' https://x.com/juan ' }],
  openTo: ['QUESTIONS'],
  avatarUrl: null,
  bannerUrl: null,
}

const issue = (input: unknown) => editProfileSchema.safeParse(input).error?.issues[0]?.message

describe('editProfileSchema (specs/profile-edit PE-04, specs/profile-presentation PP-05, PP-06)', () => {
  it('trims the texts and leaves the links as plain URLs', () => {
    expect(editProfileSchema.parse(VALID)).toEqual({
      displayName: 'Juan',
      headline: 'Macro | Rates',
      countryCode: 'AR',
      city: 'La Plata',
      bio: 'Macro and rates.',
      links: ['https://x.com/juan'],
      openTo: ['QUESTIONS'],
      avatarUrl: null,
      bannerUrl: null,
    })
  })

  it('takes empty texts and no country: they remove what there was', () => {
    const empty = { ...VALID, displayName: '', headline: '', countryCode: '', city: '', bio: '' }
    expect(editProfileSchema.safeParse({ ...empty, links: [] }).success).toBe(true)
  })

  it('refuses each text past its limit, with its message', () => {
    expect(issue({ ...VALID, displayName: 'x'.repeat(51) })).toBe(
      'communities.edit.errors.displayNameTooLong',
    )
    expect(issue({ ...VALID, headline: 'x'.repeat(101) })).toBe(
      'communities.edit.errors.headlineTooLong',
    )
    expect(issue({ ...VALID, city: 'x'.repeat(61) })).toBe('communities.edit.errors.cityTooLong')
    // The About of P-024 (specs/profile-showcase PS-04).
    expect(issue({ ...VALID, bio: 'x'.repeat(2001) })).toBe('communities.edit.errors.bioTooLong')
    expect(editProfileSchema.safeParse({ ...VALID, bio: 'x'.repeat(2000) }).success).toBe(true)
    expect(issue({ ...VALID, openTo: ['TRADING'] })).toBeDefined()
    expect(issue({ ...VALID, openTo: ['AMAS', 'AMAS'] })).toBe('communities.edit.errors.openTo')
  })

  it('takes up to five http(s) links and a country code only', () => {
    expect(issue({ ...VALID, links: [{ url: 'javascript:alert(1)' }] })).toBe(
      'communities.edit.errors.link',
    )
    expect(issue({ ...VALID, links: Array(6).fill({ url: 'https://a.com' }) })).toBe(
      'communities.edit.errors.tooManyLinks',
    )
    expect(editProfileSchema.safeParse({ ...VALID, countryCode: 'Argentina' }).success).toBe(false)
  })

  it('takes only what changed, as the form leaves it: links as plain URLs (PP-08)', () => {
    expect(editProfileChangesSchema.parse({ headline: 'Rates' })).toEqual({ headline: 'Rates' })
    expect(editProfileChangesSchema.parse({ links: [' https://x.com/juan '] })).toEqual({
      links: ['https://x.com/juan'],
    })
    expect(editProfileChangesSchema.safeParse({ links: ['javascript:x'] }).success).toBe(false)
  })
})

describe('updateProfile (PE-03 to PE-06, PP-08, PP-09)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.viewer = { id: ME, username: 'demo' }
    deps.updateProfileAs.mockResolvedValue({ ok: true, data: null })
  })

  it('saves what changed as the viewer of the session, never as someone the form says', async () => {
    expect(
      await updateProfile({
        bio: ' Macro and rates. ',
        links: ['https://x.com/juan'],
        userId: '00000000-0000-4000-8000-000000000999',
      }),
    ).toEqual({ ok: true, data: null })
    expect(deps.updateProfileAs).toHaveBeenCalledWith(ME, {
      bio: 'Macro and rates.',
      links: ['https://x.com/juan'],
    })
  })

  it('refuses a field before asking, with its error', async () => {
    const result = await updateProfile({ bio: 'x'.repeat(2001) })
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

  it('says which field the backend refused, or the general reason (PP-09)', async () => {
    const refuse = (code: string, errorKey = 'api.errors.UNKNOWN') =>
      deps.updateProfileAs.mockResolvedValue({ ok: false, code, errorKey })
    refuse('BIO_TOO_LONG')
    expect(await updateProfile({ bio: 'Hi' })).toEqual({
      ok: false,
      error: 'communities.edit.errors.bioTooLong',
      fieldErrors: { bio: ['communities.edit.errors.bioTooLong'] },
    })
    refuse('INVALID_LINK')
    expect(await updateProfile({ links: [] })).toMatchObject({
      fieldErrors: { links: ['communities.edit.errors.link'] },
    })
    // The backend's codes since 2026-10-20 (specs/backend-answer-1020 BA-02), each under its field.
    for (const [code, field, key] of [
      ['HEADLINE_TOO_LONG', 'headline', 'headlineTooLong'],
      ['CITY_TOO_LONG', 'city', 'cityTooLong'],
      ['TOO_MANY_LINKS', 'links', 'tooManyLinks'],
    ] as const) {
      refuse(code)
      expect(await updateProfile({ bio: 'Hi' })).toMatchObject({
        fieldErrors: { [field]: [`communities.edit.errors.${key}`] },
      })
    }
    refuse('HTTP', 'api.errors.UNAVAILABLE')
    expect(await updateProfile({ bio: 'Hi' })).toEqual({
      ok: false,
      error: 'api.errors.UNAVAILABLE',
    })
  })
})
