import { expect, test } from '@playwright/test'

// F-27, F-28, F-31. Header checks do not depend on the device: they run on desktop only.
test.describe('security headers', () => {
  test.skip(({ isMobile }) => isMobile, 'Device-independent')

  test('every script carries the nonce of the CSP (F-27)', async ({ request }) => {
    const response = await request.get('/en')
    const csp = response.headers()['content-security-policy'] ?? ''
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1]
    expect(nonce).toBeTruthy()

    const html = await response.text()
    const scripts = html.match(/<script[^>]*>/g) ?? []
    expect(scripts.length).toBeGreaterThan(0)
    for (const script of scripts) expect(script).toContain(`nonce="${nonce}"`)
  })

  test('uses a new nonce on every request', async ({ request }) => {
    const nonceOf = async () =>
      /'nonce-([^']+)'/.exec(
        (await request.get('/en')).headers()['content-security-policy'] ?? '',
      )?.[1]
    expect(await nonceOf()).not.toBe(await nonceOf())
  })

  test('never allows eval or inline scripts in production builds (F-28)', async ({ request }) => {
    const csp = (await request.get('/en')).headers()['content-security-policy'] ?? ''
    const scriptSrc = csp.split(';').find((part) => part.trim().startsWith('script-src')) ?? ''
    expect(scriptSrc).not.toContain('unsafe-eval')
    expect(scriptSrc).not.toContain('unsafe-inline')
    expect(csp).toContain("frame-ancestors 'none'")
  })

  test('sends the fixed security headers', async ({ request }) => {
    const headers = (await request.get('/en')).headers()
    expect(headers['strict-transport-security']).toContain('max-age=')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['permissions-policy']).toContain('camera=()')
    expect(headers['x-powered-by']).toBeUndefined()
  })

  test('is not indexable outside production (F-31)', async ({ request }) => {
    expect((await request.get('/en')).headers()['x-robots-tag']).toBe('noindex, nofollow')
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Disallow: /')
  })
})
