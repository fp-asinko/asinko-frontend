import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/feed-cards against the production build with API_MOCKS=true.

const articles = (page: Page) => page.getByRole('article')
const card = (page: Page, text: string) => articles(page).filter({ hasText: text })
const DEFI = 'How much of your portfolio is in DeFi?'

test.describe('Feed cards', () => {
  test('voting colors the results and says where the vote stands, after the bars (FC-04, FC-05, FC-09)', async ({
    page,
  }) => {
    await page.goto('/en?filter=polls')
    const poll = card(page, DEFI)
    const options = poll.getByRole('list').first()
    const before = await options.boundingBox()

    await poll.getByRole('button', { name: '1–10%' }).click()

    const consensus = poll
      .locator('[data-consensus]')
      .filter({ hasText: /You voted with the majority: \d+% chose the same/ })
    await expect(consensus).toBeVisible()
    expect(await consensus.evaluate((el) => getComputedStyle(el).animationDelay)).toBe('0.4s')
    await expect(poll.locator('[data-bar]')).toHaveCount(4)
    // D-C1: results arrive without moving the options.
    expect((await options.boundingBox())?.height).toBe(before?.height)
  })

  test('a vote cast earlier shows its consensus at once', async ({ page }) => {
    await page.goto('/en?filter=polls')
    const consensus = card(page, 'Next Fed move?')
      .locator('[data-consensus]')
      .filter({ hasText: /chose the same/ })
    await expect(consensus).toBeVisible()
    expect(await consensus.evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
  })

  test('comments enter one after another and avatars answer the hover (FC-10)', async ({
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
    const avatar = whales.getByTestId('user-avatar').first()
    await avatar.hover()
    await expect.poll(() => avatar.evaluate((el) => getComputedStyle(el).scale)).toBe('1.05')
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
      await expect(whales.getByRole('button', { name: 'See all comments' })).toBeVisible()
      const poll = card(page, DEFI)
      await poll.getByRole('button', { name: '1–10%' }).click()
      await expect(
        poll.locator('[data-consensus]').filter({ hasText: /chose the same/ }),
      ).toBeVisible()

      await expectNoA11yViolations(page)
    })
  }
})

test.describe('Feed cards with reduced motion (FC-11)', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the colored results and the consensus arrive in their final state', async ({ page }) => {
    await page.goto('/en?filter=polls')
    const poll = card(page, DEFI)
    await poll.getByRole('button', { name: '1–10%' }).click()
    const consensus = poll.locator('[data-consensus]').filter({ hasText: /chose the same/ })
    await expect(consensus).toBeVisible()
    expect(
      await consensus.evaluate((el) => parseFloat(getComputedStyle(el).animationDuration)),
    ).toBeLessThanOrEqual(0.001)
  })
})
