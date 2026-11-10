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
    // The ticket, every number once (specs/thesis-ticket Q4): how far from the entry price, and
    // when that was; the deadline with how long it has left.
    const bet = main(page).getByRole('region', { name: 'The bet' })
    await expect(bet.getByText(/^Above \$150,000$/)).toBeVisible()
    await expect(bet.getByText(/^[+-][\d.]+%$/)).toBeVisible()
    await expect(bet.getByText(/^from \$[\d,.]+ on /)).toBeVisible()
    await expect(bet.getByText(/ · in /)).toBeVisible()
    // Its arguments, For and Against (specs/thesis-arguments TA-01).
    const args = main(page).getByRole('region', { name: 'Arguments' })
    // Without their counts: e2e/thesis-arguments.spec.ts argues on the same server.
    await expect(args.getByRole('link', { name: /^For \d+$/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(args.getByRole('link', { name: /^Against \d+$/ })).toBeVisible()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`leads its card with the ticket, at 360px and accessible, in ${theme} (specs/thesis-ticket TK-03, TK-12, TK-13)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })
      await page.goto('/en/asset/BTC')
      const card = main(page).getByRole('article', { name: MARIA_OPEN })
      // THESIS; the asset › the conviction › the target; the deadline with its state; the claim.
      await expect(card).toContainText(
        /Thesis.*Asset.*\$BTC.*Conviction.*Target.*Above \$150,000.*Deadline\s*Open.*BTC will close/,
      )
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
    })
  }

  test('puts the conviction between the asset and the target (PO, 2026-11-05)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'In a phone the conviction has its own line, below')
    await page.goto('/en/asset/BTC')
    const card = main(page).getByRole('article', { name: MARIA_OPEN })
    const asset = (await card.getByRole('link', { name: /\$BTC/ }).first().boundingBox())!
    const conviction = (await card.getByText('Conviction', { exact: true }).boundingBox())!
    const target = (await card.getByText(/^Above \$150,000$/).boundingBox())!
    expect(conviction.x).toBeGreaterThan(asset.x + asset.width)
    expect(conviction.x + conviction.width).toBeLessThan(target.x)
    // On the same line.
    expect(Math.abs(conviction.y - asset.y)).toBeLessThan(asset.height)
  })

  test('says how it is doing, on a perforated ticket, and stamps a closed one (specs/thesis-identity)', async ({
    page,
  }) => {
    // Maria's open one, a little against its bet in the mocks (src/mocks/thesis-identity.ts).
    await page.goto(MARIA_PAGE)
    const bet = main(page).getByRole('region', { name: 'The bet' })
    // On screen, only today's price over its dot; the sentence, for screen readers (PO, 2026-11-09).
    await expect(bet.locator('[data-marker]').getByText(/^Today \$[\d,.]+$/)).toBeVisible()
    await expect(bet.getByText(/^Today \$[\d,.]+ · [\d.]+% below the entry$/)).toBeAttached()
    await expect(bet.getByText(/^Entry \$/)).toBeVisible()
    await expect(bet.getByText('Target $150,000')).toBeVisible()
    // The bull beside its target (specs/thesis-agree AG-19).
    await expect(bet.locator('[data-mark="bull"]')).toBeVisible()

    // A resolved one wears its stamp: its card in the list, with the ticket, not the featured one.
    await page.goto('/en/user/maria?tab=theses')
    const resolved = main(page)
      .getByRole('article')
      .filter({ hasText: 'SOL holds above $150 through the October unlocks' })
      .filter({ has: page.locator('.ticket-stub-top') })
      .first()
    const stamp = resolved.locator('[data-stamp="correct"]')
    await expect(stamp).toHaveText('Correct')
    // Its number among maria's, stamped beside it (specs/thesis-number TN-01, TN-03).
    await expect(resolved.getByText(/^Thesis number \d+$/)).toBeAttached()
    // It covers no number: its result's text ends before it, or sits above it in a phone (TI-15).
    const result = (await resolved.getByText(/^Correct on /).boundingBox())!
    const box = (await stamp.boundingBox())!
    const apart = result.x + result.width <= box.x || result.y + result.height <= box.y
    expect(apart).toBe(true)
    await expectNoA11yViolations(page)
  })

  test('draws its price chart above its card, walkable with the keyboard (specs/thesis-chart)', async ({
    page,
  }) => {
    await page.goto(MARIA_PAGE)
    const chart = main(page).getByRole('img', {
      name: /^Price of BTC since .+ today; target \$150,000 by /,
    })
    await expect(chart).toBeVisible()
    // Under the header, the back button on top of everything, and above the ticket (Q3).
    const back = main(page).getByRole('button', { name: 'Back' })
    const bet = main(page).getByRole('region', { name: 'The bet' })
    const top = (await chart.boundingBox())!.y
    expect((await back.boundingBox())!.y).toBeLessThan(top)
    expect(top).toBeLessThan((await bet.boundingBox())!.y)

    // Walked day by day (CH-17): the day's date, price and change, read as the slider's value.
    const walk = main(page).getByRole('slider', { name: /^BTC price by (day|hour)$/ })
    await walk.focus()
    const today = await walk.getAttribute('aria-valuenow')
    await page.keyboard.press('ArrowLeft')
    await expect(walk).not.toHaveAttribute('aria-valuenow', today!)
    await expect(walk).toHaveAttribute(
      'aria-valuetext',
      // With hourly points the date carries its time: "Nov 6, 3:00 PM".
      /^\w{3} \d{1,2}(,.*)? · \$[\d,.]+ · .+ from entry$/,
    )
    await page.keyboard.press('Home')
    await expect(walk).toHaveAttribute('aria-valuenow', '0')
    // Walked, with its reading open: still accessible.
    await expectNoA11yViolations(page)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`walks its chart at 360px without scrolling sideways, in ${theme} (specs/thesis-chart CH-12)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })
      await page.goto(MARIA_PAGE)
      const walk = main(page).getByRole('slider', { name: /^BTC price by (day|hour)$/ })
      await walk.focus()
      for (const key of ['Home', 'ArrowRight', 'ArrowRight', 'End']) {
        await page.keyboard.press(key)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow).toBeLessThanOrEqual(0)
      }
      await expectNoA11yViolations(page)
    })
  }

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
