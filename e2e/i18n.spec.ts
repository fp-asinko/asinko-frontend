import { expect, test } from '@playwright/test'

// F-11, F-12, F-13
test.describe('locale routing', () => {
  for (const [browserLocale, expected] of [
    ['es-AR', '/es'],
    ['pt-BR', '/pt'],
    ['fr-FR', '/en'],
  ] as const) {
    test.describe(`browser in ${browserLocale}`, () => {
      test.use({ locale: browserLocale })

      test(`/ redirects to ${expected}`, async ({ page }) => {
        await page.goto('/')
        await expect(page).toHaveURL(new RegExp(`${expected}$`))
      })
    })
  }

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
