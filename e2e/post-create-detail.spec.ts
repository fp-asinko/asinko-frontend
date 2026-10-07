import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/post-create-detail against the production build with API_MOCKS=true
// (src/mocks/fixtures/posts.ts: post 1 is "Whales accumulated…", post 12 is deleted).

const WHALES = '00000000-0000-4000-8000-000000004001'
const WHALES_PATH = `/post/${WHALES}/whales-accumulated-48-000-btc-in-two-weeks`
const DELETED = '00000000-0000-4000-8000-000000004012'
// The Fed post: a thread five levels deep, folded from level 4.
const FED_PATH =
  '/en/post/00000000-0000-4000-8000-000000004002/the-fed-cuts-25-bps-what-it-means-for-crypto'

const comments = (page: Page) => page.getByRole('region', { name: /comments/i })

test.describe('Post detail', () => {
  test('shows the whole post with its title as the h1, and passes axe (PC-12, PC-13)', async ({
    page,
  }) => {
    await page.goto(`/en${WHALES_PATH}`)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Whales accumulated 48,000 $BTC in two weeks' }),
    ).toBeVisible()
    await expect(
      page.getByRole('article').first().getByRole('button', { name: 'Upvote' }),
    ).toBeVisible()
    await expect(page.getByText('See more')).toHaveCount(0)
    await expectNoA11yViolations(page)
  })

  test('redirects a missing or outdated slug to the canonical URL, 308 (PC-12)', async ({
    request,
  }) => {
    for (const from of [`/es/post/${WHALES}`, `/pt/post/${WHALES}/old-title`]) {
      const response = await request.get(from, { maxRedirects: 0 })
      expect(response.status(), from).toBe(308)
      const locale = from.split('/')[1]
      expect(new URL(response.headers().location!, 'http://x').pathname).toBe(
        `/${locale}${WHALES_PATH}`,
      )
    }
  })

  test('an unknown post or an invalid id is a real 404 (PC-12)', async ({ request }) => {
    expect((await request.get('/en/post/00000000-0000-4000-8000-000000000000/x')).status()).toBe(
      404,
    )
    expect((await request.get('/en/post/not-an-id')).status()).toBe(404)
  })

  test('has its own title, description and canonical; a deleted post is not indexed (PC-12)', async ({
    page,
  }) => {
    await page.goto(`/es${WHALES_PATH}`)
    await expect(page).toHaveTitle(/Whales accumulated 48,000 \$BTC in two weeks/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/es${WHALES_PATH}$`),
    )

    await page.goto(`/en/post/${DELETED}`)
    await expect(page.getByRole('heading', { level: 1, name: '[deleted]' })).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })
})

test.describe('Post detail comments', () => {
  test('comments and replies show at once and stay after the refresh (PC-14, PC-15)', async ({
    page,
  }, testInfo) => {
    // The mock server keeps created comments for every test: unique texts per run and project.
    const mine = `Rates first, then risk (${testInfo.project.name} ${Date.now()})`
    const reply = `Agreed with the dots (${testInfo.project.name} ${Date.now()})`
    await page.goto(FED_PATH)
    const section = comments(page)

    await section.getByRole('textbox', { name: 'Your comment' }).fill(mine)
    await section.getByRole('button', { name: 'Comment' }).click()
    await expect(section.getByText(mine)).toBeVisible()
    await expect(section.getByRole('textbox', { name: 'Your comment' })).toHaveValue('')
    await expect(section.getByText('Sending…')).toHaveCount(0)

    const thread = section.getByRole('listitem').filter({ hasText: mine }).first()
    await thread.getByRole('button', { name: 'Reply' }).click()
    const box = thread.getByRole('textbox', { name: 'Your comment' })
    await expect(box).toBeFocused()
    await box.fill(reply)
    await thread.locator('form').getByRole('button', { name: 'Reply' }).click()
    await expect(thread.getByText(reply)).toBeVisible()
    await expect(thread.getByRole('textbox')).toHaveCount(0)

    await page.reload()
    await expect(comments(page).getByText(reply)).toBeVisible()
  })

  test('folds the replies from level 4 and votes a comment (PC-14, PC-16)', async ({ page }) => {
    await page.goto(FED_PATH)
    const section = comments(page)
    await expect(section.getByText('He always does.')).toBeHidden()
    await section.getByRole('button', { name: 'See 2 replies' }).click()
    await expect(section.getByText(/He always does/)).toBeVisible()
    await expect(section.getByText(/Until the next CPI print/)).toBeVisible()

    const first = section.getByRole('listitem').filter({ hasText: 'The dot plot shows' }).first()
    const upvote = first.getByRole('button', { name: 'Upvote' }).first()
    await upvote.click()
    await expect(upvote).toHaveAttribute('aria-pressed', 'true')
    await expectNoA11yViolations(page)
  })

  test('without a session, commenting asks for an account (PC-15)', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
    await page.goto(FED_PATH)
    const section = comments(page)
    await section.getByRole('textbox', { name: 'Your comment' }).fill('Hello')
    await section.getByRole('button', { name: 'Comment' }).click()
    await expect(page.getByRole('dialog', { name: 'Join Asinko to comment' })).toBeVisible()
  })

  test('fits 360px without horizontal scroll (PC-18)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto(FED_PATH)
    await comments(page).getByRole('button', { name: 'See 2 replies' }).click()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
