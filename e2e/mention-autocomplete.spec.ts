import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/mention-autocomplete against the production build with API_MOCKS=true: $BTC (Bitcoin),
// #defi and @maria exist in the mocks (src/mocks/fixtures).

const FED_PATH =
  '/en/post/00000000-0000-4000-8000-000000004002/the-fed-cuts-25-bps-what-it-means-for-crypto'

/** The editor's body, on the page to create a post. */
async function openBody(page: Page, isMobile: boolean) {
  await page.goto('/en')
  // "Create" goes to the page to create a post (specs/submit-page SU-02).
  if (isMobile) {
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Create' })
      .click()
  } else {
    await page.getByRole('link', { name: 'What are you thinking?' }).click()
  }
  const editor = page.getByRole('main')
  const body = editor.getByRole('textbox', { name: 'Body' })
  await body.click()
  return { editor, body }
}

/** Types a mention and waits for its list. */
async function suggest(page: Page, field: Locator, text: string) {
  await field.pressSequentially(text)
  return page.getByRole('listbox', { name: 'Suggestions' })
}

test.describe('Mention autocomplete', () => {
  test('suggests assets, communities and people in the post body (MA-01 to MA-05)', async ({
    page,
    isMobile,
  }) => {
    const { body } = await openBody(page, isMobile)

    const assets = await suggest(page, body, 'Long $bitc')
    await expect(assets.getByRole('option', { name: /^\$BTC/ })).toBeVisible()
    await body.press('Enter')
    await expect(body).toHaveValue('Long $BTC ')
    await expect(assets).toBeHidden()

    await suggest(page, body, 'in #de')
    await page.getByRole('option', { name: /^#defi/ }).click()
    await expect(body).toHaveValue('Long $BTC in #defi ')
    await expect(body).toBeFocused()

    await suggest(page, body, 'cc @mar')
    await expect(page.getByRole('option', { name: /^@maria/ })).toBeVisible()
    await body.press('Tab')
    await expect(body).toHaveValue('Long $BTC in #defi cc @maria ')
  })

  test('waits for a letter, and Esc closes only the list (MA-05, Q2)', async ({
    page,
    isMobile,
  }) => {
    const { editor, body } = await openBody(page, isMobile)
    await body.pressSequentially('$')
    await expect(page.getByRole('listbox')).toHaveCount(0)

    const list = await suggest(page, body, 'bi')
    await expect(list).toBeVisible()
    await body.press('Escape')
    await expect(list).toBeHidden()
    await expect(editor).toBeVisible()
    await expect(body).toHaveValue('$bi')
  })

  test('works in comments and replies too (MA-01)', async ({ page }) => {
    await page.goto(FED_PATH)
    const section = page.getByRole('region', { name: /comments/i })

    const comment = section.getByRole('textbox', { name: 'Join the conversation' })
    await comment.click()
    await suggest(page, comment, 'Agree @mar')
    await expect(page.getByRole('option', { name: /^@maria/ })).toBeVisible()
    await comment.press('Enter')
    await expect(comment).toHaveValue('Agree @maria ')

    const thread = section.getByRole('listitem').filter({ hasText: 'The dot plot shows' }).first()
    await thread.getByRole('button', { name: 'Reply' }).first().click()
    const reply = thread.getByRole('textbox', { name: 'Your reply' })
    await suggest(page, reply, '$bitc')
    await expect(page.getByRole('option', { name: /^\$BTC/ })).toBeVisible()
    await reply.press('Enter')
    await expect(reply).toHaveValue('$BTC ')
  })

  test('the list floats over everything, even inside a folded thread (MA-08)', async ({ page }) => {
    await page.goto(FED_PATH)
    const section = page.getByRole('region', { name: /comments/i })
    await section.getByRole('button', { name: '2 more replies' }).click()
    const deep = section.getByRole('listitem').filter({ hasText: 'He always does' }).first()
    await deep.getByRole('button', { name: 'Reply' }).first().click()
    const reply = deep.getByRole('textbox', { name: 'Your reply' })
    await suggest(page, reply, '@mar')
    const option = page.getByRole('option', { name: /^@maria/ })
    await expect(option).toBeInViewport()
    // Nothing covers or cuts it: the topmost element at its center is the option itself.
    const box = (await option.boundingBox())!
    const onTop = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('[role="option"]')?.textContent ?? '',
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    )
    expect(onTop).toContain('@maria')
  })

  test('mentions turn blue while writing, over the same text (MA-12)', async ({
    page,
    isMobile,
  }) => {
    const { body } = await openBody(page, isMobile)
    await body.pressSequentially(
      'Long $BTC with @maria and #defi, a thesis that wraps to more lines',
    )
    await body.press('Shift+Enter')
    await body.pressSequentially('$eth')

    const layer = page.locator('[data-mention-highlight]')
    await expect(layer.locator('.text-mention')).toHaveText(['$BTC', '@maria', '#defi', '$eth'])
    const color = await layer
      .locator('.text-mention')
      .first()
      .evaluate((element) => getComputedStyle(element).color)
    expect(color).toBe('rgb(21, 93, 233)') // --mention, light theme
    await expect(body).toHaveCSS('color', 'rgba(0, 0, 0, 0)')

    // The copy lies exactly over the field and wraps the same lines.
    const [field, copy] = [(await body.boundingBox())!, (await layer.boundingBox())!]
    expect(copy).toEqual(field)
    const heights = await Promise.all(
      [body, layer].map((each) => each.evaluate((element) => element.scrollHeight)),
    )
    expect(heights[1]).toBe(heights[0])
  })

  test('in forced colors the field shows its own text, without the copy (MA-12)', async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    const { body } = await openBody(page, isMobile)
    await body.pressSequentially('Long $BTC')
    await expect(page.locator('[data-mention-highlight]')).toBeHidden()
    await expect(body).toHaveValue('Long $BTC')
  })

  test('a comment box empties its blue copy after sending (MA-12)', async ({ page }) => {
    await page.goto(FED_PATH)
    const comment = page
      .getByRole('region', { name: /comments/i })
      .getByRole('textbox', { name: 'Join the conversation' })
    await comment.click()
    await comment.pressSequentially('Agree with @maria')
    const layer = page.locator('[data-mention-highlight]')
    await expect(layer.locator('.text-mention')).toHaveText('@maria')
    await page.getByRole('button', { name: 'Comment', exact: true }).click()
    await expect(comment).toHaveValue('')
    await expect(layer.locator('.text-mention')).toHaveCount(0)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`the list fits 360px and stays accessible in ${theme} (MA-07, MA-08)`, async ({
      page,
      isMobile,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      if (isMobile) await page.setViewportSize({ width: 360, height: 740 })
      const { body } = await openBody(page, isMobile)
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      const list = await suggest(page, body, '$b')
      await expect(list.getByRole('option').first()).toBeVisible()

      const box = await list.boundingBox()
      const viewport = page.viewportSize()!
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
    })
  }
})
