import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/comment-threads against the production build with API_MOCKS=true. The Fed post has a
// thread five levels deep: @federico ← @macropilar ← @federico ← (folded) 2 more replies.

const FED_PATH =
  '/en/post/00000000-0000-4000-8000-000000004002/the-fed-cuts-25-bps-what-it-means-for-crypto'

const comments = (page: Page) => page.getByRole('region', { name: /comments/i })
const comment = (page: Page, text: string) =>
  comments(page).getByRole('listitem').filter({ hasText: text }).last()

test.describe('Comment threads', () => {
  test('sizes as Reddit: 32px avatars from sm (24px in phones), 14px text (CT-01, CT-02)', async ({
    page,
    isMobile,
  }) => {
    await page.goto(FED_PATH)
    const top = comment(page, 'The dot plot shows')
    const avatar = top.getByTestId('user-avatar').first()
    const size = isMobile ? 24 : 32
    await expect(avatar).toHaveCSS('width', `${size}px`)
    const body = top.getByText('The dot plot shows')
    await expect(body).toHaveCSS('font-size', '14px')
    await expect(body).toHaveCSS('line-height', '20px')
    await expect(top.getByRole('button', { name: 'Reply' }).first()).toHaveCSS('height', '32px')
  })

  test('each reply joins its parent line with an elbow into its avatar (CT-04, CT-05)', async ({
    page,
  }) => {
    await page.goto(FED_PATH)
    const reply = comment(page, 'Exactly. And Powell')
    const avatar = (await reply.getByTestId('user-avatar').first().boundingBox())!
    // The elbow: the reply's ::after, from the parent's line to the middle of the avatar.
    const elbow = await reply.evaluate((item) => {
      const style = getComputedStyle(item, '::after')
      return {
        left: item.getBoundingClientRect().left + parseFloat(style.left),
        width: parseFloat(style.width),
        height: parseFloat(style.height),
        radius: style.borderBottomLeftRadius,
      }
    })
    expect(elbow.left + elbow.width).toBeCloseTo(avatar.x, 0)
    expect(elbow.height).toBeCloseTo(avatar.height / 2, 0)
    expect(elbow.radius).toBe('12px')
  })

  test('⊖ closes a thread to ⊕ and its author, ⊕ opens it (CT-06, CT-09)', async ({ page }) => {
    await page.goto(FED_PATH)
    const top = comment(page, 'The dot plot shows')
    await top.getByRole('button', { name: "Collapse @federico's comment" }).first().click()
    await expect(comments(page).getByText('The dot plot shows')).toBeHidden()
    await expect(comments(page).getByText('Exactly. And Powell')).toBeHidden()
    const expand = comments(page).getByRole('button', { name: "Expand @federico's comment" })
    await expect(expand).toBeFocused()
    await expand.click()
    await expect(comments(page).getByText('Exactly. And Powell')).toBeVisible()
  })

  test("a click on the thread's line closes it too (CT-06)", async ({ page, isMobile }) => {
    test.skip(isMobile, 'The strip is for the mouse; phones use ⊖')
    await page.goto(FED_PATH)
    const reply = comment(page, 'Exactly. And Powell')
    // The mouse clicks where the page is: bring the reply into view first.
    await reply.scrollIntoViewIfNeeded()
    const box = (await reply.boundingBox())!
    // Halfway down the reply, on the parent's line (16px into the parent's avatar column).
    await page.mouse.click(box.x - 16, box.y + box.height / 2)
    await expect(comments(page).getByText('Exactly. And Powell')).toBeHidden()
  })

  test('the folded replies show as "⊕ 2 more replies" and open (CT-08)', async ({ page }) => {
    await page.goto(FED_PATH)
    await expect(comments(page).getByText(/He always does/)).toBeHidden()
    await comments(page).getByRole('button', { name: '2 more replies' }).click()
    await expect(comments(page).getByText(/He always does/)).toBeVisible()
    await expect(comments(page).getByRole('button', { name: '2 more replies' })).toHaveCount(0)
  })

  test('Share copies the link to the comment, and the link opens it (CT-11, CT-12)', async ({
    page,
    context,
    isMobile,
  }) => {
    test.skip(isMobile, "Phones open the system's share sheet")
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(FED_PATH)
    const top = comment(page, 'The dot plot shows')
    await top.getByRole('button', { name: 'Share' }).first().click()
    await expect(top.getByRole('button', { name: 'Link copied' })).toBeVisible()
    const link = await page.evaluate(() => navigator.clipboard.readText())
    expect(link).toMatch(
      /\/en\/post\/[\w-]+\/the-fed-cuts-25-bps-what-it-means-for-crypto#comment-/,
    )
  })

  test('a link to a folded reply opens its thread and focuses it (CT-12)', async ({ page }) => {
    await page.goto(FED_PATH)
    // The id of a reply inside the folded "2 more replies": open it once to read it.
    await comments(page).getByRole('button', { name: '2 more replies' }).click()
    const id = await comment(page, 'He always does').getAttribute('id')
    await page.goto(`${FED_PATH}#${id}`)
    const shared = comments(page).locator(`[id="${id}"]`)
    await expect(shared).toBeVisible()
    await expect(shared).toBeFocused()
  })

  test("in a phone, Share opens the system's sheet (CT-11)", async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Desktop copies the link')
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        value: (data: ShareData) => {
          ;(window as unknown as { shared: string }).shared = data.url ?? ''
          return Promise.resolve()
        },
      })
    })
    await page.goto(FED_PATH)
    await comment(page, 'The dot plot shows').getByRole('button', { name: 'Share' }).first().click()
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { shared?: string }).shared))
      .toMatch(/#comment-/)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px with the deepest thread open and stays accessible in ${theme} (CT-13, CT-14)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto(FED_PATH)
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      await comments(page).getByRole('button', { name: '2 more replies' }).click()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await page.evaluate(() => window.scrollTo(0, 0))
      await expectNoA11yViolations(page)
    })
  }
})
