import { gzipSync } from 'node:zlib'
import { expect, test } from '@playwright/test'

// F-41 / seo.md § Performance: first-load JS per route ≤ 230 KB gzip, measured as the sum of every
// <script src> in the initial HTML, gzipped.
const BUDGET_KB = 230

test.describe('JavaScript budget', () => {
  test.skip(({ isMobile }) => isMobile, 'Same bundle on every device')

  for (const path of ['/en', '/en?filter=polls', '/en?community=btc', '/en/does-not-exist']) {
    test(`${path} stays under ${BUDGET_KB} KB gzip`, async ({ request }) => {
      const html = await (await request.get(path)).text()
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
