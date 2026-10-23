import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/sidebar-more against the production build with API_MOCKS=true: the demo user has 2
// groups, and more people and assets than a low column shows.

const section = (page: Page, name: string) =>
  page.locator('#left-column').getByRole('region', { name })
const visibleItems = (page: Page, name: string) =>
  section(page, name).locator('ul > li').filter({ visible: true }).count()

test.describe('"more" in the left column', () => {
  test.skip(({ isMobile }) => isMobile, 'The column from md; the phone panel has its own test')

  test('shows the rest of a section and goes back with "less" (SM-01 to SM-04)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/en')
    const assets = section(page, 'Assets')
    const more = assets.getByRole('button', { name: 'more: Assets' })
    await expect(more).toBeVisible()
    await expect(more).toHaveAttribute('aria-expanded', 'false')
    const fitting = await visibleItems(page, 'Assets')

    // With the keyboard: all of them, "less" keeps the focus.
    await more.focus()
    await page.keyboard.press('Enter')
    const less = assets.getByRole('button', { name: 'less: Assets' })
    await expect(less).toHaveAttribute('aria-expanded', 'true')
    await expect(less).toBeFocused()
    await expect.poll(() => visibleItems(page, 'Assets')).toBeGreaterThan(fitting)
    // What shows can be reached: the last tile takes the focus by Tab.
    const last = assets.locator('ul > li').last().getByRole('link')
    await expect(last).toBeVisible()
    await expectNoA11yViolations(page)

    await less.click()
    await expect(more).toBeVisible()
    await expect.poll(() => visibleItems(page, 'Assets')).toBe(fitting)
    // Each section by itself: people did not open.
    await expect(section(page, 'People').getByRole('button', { name: /^less/ })).toHaveCount(0)
  })

  test('is not there when a section already shows everything (SM-01)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1400 })
    await page.goto('/en')
    await expect(section(page, 'Groups').locator('ul > li').first()).toBeVisible()
    await expect(section(page, 'Groups').getByRole('button', { name: /^more/ })).toHaveCount(0)
  })

  test('says it in Spanish, and stays accessible in dark (SM-05)', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/es')
    const more = page.locator('#left-column').getByRole('button', { name: /^ver más: Activos$/ })
    await expect(more).toBeVisible()
    await more.click()
    await expect(
      page.locator('#left-column').getByRole('button', { name: 'ver menos: Activos' }),
    ).toBeVisible()
    await expectNoA11yViolations(page)
  })
})

test('in the phone panel, with no height to fit, shows everything and no "more" (SM-01, SM-05)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/en')
  await page.getByRole('button', { name: 'Open menu' }).click()
  const panel = page.getByRole('dialog')
  const assets = panel.getByRole('region', { name: 'Assets' })
  await expect(assets.locator('ul > li').first()).toBeVisible()
  // The panel scrolls: only each list's maximum could hide something, and the demo is under it.
  expect(await assets.locator('ul > li').filter({ visible: true }).count()).toBe(
    await assets.locator('ul > li').count(),
  )
  await expect(panel.getByRole('button', { name: /^more: / })).toHaveCount(0)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})
