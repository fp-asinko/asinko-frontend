import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/emoji-picker against the production build with API_MOCKS=true.

const FED =
  '/post/00000000-0000-4000-8000-000000004002/the-fed-cuts-25-bps-what-it-means-for-crypto'

/** The post editor's body: in the box (desktop) or the full screen (mobile). */
async function openBody(page: Page, isMobile: boolean) {
  await page.goto('/en')
  if (isMobile) {
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Create' })
      .click()
  } else {
    await page.getByRole('button', { name: 'What are you thinking?' }).click()
  }
  const editor = isMobile
    ? page.getByRole('dialog', { name: 'Create post' })
    : page.getByRole('region', { name: 'Create post' })
  return { editor, body: editor.getByRole('textbox', { name: 'Body' }) }
}

const panel = (page: Page) => page.getByRole('dialog', { name: 'Emojis' })

test.describe('Emoji picker', () => {
  test('puts an emoji where the caret is in a post body (EP-01 to EP-03)', async ({
    page,
    isMobile,
  }) => {
    const { editor, body } = await openBody(page, isMobile)
    await body.fill('BTC up')
    await body.evaluate((field: HTMLTextAreaElement) => field.setSelectionRange(4, 4))
    await editor.getByRole('button', { name: 'Add emoji' }).click()
    await expect(panel(page).getByRole('searchbox', { name: 'Search emoji' })).toBeFocused()
    await page.keyboard.type('rocket')
    await panel(page)
      .getByRole('button', { name: /^rocket/ })
      .click()
    await expect(body).toHaveValue('BTC 🚀up')
    await expect(body).toBeFocused()
    await expect(panel(page)).toBeHidden()
  })

  test('goes into the title when that was the last field used (EP-01)', async ({
    page,
    isMobile,
  }) => {
    const { editor } = await openBody(page, isMobile)
    const title = editor.getByRole('textbox', { name: 'Title' })
    await title.fill('To the moon')
    await editor.getByRole('button', { name: 'Add emoji' }).click()
    await expect(panel(page).getByRole('searchbox', { name: 'Search emoji' })).toBeFocused()
    await page.keyboard.type('rocket')
    await page.keyboard.press('Enter')
    await expect(title).toHaveValue('To the moon🚀')
    await expect(title).toBeFocused()
  })

  test('a category scrolls only the panel, never the page (EP-02)', async ({ page, isMobile }) => {
    // A short screen, as a laptop with the editor open: the panel fits in what is left.
    await page.setViewportSize({ width: isMobile ? 360 : 1280, height: 560 })
    const { editor, body } = await openBody(page, isMobile)
    await body.click()
    await editor.getByRole('button', { name: 'Add emoji' }).click()
    await expect(panel(page).getByRole('searchbox', { name: 'Search emoji' })).toBeFocused()
    const box = (await panel(page).boundingBox())!
    expect(box.y + box.height).toBeLessThanOrEqual(560)

    const before = await page.evaluate(() => window.scrollY)
    await panel(page).getByRole('button', { name: 'Symbols' }).click()
    await expect(panel(page).getByRole('button', { name: /^red heart/ })).toBeFocused()
    await expect(panel(page).getByRole('heading', { name: 'Symbols' })).toBeInViewport()
    expect(await page.evaluate(() => window.scrollY)).toBe(before)
  })

  test('Esc closes only the panel, also inside the full-screen editor (EP-07)', async ({
    page,
    isMobile,
  }) => {
    const { editor, body } = await openBody(page, isMobile)
    await body.click()
    await editor.getByRole('button', { name: 'Add emoji' }).click()
    await expect(panel(page).getByRole('searchbox', { name: 'Search emoji' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(panel(page)).toBeHidden()
    await expect(editor).toBeVisible()
    await expect(body).toBeFocused()
  })

  test('searches in Spanish in a comment, and remembers the recent ones (EP-04, EP-05)', async ({
    page,
  }) => {
    await page.goto(`/es${FED}`)
    const box = page.getByRole('textbox', { name: 'Únete a la conversación' })
    await box.click()
    await page.getByRole('button', { name: 'Agregar emoji' }).click()
    // The panel downloads on first use: type once its search has the focus.
    await expect(panel(page).getByRole('searchbox', { name: 'Buscar emoji' })).toBeFocused()
    await page.keyboard.type('fuego')
    await expect(panel(page).getByRole('status')).toHaveText('1 emoji')
    await page.keyboard.press('Enter')
    await expect(box).toHaveValue('🔥')

    await page.reload()
    await page.getByRole('textbox', { name: 'Únete a la conversación' }).click()
    await page.getByRole('button', { name: 'Agregar emoji' }).click()
    const recent = panel(page).getByRole('region', { name: 'Recientes' })
    await expect(recent.getByRole('button', { name: /^fuego/ })).toBeVisible()
  })

  test('the keyboard moves among the emojis and Esc goes back to the field (EP-07)', async ({
    page,
  }) => {
    await page.goto(`/en${FED}`)
    const box = page.getByRole('textbox', { name: 'Join the conversation' })
    await box.click()
    await page.getByRole('button', { name: 'Add emoji' }).click()
    await expect(panel(page).getByRole('searchbox', { name: 'Search emoji' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(panel(page).getByRole('button', { name: /^grinning face/ })).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(panel(page).getByRole('button', { name: /^smiley/ })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(panel(page)).toBeHidden()
    await expect(box).toBeFocused()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`the panel fits 360px and stays accessible in ${theme} (EP-08, EP-09)`, async ({
      page,
      isMobile,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      if (isMobile) await page.setViewportSize({ width: 360, height: 740 })
      await page.goto(`/en${FED}`)
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      await page.getByRole('textbox', { name: 'Join the conversation' }).click()
      await page.getByRole('button', { name: 'Add emoji' }).click()
      await expect(panel(page).getByRole('heading', { name: 'Smileys' })).toBeVisible()

      const box = (await panel(page).boundingBox())!
      const viewport = page.viewportSize()!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
      await expectNoA11yViolations(page)
    })
  }
})
