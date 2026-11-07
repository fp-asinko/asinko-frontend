import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// The site's toasts (sonner, components/organisms/toaster) against the production build: loaded
// with the first one, styled from globals.css, and allowed by the CSP (patches/sonner). Through a
// real one: a new group whose banner could not be uploaded (specs/community-create CG-11).

/** A real 1×1 PNG: the browser decodes and re-encodes it. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test('a group whose banner fails still opens, with a toast that says so (CG-11)', async ({
  page,
}, testInfo) => {
  const refused: string[] = []
  page.on('console', (message) => {
    if (/Content Security Policy|Refused to/.test(message.text())) refused.push(message.text())
  })
  // The image's upload is the only Server Action sent as multipart (a FormData): it never arrives.
  await page.route('**/create-group', (route) => {
    const type = route.request().headers()['content-type'] ?? ''
    return route.request().method() === 'POST' && type.startsWith('multipart/')
      ? route.abort()
      : route.fallback()
  })
  const name = `Toast Group ${testInfo.project.name} ${Date.now().toString(36)}`
  await page.goto('/en/create-group')
  const main = page.getByRole('main')
  await main.getByRole('textbox', { name: /Name/ }).fill(name)
  await main.getByRole('button', { name: 'Change banner' }).click()
  await page.getByRole('menuitem', { name: 'Upload image' }).click()
  await main.locator('input[type="file"]').setInputFiles({
    name: 'banner.png',
    mimeType: 'image/png',
    buffer: PNG,
  })
  await page.getByRole('dialog').getByRole('button', { name: 'Apply' }).click()
  await main.getByRole('button', { name: 'Create group' }).click()

  await expect(page).toHaveURL(/\/en\/hub\/toast-group-/)
  const toast = page
    .getByRole('listitem')
    .filter({ hasText: 'The group was created, but its banner could not be saved.' })
  await expect(toast).toBeVisible()
  // Styled by globals.css: sonner's card, not a bare list item.
  await expect(toast).toHaveCSS('position', 'absolute')
  await expectNoA11yViolations(page)
  expect(refused).toEqual([])
})
