import { expect, test, type Page } from '@playwright/test'

// The whole post card opens its post, as Reddit's (PO, 2026-10-09), and its own buttons keep
// working. Against the production build with API_MOCKS=true.

const whales = (page: Page) =>
  page.getByRole('article').filter({ hasText: 'Whales accumulated 48,000 $BTC' }).first()

test.describe('Post card as a link', () => {
  test('a click on the body opens the post', async ({ page }) => {
    await page.goto('/en')
    await whales(page).getByText('On-chain data shows wallets').click()
    await expect(page).toHaveURL(/\/en\/post\/[0-9a-f-]+\/whales-accumulated-48-000-btc/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Whales accumulated 48,000 $BTC in two weeks',
    )
  })

  test('voting and opening the comments stay on the feed', async ({ page }) => {
    await page.goto('/en')
    const card = whales(page)
    const upvote = card.getByRole('button', { name: 'Upvote' })
    // The vote toggles (the demo viewer may have voted it already) and the page stays.
    const before = await upvote.getAttribute('aria-pressed')
    await upvote.click()
    await expect(upvote).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true')
    await card
      .getByRole('button', { name: /comments/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/en$/)
  })

  test('the card shows a background on hover (desktop)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Phones have no hover')
    await page.goto('/en')
    const card = whales(page)
    const before = await card.evaluate((element) => getComputedStyle(element).backgroundColor)
    await card.hover()
    await expect
      .poll(() => card.evaluate((element) => getComputedStyle(element).backgroundColor))
      .not.toBe(before)
  })
})
