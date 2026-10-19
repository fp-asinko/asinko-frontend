import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// F-24
test.describe('not found', () => {
  test('an unknown URL returns 404 with a translated page', async ({ page }) => {
    const response = await page.goto('/es/no-existe')
    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Página no encontrada' }),
    ).toBeVisible()
    const robots = await page
      .locator('meta[name="robots"]')
      .evaluateAll((metas) => metas.map((meta) => meta.getAttribute('content')))
    expect(robots.length).toBeGreaterThan(0)
    for (const content of robots) expect(content).toContain('noindex')
  })

  test('links back to the home page', async ({ page }) => {
    await page.goto('/pt/nada')
    await page.getByRole('link', { name: 'Voltar para o início' }).click()
    await expect(page).toHaveURL(/\/pt$/)
  })

  // A path that cannot be decoded (a lone %) is a bad request, not a server error.
  test('a malformed URL returns 400, never 500', async ({ request }) => {
    for (const path of [
      '/%zz',
      '/en/%zz',
      '/en/hub/macro%25zz',
      '/en/user/a%25',
      '/en/asset/BTC%25',
    ]) {
      const response = await request.get(path, { maxRedirects: 0 })
      expect(response.status(), path).toBe(400)
    }
  })

  test('passes the automated accessibility check', async ({ page }) => {
    await page.goto('/en/missing')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoA11yViolations(page)
  })
})
