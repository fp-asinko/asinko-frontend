import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/thoughts against the production build with API_MOCKS=true (src/mocks/fixtures/posts.ts:
// posts 24 to 26 are thoughts, 26 the long one; 27 has only its title).

const JEPPE_THOUGHT = '00000000-0000-4000-8000-000000004024'
const TITLE_ONLY = '00000000-0000-4000-8000-000000004027'

const editor = (page: Page) => page.getByRole('main')
const publish = (page: Page) => editor(page).getByRole('button', { name: 'Publish' })

async function chooseDefi(page: Page) {
  await editor(page).getByRole('combobox', { name: 'Community', exact: true }).click()
  await page.getByRole('option', { name: /#defi/ }).click()
}

const noOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

test.describe('Thoughts', () => {
  test('the quote icon of the box opens Create with Thought chosen, and publishing lands on its page (TH-03 to TH-05, TH-08)', async ({
    page,
  }, testInfo) => {
    const text = `Liquidity leads, price follows (${testInfo.project.name} ${Date.now()})`
    await page.goto('/en')
    await page.getByRole('main').getByRole('link', { name: 'Thought', exact: true }).click()
    await expect(page).toHaveURL(/\/en\/submit\?type=thought$/)
    await expect(editor(page).getByRole('tab', { name: 'Thought' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    // Only its text: no title.
    await expect(editor(page).getByRole('textbox', { name: 'Title' })).toHaveCount(0)
    await expect(editor(page).getByText('250/250')).toBeVisible()
    expect(await noOverflow(page)).toBe(true)

    await chooseDefi(page)
    await editor(page).getByRole('textbox', { name: 'Thought' }).fill(text)
    await publish(page).click()

    await expect(page).toHaveURL(/\/en\/post\/[0-9a-f-]+\/liquidity-leads-price-follows-/)
    const article = page.getByRole('article').first()
    await expect(article.getByText(text)).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Thought by /)
    await expect(page).toHaveTitle(/Thought by /)
  })

  test('a post with only its title publishes and shows no empty body (TH-01, TH-02)', async ({
    page,
  }, testInfo) => {
    const text = `Who buys the dip today? (${testInfo.project.name} ${Date.now()})`
    await page.goto('/en/submit')
    await chooseDefi(page)
    await editor(page).getByRole('textbox', { name: 'Title' }).fill(text)
    await publish(page).click()
    await expect(page).toHaveURL(/\/en\/post\/[0-9a-f-]+\/who-buys-the-dip-today-/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(text)

    await page.goto(`/en/post/${TITLE_ONLY}`)
    await expect(
      page.getByRole('heading', { level: 1, name: 'CPI comes out Thursday: what is your number?' }),
    ).toBeVisible()
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'CPI comes out Thursday: what is your number?',
    )
  })

  test('shows on the Home as a quote with its mark, and opens its own page (TH-06, TH-08, TH-09)', async ({
    page,
  }) => {
    await page.goto('/en')
    const card = page.getByRole('article', { name: /^Thought by jeppe/ })
    await expect(card).toBeVisible()
    await expect(card.getByText('Thought', { exact: true })).toBeVisible()
    await expect(card.getByText(/Patience is not waiting/)).toBeVisible()
    // Its heading is for assistive tech (the quote is what shows): it holds the way in.
    const href = await card.getByRole('link', { name: /^Thought by jeppe/ }).getAttribute('href')
    expect(href).toMatch(new RegExp(`/en/post/${JEPPE_THOUGHT}/the-market-can-stay-irrational`))
    await page.goto(href!)
    await expect(page).toHaveURL(
      new RegExp(`/en/post/${JEPPE_THOUGHT}/the-market-can-stay-irrational`),
    )
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Thought by jeppe')
  })

  test('a long thought is cut with See more (TH-07)', async ({ page }) => {
    await page.goto('/en/hub/defi')
    const card = page.getByRole('article', { name: /^Thought by federico/ })
    await expect(card.getByText('See more')).toBeVisible()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360 px and passes axe in ${theme} (TH-10)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto(`/en/post/${JEPPE_THOUGHT}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(await noOverflow(page)).toBe(true)
      await expectNoA11yViolations(page)

      await page.goto('/en/submit?type=thought')
      await expect(editor(page).getByRole('textbox', { name: 'Thought' })).toBeVisible()
      expect(await noOverflow(page)).toBe(true)
      await expectNoA11yViolations(page)
    })
  }
})
