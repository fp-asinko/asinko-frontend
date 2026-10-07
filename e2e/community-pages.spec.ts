import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/community-pages against the production build with API_MOCKS=true: the demo user is a
// member of #defi and $BTC, and not of #memecoins (src/mocks/fixtures/communities.ts).

const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name })

test.describe('Community pages', () => {
  test("a group's page: header, members and its own feed, filters staying on it (CP-04, CP-07)", async ({
    page,
  }) => {
    await page.goto('/en/hub/defi')
    await expect(heading(page, '#defi')).toBeVisible()
    await expect(
      page
        .getByRole('main')
        .getByText(/members$/)
        .first(),
    ).toBeVisible()
    await expect(page.getByRole('main').getByRole('article').first()).toBeVisible()
    // The cards do not repeat the join button of the page's community.
    await expect(page.getByRole('main').getByRole('button', { name: 'Join #defi' })).toHaveCount(0)

    await page.getByRole('link', { name: 'Polls' }).click()
    await expect(page).toHaveURL(/\/en\/hub\/defi\?filter=polls$/)
  })

  test("an asset's page shows an explicit empty state for market data, no numbers (CP-09, CP-10)", async ({
    page,
  }) => {
    await page.goto('/en/asset/BTC')
    await expect(heading(page, '$BTC')).toBeVisible()
    await page.getByRole('button', { name: 'Asset data' }).click()
    await expect(page.getByText('No market data yet')).toBeVisible()
  })

  test('redirects a community to the page of its kind, 308, in the same locale (CP-02)', async ({
    request,
  }) => {
    for (const [from, to] of [
      ['/es/hub/BTC', '/es/asset/BTC'],
      ['/en/asset/btc', '/en/asset/BTC'],
      ['/pt/asset/defi', '/pt/hub/defi'],
    ]) {
      const response = await request.get(from!, { maxRedirects: 0 })
      expect(response.status(), from).toBe(308)
      expect(new URL(response.headers().location!, 'http://x').pathname).toBe(to)
    }
  })

  test('an unknown community is a real 404 (CP-02)', async ({ request }) => {
    expect((await request.get('/en/hub/nope')).status()).toBe(404)
    expect((await request.get('/en/asset/NOPE')).status()).toBe(404)
  })

  test('the same path in every locale, with translated metadata (CP-01, CP-03)', async ({
    page,
  }) => {
    await page.goto('/es/hub/defi')
    await expect(heading(page, '#defi')).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/es\/hub\/defi$/)
    await expect(page.locator('link[hreflang="pt"]')).toHaveAttribute('href', /\/pt\/hub\/defi$/)
  })
})

test.describe('Joining, leaving and favorites (CP-05, CP-06)', () => {
  test('a member leaves only after confirming, and can join again', async ({ page }) => {
    await page.goto('/en/hub/defi')
    await page.getByRole('button', { name: /^Joined/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Leave #defi?' })
    await expect(dialog).toBeVisible()
    await expectNoA11yViolations(page)
    await dialog.getByRole('button', { name: 'Leave' }).click()
    await expect(page.getByRole('button', { name: 'Join #defi' })).toBeVisible()
  })

  test('a member marks a favorite; a visitor who is not a member sees no star', async ({
    page,
  }) => {
    await page.goto('/en/hub/defi')
    const star = page.getByRole('button', { name: 'Add #defi to favorites' })
    await star.click()
    await expect(page.getByRole('button', { name: 'Remove #defi from favorites' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await page.goto('/en/hub/memecoins')
    await expect(page.getByRole('button', { name: 'Join #memecoins' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /favorites/ })).toHaveCount(0)
  })

  test('without a session, joining opens the account modal', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
    await page.goto('/en/hub/defi')
    await page.getByRole('main').getByRole('button', { name: 'Join #defi' }).first().click()
    await expect(
      page.getByRole('dialog', { name: 'Join Asinko to join communities' }),
    ).toBeVisible()
  })
})

test.describe('Quality (CP-16)', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible in ${theme}`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })
      for (const path of ['/en/hub/defi', '/en/asset/BTC']) {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(page.getByRole('main').getByRole('article').first()).toBeVisible()
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow, path).toBeLessThanOrEqual(0)
        await expectNoA11yViolations(page)
      }
    })
  }
})

test.describe('Profile pages (CP-11 to CP-13, CP-21)', () => {
  test('a profile: name and stats; following asks before unfollowing', async ({ page }) => {
    await page.goto('/en/user/federico')
    await expect(heading(page, 'Federico Piva')).toBeVisible()
    const header = page.getByRole('main').locator('header')
    // Tier and rating come after the MVP (backend, 2026-10-07).
    await expect(header.getByText('Creator')).toHaveCount(0)
    await expect(header.getByText(/followers/)).toBeVisible()
    await expect(header.getByRole('button', { name: /favorites/ })).toHaveCount(0)

    await header.getByRole('button', { name: /^Following/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Unfollow @federico?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Unfollow' }).click()
    await expect(header.getByRole('button', { name: 'Follow @federico' })).toBeVisible()
  })

  test('your own profile has no follow actions', async ({ page }) => {
    await page.goto('/en/user/demo')
    await expect(heading(page, '@demo')).toBeVisible()
    await expect(page.getByRole('main').getByRole('button', { name: /Follow/ })).toHaveCount(0)
  })

  test('a personal channel asked as a group goes to the profile; an unknown user is a 404', async ({
    request,
  }) => {
    const response = await request.get('/en/hub/federico', { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    expect(new URL(response.headers().location!, 'http://x').pathname).toBe('/en/user/federico')
    expect((await request.get('/en/user/nobody')).status()).toBe(404)
  })

  test('the author of a card links to the profile (CP-21)', async ({ page }) => {
    await page.goto('/en')
    await page.getByRole('main').getByRole('link', { name: '@maria' }).first().click()
    await expect(page).toHaveURL(/\/en\/user\/maria$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`a profile fits 360px and stays accessible in ${theme}`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })
      await page.goto('/en/user/federico')
      await expect(heading(page, 'Federico Piva')).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
    })
  }
})
