import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/community-first against the production build with API_MOCKS=true: the demo user is
// signed in and is not a member of #memecoins (src/mocks/fixtures/communities.ts).

const feed = (page: Page) => page.getByRole('main')
const joinMemecoins = (page: Page) => page.getByRole('button', { name: 'Join #memecoins' })

test.describe('The group first on each card', () => {
  test('the header shows the group before the author (CF-01, CF-02)', async ({ page }) => {
    await page.goto('/en')
    const card = feed(page).getByRole('article').filter({ hasText: 'Whales accumulated' })
    const header = await card.getByRole('link', { name: '$BTC' }).first().boundingBox()
    // The author by their name, without the @ (specs/byline-handles BH-01).
    const author = await card
      .getByRole('link', { name: 'maria', exact: true })
      .first()
      .boundingBox()
    // The group sits on the first line, the author below it.
    expect(header!.y).toBeLessThan(author!.y)
  })

  test('fits 360px without horizontal scroll (CF-13)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/en')
    await expect(joinMemecoins(page).first()).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    const box = await joinMemecoins(page).first().boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(32)
  })
})

test.describe('Joining', () => {
  test('hides every join button of the group at once, column included (CF-07, CF-10)', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en')
    const cards = feed(page).getByRole('button', { name: 'Join #memecoins' })
    await expect(cards.first()).toBeVisible()
    // From md the left column offers it too (Suggested): one more than the cards.
    if (!isMobile) await expect(joinMemecoins(page)).toHaveCount((await cards.count()) + 1)

    await cards.first().click()
    await expect(joinMemecoins(page)).toHaveCount(0)
    // Other groups keep theirs.
    await expect(page.getByRole('button', { name: 'Join #macro' }).first()).toBeVisible()
    await expectNoA11yViolations(page)
  })

  test('opens the account modal without a session (CF-06)', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
    await page.goto('/en')
    // Without a session no one is a member: every group offers to join.
    await feed(page).getByRole('button', { name: 'Join $BTC' }).first().click()
    await expect(
      page.getByRole('dialog', { name: 'Join Asinko to join communities' }),
    ).toBeVisible()
  })
})
