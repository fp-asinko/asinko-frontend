import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/mention-autocomplete against the production build with API_MOCKS=true: $BTC (Bitcoin),
// #defi and @maria exist in the mocks (src/mocks/fixtures).

const FED_PATH =
  '/en/post/00000000-0000-4000-8000-000000004002/the-fed-cuts-25-bps-what-it-means-for-crypto'

/** The editor's body: in the expanded box (desktop) or the full screen (mobile). */
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

    const comment = section.getByRole('textbox', { name: 'Your comment' })
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
