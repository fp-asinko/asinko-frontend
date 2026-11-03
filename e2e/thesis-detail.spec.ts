import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'
import { main, publishThesis, signUp } from './fixtures/theses'

// specs/thesis-detail against the production build with API_MOCKS=true. The mocks carry theses of
// each state in the feeds (src/mocks/fixtures/theses.ts); cancelling uses one written by an account
// of its own, so every run starts clean.

const MARIA_OPEN = 'BTC will close above $150K before December 2026'
const MARIA_PAGE = '/en/thesis/00000000-0000-4000-8000-000000009001'

test.describe('A thesis in the feed and on its page', () => {
  test('shows in its asset’s feed and opens its page (TD-01 to TD-06)', async ({ page }) => {
    await page.goto('/en/asset/BTC')
    const card = main(page).getByRole('article', { name: MARIA_OPEN })
    await expect(card).toBeVisible()
    await expect(card.getByText('Thesis', { exact: true })).toBeVisible()
    await expect(card.getByText('Open', { exact: true })).toBeVisible()
    await expect(card.getByRole('link', { name: /arguments/ })).toBeVisible()

    await card.getByRole('link', { name: MARIA_OPEN }).click()
    await expect(page).toHaveURL(MARIA_PAGE)
    await expect(page.getByRole('heading', { level: 1, name: MARIA_OPEN })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
    // The reasoning, the bet and where it stands (TD-06 to TD-08).
    await expect(main(page).getByText('Flows, positioning and the macro calendar')).toBeVisible()
    const bet = main(page).getByRole('region', { name: 'The bet' })
    await expect(bet.getByText('Reference price')).toBeVisible()
    await expect(bet.getByText(/^Above \$150,000 · [+-]/)).toBeVisible()
    await expect(bet.getByText(/^Closes in /)).toBeVisible()
    // Its arguments, For and Against (specs/thesis-arguments TA-01).
    const args = main(page).getByRole('region', { name: 'Arguments' })
    await expect(args.getByRole('link', { name: 'For 3' })).toHaveAttribute('aria-current', 'page')
    await expect(args.getByRole('link', { name: 'Against 1' })).toBeVisible()
  })

  test('says how a resolved one ended and why a cancelled one was (TD-08)', async ({ page }) => {
    await page.goto('/en/user/maria?tab=theses')
    // Its card's claim, not the featured one that shows it too (specs/profile-showcase).
    const open = (claim: string) =>
      main(page).locator('a[href^="/en/thesis/"]', { hasText: claim }).first().click()
    await open('SOL holds above $150 through the October unlocks')
    await expect(page).toHaveURL(/\/en\/thesis\//)
    await expect(main(page).getByText(/^Correct on .+ at \$182\.47 · automatically$/)).toBeVisible()

    await page.goto('/en/user/maria?tab=theses')
    await open('The Fed cuts twice more before the year ends')
    await expect(main(page).getByText(/^Cancelled on .+: Posted twice by mistake\.$/)).toBeVisible()
  })

  test('has its title, canonical and share image, and a missing one is a 404 (TD-10, TD-11)', async ({
    page,
    request,
  }) => {
    await page.goto(MARIA_PAGE)
    await expect(page).toHaveTitle(`${MARIA_OPEN} · $BTC · Asinko`)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/en\/thesis\/00000000-0000-4000-8000-000000009001$/,
    )
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute(
      'href',
      /\/es\/thesis\//,
    )
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/thesis\/.+\/opengraph-image\/card/,
    )
    const missing = await request.get('/en/thesis/00000000-0000-4000-8000-0000000000ff')
    expect(missing.status()).toBe(404)
  })

  test('votes on a thesis as on a post (TD-16)', async ({ page }) => {
    await page.goto(MARIA_PAGE)
    // The thesis's own, not its arguments' (specs/thesis-arguments).
    const upvote = main(page)
      .getByRole('article', { name: MARIA_OPEN })
      .getByRole('button', { name: 'Upvote' })
      .first()
    await upvote.click()
    await expect(upvote).toHaveAttribute('aria-pressed', 'true')
  })

  test('its author cancels it with a reason, and it stays as Cancelled (TD-12 to TD-14)', async ({
    page,
    baseURL,
  }, testInfo) => {
    const username = await signUp(page, baseURL!)
    const claim = `To cancel (${testInfo.project.name} ${Date.now()})`
    await publishThesis(page, username, claim)
    await main(page).getByRole('link', { name: claim }).click()
    await expect(page.getByRole('heading', { level: 1, name: claim })).toBeVisible()

    await main(page)
      .getByRole('button', { name: `Options for the thesis ${claim}` })
      .click()
    await page.getByRole('menuitem', { name: 'Cancel thesis' }).click()
    const dialog = page.getByRole('dialog', { name: 'Cancel this thesis?' })
    await expect(dialog).toContainText('It stays on your track record as Cancelled')
    await expectNoA11yViolations(page)
    await dialog.getByRole('button', { name: 'Cancel thesis' }).click()
    await expect(dialog.getByRole('alert')).toHaveText('Say why you are cancelling it')
    await dialog.getByRole('textbox', { name: 'Why are you cancelling it?' }).fill('Wrong asset.')
    await dialog.getByRole('button', { name: 'Cancel thesis' }).click()

    await expect(dialog).toBeHidden()
    await expect(main(page).getByText(/^Cancelled on .+: Wrong asset\.$/)).toBeVisible()
    await expect(main(page).getByRole('button', { name: /^Options for the thesis/ })).toHaveCount(0)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible in ${theme} (TD-18)`, async ({ page, isMobile }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      if (isMobile) await page.setViewportSize({ width: 360, height: 740 })
      // The Home and an asset's page, with theses among their cards, and a thesis's page.
      for (const path of ['/en', '/en/asset/BTC', MARIA_PAGE]) {
        await page.goto(path)
        if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow, path).toBeLessThanOrEqual(0)
        await expectNoA11yViolations(page)
      }
    })
  }
})
