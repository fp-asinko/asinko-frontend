import { expect, test, type Page } from '@playwright/test'
import { collectConsoleErrors, expectNoA11yViolations } from './fixtures/axe'

// specs/home: the feed against the production build with API_MOCKS=true (deterministic data from
// src/mocks/fixtures: 23 posts and 3 polls, 20 per page). Runs on mobile and desktop.

const articles = (page: Page) => page.getByRole('article')
const card = (page: Page, text: string) => articles(page).filter({ hasText: text })

test.describe('Home feed', () => {
  test('shows the first page with posts and polls (H-12, H-13)', async ({ page }) => {
    await page.goto('/en')
    await expect(articles(page)).toHaveCount(20)
    await expect(
      page.getByRole('heading', { name: 'Whales accumulated 48,000 $BTC in two weeks' }),
    ).toBeVisible()
    await expect(card(page, 'Where does $BTC close 2026?').getByText('Poll')).toBeVisible()
  })

  test('switches to Following with a shareable link (H-10)', async ({ page }) => {
    await page.goto('/en')
    await page.getByRole('link', { name: 'Following' }).click()
    await expect(page).toHaveURL(/\/en\?feed=following$/)
    await expect(page.getByRole('link', { name: 'Following' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(articles(page).first()).toBeVisible()
  })

  test('the Polls filter shows only polls (H-11)', async ({ page }) => {
    await page.goto('/en')
    await page.getByRole('link', { name: 'Polls' }).click()
    await expect(page).toHaveURL(/filter=polls/)
    await expect(articles(page)).toHaveCount(3)
    for (const poll of await articles(page).all()) {
      await expect(poll.getByText('Poll', { exact: true })).toBeVisible()
    }
  })

  test('a $BTC mention filters the Home by its community, and the chip removes it (H-14)', async ({
    page,
  }) => {
    await page.goto('/en')
    const post = card(page, 'Whales accumulated 48,000 $BTC')
    await post.locator('p').getByRole('link', { name: '$BTC' }).first().click()
    await expect(page).toHaveURL(/\/en\?community=btc$/)
    for (const each of await articles(page).all()) {
      await expect(each.getByRole('link', { name: '$BTC' }).first()).toBeVisible()
    }

    await page.getByRole('link', { name: 'Remove the $BTC filter' }).click()
    await expect(page).toHaveURL(/\/en$/)
  })

  test('an unknown community shows the not-found page, out of search engines', async ({ page }) => {
    await page.goto('/en?community=nope')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    // Status 200 because the Home streams (design § 5); noindex keeps it out of search engines.
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached()
  })

  test('votes on a post at once and can remove the vote (H-15)', async ({ page }) => {
    await page.goto('/en')
    const post = card(page, 'The Fed cuts 25 bps')
    const up = post.getByRole('button', { name: 'Upvote' })

    await up.click()
    await expect(up).toHaveAttribute('aria-pressed', 'true')
    await expect(post.getByText('643 points, you upvoted')).toBeAttached()

    await up.click()
    await expect(up).toHaveAttribute('aria-pressed', 'false')
    await expect(post.getByText('642 points', { exact: true })).toBeAttached()
  })

  test('votes on a poll and reveals the hidden results (H-13, H-15)', async ({ page }) => {
    await page.goto('/en?filter=polls')
    const poll = card(page, 'How much of your portfolio is in DeFi?')
    await expect(poll.getByText('Vote to see the results')).toBeVisible()

    await poll.getByRole('button', { name: '1–10%' }).click()
    await expect(poll.getByRole('button', { name: /1–10%/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(poll.getByText('Vote to see the results')).toBeHidden()
    await expect(poll.getByText(/^\d+%$/).first()).toBeVisible()
  })

  test('opens the first comments under a card (H-28)', async ({ page }) => {
    await page.goto('/en')
    const post = card(page, 'Whales accumulated 48,000 $BTC')
    const toggle = post.getByRole('button', { name: /6 comments/ })

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(post.getByRole('listitem').first()).toBeVisible()
    await expect(post.getByRole('button', { name: 'See all comments' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  test('loads the next page when scrolling, until the end (H-16)', async ({ page }) => {
    await page.goto('/en')
    await expect(articles(page)).toHaveCount(20)
    await page.getByRole('button', { name: 'Load more' }).scrollIntoViewIfNeeded()
    await expect(articles(page)).toHaveCount(26)
    await expect(page.getByRole('button', { name: 'Load more' })).toBeHidden()
  })

  test('features of later phases say "Coming soon" (H-26)', async ({ page }) => {
    await page.goto('/en')
    const share = articles(page).first().getByRole('button', { name: 'Share' })
    await expect(share).toHaveAttribute('aria-disabled', 'true')
    // aria-disabled (not disabled) keeps it focusable; Playwright needs force to click it.
    await share.click({ force: true })
    await expect(articles(page).first().getByRole('status')).toHaveText('Coming soon')
  })

  test('long words from users wrap instead of overflowing at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/en?community=latam')
    await expect(card(page, 'very-long-path-without-spaces')).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBe(0)
  })
})

test.describe('Home health', () => {
  test('passes the accessibility check with the feed, a filter and open comments (H-23)', async ({
    page,
  }) => {
    await page.goto('/en')
    await expectNoA11yViolations(page)

    await card(page, 'Whales accumulated 48,000 $BTC')
      .getByRole('button', { name: /6 comments/ })
      .click()
    await expect(page.getByRole('button', { name: 'See all comments' })).toBeVisible()
    await expectNoA11yViolations(page)

    await page.goto('/en?filter=polls')
    await expectNoA11yViolations(page)
  })

  test('has no console errors while voting, commenting and loading more', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto('/es')
    await card(page, 'The Fed cuts 25 bps').getByRole('button', { name: 'Votar a favor' }).click()
    await card(page, 'Whales accumulated 48,000 $BTC')
      .getByRole('button', { name: /6 comentarios/ })
      .click()
    await expect(page.getByRole('button', { name: 'Ver todos los comentarios' })).toBeVisible()
    await page.getByRole('button', { name: 'Cargar más' }).scrollIntoViewIfNeeded()
    await expect(articles(page)).toHaveCount(26)
    expect(errors).toEqual([])
  })
})
