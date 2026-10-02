import { expect, test } from '@playwright/test'
import { collectConsoleErrors, expectNoA11yViolations } from './fixtures/axe'

// F-23, F-23b, F-26 and general health of the shell.
test.describe('app shell', () => {
  test('has no console errors (CSP violations, hydration mismatches)', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto('/es')
    await page.waitForLoadState('networkidle')
    expect(errors).toEqual([])
  })

  test('passes the automated accessibility check', async ({ page }) => {
    await page.goto('/es')
    await expectNoA11yViolations(page)
  })

  test('starts with a skip link that moves focus to the content', async ({ page }) => {
    await page.goto('/en')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to content' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('main')).toBeFocused()
  })

  // T-04 rebuilt the shell after the prototype: the bottom bar (mobile) is the main navigation,
  // and the destinations that do not exist yet are coming soon (H-26).
  test('only links destinations that exist (F-23b, H-26)', async ({ page, isMobile }) => {
    await page.goto('/en')
    if (isMobile) {
      const nav = page.getByRole('navigation', { name: 'Main navigation' })
      await expect(nav.getByRole('link')).toHaveText(['Home'])
      for (const name of ['Search', 'Create', 'Notif', 'Profile']) {
        await expect(nav.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
      }
    } else {
      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden()
      await expect(page.getByRole('banner').getByRole('link').first()).toHaveAttribute(
        'href',
        '/en',
      )
    }
  })
})

test.describe('layout by width (F-23, F-26)', () => {
  for (const width of [360, 800, 1280, 1440]) {
    test(`${width}px has no horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/es')
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBe(0)
    })
  }

  test('mobile: bottom bar and menu panel, no fixed left column', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/en')
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Your interests' })).toBeHidden()

    await page.getByRole('button', { name: 'Open menu' }).click()
    const panel = page.getByRole('dialog', { name: 'Menu' })
    await expect(panel.getByRole('region', { name: 'Your interests' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
  })

  test('desktop: fixed left column, no menu button or bottom bar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/en')
    await expect(page.getByRole('region', { name: 'Your interests' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden()
  })
})
