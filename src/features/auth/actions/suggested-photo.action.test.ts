// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSuggestedPhoto } from './suggested-photo.action'

const deps = vi.hoisted(() => ({
  session: null as Record<string, unknown> | null,
  download: vi.fn(async () => ({ type: 'image/jpeg', base64: 'AQID' })),
}))
vi.mock('@/lib/auth/session', () => ({ readSession: async () => deps.session }))
vi.mock('@/lib/auth/suggested-photo', () => ({ downloadSuggestedPhoto: deps.download }))

const PHOTO = 'https://lh3.googleusercontent.com/a/x=s96-c'

describe('getSuggestedPhoto (specs/auth AU-22, design.md § 15)', () => {
  beforeEach(() => deps.download.mockClear())

  it('downloads the Google photo of an account still without a profile', async () => {
    deps.session = { username: null, photoSuggestion: PHOTO }
    expect(await getSuggestedPhoto()).toEqual({ type: 'image/jpeg', base64: 'AQID' })
    expect(deps.download).toHaveBeenCalledWith(PHOTO)
  })

  it('gives nothing without a session, with a profile already, or without a Google photo', async () => {
    for (const session of [
      null,
      { username: 'ana', photoSuggestion: PHOTO },
      { username: null, photoSuggestion: null },
      { username: null },
    ]) {
      deps.session = session
      expect(await getSuggestedPhoto()).toBeNull()
    }
    expect(deps.download).not.toHaveBeenCalled()
  })
})
