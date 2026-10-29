// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { googleErrorPath, localeOf, welcomePath } from '@/app/auth/paths'
import { finishGoogle, startGoogle } from './google'

const USER_ID = '00000000-0000-4000-8000-0000000000aa'
const TOKENS = {
  accessToken: 'a',
  refreshToken: 'r',
  expiresIn: 3600,
  userId: USER_ID,
  email: null,
}

describe('Google with PKCE (specs/auth AU-10)', () => {
  it('sends to Supabase with the challenge of a verifier kept in the cookie', async () => {
    const googleUrl = vi.fn((redirectTo: string, challenge: string) => `${redirectTo}#${challenge}`)
    const { url, cookie } = await startGoogle({ googleUrl }, 'https://asinko.app', '/es/hub/macro')
    const pending = JSON.parse(cookie) as { verifier: string; next: string }

    expect(pending.next).toBe('/es/hub/macro')
    const [redirectTo, challenge] = googleUrl.mock.calls[0]!
    expect(redirectTo).toBe('https://asinko.app/auth/callback')
    // S256: the challenge is the verifier's SHA-256, base64url.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pending.verifier))
    expect(challenge).toBe(Buffer.from(digest).toString('base64url'))
    expect(url).toContain(challenge)
  })

  it('never keeps a way back out of the site', async () => {
    const { cookie } = await startGoogle({ googleUrl: () => '' }, 'https://asinko.app', '//evil.x')
    expect(JSON.parse(cookie).next).toBe('/')
  })

  it('exchanges the code with the kept verifier, and comes back where the person was', async () => {
    const exchangeCode = vi.fn(async () => ({ ok: true as const, tokens: TOKENS }))
    const cookie = JSON.stringify({ verifier: 'v'.repeat(43), next: '/es/hub/macro' })
    expect(await finishGoogle({ exchangeCode }, 'the-code', cookie)).toEqual({
      ok: true,
      tokens: TOKENS,
      next: '/es/hub/macro',
    })
    expect(exchangeCode).toHaveBeenCalledWith('the-code', 'v'.repeat(43))
  })

  it('fails without the cookie, without a code, or when Supabase refuses the code', async () => {
    const exchangeCode = vi.fn(async () => ({ ok: false as const, reason: 'expired' as const }))
    const cookie = JSON.stringify({ verifier: 'v'.repeat(43), next: '/es' })
    expect(await finishGoogle({ exchangeCode }, 'code', undefined)).toEqual({
      ok: false,
      next: '/',
    })
    expect(await finishGoogle({ exchangeCode }, null, cookie)).toEqual({ ok: false, next: '/es' })
    expect(await finishGoogle({ exchangeCode }, 'code', cookie)).toEqual({ ok: false, next: '/es' })
    expect(await finishGoogle({ exchangeCode }, 'code', '{bad')).toEqual({ ok: false, next: '/' })
  })

  it('goes to choose a username, or to the login page, in the language of the way back', () => {
    expect(localeOf('/es/hub/macro')).toBe('es')
    expect(localeOf('/pt?x=1')).toBe('pt')
    expect(localeOf('/hub/macro')).toBe('en')
    expect(welcomePath('/es/hub/macro')).toBe('/es/welcome?next=%2Fes%2Fhub%2Fmacro')
    expect(googleErrorPath('/')).toBe('/en/login?error=google&next=%2F')
  })
})
