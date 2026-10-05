import { expect, test } from '@playwright/test'
import { settings } from './fixtures/settings'

// F-11, F-13 and H-27 (English first: replaces F-12's browser-language redirect)
test.describe('locale routing', () => {
  for (const browserLocale of ['es-AR', 'pt-BR', 'en-US']) {
    test.describe(`browser in ${browserLocale}`, () => {
      test.use({ locale: browserLocale })

      test('/ redirects to /en', async ({ page }) => {
        await page.goto('/')
        await expect(page).toHaveURL(/\/en$/)
      })
    })
  }

  test('the header selector switches language and keeps the filters (H-27)', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en?community=btc')
    await (
      await settings(page, isMobile)
    )
      .getByRole('combobox', { name: 'Language' })
      .selectOption('es')
    await expect(page).toHaveURL(/\/es\?community=btc$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    // On phones the menu closes with the navigation: open it again, now in Spanish.
    const controls = await settings(page, isMobile, 'Abrir menú')
    await expect(controls.getByRole('combobox', { name: 'Idioma' })).toHaveValue('es')
  })

  for (const [locale, heading] of [
    ['en', 'Home'],
    ['es', 'Inicio'],
    ['pt', 'Início'],
  ] as const) {
    test(`/${locale} is served in its language`, async ({ page }) => {
      await page.goto(`/${locale}`)
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    })
  }
})
