// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const deps = vi.hoisted(() => ({
  session: null as { username: string | null } | null,
  availability: vi.fn(async () => 'available' as const),
}))
vi.mock('@/lib/auth/session', () => ({ readSession: async () => deps.session }))
vi.mock('../lib/profile-api', () => ({ usernameAvailability: deps.availability }))

const { checkUsername } = await import('./check-username.action')

describe('checkUsername (specs/auth AU-24, design.md § 17)', () => {
  beforeEach(() => {
    deps.availability.mockClear()
    deps.session = { username: null }
  })

  it('asks the backend for a valid username, trimmed', async () => {
    expect(await checkUsername(' ana_92 ')).toBe('available')
    expect(deps.availability).toHaveBeenCalledWith('ana_92')
  })

  it('never asks for an invalid one, nor without a session or with a profile already', async () => {
    expect(await checkUsername('a-b')).toBe('unknown')
    expect(await checkUsername(42)).toBe('unknown')
    deps.session = null
    expect(await checkUsername('ana_92')).toBe('unknown')
    deps.session = { username: 'ana' }
    expect(await checkUsername('ana_92')).toBe('unknown')
    expect(deps.availability).not.toHaveBeenCalled()
  })
})
