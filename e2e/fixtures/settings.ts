import type { Locator, Page } from '@playwright/test'

/**
 * Where the language and theme controls live: the top bar from md, the menu panel on phones
 * (specs/guest-experience: no room next to "Log in" at 360px). On phones it opens the menu.
 */
export async function settings(
  page: Page,
  isMobile: boolean,
  openMenu = 'Open menu',
): Promise<Locator> {
  if (!isMobile) return page.locator('body')
  await page.getByRole('button', { name: openMenu }).click()
  return page.getByRole('dialog')
}
