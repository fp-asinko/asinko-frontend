import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/post-create-detail against the production build with API_MOCKS=true
// (src/mocks/fixtures/posts.ts: post 1 is "Whales accumulated…", post 12 is deleted).

const WHALES = '00000000-0000-4000-8000-000000004001'
const WHALES_PATH = `/post/${WHALES}/whales-accumulated-48-000-btc-in-two-weeks`
const DELETED = '00000000-0000-4000-8000-000000004012'

test.describe('Post detail', () => {
  test('shows the whole post with its title as the h1, and passes axe (PC-12, PC-13)', async ({
    page,
  }) => {
    await page.goto(`/en${WHALES_PATH}`)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Whales accumulated 48,000 $BTC in two weeks' }),
    ).toBeVisible()
    await expect(page.getByRole('main').getByRole('button', { name: /upvote/i })).toBeVisible()
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
