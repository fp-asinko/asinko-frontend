import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/poll-pie against the production build with API_MOCKS=true: "Next Fed move?" shows its
// results (the demo user voted); "How much of your portfolio is in DeFi?" hides them until a vote.

const card = (page: Page, text: string) => page.getByRole('article').filter({ hasText: text })
const noOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

test.describe('Poll pie', () => {
  test('a pie beside the results, the most voted first, highlighted together with its row (PP-01 to PP-04)', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en?filter=polls')
    const poll = card(page, 'Next Fed move?')
    const pie = poll.locator('[data-poll-pie]')
    await expect(pie).toBeVisible()
    await expect(pie).toHaveAttribute('aria-hidden', 'true')
    // The list: most voted first, each row with its swatch and its bar.
    const percents = await poll
      .getByRole('listitem')
      .evaluateAll((items) => items.map((item) => Number(/(\d+)%/.exec(item.textContent!)?.[1])))
    expect(percents).toEqual([...percents].sort((a, b) => b - a))
    await expect(poll.locator('[data-swatch]').first()).toBeVisible()
    await expect(poll.locator('[data-bar]').first()).toBeAttached()

    if (!isMobile) {
      const first = poll.getByRole('listitem').first()
      await first.hover()
      await expect(pie.locator('[data-slice]').nth(1)).toHaveCSS('opacity', '0.45')
    }
  })

  test('no pie while the results are hidden; one once the vote reveals them (PP-01, PP-05)', async ({
    page,
  }) => {
    await page.goto('/en?filter=polls')
    const poll = card(page, 'How much of your portfolio is in DeFi?')
    await expect(poll.locator('[data-poll-pie]')).toHaveCount(0)
    await poll.getByRole('button', { name: '1–10%' }).click()
    await expect(poll.locator('[data-poll-pie]')).toBeVisible()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360 px and passes axe in ${theme} (PP-06, PP-07)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })
      await page.goto('/en?filter=polls')
      await card(page, 'Next Fed move?').locator('[data-poll-pie]').scrollIntoViewIfNeeded()
      expect(await noOverflow(page)).toBe(true)
      await expectNoA11yViolations(page)
    })
  }
})
