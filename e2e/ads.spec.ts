import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/ads against the production build with API_MOCKS=true: the mocks put an ad after every 10
// items of a feed page, and one under a post with its comments (P-031).

const WHALES =
  '/en/post/00000000-0000-4000-8000-000000004001/whales-accumulated-48-000-btc-in-two-weeks'

test.describe('Ads', () => {
  test('in the Home: where the feed puts it, the piece whole and capped, the link sponsored (AD-01 to AD-03, AD-06)', async ({
    page,
  }) => {
    await page.goto('/en')
    const feed = page.getByRole('main')
    const ad = feed.getByRole('region', { name: 'Ad: AvaTrade' }).first()
    await expect(ad).toBeVisible()
    // After the first ten cards.
    const before = await ad.evaluate((section) => {
      const item = section.closest('li')!
      return [...item.parentElement!.children].indexOf(item)
    })
    expect(before).toBe(10)

    // The tall piece (4:5) stops at 540px, whole, and its place was held before it loaded.
    const image = ad.getByRole('img', { name: /Indices trading/ })
    await expect(image).toBeVisible()
    const box = (await image.boundingBox())!
    expect(box.height).toBeLessThanOrEqual(541)
    expect(box.height).toBeGreaterThan(300)
    expect(await image.evaluate((img: HTMLImageElement) => getComputedStyle(img).objectFit)).toBe(
      'contain',
    )

    const link = ad.getByRole('link', { name: /Learn more about AvaTrade/ })
    await expect(link).toHaveAttribute('rel', 'sponsored noopener noreferrer')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(ad.getByText('avatrade.com')).toBeVisible()
  })

  test('in a post: one under it, with its comments; none in a search (AD-04, AD-05)', async ({
    page,
  }) => {
    await page.goto(WHALES)
    const comments = page.getByRole('region', { name: /comments/i })
    const ad = comments.getByRole('region', { name: /^Ad: / }).first()
    await expect(ad).toBeVisible()
    // Before the first comment.
    const firstComment = comments.getByRole('listitem').first()
    expect((await ad.boundingBox())!.y).toBeLessThan((await firstComment.boundingBox())!.y)

    await page.goto(`${WHALES}?q=flows`)
    await expect(page.getByRole('region', { name: /comments/i })).toBeVisible()
    await expect(page.getByRole('region', { name: /^Ad: / })).toHaveCount(0)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible in ${theme} (AD-09)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })
      await page.goto('/en')
      const ad = page.getByRole('main').getByRole('region', { name: /^Ad: / }).first()
      await ad.scrollIntoViewIfNeeded()
      await expect(ad.getByRole('img')).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
    })
  }
})
