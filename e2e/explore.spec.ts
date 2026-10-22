import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/explore-v1 against the production build with API_MOCKS=true: the mock's Explore mixes the
// four reasons in turn (SIMILAR via #macro, COUNTRY AR, TRENDING, FOLLOWING).

test.describe('Explore: why it shows a card', () => {
  test('says why above the header, with a link to the community, in light and dark (EX-01, EX-04, EX-11)', async ({
    page,
  }) => {
    await page.goto('/en')
    const feed = page.getByRole('main')
    const similar = feed.getByText(/^Because you follow #macro$/).first()
    await expect(similar).toBeVisible()
    await expect(feed.getByText('Popular in Argentina').first()).toBeVisible()
    // TRENDING and FOLLOWING say nothing (Q1).
    await expect(feed.getByText(/Popular in Asinko|From a group you follow/)).toHaveCount(0)

    // Above the header: the card's byline comes after it.
    const card = feed
      .getByRole('article')
      .filter({ has: page.getByText(/^Because you follow #macro$/) })
      .first()
    const line = await card.getByText(/^Because you follow #macro$/).boundingBox()
    const title = await card.getByRole('heading').first().boundingBox()
    expect(line!.y).toBeLessThan(title!.y)

    // No horizontal scroll at the phone's width either.
    await page.setViewportSize({ width: 360, height: 740 })
    await expect(similar).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    await expectNoA11yViolations(page)

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.evaluate(() => localStorage.setItem('theme', 'dark'))
    await page.reload()
    await expect(feed.getByText(/^Because you follow #macro$/).first()).toBeVisible()
    await expectNoA11yViolations(page)

    // The community's link leads to its page, not to the post.
    // The line's own link, not the card header's (both go to the group).
    await feed
      .getByText(/^Because you follow #macro$/)
      .first()
      .getByRole('link', { name: '#macro' })
      .click()
    await expect(page).toHaveURL(/\/en\/hub\/macro$/)
  })

  test('says it in Spanish', async ({ page }) => {
    await page.goto('/es')
    await expect(
      page
        .getByRole('main')
        .getByText(/^Porque sigues #macro$/)
        .first(),
    ).toBeVisible()
    await expect(page.getByRole('main').getByText('Popular en Argentina').first()).toBeVisible()
  })

  test('says nothing in Following, nor on a group or an asset (EX-03)', async ({ page }) => {
    for (const path of ['/en?feed=following', '/en/hub/macro', '/en/asset/BTC']) {
      await page.goto(path)
      await expect(page.getByRole('main').getByRole('article').first()).toBeVisible()
      await expect(
        page.getByRole('main').getByText(/^Because you follow|^Popular in /),
      ).toHaveCount(0)
    }
  })
})
