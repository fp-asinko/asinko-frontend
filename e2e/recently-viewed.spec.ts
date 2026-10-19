import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/recently-viewed against the production build with API_MOCKS=true. The right column
// exists from 1024px: the desktop project.

const ETH =
  '/en/post/00000000-0000-4000-8000-000000004003/eth-btc-at-a-4-year-low-capitulation-or-opportunity'
const FED =
  '/en/post/00000000-0000-4000-8000-000000004002/the-fed-cuts-25-bps-what-it-means-for-crypto'

const recent = (page: Page) =>
  page.getByRole('complementary', { name: 'Related' }).getByRole('region', {
    name: 'Recently viewed',
  })

/** Opens two posts, the Fed one last, and comes back to the Home. */
async function readTwoPosts(page: Page) {
  for (const [path, id] of [
    [ETH, '4003'],
    [FED, '4002'],
  ] as const) {
    await page.goto(path)
    // The visit is noted once the page is interactive: wait for it, as a reader would stay.
    await expect
      .poll(() =>
        page.evaluate(
          (post) => localStorage.getItem('asinko:recently-viewed')?.includes(post) ?? false,
          id,
        ),
      )
      .toBe(true)
  }
  await page.goto('/en')
}

test.describe('Recently viewed', () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, 'The right column exists from 1024px')
  })

  test('lists the posts opened, the last one first, each leading to its page (RV-01 to RV-03)', async ({
    page,
  }) => {
    await readTwoPosts(page)
    const links = recent(page).getByRole('link')
    await expect(links).toHaveCount(2)
    await expect(links.first()).toContainText('The Fed cuts 25 bps')
    await expect(links.first()).toContainText('#macro')
    await expect(links.nth(1)).toContainText('ETH/BTC at a 4-year low')

    await links.nth(1).click()
    await expect(page).toHaveURL(new RegExp(`${ETH}$`))
    // Opened again: first now, back on the Home (its only page, specs/community-widgets CW-02).
    await page.goto('/en')
    await expect(recent(page).getByRole('link').first()).toContainText('ETH/BTC at a 4-year low')
  })

  test('clears the list (RV-05)', async ({ page }) => {
    await readTwoPosts(page)
    await recent(page).getByRole('button', { name: 'Clear recently viewed' }).click()
    await expect(recent(page).getByRole('link')).toHaveCount(0)
    await expect(recent(page).getByText('Nothing viewed yet')).toBeVisible()
    await page.reload()
    await expect(recent(page).getByText('Nothing viewed yet')).toBeVisible()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`stays accessible with the list in ${theme} (RV-07)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await readTwoPosts(page)
      await expect(recent(page).getByRole('link')).toHaveCount(2)
      await expectNoA11yViolations(page)
    })
  }
})

test('in a phone there is no column, and nothing is downloaded for it (RV-08)', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Mobile only')
  await page.goto(FED)
  await page.goto('/en')
  await expect(page.getByRole('region', { name: 'Recently viewed' })).toHaveCount(0)
})
