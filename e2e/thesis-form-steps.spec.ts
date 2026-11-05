import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'
import { main } from './fixtures/theses'

// specs/thesis-form-steps against the production build with API_MOCKS=true: the asset as a search,
// the viewer’s assets beside it (their interests, then the popular), and the numbered steps.

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

  test('chooses one of the viewer’s assets from the row beside the search (FS-04 to FS-06, PO 2026-11-05)', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en/submit?type=thesis')
    // The demo user's interests: their asset communities, the favorite first.
    const row = main(page).getByRole('region', { name: 'Based on your previous interests' })
    const btc = row.getByRole('button', { name: '$BTC, Bitcoin' })
    // Still: no counts, nothing that moves. Three, whole.
    await expect(row).not.toContainText(/thes[ie]s/)
    await expect(row.getByRole('button')).toHaveCount(3)
    if (!isMobile) {
      // Level with the search, beside it (PO, 2026-11-05).
      const search = (await main(page)
        .getByRole('combobox', { name: /Asset$/ })
        .boundingBox())!
      const pill = (await btc.boundingBox())!
      expect(Math.abs(pill.y + pill.height / 2 - (search.y + search.height / 2))).toBeLessThan(4)
      expect(pill.x).toBeGreaterThan(search.x + search.width)
    }
    await btc.click()
    await expect(main(page).getByRole('group', { name: /Asset$/ })).toContainText('$BTC')
    await expect(btc).toHaveAttribute('aria-pressed', 'true')
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

  test('fits 360px with the row, and stays accessible (FS-10, FS-11)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/en/submit?type=thesis')
    await expect(
      main(page).getByRole('region', { name: 'Based on your previous interests' }),
    ).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    await expectNoA11yViolations(page)
  })
})
