import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/sidebar-toggle against the production build with API_MOCKS=true.

const toggle = (page: Page) => page.getByRole('button', { name: 'Your interests' })
const column = (page: Page) => page.locator('#left-column')
const region = (page: Page) => page.getByRole('region', { name: 'Your interests' })

/** Whether the column casts a shadow anyone can see: Tailwind writes "none" as transparent ones. */
const shadowed = (page: Page) =>
  column(page).evaluate((el) =>
    [...getComputedStyle(el).boxShadow.matchAll(/rgba?(([^)]+))/g)].some(([, rgb]) => {
      const alpha = rgb!.split(',')[3]
      return alpha === undefined || Number(alpha) > 0
    }),
  )

/** The toggle's center, against the column's right edge. */
async function centerOffEdge(page: Page) {
  const button = (await toggle(page).boundingBox())!
  const edge = (await column(page).boundingBox())!
  return Math.abs(button.x + button.width / 2 - (edge.x + edge.width))
}

test.describe('Left column toggle', () => {
  test.skip(({ isMobile }) => isMobile, 'The left column exists from md: the phone has its panel')

  test('folds to a strip and opens again, the toggle riding the edge (SL-01, SL-02, SL-04 to SL-06)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en')
    await expect(region(page)).toBeVisible()
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true')
    // Open: 260px, its shadow towards the content, the toggle on its line.
    expect((await column(page).boundingBox())!.width).toBeCloseTo(260, 0)
    expect(await shadowed(page)).toBe(true)
    await expect.poll(() => centerOffEdge(page)).toBeLessThanOrEqual(1)
    const main = (await page.getByRole('main').boundingBox())!

    await toggle(page).click()
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false')
    // Folded: a 32px strip, no shadow, nothing of it read or reached; the content takes the room.
    await expect.poll(async () => (await column(page).boundingBox())!.width).toBeCloseTo(32, 0)
    await expect.poll(() => shadowed(page)).toBe(false)
    await expect(region(page)).toBeHidden()
    await expect.poll(() => centerOffEdge(page)).toBeLessThanOrEqual(1)
    await expect
      .poll(async () => (await page.getByRole('main').boundingBox())!.x)
      .toBeLessThan(main.x)

    await toggle(page).click()
    await expect(region(page)).toBeVisible()
    await expect.poll(async () => (await column(page).boundingBox())!.width).toBeCloseTo(260, 0)
  })

  test('works with the keyboard, and Tab skips the folded column (SL-03, SL-06)', async ({
    page,
  }) => {
    await page.goto('/en')
    await toggle(page).focus()
    await page.keyboard.press('Enter')
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false')
    // Once it has folded (150ms): while it slides it is still on screen.
    await expect(region(page)).toBeHidden()
    for (let step = 0; step < 6; step++) {
      await page.keyboard.press('Tab')
      const inColumn = await page.evaluate(() =>
        Boolean(document.querySelector('#left-column')?.contains(document.activeElement)),
      )
      expect(inColumn).toBe(false)
    }
    await toggle(page).focus()
    await page.keyboard.press('Space')
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true')
  })

  test('is remembered on reload and on every page, already drawn by the server (SL-08, SL-10)', async ({
    page,
  }) => {
    await page.goto('/en')
    await toggle(page).click()
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false')

    // The server's HTML is already folded: nothing to jump once the script runs.
    const html = await (await page.request.get('/en/hub/defi')).text()
    expect(html).toContain('data-left-site="folded"')

    await page.goto('/en/hub/defi')
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(region(page)).toBeHidden()

    // Reloaded folded, the layout does not shift as the page comes to life (CLS < 0.1, seo.md).
    await page.addInitScript(() => {
      const win = window as Window & { shift?: number }
      win.shift = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { value: number })[]) {
          win.shift! += entry.value
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.reload()
    await expect(region(page)).toBeHidden()
    await expect(page.getByRole('main').getByRole('article').first()).toBeVisible()
    const shift = await page.evaluate(() => (window as Window & { shift?: number }).shift ?? 0)
    expect(shift).toBeLessThan(0.1)
  })

  for (const theme of ['light', 'dark'] as const) {
    for (const width of [768, 1024, 1440]) {
      test(`stays accessible open and folded at ${width}px in ${theme} (SL-11)`, async ({
        page,
      }) => {
        await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
        await page.setViewportSize({ width, height: 900 })
        await page.goto('/en')
        await expect(region(page)).toBeVisible()
        await expectNoA11yViolations(page)
        await toggle(page).click()
        await expect(region(page)).toBeHidden()
        await expectNoA11yViolations(page)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow).toBeLessThanOrEqual(0)
      })
    }
  }
})

test('is not there on a phone: the column lives in the menu panel', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/en')
  await expect(toggle(page)).toBeHidden()
})
