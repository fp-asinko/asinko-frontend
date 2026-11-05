import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'
import { main, publishThesis, signUp } from './fixtures/theses'

// specs/thesis-arguments against the production build with API_MOCKS=true. Maria's open $BTC
// thesis has 3 arguments for and 1 against, and one update (src/mocks/fixtures). Arguing is the
// demo user's; updating needs the thesis's author, so that test publishes its own.

const PAGE = '/en/thesis/00000000-0000-4000-8000-000000009001'
const args = (page: Parameters<typeof main>[0]) =>
  main(page).getByRole('region', { name: 'Arguments' })

test.describe('A thesis’s arguments and updates', () => {
  test('reads each side in its tab, in the URL (TA-01, TA-02)', async ({ page }) => {
    await page.goto(PAGE)
    const pro = args(page).getByRole('link', { name: /^For \d+$/ })
    await expect(pro).toHaveAttribute('aria-current', 'page')
    await expect(args(page).getByText('ETF inflows have been positive 9 weeks')).toBeVisible()
    // Its reply, under it, on the same side.
    await expect(args(page).getByText('And the halving cut issuance in half.')).toBeVisible()

    await args(page)
      .getByRole('link', { name: /^Against \d+$/ })
      .click()
    await expect(page).toHaveURL(`${PAGE}?side=contra`)
    await expect(args(page).getByText('150K is a 79% move in 14 months.')).toBeVisible()
    await expect(args(page).getByText('ETF inflows have been positive 9 weeks')).toHaveCount(0)
  })

  test('puts the side’s ad above the arguments, not inside them (specs/ads AD-04, PO 2026-11-05)', async ({
    page,
  }) => {
    await page.goto(PAGE)
    const ad = main(page).getByRole('region', { name: /^Ad: / }).first()
    await expect(ad).toBeVisible()
    // Before the section, as a post's ad before its comments.
    const before = await ad.evaluate((node) => {
      const section = document.getElementById('arguments')!
      return Boolean(node.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING)
    })
    expect(before).toBe(true)
  })

  test('the order keeps the side (TA-03)', async ({ page }) => {
    await page.goto(`${PAGE}?side=contra`)
    await args(page)
      .getByRole('button', { name: /Sort by/ })
      .click()
    await page.getByRole('menuitemradio', { name: 'New' }).click()
    await expect(page).toHaveURL(`${PAGE}?side=contra&sort=new`)
    await expect(args(page).getByRole('link', { name: /^Against \d+$/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('argues against, and the side counts one more (TA-04, TA-07)', async ({ page }) => {
    await page.goto(`${PAGE}?side=contra`)
    // Other tests argue too, on the same server: the count before, and one more after.
    const tab = args(page).getByRole('link', { name: /^Against \d+$/ })
    const before = Number((await tab.textContent())!.replace(/\D/g, ''))
    const box = args(page).getByRole('textbox', { name: 'Argue against…' })
    await box.click()
    const text = `Too far, too soon (${Date.now()})`
    await box.fill(text)
    await args(page).getByRole('button', { name: 'Comment', exact: true }).click()
    await expect(args(page).getByRole('listitem').filter({ hasText: text }).first()).toBeVisible()
    await expect(tab).toHaveText(new RegExp(`^Against (${before + 1}|${before + 2})$`))
  })

  test('a reply goes to its argument’s side (TA-05)', async ({ page }) => {
    await page.goto(PAGE)
    const argument = args(page)
      .locator('li', { hasText: 'Every cycle the post-halving top' })
      .first()
    await argument.getByRole('button', { name: 'Reply' }).first().click()
    const text = `Same as 2017 (${Date.now()})`
    await args(page).getByRole('textbox', { name: 'Your reply' }).fill(text)
    await args(page).getByRole('button', { name: 'Send reply' }).click()
    await expect(args(page).getByRole('textbox', { name: 'Your reply' })).toHaveCount(0)
    await expect(args(page).getByRole('listitem').filter({ hasText: text }).first()).toBeVisible()
    // Still on For: it never shows on Against.
    await page.goto(`${PAGE}?side=contra`)
    await expect(args(page).getByText(text)).toHaveCount(0)
  })

  test('shows the author’s updates, the newest first (TA-09)', async ({ page }) => {
    await page.goto(PAGE)
    const updates = main(page).getByRole('region', { name: 'Updates from the author' })
    await expect(updates.getByText('ETF inflows held this week too.')).toBeVisible()
    // Not the author: no box.
    await expect(updates.getByRole('button', { name: 'Post an update' })).toHaveCount(0)
  })

  test('its author posts an update while it is open (TA-10, TA-12)', async ({
    page,
    baseURL,
  }, testInfo) => {
    const username = await signUp(page, baseURL!)
    const claim = `With updates (${testInfo.project.name} ${Date.now()})`
    await publishThesis(page, username, claim)
    await main(page).getByRole('link', { name: claim }).click()

    const updates = main(page).getByRole('region', { name: 'Updates from the author' })
    await updates.getByRole('button', { name: 'Post an update' }).click()
    const field = updates.getByRole('textbox', { name: 'Your update' })
    await expect(field).toHaveAccessibleDescription(/can’t be edited or deleted/)
    await field.fill('CPI came in hot. Holding the target.')
    await updates.getByRole('button', { name: 'Post update' }).click()
    await expect(updates.getByText('CPI came in hot. Holding the target.')).toBeVisible()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible in ${theme} (TA-13)`, async ({ page, isMobile }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      if (isMobile) await page.setViewportSize({ width: 360, height: 740 })
      for (const path of [PAGE, `${PAGE}?side=contra`]) {
        await page.goto(path)
        if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
        await args(page).getByRole('textbox').first().click()
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow, path).toBeLessThanOrEqual(0)
        await expectNoA11yViolations(page)
      }
    })
  }
})
