import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/right-column against the production build with API_MOCKS=true.

test.describe('Right column', () => {
  test('is there from lg and stays in view while the feed scrolls (RC-01)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The column only exists from 1024px (RC-05 has its own test)')
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/en')
    const column = page.getByRole('complementary', { name: 'Related' })
    await expect(column).toBeVisible()
    await expect(column.getByRole('heading', { name: 'Season tokens' })).toBeVisible()

    // The feed streams in after the column: a wheel before it arrives scrolls a short page and
    // stops at the top (CI, 2026-10-22). Wait for the cards, and wheel again until it is down.
    await expect(page.getByRole('main').getByRole('article').first()).toBeVisible()
    await expect(async () => {
      await page.mouse.wheel(0, 2500)
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)
    }).toPass()
    const box = await column.boundingBox()
    expect(box?.y).toBeLessThanOrEqual(61)
    await expect(column.getByRole('heading', { name: 'Season tokens' })).toBeInViewport()

    // The footer sits at the bottom of the column (decided 2026-10-05).
    const footer = (await column
      .getByRole('contentinfo')
      .or(column.locator('footer'))
      .first()
      .boundingBox())!
    const aside = (await column.boundingBox())!
    expect(Math.abs(footer.y + footer.height - (aside.y + aside.height))).toBeLessThanOrEqual(2)
  })

  test('footer links say "Coming soon" and the page stays accessible (RC-03, RC-04)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The column only exists from 1024px')
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/en')
    const column = page.getByRole('complementary', { name: 'Related' })
    const terms = column.getByRole('button', { name: 'Terms' })
    await expect(terms).toHaveAttribute('aria-disabled', 'true')
    // Coming soon controls are aria-disabled: Playwright needs force (testing.md).
    await terms.click({ force: true })
    await expect(column.getByRole('status').filter({ hasText: 'Coming soon' })).toBeVisible()

    // The first link of a row sits at the left edge: its bubble must stay inside the column.
    await column.getByRole('button', { name: 'Rules' }).click({ force: true })
    const bubble = column.getByRole('status').filter({ hasText: 'Coming soon' }).first()
    await expect(bubble).toBeVisible()
    const [inner, outer] = [await bubble.boundingBox(), await column.boundingBox()]
    expect(inner!.x).toBeGreaterThanOrEqual(outer!.x)
    expect(inner!.x + inner!.width).toBeLessThanOrEqual(outer!.x + outer!.width)
    await expectNoA11yViolations(page)
  })

  for (const width of [360, 768, 1023]) {
    test(`is not shown below 1024px: ${width}px (RC-05)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/en')
      await expect(page.getByRole('heading', { name: 'Season tokens' })).toBeHidden()
    })
  }
})
