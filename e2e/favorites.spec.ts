import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/favorites against the production build with API_MOCKS=true: the demo user follows maria
// and jeppe, maria marked as a favorite; it belongs to groups and assets.

const column = (page: Page) => page.getByRole('region', { name: 'Your interests' })

test.describe('Favorites', () => {
  test.skip(({ isMobile }) => isMobile, 'The column is in the menu panel on phones')

  test('a favorite first with its black star; another marked from its row (FV-01, FV-02)', async ({
    page,
  }) => {
    await page.goto('/en')
    const people = column(page).getByRole('region', { name: 'People' })
    await expect(people.getByRole('listitem').first()).toContainText('maria')
    await expect(
      people.getByRole('button', { name: 'Remove @maria from favorites' }),
    ).toHaveAttribute('aria-pressed', 'true')

    const groups = column(page).getByRole('region', { name: 'Groups' })
    const row = groups.getByRole('listitem').first()
    await row.hover()
    const star = row.getByRole('button', { name: /^Add .* to favorites$/ })
    await expect(star).toHaveCSS('opacity', '1')
    await star.click()
    await expect(row.getByRole('button', { name: /^Remove .* from favorites$/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await page.screenshot({
      path: 'C:/Users/WINDOW~1/AppData/Local/Temp/claude/d--programacion-asinko-web/b01afc19-1a9c-4422-b005-e39e7a2ec9b6/scratchpad/fav-column.png',
      clip: { x: 0, y: 60, width: 280, height: 900 },
    })
  })

  test('each star stays on its row with "more" open (FV-02)', async ({ page }) => {
    // Short: Groups hides some, so it has "more".
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto('/en')
    const groups = column(page).getByRole('region', { name: 'Groups' })
    await groups.getByRole('button', { name: 'more: Groups' }).click()
    for (const row of await groups.getByRole('listitem').all()) {
      const link = (await row.getByRole('link').boundingBox())!
      const star = (await row.getByRole('button').boundingBox())!
      // On the link's line, to its right: not wrapped under it (PO, 2026-10-28).
      expect(star.y).toBeGreaterThanOrEqual(link.y - 1)
      expect(star.y + star.height).toBeLessThanOrEqual(link.y + link.height + 1)
      expect(star.x).toBeGreaterThanOrEqual(link.x + link.width - 1)
    }
  })

  test('a followed profile has its star by "Following" (FV-03)', async ({ page }) => {
    await page.goto('/en/user/maria')
    await expect(
      page.getByRole('main').getByRole('button', { name: 'Remove @maria from favorites' }),
    ).toBeVisible()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`stays accessible with its stars in ${theme} (FV-05)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.goto('/en')
      await expect(
        column(page)
          .getByRole('button', { name: /favorites/ })
          .first(),
      ).toBeAttached()
      await expectNoA11yViolations(page)
    })
  }
})
