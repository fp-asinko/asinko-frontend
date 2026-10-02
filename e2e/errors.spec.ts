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

  test('passes the automated accessibility check', async ({ page }) => {
    await page.goto('/en/missing')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoA11yViolations(page)
  })
})
