import { gzipSync } from 'node:zlib'
import { expect, test } from '@playwright/test'

// F-41 / seo.md § Performance: first-load JS per route ≤ 241 KB gzip, measured as the sum of every
// <script src> in the initial HTML, gzipped.
// 230 until 2026-10-07 (raised by the PO with specs/community-pages), 235 until 2026-10-08 (raised
// by the PO with specs/mention-autocomplete), 240 until 2026-11-07 (raised by the PO with
// specs/community-create). History in seo.md § Performance.
const BUDGET_KB = 241

// A guest (the login page sends anyone else away) and an account without a username (the page to
// choose it): with API_MOCKS=true there is the demo user unless a cookie says otherwise.
const GUEST = 'asinko-mock-guest=1'
const NO_USERNAME = `asinko-session=${encodeURIComponent(
  JSON.stringify({
    accessToken: 'mock-access.00000000-0000-4000-8000-0000000000f1.perf',
    refreshToken: 'mock-refresh.00000000-0000-4000-8000-0000000000f1.perf',
    userId: '00000000-0000-4000-8000-0000000000f1',
    username: null,
    expiresAt: Date.now() + 3_600_000,
  }),
)}`

test.describe('JavaScript budget', () => {
  test.skip(({ isMobile }) => isMobile, 'Same bundle on every device')

  for (const entry of [
    '/en',
    '/en?filter=polls',
    '/en?community=BTC',
    '/en/does-not-exist',
    // specs/community-pages CP-18
    '/en/hub/defi',
    '/en/asset/BTC',
    '/en/user/federico',
    '/en/user/maria?tab=theses',
    // specs/profile-showcase PS-11: your own, with its checklist and "⋯"
    '/en/user/demo',
    '/en/user/maria/achievements',
    // specs/community-widgets CW-14: a group with its widgets and, for its moderator, the pencil
    '/en/hub/trading-on-chain',
    // specs/profile-aside PA-06: its card, in the page and in the right column
    '/en/user/maria',
    // specs/backend-adoption BK-03
    '/en/user/maria?tab=replies',
    // specs/submit-page SU-11
    '/en/submit',
    '/en/submit?community=defi',
    // specs/thesis-create TC-19
    '/en/submit?type=thesis',
    // specs/community-create CG-14
    '/en/create-group',
    // specs/thesis-detail TD-19: a thesis's page
    '/en/thesis/00000000-0000-4000-8000-000000009001',
    // specs/post-create-detail PC-19
    '/en/post/00000000-0000-4000-8000-000000004001/whales-accumulated-48-000-btc-in-two-weeks',
    // specs/auth AU-19
    ['/en/login', GUEST],
    ['/en/login?mode=signup', GUEST],
    ['/en/welcome', NO_USERNAME],
    // specs/password-recovery PR-17
    ['/en/login?mode=recover', GUEST],
    ['/en/reset-password', GUEST],
  ].map((entry) => (typeof entry === 'string' ? [entry] : entry))) {
    const [path, cookie] = entry as [string, string?]
    test(`${path} stays under ${BUDGET_KB} KB gzip`, async ({ request }) => {
      const response = await request.get(path, cookie ? { headers: { cookie } } : undefined)
      // The auth pages themselves, not where they would send someone else.
      if (cookie) expect(new URL(response.url()).pathname).toBe(new URL(path, 'http://x').pathname)
      const html = await response.text()
      const sources = [
        ...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1])),
      ]

      let bytes = 0
      for (const source of sources) {
        const body = await (await request.get(source as string)).body()
        bytes += gzipSync(body).length
      }

      const kilobytes = bytes / 1024
      test
        .info()
        .annotations.push({ type: 'first-load JS', description: `${kilobytes.toFixed(1)} KB gzip` })
      expect(kilobytes).toBeLessThanOrEqual(BUDGET_KB)
    })
  }
})
