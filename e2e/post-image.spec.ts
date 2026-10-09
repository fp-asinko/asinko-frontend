import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/post-image against the production build with API_MOCKS=true: the upload is mocked on the
// server and answers a fixture image (src/mocks/post-image.ts); everything before it runs for real
// in the browser (decoding, shrinking to WebP).

/** A real 1×1 PNG: the browser decodes and re-encodes it. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

async function openEditor(page: Page, isMobile: boolean) {
  await page.goto('/en')
  const bar = isMobile
    ? page.getByRole('navigation', { name: 'Main navigation' })
    : page.getByRole('banner')
  await bar.getByRole('button', { name: 'Create' }).click()
  const editor = page.getByRole('dialog', { name: 'Create post' })
  await expect(editor).toBeVisible()
  return editor
}

test.describe('Post with an image', () => {
  test('chooses an image, sees it, publishes it and finds it on the post (PI-01, PI-05 to PI-10)', async ({
    page,
    isMobile,
  }, testInfo) => {
    const title = `Chart of the week (${testInfo.project.name} ${Date.now()})`
    const editor = await openEditor(page, isMobile)
    await editor.getByRole('combobox', { name: 'Community' }).click()
    await page.getByRole('option', { name: /#defi/ }).click()
    await editor.getByRole('tab', { name: 'Image' }).click()
    await editor.locator('input[type="file"]').setInputFiles({
      name: 'chart.png',
      mimeType: 'image/png',
      buffer: PNG,
    })
    await expect(editor.getByRole('img', { name: 'The image of your post' })).toBeVisible()
    await expect(editor.getByRole('button', { name: 'Remove image' })).toBeVisible()

    await editor.getByRole('textbox', { name: 'Title' }).fill(title)
    await editor.getByRole('textbox', { name: 'Body' }).fill('Funding flipped again.')
    await editor.getByRole('button', { name: 'Publish' }).click()

    await expect(page).toHaveURL(/\/en\/post\/[0-9a-f-]+\/chart-of-the-week/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(
      page.getByRole('main').getByRole('img', { name: 'Image attached to the post' }),
    ).toBeVisible()
  })

  test('refuses a file that is not an image of the allowed types (PI-03)', async ({
    page,
    isMobile,
  }) => {
    const editor = await openEditor(page, isMobile)
    await editor.getByRole('tab', { name: 'Image' }).click()
    await editor.locator('input[type="file"]').setInputFiles({
      name: 'anim.gif',
      mimeType: 'image/gif',
      buffer: Buffer.from('GIF89a'),
    })
    await expect(editor.getByRole('alert')).toHaveText('Only JPEG, PNG or WebP images')
  })

  test('removes the image and goes back to choosing one (PI-08)', async ({ page, isMobile }) => {
    const editor = await openEditor(page, isMobile)
    await editor.getByRole('tab', { name: 'Image' }).click()
    await editor
      .locator('input[type="file"]')
      .setInputFiles({ name: 'chart.png', mimeType: 'image/png', buffer: PNG })
    await editor.getByRole('button', { name: 'Remove image' }).click()
    await expect(editor.getByRole('button', { name: /Choose image/ })).toBeFocused()
  })

  // In Spanish, the longest names: the editor's footer must fit at 360px without its own scroll
  // (the editor scrolls inside its window, so the page's width would not tell).
  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px in Spanish and stays accessible in ${theme} (PI-12 to PI-14)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/es')
      await page
        .getByRole('navigation', { name: 'Navegación principal' })
        .getByRole('button', { name: 'Crear' })
        .click()
      const editor = page.getByRole('dialog', { name: 'Crear post' })
      await editor.getByRole('tab', { name: 'Imagen' }).click()
      // The hidden input behind "Elegir imagen": the only way to hand a file to the browser.
      await editor
        .locator('input[type="file"]')
        .setInputFiles({ name: 'chart.png', mimeType: 'image/png', buffer: PNG })
      await expect(editor.getByRole('img', { name: 'La imagen de tu post' })).toBeVisible()
      const overflow = await editor.evaluate((dialog) =>
        [dialog, ...dialog.querySelectorAll('*')].some(
          (element) =>
            element.clientWidth > 1 && // not the 1px screen-reader-only texts
            element.scrollWidth > element.clientWidth + 1 &&
            getComputedStyle(element).overflowX !== 'visible',
        ),
      )
      expect(overflow).toBe(false)
      const footer = editor.getByRole('button', { name: 'Publicar' })
      const box = (await footer.boundingBox())!
      expect(box.x + box.width).toBeLessThanOrEqual(360)
      await expectNoA11yViolations(page)
    })
  }
})
