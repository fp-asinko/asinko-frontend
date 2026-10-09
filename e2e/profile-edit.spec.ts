import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/profile-edit against the production build with API_MOCKS=true: the demo viewer edits
// their own profile; the mock keeps the bio in memory, so the page shows it after saving.

test.describe('Edit profile', () => {
  test('writes a bio and the profile shows it without reloading (PE-01 to PE-03)', async ({
    page,
  }, testInfo) => {
    const bio = `Macro and rates, written in ${testInfo.project.name} ${Date.now()}`
    await page.goto('/en/user/demo')
    await page.getByRole('button', { name: 'Edit profile' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit profile' })
    const field = dialog.getByRole('textbox', { name: 'Bio' })
    await expect(field).toBeFocused()
    await field.fill(bio)
    await dialog.getByRole('button', { name: 'Save' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('main').getByText(bio)).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Profile saved.' })).toBeAttached()
  })

  test('is only on your own profile (PE-01)', async ({ page }) => {
    await page.goto('/en/user/maria')
    await expect(page.getByRole('button', { name: 'Edit profile' })).toHaveCount(0)
  })

  test('marks a bio over 160 characters and does not save it (PE-04)', async ({ page }) => {
    await page.goto('/en/user/demo')
    await page.getByRole('button', { name: 'Edit profile' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit profile' })
    await dialog.getByRole('textbox', { name: 'Bio' }).fill('x'.repeat(161))
    await expect(dialog.getByText('161/160')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Save' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px as the full screen and stays accessible in ${theme} (PE-08)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/en/user/demo')
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      await page.getByRole('button', { name: 'Edit profile' }).click()
      const dialog = page.getByRole('dialog', { name: 'Edit profile' })
      await expect(dialog.getByRole('textbox', { name: 'Bio' })).toBeFocused()
      const box = (await dialog.boundingBox())!
      expect(box.width).toBeLessThanOrEqual(360)
      await expectNoA11yViolations(page)

      // A word of 160 characters, saved: it wraps instead of widening the page (PE-07).
      await dialog.getByRole('textbox', { name: 'Bio' }).fill('x'.repeat(160))
      await dialog.getByRole('button', { name: 'Save' }).click()
      await expect(dialog).toBeHidden()
      await expect(page.getByRole('button', { name: 'Edit profile' })).toBeFocused()
      await expect(page.getByRole('main').getByText('x'.repeat(160))).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
})
