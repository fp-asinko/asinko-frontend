// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { keptRecoveryToken, recoveryRedirect, recoveryToken } from './recovery'

describe('the recovery link (specs/password-recovery design.md § 3)', () => {
  it('takes the token of a recovery link only', () => {
    const link = (query: string) => recoveryToken(new URLSearchParams(query))
    expect(link('token_hash=abc123def456&type=recovery')).toBe('abc123def456')
    expect(link('token_hash=pkce_abc-123_def&type=recovery')).toBe('pkce_abc-123_def')
    expect(link('token_hash=abc123def456&type=signup')).toBeNull()
    expect(link('token_hash=abc123def456')).toBeNull()
    expect(link('token_hash=short&type=recovery')).toBeNull()
    expect(link('token_hash=abc%20123%3Cdef&type=recovery')).toBeNull()
    expect(link('type=recovery')).toBeNull()
  })

  it('checks again the token kept in the cookie, which also comes from the browser', () => {
    expect(keptRecoveryToken('abc123def456')).toBe('abc123def456')
    expect(keptRecoveryToken('abc<script>def')).toBeNull()
    expect(keptRecoveryToken(undefined)).toBeNull()
  })

  it('goes back to our route with an internal next only (PR-14)', () => {
    expect(recoveryRedirect('https://asinko.app', '/es/hub/macro?sort=new')).toBe(
      'https://asinko.app/auth/reset?next=%2Fes%2Fhub%2Fmacro%3Fsort%3Dnew',
    )
    expect(recoveryRedirect('https://asinko.app', 'https://evil.example')).toBe(
      'https://asinko.app/auth/reset?next=%2F',
    )
  })
})
