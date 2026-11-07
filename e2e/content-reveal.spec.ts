import { expect, test, type Page } from '@playwright/test'

// specs/content-reveal against the production build: what replaces a skeleton fades in, and with
// reduced motion it appears at once.

/** The Home feed's wrapper (the innermost: the page's holds it too), without a box of its own. */
const feed = (page: Page) =>
  page
    .locator('.arrive')
    .filter({ has: page.getByRole('article') })
    .last()

/** The animation of what the wrapper holds, as the browser runs it. */
const animationOf = (page: Page) =>
  feed(page).evaluate((wrapper) => {
    const style = getComputedStyle(wrapper.firstElementChild!)
    return { name: style.animationName, duration: parseFloat(style.animationDuration) }
  })

test('the Home feed fades in all at once where its skeleton was (CR-01, CR-02)', async ({
  page,
}) => {
  await page.goto('/en')
  await expect(page.getByRole('article').first()).toBeVisible()
  await expect(feed(page)).toHaveCSS('display', 'contents')
  expect(await animationOf(page)).toEqual({ name: 'fade-in', duration: 0.2 })
})

test('the Home composer and tabs fade in where the page skeleton was (CR-05)', async ({ page }) => {
  await page.goto('/en')
  const tabs = page.getByRole('link', { name: 'For you' })
  await expect(tabs).toBeVisible()
  const name = await page
    .locator('.arrive')
    .filter({ has: tabs })
    .first()
    .evaluate((wrapper) => getComputedStyle(wrapper.firstElementChild!).animationName)
  expect(name).toBe('fade-in')
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the feed appears at once (CR-03)', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('article').first()).toBeVisible()
    // The global rule ends every animation at once.
    expect((await animationOf(page)).duration).toBeLessThan(0.01)
  })
})
