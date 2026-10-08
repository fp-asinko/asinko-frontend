import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/post-detail-refresh against the production build with API_MOCKS=true. The ETH/BTC post
// has ~30 comments with replies (src/mocks/fixtures/comments.ts): enough for 3 ads.

const ETH_PATH =
  '/en/post/00000000-0000-4000-8000-000000004003/eth-btc-at-a-4-year-low-capitulation-or-opportunity'

const comments = (page: Page) => page.getByRole('region', { name: /comments/i })

test.describe('Post detail refresh', () => {
  test('back goes to where the visit came from (PD-01)', async ({ page }) => {
    await page.goto('/en')
    await page.getByRole('link', { name: /ETH\/BTC at a 4-year low/ }).click()
    await expect(page).toHaveURL(new RegExp(`${ETH_PATH}$`))
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/en$/)
  })

  test('opened directly, back goes to the Home (PD-01)', async ({ page }) => {
    await page.goto(ETH_PATH)
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/en$/)
  })

  test('the comment box is a one-line pill that opens on focus and closes empty (PD-02)', async ({
    page,
  }) => {
    await page.goto(ETH_PATH)
    const box = comments(page).getByRole('textbox', { name: 'Join the conversation' })
    const closed = (await box.boundingBox())!.height
    expect(closed).toBeLessThanOrEqual(46)
    await expect(box).toHaveAttribute('placeholder', 'Join the conversation')
    await expect(comments(page).getByRole('button', { name: 'Comment', exact: true })).toHaveCount(
      0,
    )

    await box.click()
    await expect(comments(page).getByRole('button', { name: 'Comment', exact: true })).toBeVisible()
    await expect.poll(async () => (await box.boundingBox())!.height).toBeGreaterThan(closed)

    await page.getByRole('heading', { name: /comments/ }).click()
    await expect(comments(page).getByRole('button', { name: 'Comment', exact: true })).toHaveCount(
      0,
    )
  })

  test('sorts by New and Top, in the URL, and back returns (PD-03, PD-04)', async ({ page }) => {
    await page.goto(ETH_PATH)
    const sort = page.getByRole('button', { name: 'Sort by: Best' })
    await sort.click()
    await page.getByRole('menuitemradio', { name: 'New' }).click()
    await expect(page).toHaveURL(/\?sort=new$/)
    await expect(page.getByRole('button', { name: 'Sort by: New' })).toBeVisible()
    // The newest comment of the debate first (1.2 h ago).
    await expect(
      comments(page).getByRole('listitem').first().getByText('Final take: opportunity'),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Sort by: New' }).click()
    await page.getByRole('menuitemradio', { name: 'Top' }).click()
    await expect(page).toHaveURL(/\?sort=top$/)
    // The most voted first (88).
    await expect(
      comments(page).getByRole('listitem').first().getByText('Backtest: buying ETH/BTC'),
    ).toBeVisible()

    await page.goBack()
    await expect(page.getByRole('button', { name: 'Sort by: New' })).toBeVisible()
  })

  test('an unknown order is the default one (PD-04)', async ({ page }) => {
    await page.goto(`${ETH_PATH}?sort=hot`)
    await expect(page.getByRole('button', { name: 'Sort by: Best' })).toBeVisible()
  })

  test('searches the comments, with and without results, and goes back to all (PD-05, PD-06)', async ({
    page,
  }) => {
    await page.goto(ETH_PATH)
    const search = page.getByRole('searchbox', { name: 'Search comments' })
    await search.fill('BLOBS')
    await search.press('Enter')
    await expect(page).toHaveURL(/\?q=BLOBS$/)
    await expect(comments(page).getByRole('status').filter({ hasText: 'for “' })).toHaveText(
      '2 results for “BLOBS”',
    )
    await expect(comments(page).locator('mark')).toHaveText(['blobs', 'blobs'])
    // No ads among the results (the one inside the post stays, PD-15).
    await expect(comments(page).getByRole('region', { name: /^Ad: / })).toHaveCount(0)

    await search.fill('nothing like this')
    await search.press('Enter')
    await expect(comments(page).getByRole('status').filter({ hasText: 'for “' })).toHaveText(
      'No results for “nothing like this”',
    )

    await page.getByRole('link', { name: 'See all comments' }).click()
    await expect(page).toHaveURL(new RegExp(`${ETH_PATH}$`))
    await expect(page.getByRole('button', { name: 'Sort by: Best' })).toBeVisible()
  })

  test('shows an ad after every 10 comments, with a safe link (PD-07 to PD-10)', async ({
    page,
  }) => {
    await page.goto(ETH_PATH)
    const ads = page.getByRole('region', { name: /^Ad: / })
    // One inside the post (PD-15) and ~30 comments in reading order: 3 more.
    await expect(ads).toHaveCount(4)
    const link = ads.first().getByRole('link', { name: /^Learn more/ })
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'sponsored noopener noreferrer')
    await expect(link).toHaveAttribute('href', /^https:\/\//)
    await expect(ads.first().getByText('example.com')).toBeVisible()
  })

  test('shows an ad inside the post, before the comments, even with few of them (PD-15)', async ({
    page,
  }) => {
    // The DOGE post: 2 comments, and no test adds more (the Fed's grow during a run).
    await page.goto('/en/post/00000000-0000-4000-8000-000000004004')
    const ads = page.getByRole('region', { name: /^Ad: / })
    await expect(ads).toHaveCount(1)
    // Above the comments: before their heading.
    const adBox = (await ads.first().boundingBox())!
    const heading = (await page.getByRole('heading', { name: /comments/ }).boundingBox())!
    expect(adBox.y).toBeLessThan(heading.y)
  })

  test('the feeds show an ad every 10 cards, also after loading more (PD-16)', async ({ page }) => {
    await page.goto('/en')
    const ads = page.getByRole('main').getByRole('region', { name: /^Ad: / })
    // First page: 20 cards, ads after the 10th and the 20th.
    await expect(ads).toHaveCount(2)
    // The next page (cards 21 to 25 in the mocks) keeps counting: no ad at its start.
    const cards = page.getByRole('main').getByRole('article')
    const before = await cards.count()
    await page.getByRole('button', { name: 'Load more' }).click()
    await expect.poll(() => cards.count()).toBeGreaterThan(before)
    await expect(ads).toHaveCount(2)

    await page.goto('/en/hub/defi')
    await expect(page.getByRole('main').getByRole('article').first()).toBeVisible()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible in ${theme} (PD-12, PD-13)`, async ({
      page,
      isMobile,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      if (isMobile) await page.setViewportSize({ width: 360, height: 740 })
      await page.goto(ETH_PATH)
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      await page.getByRole('button', { name: 'Sort by: Best' }).click()
      await expect(page.getByRole('menu')).toBeVisible()
      await expectNoA11yViolations(page)
      await page.keyboard.press('Escape')

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      // An ad among the comments, far from the top: nothing left under the sticky bar.
      await page.getByRole('region', { name: /^Ad: / }).last().scrollIntoViewIfNeeded()
      await expectNoA11yViolations(page)
    })
  }
})

test('the post page breathes more than the card: header, title, body and votes apart (PD-17)', async ({
  page,
}) => {
  await page.goto(ETH_PATH)
  const post = page.getByRole('article').first()
  const title = post.getByRole('heading', { level: 1 })
  const back = post.getByRole('button', { name: 'Back' })
  const upvote = post.getByRole('button', { name: 'Upvote' })
  const paragraphs = post.getByRole('paragraph')
  const box = async (part: Locator) => {
    const found = await part.boundingBox()
    if (!found) throw new Error('not drawn')
    return found
  }
  const backBox = await box(back)
  const titleBox = await box(title)
  const bodyTop = (await box(paragraphs.first())).y
  const bodyEnd = await box(paragraphs.last())
  const voteBox = await box(upvote)
  // The gaps between them, as measured on Reddit's post page (14, 12 and 24px).
  expect(titleBox.y - (backBox.y + backBox.height)).toBeGreaterThanOrEqual(13)
  expect(bodyTop - (titleBox.y + titleBox.height)).toBeGreaterThanOrEqual(11)
  expect(voteBox.y - (bodyEnd.y + bodyEnd.height)).toBeGreaterThanOrEqual(23)
})
