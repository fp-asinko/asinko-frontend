import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/share-menu against the production build with API_MOCKS=true. Headless Chromium has no
// system share sheet, so the phone project opens the window too (SM-06: 360px).

const FED_PATH =
  '/en/post/00000000-0000-4000-8000-000000004002/the-fed-cuts-25-bps-what-it-means-for-crypto'

async function openWindow(page: Page) {
  await page.goto(FED_PATH)
  const share = page.getByRole('article').first().getByRole('button', { name: 'Share' })
  await share.click()
  const dialog = page.getByRole('dialog', { name: 'Share post' })
  await expect(dialog).toBeVisible()
  return { share, dialog }
}

test.describe('Share window', () => {
  test("a post's Share opens the window: its image, Copy link and the networks (SM-01 to SM-04)", async ({
    page,
    context,
    baseURL,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const { dialog } = await openWindow(page)
    const image = dialog.getByRole('img', { name: 'The Fed cuts 25 bps: what it means for crypto' })
    await expect(image).toBeVisible()
    // The share image loaded (specs/share-preview), not a broken one.
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1200)

    const copy = dialog.getByRole('button', { name: 'Copy link' })
    await expect(copy).toBeFocused()
    const link = `${baseURL}${FED_PATH}`
    await expect(dialog.getByRole('link', { name: 'X (opens in a new tab)' })).toHaveAttribute(
      'href',
      new RegExp(
        `^https://x\\.com/intent/post\\?url=${encodeURIComponent(link).replace(/[.?]/g, '\\$&')}`,
      ),
    )
    for (const name of [/WhatsApp/, /Telegram/, /Email/]) {
      await expect(dialog.getByRole('link', { name })).toBeVisible()
    }

    await copy.click()
    await expect(dialog.getByRole('button', { name: 'Link copied' })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link)
  })

  test('from the feed it opens over it: the feed never goes back to its skeleton (a bug)', async ({
    page,
  }) => {
    await page.goto('/en')
    const feed = page.getByRole('main')
    await feed.getByRole('article').first().waitFor()
    // Watched from the click on: a skeleton of the feed at any moment is the bug.
    await page.evaluate(() => {
      const seen = { skeleton: false }
      ;(window as unknown as { seen: typeof seen }).seen = seen
      new MutationObserver(() => {
        if (document.querySelector('main [data-slot=skeleton]')) seen.skeleton = true
      }).observe(document.body, { childList: true, subtree: true })
    })
    await feed.getByRole('button', { name: 'Share' }).first().click()
    await expect(page.getByRole('dialog', { name: 'Share post' })).toBeVisible()
    expect(
      await page.evaluate(
        () => (window as unknown as { seen: { skeleton: boolean } }).seen.skeleton,
      ),
    ).toBe(false)
  })

  test('Esc closes it and the focus goes back to Share (SM-05)', async ({ page }) => {
    const { share, dialog } = await openWindow(page)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(share).toBeFocused()
  })

  test("a comment's Share still copies its link (Q4)", async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(FED_PATH)
    const comments = page.getByRole('region', { name: /comments/i })
    await comments.getByRole('button', { name: 'Share' }).first().click()
    await expect(comments.getByRole('button', { name: 'Link copied' }).first()).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible in ${theme} (SM-06)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      const { dialog } = await openWindow(page)
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      const box = (await dialog.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(360)
      expect(await dialog.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
    })
  }
})
