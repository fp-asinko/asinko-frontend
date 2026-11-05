import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'
import { chooseType } from './fixtures/feed-type'

// specs/feed-type-filter against the production build with API_MOCKS=true.

const articles = (page: Page) => page.getByRole('main').getByRole('article')

test.describe('The feed’s type filter', () => {
  test('shows only theses, in the URL, keeping the tab (FT-04 to FT-06)', async ({ page }) => {
    await page.goto('/en')
    await chooseType(page, 'Theses')
    await expect(page).toHaveURL(/\/en\?type=theses$/)
    await expect(articles(page).first()).toBeVisible()
    for (const card of await articles(page).all()) {
      // Its badge, wherever its header puts it.
      await expect(card.getByText('Thesis', { exact: true })).toBeVisible()
    }
    // The menu says it, checked.
    await page.getByRole('main').getByRole('button', { name: 'Content type: Theses' }).click()
    await expect(page.getByRole('menuitemradio', { name: 'Theses' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  test('works from the keyboard: Enter opens it with the focus in, arrows and Enter choose (FT-07)', async ({
    page,
  }) => {
    await page.goto('/en')
    await page.getByRole('main').getByRole('button', { name: 'Content type: All' }).focus()
    await page.keyboard.press('Enter')
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    // The focus goes into the menu, so the arrows move through it.
    await expect
      .poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('[role=menu]'))))
      .toBe(true)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/type=(posts|theses)/)
  })

  test('reads an old ?filter=polls link as the Polls type (FT-10)', async ({ page }) => {
    await page.goto('/en?filter=polls')
    await expect(
      page.getByRole('main').getByRole('button', { name: 'Content type: Polls' }),
    ).toBeVisible()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`keeps the tabs, New and the type on one line at 360px, accessible, in ${theme} (FT-01, FT-02, FT-12)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })
      for (const locale of ['en', 'es', 'pt']) {
        await page.goto(`/${locale}`)
        // "Feed" in every language; the menu, by its name's "Content type: …" in each.
        const tabs = page.getByRole('main').getByRole('navigation', { name: 'Feed' })
        const menu = page
          .getByRole('main')
          .getByRole('button', { name: /^[^:]+: \S+$/ })
          .first()
        await expect(menu).toBeVisible()
        const [a, b] = [(await tabs.boundingBox())!, (await menu.boundingBox())!]
        // The same line: the menu's middle within the tabs' height.
        expect(b.y + b.height / 2).toBeGreaterThan(a.y)
        expect(b.y + b.height / 2).toBeLessThan(a.y + a.height)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow).toBeLessThanOrEqual(0)
      }
      await page.goto('/en')
      await expectNoA11yViolations(page)
    })
  }
})
