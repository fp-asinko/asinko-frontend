// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { refreshSession } from './refresh-session'
import { parseSession, sessionFromTokens } from './session-cookie'
import type { AuthResult } from './supabase-auth'

const USER_ID = '00000000-0000-4000-8000-0000000000aa'
const NOW = 1_000_000
const tokens = (accessToken: string, userId = USER_ID) => ({
  accessToken,
  refreshToken: `${accessToken}-refresh`,
  expiresIn: 3600,
  userId,
})
// Expires in 30 s: inside the margin.
const expiring = sessionFromTokens({ ...tokens('old'), expiresIn: 30 }, 'maria', NOW)
const fresh = sessionFromTokens(tokens('fresh'), 'maria', NOW)

const authAnswering = (result: AuthResult) => ({ refresh: vi.fn(async () => result) })

describe('refreshSession (specs/auth AU-13, design.md § 4)', () => {
  it('leaves a guest and a fresh token alone, without calling Supabase', async () => {
    const auth = authAnswering({ ok: true, tokens: tokens('new') })
    expect(await refreshSession(undefined, auth, NOW)).toEqual({ kind: 'keep' })
    expect(await refreshSession(JSON.stringify(fresh), auth, NOW)).toEqual({ kind: 'keep' })
    expect(auth.refresh).not.toHaveBeenCalled()
  })

  it('renews a token in its last minute, keeping the user and the username', async () => {
    const auth = authAnswering({ ok: true, tokens: tokens('new') })
    const outcome = await refreshSession(JSON.stringify(expiring), auth, NOW)
    expect(auth.refresh).toHaveBeenCalledWith('old-refresh')
    if (outcome.kind !== 'renewed') throw new Error(outcome.kind)
    expect(parseSession(outcome.value)).toEqual({
      accessToken: 'new',
      refreshToken: 'new-refresh',
      userId: USER_ID,
      username: 'maria',
      expiresAt: NOW + 3_600_000,
    })
  })

  it('ends the session when Supabase refuses the refresh token', async () => {
    const auth = authAnswering({ ok: false, reason: 'expired' })
    expect(await refreshSession(JSON.stringify(expiring), auth, NOW)).toEqual({ kind: 'ended' })
  })

  it('keeps the cookie when Supabase is down: the next action opens the modal', async () => {
    const auth = authAnswering({ ok: false, reason: 'unavailable' })
    expect(await refreshSession(JSON.stringify(expiring), auth, NOW)).toEqual({ kind: 'keep' })
  })

  it('ends a broken cookie, and a refresh that answers for someone else', async () => {
    expect(await refreshSession('{broken', null, NOW)).toEqual({ kind: 'ended' })
    const other = authAnswering({
      ok: true,
      tokens: tokens('new', '00000000-0000-4000-8000-0000000000bb'),
    })
    expect(await refreshSession(JSON.stringify(expiring), other, NOW)).toEqual({ kind: 'ended' })
  })

  it('keeps the session as it is without Supabase configured', async () => {
    expect(await refreshSession(JSON.stringify(expiring), null, NOW)).toEqual({ kind: 'keep' })
  })
})
