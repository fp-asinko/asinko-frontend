import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/feed-navigation against the production build with API_MOCKS=true. The x-mock-delay header
// makes the mocked feed answer slowly, like the real backend today (src/lib/api/mock-delay.ts).

const DELAY_MS = 3000

test.describe('Feed navigation with a slow backend', () => {
  test('a filter switch answers at once: URL, active filter and skeleton (FN-01, FN-02)', async ({
    page,
  }) => {
    await page.goto('/en')
    await expect(page.getByRole('article').first()).toBeVisible()
    await page.setExtraHTTPHeaders({ 'x-mock-delay': String(DELAY_MS) })

    const started = Date.now()
    await page.getByRole('link', { name: 'Polls' }).click()
    await expect(page).toHaveURL(/filter=polls/, { timeout: 1500 })
    await expect(page.getByRole('link', { name: 'Polls' })).toHaveAttribute(
      'aria-current',
      'page',
      {
        timeout: 1500,
      },
    )
    await expect(page.getByTestId('feed-skeleton')).toBeVisible({ timeout: 1500 })
    expect(Date.now() - started).toBeLessThan(DELAY_MS)
    // Screen readers hear it (FN-03), and the page stays accessible while it loads.
    await expect(page.getByRole('status').filter({ hasText: 'Loading…' })).toBeAttached()
    await expectNoA11yViolations(page)
    // The top stays: the tabs never left the screen (FN-02).
    await expect(page.getByRole('link', { name: 'For you' })).toBeVisible()

    // Then the list arrives.
    await expect(page.getByRole('article').first()).toBeVisible({ timeout: DELAY_MS + 5000 })
    await expect(page.getByTestId('feed-skeleton')).toHaveCount(0)
  })

  test('a community mention answers at once too: the chip keeps its place (FN-01, § 2)', async ({
    page,
  }) => {
    await page.goto('/en')
    await expect(page.getByRole('article').first()).toBeVisible()
    await page.setExtraHTTPHeaders({ 'x-mock-delay': String(DELAY_MS) })

    const started = Date.now()
    await page.getByRole('article').first().getByRole('link', { name: '$BTC' }).first().click()
    await expect(page).toHaveURL(/community=btc/, { timeout: 1500 })
    await expect(page.getByTestId('feed-skeleton')).toBeVisible({ timeout: 1500 })
    expect(Date.now() - started).toBeLessThan(DELAY_MS)

    // The chip arrives with its real name ($, not #).
    await expect(page.getByRole('link', { name: 'Remove the $BTC filter' })).toBeVisible({
      timeout: DELAY_MS + 5000,
    })
  })

  test('going back to a tab seen moments ago is instant, from the router cache (FN-04)', async ({
    page,
  }) => {
    await page.goto('/en')
    await page.getByRole('link', { name: 'Polls' }).click()
    await expect(page.getByRole('article').first()).toContainText('Poll')

    // From here on the backend is slow: only the cache can make the way back instant.
    await page.setExtraHTTPHeaders({ 'x-mock-delay': String(DELAY_MS) })
    const started = Date.now()
    await page.getByRole('link', { name: 'New' }).click()
    await expect(page.getByRole('article').filter({ hasText: 'Whales accumulated' })).toBeVisible()
    expect(Date.now() - started).toBeLessThan(DELAY_MS)
  })

  test('an unknown community still shows the not-found page with the streaming (§ 2)', async ({
    page,
  }) => {
    await page.goto('/en?community=nope')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached()
  })

  test('a language switch answers at once, without waiting for the column (FN-08)', async ({
    page,
  }) => {
    await page.goto('/en')
    await expect(page.getByRole('article').first()).toBeVisible()
    await page.setExtraHTTPHeaders({ 'x-mock-delay': String(DELAY_MS) })

    const started = Date.now()
    await page.getByRole('button', { name: 'More options' }).click()
    await page.getByRole('menuitemradio', { name: 'Español' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es', { timeout: 2000 })
    await expect(page.getByTestId('feed-skeleton')).toBeVisible({ timeout: 2000 })
    expect(Date.now() - started).toBeLessThan(DELAY_MS)
  })
})
