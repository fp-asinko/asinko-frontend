import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'
import { main } from './fixtures/theses'

// specs/thesis-form-steps against the production build with API_MOCKS=true: the asset as a search,
// the ticker of the assets with the most theses beside it, and the numbered steps.

test.describe('The thesis form in steps', () => {
  test('searches an asset and chooses it, and × brings the search back (FS-01 to FS-03, FS-09)', async ({
    page,
  }) => {
    await page.goto('/en/submit?type=thesis')
    const search = main(page).getByRole('combobox', { name: 'Step 1 of 6: Asset' })
    await expect(search).toHaveAttribute('placeholder', 'Search an asset…')
    await search.fill('eth')
    await page.getByRole('option', { name: /\$ETH/ }).click()

    // Chosen: its card, and the step done.
    const chosen = main(page).getByRole('group', { name: 'Step 1 of 6, done: Asset' })
    await expect(chosen).toContainText('$ETH')
    await chosen.getByRole('button', { name: 'Change $ETH' }).click()
    await expect(main(page).getByRole('combobox', { name: /Asset$/ })).toBeFocused()
  })

  test('chooses an asset from the ticker, which pauses and plays again (FS-05, FS-06)', async ({
    page,
  }) => {
    await page.goto('/en/submit?type=thesis')
    const ticker = main(page).getByRole('region', { name: 'Assets with the most theses' })
    // It moves by itself: paused first, as anyone would to take one (WCAG 2.2.2).
    await ticker.getByRole('button', { name: 'Pause' }).click()
    await expect(ticker.getByRole('button', { name: 'Play' })).toBeVisible()
    // Its name starts with what it shows (WCAG 2.5.3).
    await ticker.getByRole('button', { name: /^\$BTC, Bitcoin, \d+ theses$/ }).click()

    await expect(main(page).getByRole('group', { name: /Asset$/ })).toContainText('$BTC')
    await expect(ticker.getByRole('button', { name: /^\$BTC,/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('chooses a pill clicked while the ticker moves, without jumping back (PO, 2026-11-05)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'A pointer that hovers: a phone has no mouse over the row')
    await page.goto('/en/submit?type=thesis')
    const ticker = main(page).getByRole('region', { name: 'Assets with the most theses' })
    const eth = ticker.getByRole('button', { name: /^\$ETH,/ })
    await expect(eth).toBeVisible()
    // Moving: no waiting for it to stand still, as a person would not.
    await eth.click({ force: true })
    await expect(main(page).getByRole('group', { name: /Asset$/ })).toContainText('$ETH')
    await expect(eth).toHaveAttribute('aria-pressed', 'true')
  })

  test('chooses from the loop’s copy too, the pills that come in from the edge (PO, 2026-11-05)', async ({
    page,
  }) => {
    await page.goto('/en/submit?type=thesis')
    const ticker = main(page).getByRole('region', { name: 'Assets with the most theses' })
    await ticker.getByRole('button', { name: 'Pause' }).click()
    // The copy is hidden from assistive tech, so it is found by its place, as a pointer finds it.
    await ticker.locator('[data-marquee-copy] button').first().click({ force: true })
    await expect(main(page).getByRole('group', { name: /Asset$/ })).toContainText('$')
  })

  test('numbers the six steps (FS-08)', async ({ page }) => {
    await page.goto('/en/submit?type=thesis')
    for (const [n, name] of [
      [2, 'Claim'],
      [4, 'Target price'],
      [6, 'Reasoning'],
    ] as const) {
      await expect(
        main(page).getByRole('textbox', { name: `Step ${n} of 6: ${name}` }),
      ).toBeVisible()
    }
    await expect(
      main(page).getByRole('radiogroup', { name: /Step 3 of 6.*Deadline/ }),
    ).toBeVisible()
    await expect(
      main(page).getByRole('radiogroup', { name: /Step 5 of 6.*Conviction/ }),
    ).toBeVisible()
  })

  test('stands still when the system asks for reduced motion, without its pause (FS-05)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en/submit?type=thesis')
    const ticker = main(page).getByRole('region', { name: 'Assets with the most theses' })
    await expect(ticker.getByRole('button', { name: /^\$BTC,/ })).toBeVisible()
    await expect(ticker.getByRole('button', { name: 'Pause' })).toBeHidden()
  })

  test('fits 360px with the ticker, and stays accessible (FS-10, FS-11)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/en/submit?type=thesis')
    await expect(
      main(page).getByRole('region', { name: 'Assets with the most theses' }),
    ).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    await expectNoA11yViolations(page)
  })
})
