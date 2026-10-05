import type { Locator, Page } from '@playwright/test'

/**
 * Language and dark mode live in the top bar's "⋯" menu at every size (specs/header-refresh
 * HR-03). Opens it and returns the menu.
 */
export async function settings(page: Page, moreOptions = 'More options'): Promise<Locator> {
  await page.getByRole('button', { name: moreOptions }).click()
  const menu = page.getByRole('menu')
  await menu.waitFor()
  return menu
}
