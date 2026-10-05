import { expect, test } from '@playwright/test'
import { settings } from './fixtures/settings'

// F-19, F-20, F-21 (the toggle is in the "⋯" menu since specs/header-refresh)
test.describe('theme', () => {
  test.use({ colorScheme: 'dark' })

  test('starts light even when the OS is dark', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    const menu = await settings(page)
    await expect(menu.getByRole('menuitemcheckbox', { name: 'Dark mode' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  test('the toggle switches to dark with the keyboard and the choice persists', async ({
    page,
  }) => {
    await page.goto('/en')
    const menu = await settings(page)
    const toggle = menu.getByRole('menuitemcheckbox', { name: 'Dark mode' })
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(
      (await settings(page)).getByRole('menuitemcheckbox', { name: 'Dark mode' }),
    ).toHaveAttribute('aria-checked', 'true')
  })

  test('the theme is applied by an inline script before the page content (no flicker)', async ({
    request,
  }) => {
    const html = await (await request.get('/en')).text()
    const themeScript = html.search(/<script[^>]*nonce="[^"]+"[^>]*>[^<]*localStorage/)
    expect(themeScript).toBeGreaterThan(-1)
    expect(themeScript).toBeLessThan(html.indexOf('<header'))
  })
})
