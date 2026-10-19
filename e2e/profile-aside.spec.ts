import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/profile-aside against the production build with API_MOCKS=true: María's card, with her
// numbers and where she publishes (P-027, mocked).

const column = (page: Page) => page.getByRole('complementary', { name: 'Related' })
const card = (page: Page) =>
  page.getByRole('region', { name: 'María Ruiz' }).locator('visible=true')

test.describe("The profile's card, as Reddit's", () => {
  test('shows the numbers in the right column from desktop, in the page on a phone (PA-01 to PA-03)', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en/user/maria')
    const where = isMobile ? page.getByRole('main') : column(page)
    const shown = where.getByRole('region', { name: 'María Ruiz' })
    await expect(shown).toBeVisible()
    for (const label of ['Accuracy', 'Streak', 'Correct', 'Incorrect', 'Points', 'Member since']) {
      await expect(shown.getByText(label, { exact: true })).toBeVisible()
    }
    // Only one shows at a time.
    await expect(card(page)).toHaveCount(1)
    // Under the name, followers and following; the streak is in the card (PA-02).
    await expect(page.getByRole('main').getByText(/\d+ streak/)).toHaveCount(0)
  })

  test('"Participates in" leads to where she publishes (PA-05)', async ({ page }) => {
    await page.goto('/en/user/maria')
    const active = card(page).getByRole('region', { name: 'Participates in' })
    const first = active.getByRole('link').first()
    await expect(first).toHaveAccessibleName(/^[$#@]\S+ \d+ posts?$/)
    const href = await first.getAttribute('href')
    await first.click()
    await expect(page).toHaveURL(new RegExp(`${href!.replace(/[$]/g, '\$')}$`))
  })

  test('Share copies the link to the profile on desktop (PA-04)', async ({
    page,
    context,
    isMobile,
  }) => {
    test.skip(isMobile, "A phone opens the system's share sheet")
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/en/user/maria')
    await page.getByRole('main').getByRole('button', { name: 'Share profile' }).click()
    await expect(page.getByText('Link copied').first()).toBeAttached()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/en\/user\/maria$/)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible in ${theme} (PA-06)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/en/user/maria')
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      await expect(card(page)).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
    })
  }
})
