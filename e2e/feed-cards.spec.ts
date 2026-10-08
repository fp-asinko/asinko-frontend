import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/feed-cards against the production build with API_MOCKS=true.

const articles = (page: Page) => page.getByRole('article')
const card = (page: Page, text: string) => articles(page).filter({ hasText: text })
const DEFI = 'How much of your portfolio is in DeFi?'
// The note of revision 4 (FC-26). It unfolds inside a grid two levels up (FC-28).
const noteOf = (poll: Locator) =>
  poll.locator('[data-consensus]').filter({ hasText: /\d+% share your view\./ })
const unfoldStyle = (note: Locator) =>
  note.evaluate((el) => {
    const style = getComputedStyle(el.parentElement!.parentElement!)
    return { delay: style.transitionDelay, duration: parseFloat(style.transitionDuration) }
  })

test.describe('Feed cards', () => {
  test('voting fills the same boxes, marks it with your avatar and unfolds the note after the fill (FC-20, FC-24 to FC-28)', async ({
    page,
  }) => {
    await page.goto('/en?filter=polls')
    const poll = card(page, DEFI)
    const option = poll.getByRole('button', { name: /1–10%/ })
    const before = (await option.boundingBox())!.height
    await option.click()

    const note = noteOf(poll)
    await expect(note).toBeVisible()
    expect((await unfoldStyle(note)).delay).toBe('0.4s')
    // FC-24: the demo viewer's avatar on the voted option.
    await expect(option.locator('[data-mine]').getByTestId('user-avatar')).toBeVisible()
    await expect(poll.locator('[data-bar]')).toHaveCount(4)
    // FC-20: the same box before and after voting, now filled to its share.
    expect((await option.boundingBox())!.height).toBe(before)
  })

  test('a vote cast earlier shows its note from the start (FC-28)', async ({ page }) => {
    await page.goto('/en?filter=polls')
    const note = noteOf(card(page, 'Next Fed move?'))
    await expect(note).toBeVisible()
    expect((await unfoldStyle(note)).delay).toBe('0s')
  })

  test('Tell us why opens the comments of the poll (FC-27)', async ({ page }) => {
    await page.goto('/en?filter=polls')
    const poll = card(page, 'Next Fed move?')
    await poll.getByRole('button', { name: 'Tell us why' }).click()
    await expect(poll.getByRole('button', { name: /^\d+ comments?$/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  test('comments enter one after another and their avatars answer the hover (FC-10)', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en')
    const whales = card(page, 'Whales accumulated 48,000 $BTC')
    await whales.getByRole('button', { name: /6 comments/ }).click()
    const rows = whales.locator('.stagger > li')
    await expect(rows.nth(1)).toBeVisible()
    expect(await rows.nth(0).evaluate((el) => getComputedStyle(el).animationName)).toBe('fade-up')
    expect(await rows.nth(1).evaluate((el) => getComputedStyle(el).animationDelay)).toBe('0.04s')

    // Hover exists only with a pointer that hovers (Tailwind 4 hover: variant).
    test.skip(isMobile, 'no hover on touch devices')
    const avatar = rows.first().getByTestId('user-avatar')
    await avatar.hover()
    await expect.poll(() => avatar.evaluate((el) => getComputedStyle(el).scale)).toBe('1.05')
    // The card's header stays still (PO, 2026-10-08).
    const header = whales.getByTestId('user-avatar').first()
    await header.hover()
    expect(await header.evaluate((el) => getComputedStyle(el).scale)).toBe('none')
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`stays accessible in ${theme} after voting and opening comments (FC-12)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.goto('/en')
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)

      const whales = card(page, 'Whales accumulated 48,000 $BTC')
      await whales.getByRole('button', { name: /6 comments/ }).click()
      await expect(whales.getByRole('link', { name: 'See all comments' })).toBeVisible()
      const poll = card(page, DEFI)
      await poll.getByRole('button', { name: '1–10%' }).click()
      await expect(noteOf(poll)).toBeVisible()

      // From the top: a link that the scroll leaves under the sticky bar counts as obscured.
      await page.evaluate(() => window.scrollTo(0, 0))
      await expectNoA11yViolations(page)
    })
  }
})

test.describe('Feed cards with reduced motion (FC-11)', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the results and the note arrive in their final state', async ({ page }) => {
    await page.goto('/en?filter=polls')
    const poll = card(page, DEFI)
    await poll.getByRole('button', { name: '1–10%' }).click()
    const note = noteOf(poll)
    await expect(note).toBeVisible()
    expect((await unfoldStyle(note)).duration).toBeLessThanOrEqual(0.001)
  })
})
