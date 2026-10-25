import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/composer-row against the production build with API_MOCKS=true.

const prompt = (page: Page) =>
  page
    .getByRole('main')
    .getByRole('link', { name: /What are you thinking\?|No que você está pensando\?/ })
    .first()
const publish = (page: Page) =>
  page
    .getByRole('main')
    .locator('a', { hasText: /^(Publish|Publicar)$/ })
    .first()
const linkIcon = (page: Page) => page.getByRole('main').getByRole('link', { name: 'Link' }).first()

/** Same row: their vertical centers within a few pixels. */
async function sameRow(page: Page) {
  const a = (await prompt(page).boundingBox())!
  const b = (await publish(page).boundingBox())!
  return Math.abs(a.y + a.height / 2 - (b.y + b.height / 2)) <= 4
}

const noOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)

test.describe('Composer box in one row', () => {
  for (const width of [1280, 1440]) {
    test(`is one row at ${width}px, where it fits: the prompt left, the formats and Publish right (CR-01, CR-06)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/en')
      await expect(prompt(page)).toBeVisible()
      expect(await sameRow(page)).toBe(true)
      // The icons sit on the right, next to Publish, after the prompt.
      const text = (await prompt(page).boundingBox())!
      const icon = (await linkIcon(page).boundingBox())!
      expect(icon.x).toBeGreaterThan(text.x + text.width - 1)
      // The prompt whole, not cut.
      const span = prompt(page).locator('span')
      expect(await span.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
      expect(await noOverflow(page)).toBe(true)
    })
  }

  for (const width of [640, 1024]) {
    test(`goes back to two rows at ${width}px, where the row would cut the prompt (CR-06)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/en')
      await expect(prompt(page)).toBeVisible()
      expect(await sameRow(page)).toBe(false)
      expect(await noOverflow(page)).toBe(true)
    })
  }

  test('stays two rows on a phone, the prompt whole, the seven formats and Publish in (CR-02, CR-05)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/en')
    await expect(prompt(page)).toBeVisible()
    expect(await sameRow(page)).toBe(false)
    const span = prompt(page).locator('span')
    expect(await span.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    for (const name of ['Duel', 'Portfolio']) {
      await expect(page.getByRole('main').getByRole('button', { name })).toBeVisible()
    }
    // Thought is no longer coming soon: a link to create one (specs/thoughts TH-04).
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Thought', exact: true }),
    ).toBeVisible()
    // Publish inside the box, after the last format.
    const last = (await page
      .getByRole('main')
      .getByRole('link', { name: 'Thought', exact: true })
      .boundingBox())!
    const pub = (await publish(page).boundingBox())!
    expect(pub.x).toBeGreaterThanOrEqual(last.x + last.width)
    expect(pub.x + pub.width).toBeLessThanOrEqual(360)
    expect(await noOverflow(page)).toBe(true)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`keeps the longest prompt (Portuguese) in the row, and stays accessible in ${theme} (CR-04)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto('/pt')
      await expect(prompt(page)).toBeVisible()
      expect(await sameRow(page)).toBe(true)
      expect(await noOverflow(page)).toBe(true)
      await expectNoA11yViolations(page)
    })
  }
})
