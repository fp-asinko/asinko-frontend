import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/empty-states against the production build with API_MOCKS=true.

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Empty states in ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
    })

    test('a post without comments invites to comment, and the button opens the box (ES-02)', async ({
      page,
    }, testInfo) => {
      await page.goto('/en')
      const bar =
        testInfo.project.name === 'mobile'
          ? page.getByRole('navigation', { name: 'Main navigation' })
          : page.getByRole('banner')
      await bar.getByRole('button', { name: 'Create' }).click()
      const editor = page.getByRole('dialog', { name: 'Create post' })
      await editor.getByRole('combobox', { name: 'Community' }).click()
      await page.getByRole('option').first().click()
      await editor.getByRole('textbox', { name: 'Title' }).fill(`Quiet one ${Date.now()}`)
      await editor.getByRole('textbox', { name: 'Body' }).fill('Nobody answers.')
      await editor.getByRole('button', { name: 'Publish' }).click()
      await page.waitForURL(/\/post\//)

      await expect(page.getByText('Be the first to comment')).toBeVisible()
      await page.getByRole('button', { name: 'Add a comment' }).click()
      await expect(page.getByRole('textbox', { name: 'Join the conversation' })).toBeFocused()
      await page.keyboard.press('Escape')
      await expectNoA11yViolations(page)
    })

    test('the Following feed without a session says why and offers the way in (ES-02)', async ({
      page,
      context,
      baseURL,
    }) => {
      await context.addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
      await page.goto('/en?feed=following')
      await expect(page.getByText('Your feed, your way')).toBeVisible()
      await expect(
        page.getByRole('main').getByRole('button', { name: 'Create account' }),
      ).toBeVisible()
      await expectNoA11yViolations(page)
    })
  })
}
