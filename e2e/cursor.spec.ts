import { expect, test } from '@playwright/test'
import { settings } from './fixtures/settings'

/**
 * Everything you click shows the hand, as the PO asked (2026-10-08): buttons, menu items, the
 * post editor's controls. Text fields keep the text cursor. Desktop only: phones have no cursor.
 */
test.describe('cursor', () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, 'Phones have no mouse cursor')
  })

  test('buttons and menu items show the hand', async ({ page }) => {
    await page.goto('/en')
    const upvote = page.getByRole('article').first().getByRole('button', { name: 'Upvote' })
    await expect(upvote).toHaveCSS('cursor', 'pointer')
    await expect(page.getByRole('button', { name: 'More options' })).toHaveCSS('cursor', 'pointer')

    const menu = await settings(page)
    await expect(menu.getByRole('menuitemcheckbox', { name: 'Dark mode' })).toHaveCSS(
      'cursor',
      'pointer',
    )
  })

  test("the post editor's controls show the hand, its fields the text cursor", async ({ page }) => {
    await page.goto('/en')
    await page.getByRole('banner').getByRole('link', { name: 'Create' }).click()
    const editor = page.getByRole('main')
    await expect(editor).toBeVisible()

    for (const control of [
      editor.getByRole('combobox', { name: 'Community' }),
      editor.getByRole('tab').first(),
      editor.getByRole('button', { name: 'Publish' }),
      editor.getByRole('button', { name: /emoji/i }).first(),
    ]) {
      await expect(control).toHaveCSS('cursor', 'pointer')
    }
    await expect(editor.getByRole('textbox', { name: 'Title' })).toHaveCSS('cursor', 'text')

    await editor.getByRole('combobox', { name: 'Community' }).click()
    await expect(page.getByRole('option').first()).toHaveCSS('cursor', 'pointer')
  })
})
