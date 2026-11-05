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
    await ticker.getByRole('button', { name: /^Bitcoin, \d+ theses$/ }).click()

    await expect(main(page).getByRole('group', { name: /Asset$/ })).toContainText('$BTC')
    await expect(ticker.getByRole('button', { name: /^Bitcoin/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
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
    await expect(ticker.getByRole('button', { name: /^Bitcoin/ })).toBeVisible()
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
