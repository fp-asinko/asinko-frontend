import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/community-members against the production build with API_MOCKS=true: #defi has more than
// 20 members (a page and the rest behind "Load more"), the demo viewer the newest; each row says
// whether the viewer follows them (proposal P-017, mocked).

const members = (page: Page, handle = '#defi') =>
  page.getByRole('dialog', { name: `Members of ${handle}` })

async function open(page: Page, path = '/en/hub/defi', handle = '#defi') {
  await page.goto(path)
  await page
    .getByRole('main')
    .getByRole('button', { name: /members$/ })
    .click()
  await expect(members(page, handle)).toBeVisible()
}

test.describe('Community members', () => {
  test("a group's members open from its count, newest first, and page (CM-01 to CM-03)", async ({
    page,
  }) => {
    await open(page)
    const list = members(page).getByRole('list', { name: 'Members of #defi' })
    await expect(list.getByRole('listitem')).toHaveCount(20)
    // The demo viewer joined last: first, and without a button on its own row.
    const first = list.getByRole('listitem').first()
    await expect(first.getByRole('link', { name: /@demo/ })).toBeVisible()
    await expect(first.getByRole('button')).toHaveCount(0)
    await members(page).getByRole('button', { name: 'Load more' }).click()
    await expect.poll(() => list.getByRole('listitem').count()).toBeGreaterThan(20)
  })

  test("an asset's members open the same way (CM-01, Q1)", async ({ page }) => {
    await open(page, '/en/asset/BTC', '$BTC')
    await expect(members(page, '$BTC').getByRole('listitem').first()).toBeVisible()
  })

  test('each row follows from there, and a person takes you to their profile (CM-02, CM-05)', async ({
    page,
  }) => {
    await open(page)
    // The newest member after the viewer, whom the demo viewer does not follow.
    const row = members(page).getByRole('listitem').filter({ hasText: '@whale_alert_wes' })
    await row.getByRole('button', { name: 'Follow @whale_alert_wes' }).click()
    await expect(row.getByRole('button', { name: /^Following/ })).toBeVisible()

    await row.getByRole('link', { name: /@whale_alert_wes/ }).click()
    await expect(page).toHaveURL(/\/en\/user\/whale_alert_wes$/)
    await expect(members(page)).toBeHidden()
  })

  test('closing gives the focus back to the count (CM-06)', async ({ page }) => {
    await open(page)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('main').getByRole('button', { name: /members$/ })).toBeFocused()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible in ${theme} (CM-07, CM-08)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await open(page)
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      await expect(members(page).getByRole('listitem')).toHaveCount(20)
      const box = (await members(page).boundingBox())!
      expect(box.width).toBeLessThanOrEqual(360)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      // Nor inside the window, which is fixed: its own width.
      expect(
        await members(page).evaluate((dialog) => dialog.scrollWidth - dialog.clientWidth),
      ).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
    })
  }
})
