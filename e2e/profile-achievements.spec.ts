import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/profile-achievements against the production build with API_MOCKS=true (P-030, mocked).
// María has eleven earned; the demo user (the viewer) has some and sees the missing ones; Jeppe
// has none.

const column = (page: Page) => page.getByRole('complementary', { name: 'Related' })
const trophies = (page: Page) =>
  page.getByRole('region', { name: /^Achievements/ }).locator('visible=true')

test.describe('Achievements, as Reddit’s trophy case', () => {
  test('the last four in the right column from desktop, in the page on a phone (AC-03, AC-05)', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en/user/maria')
    const where = isMobile ? page.getByRole('main') : column(page)
    const card = where.getByRole('region', { name: 'Achievements · 11' })
    await expect(card).toBeVisible()
    await expect(card.getByRole('listitem')).toHaveCount(4)
    await expect(card.getByRole('listitem').first()).toHaveText('100 votes')
    await expect(trophies(page)).toHaveCount(1)
  })

  test('See all leads to the whole list, only what she earned (AC-06, AC-07)', async ({ page }) => {
    await page.goto('/en/user/maria')
    await trophies(page).getByRole('link', { name: "See all of María Ruiz's achievements" }).click()
    await expect(page).toHaveURL(/\/en\/user\/maria\/achievements$/)
    const main = page.getByRole('main')
    await expect(
      main.getByRole('heading', { level: 1, name: "María Ruiz's achievements" }),
    ).toBeVisible()
    await expect(main.getByRole('region', { name: 'Theses and reputation' })).toBeVisible()
    await expect(main.getByText('Locked')).toHaveCount(0)
    await expect(main.getByRole('region', { name: 'Profile' })).toHaveCount(0)
    await expect(page).toHaveTitle(/María Ruiz's achievements/)
    await main.getByRole('link', { name: "Back to María Ruiz's profile" }).click()
    await expect(page).toHaveURL(/\/en\/user\/maria$/)
  })

  test('your own shows what is missing, with its progress (AC-07, AC-09)', async ({ page }) => {
    await page.goto('/en/user/demo/achievements')
    const profile = page.getByRole('main').getByRole('region', { name: 'Profile' })
    await expect(profile.getByText('Locked')).toBeVisible()
    await expect(profile.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '3 of 8')
  })

  test('someone without any: no card, and the page says so; an unknown one, 404 (AC-04, AC-08)', async ({
    page,
  }) => {
    await page.goto('/en/user/jeppe')
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible()
    await expect(trophies(page)).toHaveCount(0)
    await page.goto('/en/user/jeppe/achievements')
    await expect(page.getByRole('main').getByText(/has no achievements yet/)).toBeVisible()
    const response = await page.goto('/en/user/nobody-here/achievements')
    expect(response?.status()).toBe(404)
  })

  test('canonical and hreflang of its own, translated (AC-08)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Not about the device')
    await page.goto('/es/user/maria/achievements')
    await expect(page).toHaveTitle(/Logros de María Ruiz/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/es\/user\/maria\/achievements$/,
    )
    await expect(page.locator('link[rel="alternate"][hreflang="pt"]')).toHaveAttribute(
      'href',
      /\/pt\/user\/maria\/achievements$/,
    )
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible in ${theme} (AC-10)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })
      for (const path of ['/en/user/demo', '/en/user/demo/achievements']) {
        await page.goto(path)
        if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
        await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible()
        const width = await page.evaluate(() => document.documentElement.scrollWidth)
        expect(width).toBeLessThanOrEqual(360)
        await expectNoA11yViolations(page)
      }
    })
  }
})
