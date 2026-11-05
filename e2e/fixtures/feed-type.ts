import type { Page } from '@playwright/test'

/** Chooses what the feed shows from its type menu (specs/feed-type-filter FT-04). */
export async function chooseType(page: Page, type: 'All' | 'Posts' | 'Theses' | 'Polls') {
  await page
    .getByRole('main')
    .getByRole('button', { name: /^Content type: / })
    .click()
  await page.getByRole('menuitemradio', { name: type }).click()
}
