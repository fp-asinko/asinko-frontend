import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/community-widgets against the production build with API_MOCKS=true. The demo user
// moderates #trading-on-chain (its widgets are in the server's memory, shared by both projects:
// what saves runs on desktop only); #macro has two widgets of someone else's.

const FED =
  '/en/post/00000000-0000-4000-8000-000000004002/the-fed-cuts-25-bps-what-it-means-for-crypto'
const column = (page: Page) => page.getByRole('complementary', { name: 'Related' })
// Its name is the view's: "Edit widgets", or the widget being edited.
const editor = (page: Page) => page.getByRole('dialog')

test.describe('A group as a web page, as Reddit', () => {
  test('the banner spans both columns from desktop; the right column starts under it (CW-01)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The right column exists from 1024px')
    await page.goto('/en/hub/macro')
    const banner = page.getByRole('main').getByRole('heading', { level: 1, name: '#macro' })
    await expect(banner).toBeVisible()
    const hero = (await page.locator('[data-hero]').boundingBox())!
    const aside = (await column(page).boundingBox())!
    // Over the right column too (the banner bleeds over main's 16px gutter), and the column below.
    expect(hero.x + hero.width).toBeGreaterThanOrEqual(aside.x + aside.width - 17)
    expect(aside.y).toBeGreaterThanOrEqual(hero.y + hero.height - 1)
    // The feed keeps its 16px gap from the right column, as on a page without a banner.
    const post = (await page.getByRole('main').getByRole('article').first().boundingBox())!
    expect(post.x + post.width).toBeLessThanOrEqual(aside.x - 16)
  })

  test('each page brings its own right column (CW-02, CW-03)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The right column exists from 1024px')
    await page.goto('/en')
    await expect(column(page).getByRole('region', { name: 'Season tokens' })).toBeVisible()

    await page.goto('/en/hub/macro')
    await expect(column(page).getByRole('region', { name: 'Season tokens' })).toHaveCount(0)
    await expect(column(page).getByRole('region', { name: 'About macro' })).toBeVisible()
    // Someone else's group: no pencil.
    await expect(page.getByRole('main').getByRole('button', { name: 'Edit widgets' })).toHaveCount(
      0,
    )

    // A post of #macro: its group's widgets.
    await page.goto(FED)
    await expect(column(page).getByRole('region', { name: 'About macro' })).toBeVisible()

    await page.goto('/en/asset/BTC')
    await expect(column(page).getByRole('region', { name: 'Asset data' })).toBeVisible()

    await page.goto('/en/user/maria')
    await expect(column(page).getByRole('region', { name: 'Recently viewed' })).toHaveCount(0)

    await page.goto('/en/does-not-exist')
    await expect(column(page).getByRole('region')).toHaveCount(0)
  })

  test('on a phone the widgets fold under the header as "About the community" (CW-04)', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Under lg there is no right column')
    await page.goto('/en/hub/macro')
    const fold = page.getByRole('button', { name: 'About the community' })
    await expect(fold).toHaveAttribute('aria-expanded', 'false')
    await fold.click()
    await expect(page.getByRole('main').getByRole('region', { name: 'About macro' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: /FRED/ })).toHaveAttribute(
      'target',
      '_blank',
    )
  })

  test('a moderator adds a text widget, moves it up, saves it and sees it; then deletes it (CW-08 to CW-12)', async ({
    page,
    isMobile,
  }, testInfo) => {
    test.skip(isMobile, "Saves #trading-on-chain's widgets: desktop only")
    const title = `Note ${testInfo.repeatEachIndex}${Date.now() % 10000}`
    await page.goto('/en/hub/trading-on-chain')
    await page.getByRole('main').getByRole('button', { name: 'Edit widgets' }).click()
    await expect(editor(page)).toBeVisible()

    await editor(page).getByRole('button', { name: 'Add widget' }).click()
    await page.getByRole('menuitem', { name: /^Text/ }).click()
    await editor(page).getByRole('textbox', { name: 'Title' }).fill(title)
    await editor(page).getByRole('textbox', { name: 'Text' }).fill('Be **kind**.')
    await editor(page).getByRole('button', { name: 'Done' }).click()

    await editor(page)
      .getByRole('button', { name: `Move ${title} up` })
      .click()
    await expect(editor(page).getByRole('status').filter({ hasText: 'position' })).toHaveText(
      new RegExp(`${title}, position \\d+ of \\d+`),
    )
    await editor(page).getByRole('button', { name: 'Save' }).click()
    await expect(editor(page)).toBeHidden()

    const card = column(page).getByRole('region', { name: title })
    await expect(card).toBeVisible()
    await expect(card.getByText('kind')).toHaveJSProperty('tagName', 'STRONG')

    // Back as it was.
    await page.getByRole('main').getByRole('button', { name: 'Edit widgets' }).click()
    await editor(page)
      .getByRole('button', { name: `Edit ${title}` })
      .click()
    await editor(page).getByRole('button', { name: 'Delete widget' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
    await editor(page).getByRole('button', { name: 'Save' }).click()
    await expect(column(page).getByRole('region', { name: title })).toHaveCount(0)
  })

  test('a widget moves by dragging its handle (CW-09)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The mouse: desktop')
    await page.goto('/en/hub/trading-on-chain')
    await page.getByRole('main').getByRole('button', { name: 'Edit widgets' }).click()
    const rows = editor(page).getByRole('listitem')
    const first = await rows.nth(1).textContent()
    const handle = editor(page)
      .getByRole('button', { name: /^Drag .* to reorder$/ })
      .first()
    const box = (await handle.boundingBox())!
    const target = (await rows.nth(3).boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2, target.y + target.height / 2 + 4, { steps: 8 })
    await page.mouse.up()
    expect(await rows.nth(1).textContent()).not.toBe(first)
    // Nothing saved: closing asks.
    await editor(page).getByRole('button', { name: 'Cancel' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Discard' }).click()
    await expect(editor(page)).toBeHidden()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px with "Edit widgets" open and stays accessible in ${theme} (CW-14)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/en/hub/trading-on-chain')
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      await page.getByRole('button', { name: 'About the community' }).click()
      await expectNoA11yViolations(page)
      // In the header, by the actions (CW-08).
      await page.getByRole('main').getByRole('button', { name: 'Edit widgets' }).click()
      await expect(editor(page)).toBeVisible()
      const box = (await editor(page).boundingBox())!
      expect(box.width).toBeLessThanOrEqual(360)
      await expectNoA11yViolations(page)
      await editor(page).getByRole('button', { name: 'Edit Events' }).click()
      await expect(editor(page).getByRole('textbox', { name: 'Title' })).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }
})
