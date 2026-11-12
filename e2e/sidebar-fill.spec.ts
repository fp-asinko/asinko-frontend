import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/sidebar-fill against the production build with API_MOCKS=true (the demo user's interests).
// The left column exists from md: desktop only.

const column = (page: Page) => page.locator('#left-column')

/** Whether the column scrolls, and whether every item shown fits whole inside it. */
async function layout(page: Page) {
  return column(page).evaluate((el) => {
    const box = el.getBoundingClientRect()
    const shown = [...el.querySelectorAll('li')].filter(
      (li) => !li.hidden && li.offsetParent !== null,
    )
    const cut = shown.some((li) => {
      const item = li.getBoundingClientRect()
      return (
        item.right > box.right + 1 ||
        (el.scrollHeight <= el.clientHeight + 1 && item.bottom > box.bottom + 1)
      )
    })
    return { scrolls: el.scrollHeight > el.clientHeight + 1, shown: shown.length, cut }
  })
}

test.describe('The left column fills its height', () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, 'The left column exists from md')
  })

  test('groups, people, then assets, and suggested at the end (SF-01)', async ({ page }) => {
    await page.goto('/en')
    const region = page.getByRole('region', { name: 'Your interests' })
    await expect(region.getByRole('heading')).toHaveText([
      'Groups',
      'People',
      'Assets',
      'Suggested',
    ])
  })

  test('suggested sits at the bottom of the column, the space left above it (PO, 2026-11-10)', async ({
    page,
  }, testInfo) => {
    // Taller than everything: room to spare.
    await page.setViewportSize({ width: 1280, height: 1800 })
    await page.goto('/en')
    const suggested = page
      .getByRole('region', { name: 'Your interests' })
      .getByRole('region', { name: 'Suggested' })
    await expect(suggested.getByRole('listitem').first()).toBeVisible()
    const gap = await column(page).evaluate((el) => {
      const lists = el.querySelectorAll('ul')
      const items = [...(lists[lists.length - 1]?.children ?? [])].filter(
        (li) => !(li as HTMLElement).hidden,
      )
      const last = items[items.length - 1]!.getBoundingClientRect()
      const box = el.getBoundingClientRect()
      return box.bottom - last.bottom
    })
    await page.screenshot({ path: testInfo.outputPath('bottom.png') })
    // Only the column's own padding under it.
    expect(gap).toBeLessThan(48)
  })

  test('tall: no scroll, every item whole; low: fewer, still no scroll; lower: it scrolls (SF-02 to SF-05)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 1100 })
    await page.goto('/en')
    await expect(page.getByRole('region', { name: 'Your interests' })).toBeVisible()
    const tall = await layout(page)
    expect(tall).toMatchObject({ scrolls: false, cut: false })

    // Lower, as with zoom, without reloading (SF-05): fewer items, still no scroll. The minimum
    // column is ~840px (3 groups, 3 people, 3 rows, 1 suggestion; PO, 2026-11-12).
    await page.setViewportSize({ width: 1280, height: 1000 })
    await expect.poll(async () => (await layout(page)).shown).toBeLessThan(tall.shown)
    expect(await layout(page)).toMatchObject({ scrolls: false, cut: false })

    // A common laptop window (800px) is below the new minimum: the column scrolls (SF-04).
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect.poll(async () => (await layout(page)).scrolls).toBe(true)

    // Below the minimums: the column scrolls and no section goes away (SF-04).
    await page.setViewportSize({ width: 1280, height: 560 })
    await expect.poll(async () => (await layout(page)).scrolls).toBe(true)
    await expect(
      page.getByRole('region', { name: 'Your interests' }).getByRole('heading'),
    ).toHaveCount(4)
  })

  test('at least 3 groups, 3 people and 3 assets at the minimum column (SF-03, PO 2026-11-12)', async ({
    page,
  }) => {
    // A column just over the minimum: no scroll and nothing beyond the minimums yet.
    await page.setViewportSize({ width: 1280, height: 1000 })
    await page.goto('/en')
    await expect(page.getByRole('region', { name: 'Your interests' })).toBeVisible()
    for (const name of ['Groups', 'People', 'Assets']) {
      const items = column(page).getByRole('region', { name }).locator('ul > li')
      const total = await items.count()
      await expect
        .poll(() => items.filter({ visible: true }).count())
        .toBeGreaterThanOrEqual(Math.min(total, 3))
    }
    expect(await layout(page)).toMatchObject({ scrolls: false, cut: false })
  })

  test('assets are one row of 32px each, 3 / 5 / 8 by the column height (SA-01, SA-10)', async ({
    page,
  }) => {
    const rows = page.locator('#left-column').getByRole('region', { name: 'Assets' }).locator('li')

    await page.setViewportSize({ width: 1280, height: 1000 })
    await page.goto('/en')
    await expect(rows.first()).toBeVisible()
    await expect.poll(() => rows.filter({ visible: true }).count()).toBe(3)

    await page.setViewportSize({ width: 1280, height: 1100 })
    await expect.poll(() => rows.filter({ visible: true }).count()).toBe(5)

    // Whole rows, 32px at least (WCAG 2.5.8), and no scroll.
    const heights = await rows
      .filter({ visible: true })
      .evaluateAll((items) => items.map((li) => li.getBoundingClientRect().height))
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(32)
    expect(await layout(page)).toMatchObject({ scrolls: false, cut: false })
  })

  test('what is shown fits whole in its list; the rest is out of the keyboard (SF-06)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/en')
    await expect(page.getByRole('region', { name: 'Your interests' })).toBeVisible()
    // Every item a person can reach is whole inside its list: none clipped and focusable.
    const clipped = await column(page).evaluate((el) =>
      [...el.querySelectorAll('ul')].flatMap((list) => {
        const box = list.getBoundingClientRect()
        return [...list.children]
          .filter((item) => !(item as HTMLElement).hidden && (item as HTMLElement).offsetParent)
          .filter((item) => {
            const rect = item.getBoundingClientRect()
            return rect.right > box.right + 1 || rect.bottom > box.bottom + 1
          })
          .map((item) => item.textContent)
      }),
    )
    expect(clipped).toEqual([])
    // Tabbing through the column, every control focused is on screen.
    const first = page.getByRole('region', { name: 'Your interests' }).getByRole('link').first()
    await first.focus()
    for (let step = 0; step < 25; step++) {
      const inside = await page.evaluate(() => {
        const focused = document.activeElement as HTMLElement | null
        const col = document.querySelector('#left-column')!
        if (!focused || !col.contains(focused)) return null
        const rect = focused.getBoundingClientRect()
        return (
          rect.width > 0 && rect.height > 0 && rect.right <= col.getBoundingClientRect().right + 1
        )
      })
      if (inside === null) break
      expect(inside).toBe(true)
      await page.keyboard.press('Tab')
    }
  })

  test('the phone panel keeps every item, as before (out of scope)', async ({ browser }) => {
    const phone = await browser.newPage({ viewport: { width: 360, height: 640 } })
    await phone.goto('/en')
    await phone.getByRole('button', { name: 'Open menu' }).click()
    const panel = phone.getByRole('dialog').getByRole('region', { name: 'Your interests' })
    await expect(panel).toBeVisible()
    // People and assets, not the groups: the demo's grow when another test creates one
    // (specs/community-create), and past their maximum the rest wait under "more", as they should.
    let hidden = 0
    for (const name of ['People', 'Assets']) {
      hidden += await panel
        .getByRole('region', { name })
        .evaluate(
          (el) =>
            [...el.querySelectorAll('li')].filter((li) => li.hidden || !li.offsetParent).length,
        )
    }
    expect(hidden).toBe(0)
    // Assets: a row of 32px at least, and nothing wider than the 360px screen (SA-12).
    const heights = await panel
      .getByRole('region', { name: 'Assets' })
      .locator('li')
      .evaluateAll((items) => items.map((li) => li.getBoundingClientRect().height))
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(32)
    expect(
      await phone.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0)
    await phone.close()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`stays accessible in ${theme} (SF-06)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto('/en')
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      await expect(page.getByRole('region', { name: 'Your interests' })).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }
})
