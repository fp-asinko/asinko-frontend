import { expect, test } from '@playwright/test'

// F-19, F-20, F-21
test.describe('theme', () => {
  test.use({ colorScheme: 'dark' })

  test('starts light even when the OS is dark', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await expect(page.getByRole('switch', { name: 'Dark mode' })).not.toBeChecked()
  })

  test('the toggle switches to dark with the keyboard and the choice persists', async ({
    page,
  }) => {
    await page.goto('/en')
    const toggle = page.getByRole('switch', { name: 'Dark mode' })
    await toggle.focus()
    await page.keyboard.press('Space')

    await expect(toggle).toBeChecked()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByRole('switch', { name: 'Dark mode' })).toBeChecked()
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
