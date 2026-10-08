import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/mention-preview against the production build with API_MOCKS=true (the demo user is
// signed in). The Home's cards carry their group and author as preview links.

const FED_PATH =
  '/en/post/00000000-0000-4000-8000-000000004002/the-fed-cuts-25-bps-what-it-means-for-crypto'

const card = (page: Page) => page.locator('[data-preview-card]')

/** The first card header link to a group (`#…`) and to a person (`@…`) in the feed. */
function feedLinks(page: Page) {
  const feed = page.getByRole('main')
  return {
    group: feed.locator('a[data-preview^="group:"]').first(),
    person: feed.locator('a[data-preview^="user:"]').first(),
  }
}

test.describe('Mention previews', () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, 'Desktop: the mobile test checks that a tap still navigates')
  })

  test('a group shows its card after a pause, and it stays while the mouse goes to it (MP-01, MP-03, MP-07)', async ({
    page,
  }) => {
    await page.goto('/en')
    const { group } = feedLinks(page)
    const name = (await group.textContent())!.trim()
    await group.hover()
    await expect(card(page)).toBeVisible()
    await expect(card(page).getByRole('link', { name })).toBeVisible()
    await expect(card(page).getByText('Members', { exact: true })).toBeVisible()
    // The link is described by the card's summary (Q1).
    await expect(group).toHaveAttribute('aria-describedby', /.+/)

    // Across the gap to the card: it stays.
    await card(page).hover()
    await page.waitForTimeout(300)
    await expect(card(page)).toBeVisible()

    // Away from both: it goes.
    await page.mouse.move(5, 400)
    await expect(card(page)).toBeHidden()
    await expect(group).not.toHaveAttribute('aria-describedby', /.+/)
  })

  test('passing over a link opens nothing; Esc closes the card (MP-07, MP-10)', async ({
    page,
  }) => {
    await page.goto('/en')
    const { group, person } = feedLinks(page)
    await group.hover()
    await page.mouse.move(5, 400)
    await page.waitForTimeout(700)
    await expect(card(page)).toBeHidden()

    await person.hover()
    await expect(card(page)).toBeVisible()
    await expect(card(page).getByText('Followers', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(card(page)).toBeHidden()
  })

  test('the keyboard opens it too, and moving on closes it (Q1)', async ({ page }) => {
    await page.goto('/en')
    const { group } = feedLinks(page)
    await group.focus()
    // A real keyboard focus: :focus-visible.
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(group).toBeFocused()
    await expect(card(page)).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(card(page)).toBeHidden()
  })

  test('joins a group from its card (MP-06)', async ({ page }) => {
    await page.goto('/en')
    // The first group in the feed the demo user has not joined: its card offers Join.
    const group = page
      .getByRole('main')
      .getByRole('article')
      .filter({ has: page.getByRole('button', { name: /^Join #/ }) })
      .first()
      .locator('a[data-preview^="group:"]')
      .first()
    // Fixed now: once joined, its post loses its own Join button and the filter would move on.
    const target = await group.getAttribute('data-preview')
    await group.hover()
    const join = card(page).getByRole('button', { name: /^Join/ })
    await join.click()
    await expect(card(page).getByRole('button', { name: /^Joined/ })).toBeVisible()
    // After the click the focus is on the card's button: leaving still closes it (MP-07), and
    // the focus goes back to the link.
    await page.mouse.move(5, 400)
    await expect(card(page)).toBeHidden()
    await expect(page.locator(`a[data-preview="${target}"]:focus`)).toHaveCount(1)
  })

  test('comment authors have cards too (MP-01)', async ({ page }) => {
    await page.goto(FED_PATH)
    const author = page
      .getByRole('region', { name: /comments/i })
      .locator('a[data-preview^="user:"]')
      .first()
    await author.hover()
    await expect(card(page)).toBeVisible()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`the open card is accessible in ${theme} (MP-13)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.goto('/en')
      await feedLinks(page).person.hover()
      await expect(card(page).getByText('Followers', { exact: true })).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }
})

test('in a phone a tap goes to the page, with no card (MP-02)', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile only')
  await page.goto('/en')
  const group = page.getByRole('main').locator('a[data-preview^="group:"]').first()
  const href = await group.getAttribute('href')
  await group.tap()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  await expect(card(page)).toHaveCount(0)
})
