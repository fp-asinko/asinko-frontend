import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'
import { settings } from './fixtures/settings'

// specs/header-refresh against the production build with API_MOCKS=true.

const centerOf = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const box = document.querySelector(sel)!.getBoundingClientRect()
    return box.left + box.width / 2
  }, selector)

test.describe('Top bar', () => {
  for (const width of [1440, 1280, 1024]) {
    test(`the search sits centered over the feed at ${width}px (HR-01)`, async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'The search bar exists from md')
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/en')
      const search = page.getByRole('banner').getByRole('button', { name: 'Search' })
      await expect(search).toBeVisible()
      const box = (await search.boundingBox())!
      const feed = await centerOf(page, 'main')
      expect(Math.abs(box.x + box.width / 2 - feed)).toBeLessThanOrEqual(1)
      expect(box.width).toBeGreaterThan(400)
    })
  }

  for (const [width, locale] of [
    [360, 'es'],
    [768, 'en'],
  ] as const) {
    test(`nothing overflows sideways at ${width}px in ${locale} (HR-04)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto(`/${locale}`)
      await expect(page.getByRole('banner')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    })
  }

  test('only the essentials on the right: no tokens, settings in "⋯" (HR-02, HR-03)', async ({
    page,
  }) => {
    await page.goto('/en')
    const banner = page.getByRole('banner')
    await expect(banner.getByRole('button', { name: 'Tokens' })).toHaveCount(0)
    await expect(banner.getByRole('combobox')).toHaveCount(0)
    await expect(banner.getByRole('switch')).toHaveCount(0)
    await expect(banner.getByRole('button', { name: 'More options' })).toBeVisible()
  })

  test('the "⋯" menu works with the keyboard alone (HR-03)', async ({ page }) => {
    await page.goto('/en')
    const trigger = page.getByRole('button', { name: 'More options' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()

    // Down the items until Dark mode, then choose it.
    const dark = menu.getByRole('menuitemcheckbox', { name: 'Dark mode' })
    for (
      let step = 0;
      step < 6 && !(await dark.evaluate((el) => el === document.activeElement));
      step++
    ) {
      await page.keyboard.press('ArrowDown')
    }
    await expect(dark).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('html')).toHaveClass(/dark/)

    if (await menu.isVisible()) await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`stays accessible with the "⋯" menu open in ${theme} (HR-08)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.goto('/en')
      await settings(page)
      await expectNoA11yViolations(page)
    })
  }
})
