import { describe, expect, it } from 'vitest'
import { buildCsp, createNonce } from './csp'

const base = { nonce: 'abc123', isDev: false, siteUrl: 'https://asinko.example' }

function directive(csp: string, name: string): string[] {
  const entry = csp.split('; ').find((part) => part.startsWith(`${name} `))
  return entry ? entry.split(' ').slice(1) : []
}

describe('buildCsp', () => {
  it('allows scripts only with the nonce (F-27)', () => {
    const scripts = directive(buildCsp(base), 'script-src')
    expect(scripts).toContain("'nonce-abc123'")
    expect(scripts).toContain("'strict-dynamic'")
  })

  it('never allows unsafe-eval or unsafe-inline for scripts outside development (F-28)', () => {
    const scripts = directive(buildCsp(base), 'script-src')
    expect(scripts).not.toContain("'unsafe-eval'")
    expect(scripts).not.toContain("'unsafe-inline'")
  })

  it('adds unsafe-eval only in development', () => {
    expect(directive(buildCsp({ ...base, isDev: true }), 'script-src')).toContain("'unsafe-eval'")
  })

  it('allows inline style elements in development without a nonce (dev tools)', () => {
    // A nonce makes browsers ignore 'unsafe-inline', which would block Next's dev overlay.
    const styles = directive(buildCsp({ ...base, isDev: true }), 'style-src-elem')
    expect(styles).toEqual(["'self'", "'unsafe-inline'"])
  })

  it('protects style elements with the nonce and allows style attributes', () => {
    const csp = buildCsp(base)
    expect(directive(csp, 'style-src-elem')).toEqual(["'self'", "'nonce-abc123'"])
    expect(directive(csp, 'style-src-attr')).toEqual(["'unsafe-inline'"])
  })

  it('blocks framing, plugins and foreign forms', () => {
    const csp = buildCsp(base)
    expect(directive(csp, 'frame-ancestors')).toEqual(["'none'"])
    expect(directive(csp, 'object-src')).toEqual(["'none'"])
    expect(directive(csp, 'form-action')).toEqual(["'self'"])
    expect(directive(csp, 'base-uri')).toEqual(["'self'"])
  })

  it('adds the Sentry origin to connect-src only when a DSN is set', () => {
    expect(directive(buildCsp(base), 'connect-src')).toEqual(["'self'"])
    const withSentry = buildCsp({ ...base, sentryDsn: 'https://key@o1.ingest.sentry.io/42' })
    expect(directive(withSentry, 'connect-src')).toEqual(["'self'", 'https://o1.ingest.sentry.io'])
  })

  it('upgrades insecure requests only when the site is served over https', () => {
    expect(buildCsp(base)).toContain('upgrade-insecure-requests')
    expect(buildCsp({ ...base, siteUrl: 'http://localhost:3000' })).not.toContain(
      'upgrade-insecure-requests',
    )
  })
})

describe('createNonce', () => {
  it('returns a base64 value of 16 bytes, different every time', () => {
    const first = createNonce()
    expect(atob(first)).toHaveLength(16)
    expect(createNonce()).not.toBe(first)
  })
})
