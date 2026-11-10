// @vitest-environment node
import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'
import { RECOVERY_COOKIE } from '@/lib/auth/recovery'
import { GET } from './route'

vi.mock('@/lib/auth/session', () => ({ secureCookies: () => true }))

const open = (query: string) => GET(new NextRequest(`https://asinko.app/auth/reset?${query}`))

describe('/auth/reset (specs/password-recovery PR-06, PR-13, PR-14)', () => {
  it('keeps the token in an HttpOnly cookie and goes to the page without it', () => {
    const response = open('next=%2Fes%2Fhub%2Fmacro&token_hash=abc123def456&type=recovery')
    const location = response.headers.get('location') ?? ''
    expect(location).toBe('https://asinko.app/es/reset-password?next=%2Fes%2Fhub%2Fmacro')
    expect(location).not.toContain('abc123def456')

    const cookie = response.cookies.get(RECOVERY_COOKIE)
    expect(cookie?.value).toBe('abc123def456')
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'lax', secure: true, path: '/' })
    expect(cookie?.maxAge).toBe(3600)
  })

  it('goes to the page without a cookie when the link is not a recovery link (PR-08)', () => {
    const response = open('next=%2Fen&token_hash=bad%3Ctoken&type=recovery')
    expect(response.headers.get('location')).toBe('https://asinko.app/en/reset-password?next=%2Fen')
    expect(response.cookies.get(RECOVERY_COOKIE)).toBeUndefined()
  })

  it('drops a next that leaves the site, back to the Home in the default language', () => {
    const response = open('next=https%3A%2F%2Fevil.example&token_hash=abc123def456&type=recovery')
    expect(response.headers.get('location')).toBe('https://asinko.app/en/reset-password?next=%2F')
  })
})
