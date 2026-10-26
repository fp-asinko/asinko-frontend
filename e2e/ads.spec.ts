import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/ads against the production build with API_MOCKS=true: the mocks put an ad after every 10
// items of a feed page, and one under a post with its comments (P-031).

const WHALES =
  '/en/post/00000000-0000-4000-8000-000000004001/whales-accumulated-48-000-btc-in-two-weeks'

test.describe('Ads', () => {
  test('in the Home: where the feed puts it, the piece whole and capped in phones, the link sponsored (AD-01 to AD-03, AD-06)', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en')
    const feed = page.getByRole('main')
    // The mocks pick them at random: any advertiser.
    const ad = feed.getByRole('region', { name: /^Ad: / }).first()
    await expect(ad).toBeVisible()
    // After the first ten cards, and the glossary term that goes after 8 of them (specs/glossary).
    const before = await ad.evaluate((section) => {
      const item = section.closest('li')!
      return [...item.parentElement!.children].indexOf(item)
    })
    expect(before).toBe(11)

    // Whole, its place held before it loaded. In phones at most 540px tall (a 4:5 piece stops
    // there); from md, the column's width and the height its proportion needs (PO, 2026-10-26).
    const image = ad.getByRole('img')
    await expect(image).toBeVisible()
    const box = (await image.boundingBox())!
    expect(box.height).toBeGreaterThan(50)
    if (isMobile) {
      expect(box.height).toBeLessThanOrEqual(541)
    } else {
      const [width, height] = await image.evaluate((img: HTMLImageElement) => [
        Number(img.getAttribute('width')),
        Number(img.getAttribute('height')),
      ])
      expect(Math.abs(box.height - (box.width * height!) / width!)).toBeLessThanOrEqual(2)
    }
    expect(await image.evaluate((img: HTMLImageElement) => getComputedStyle(img).objectFit)).toBe(
      'contain',
    )

    const link = ad.getByRole('link', { name: /^Learn more about / })
    await expect(link).toHaveAttribute('rel', 'sponsored noopener noreferrer')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(ad.getByText(/^(avatrade|pepperstone|etoro).com$/)).toBeVisible()
  })

  test('in a post: one under its actions, before the comments; none in a search (AD-04, AD-05)', async ({
    page,
  }) => {
    await page.goto(WHALES)
    const main = page.getByRole('main')
    const ad = main.getByRole('region', { name: /^Ad: / }).first()
    await expect(ad).toBeVisible()
    // Below the post's votes and share, above the comments' heading (PO, 2026-10-26).
    const share = main.getByRole('article').first().getByRole('button', { name: 'Share' })
    const heading = page.getByRole('heading', { name: /comments/i, level: 2 })
    const adTop = (await ad.boundingBox())!.y
    expect(adTop).toBeGreaterThan((await share.boundingBox())!.y)
    expect(adTop).toBeLessThan((await heading.boundingBox())!.y)
    // Whole, with no gray bands: the height its proportion needs.
    const image = ad.getByRole('img')
    const box = (await image.boundingBox())!
    const [width, height] = await image.evaluate((img: HTMLImageElement) => [
      Number(img.getAttribute('width')),
      Number(img.getAttribute('height')),
    ])
    if (box.width > 700) {
      expect(Math.abs(box.height - (box.width * height!) / width!)).toBeLessThanOrEqual(2)
    }

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
