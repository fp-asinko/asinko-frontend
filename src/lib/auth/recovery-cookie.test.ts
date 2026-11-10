// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const jar = vi.hoisted(() => ({
  values: new Map<string, string>(),
  origin: null as string | null,
  set: vi.fn(),
  delete: vi.fn(),
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.values.has(name) ? { value: jar.values.get(name) } : undefined),
    set: jar.set,
    delete: jar.delete,
  }),
  headers: async () => new Headers(jar.origin ? { origin: jar.origin } : {}),
}))
vi.mock('@/env', () => ({ env: { NEXT_PUBLIC_SITE_URL: 'https://asinko.app/' } }))
vi.mock('./session', () => ({ secureCookies: () => true }))

const { clearRecovery, markRecoveryVerified, readRecovery, requestOrigin } =
  await import('./recovery-cookie')

describe('the recovery cookie on the server (specs/password-recovery design.md § 3, § 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    jar.values.clear()
    jar.origin = null
  })

  it('reads the token or the mark, and nothing forged', async () => {
    expect(await readRecovery()).toBeNull()
    jar.values.set('asinko-recovery', 'abc123def456')
    expect(await readRecovery()).toEqual({ token: 'abc123def456' })
    jar.values.set('asinko-recovery', 'verified')
    expect(await readRecovery()).toEqual({ verified: true })
    jar.values.set('asinko-recovery', '<bad>')
    expect(await readRecovery()).toBeNull()
  })

  it('marks the link as spent in the same HttpOnly cookie, and deletes it', async () => {
    await markRecoveryVerified()
    expect(jar.set).toHaveBeenCalledWith('asinko-recovery', 'verified', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 3600,
    })
    await clearRecovery()
    expect(jar.delete).toHaveBeenCalledWith({ name: 'asinko-recovery', path: '/' })
  })

  it("takes the request's origin, or the site's when there is none or it is not http", async () => {
    expect(await requestOrigin()).toBe('https://asinko.app')
    jar.origin = 'https://preview-1.asinko.app'
    expect(await requestOrigin()).toBe('https://preview-1.asinko.app')
    jar.origin = 'javascript:alert(1)'
    expect(await requestOrigin()).toBe('https://asinko.app')
    jar.origin = 'not a url'
    expect(await requestOrigin()).toBe('https://asinko.app')
  })
})
