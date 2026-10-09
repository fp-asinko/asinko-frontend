import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/follow-lists against the production build with API_MOCKS=true: @maria has 25 followers
// (a page of 20 and the rest behind "Load more") and follows three people; the demo viewer
// follows some of them (proposal P-017, mocked).

const lists = (page: Page) => page.getByRole('dialog', { name: '@maria' })

async function open(page: Page, number: RegExp) {
  await page.goto('/en/user/maria')
  await page.getByRole('main').getByRole('button', { name: number }).click()
  await expect(lists(page)).toBeVisible()
}

test.describe('Followers and following', () => {
  test('opens the followers, pages them, and switches to following (FL-01 to FL-03)', async ({
    page,
  }) => {
    await open(page, /followers/)
    const dialog = lists(page)
    await expect(dialog.getByRole('tab', { name: 'Followers' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const followers = dialog.getByRole('list', { name: 'Followers of @maria' })
    await expect(followers.getByRole('listitem')).toHaveCount(20)
    await dialog.getByRole('button', { name: 'Load more' }).click()
    await expect(followers.getByRole('listitem')).toHaveCount(25)

    await dialog.getByRole('tab', { name: 'Following' }).click()
    const following = dialog.getByRole('list', { name: 'People @maria follows' })
    await expect(following.getByRole('link')).toHaveText([/@federico/, /@jeppe/, /@quantsimula/])
  })

  test('each row says whether you follow them, and following works from there (FL-05)', async ({
    page,
  }) => {
    await open(page, /following/)
    const dialog = lists(page)
    // The demo viewer follows @federico, not @quantsimula; and has no button on their own row.
    const row = (name: string) => dialog.getByRole('listitem').filter({ hasText: name })
    await expect(row('@federico').getByRole('button', { name: /^Following/ })).toBeVisible()
    await row('@quantsimula').getByRole('button', { name: 'Follow @quantsimula' }).click()
    await expect(row('@quantsimula').getByRole('button', { name: /^Following/ })).toBeVisible()
  })

  test('a person in the list takes you to their profile', async ({ page }) => {
    await open(page, /following/)
    await lists(page)
      .getByRole('link', { name: /@federico/ })
      .click()
    await expect(page).toHaveURL(/\/en\/user\/federico$/)
    await expect(lists(page)).toBeHidden()
  })

  test('closing gives the focus back to the number (FL-06)', async ({ page }) => {
    await open(page, /followers/)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('main').getByRole('button', { name: /followers/ })).toBeFocused()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible in ${theme} (FL-07, FL-08)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await open(page, /followers/)
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      await expect(
        lists(page).getByRole('list', { name: 'Followers of @maria' }).getByRole('listitem'),
      ).toHaveCount(20)
      const box = (await lists(page).boundingBox())!
      expect(box.width).toBeLessThanOrEqual(360)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
    })
  }
})
