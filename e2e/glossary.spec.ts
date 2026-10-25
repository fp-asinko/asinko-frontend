import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/glossary against the production build with API_MOCKS=true: the mock puts a glossary term
// after every 8 posts of the Home, ads not counted, chosen at random.

const terms = (page: Page) => page.getByRole('article', { name: /^Glossary: / })
const noOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

test.describe('Glossary in the Home', () => {
  test('a term after every 8 posts, with its group, mark and example, and nothing to press (GL-01, GL-02, GL-04)', async ({
    page,
  }) => {
    await page.goto('/en')
    await expect(terms(page)).toHaveCount(2)
    // Ninth in the list: after the first 8 posts.
    await expect(page.getByRole('main').getByRole('article').nth(8)).toHaveAttribute(
      'aria-label',
      /^Glossary: /,
    )

    const term = terms(page).first()
    const name = (await term.getAttribute('aria-label'))!.replace('Glossary: ', '')
    await expect(term.getByRole('heading', { level: 2, name })).toBeVisible()
    await expect(term.getByText(/^(Trading|Macro and bonds)$/)).toBeVisible()
    await expect(term.getByText('Glossary', { exact: true })).toBeVisible()
    await expect(term.getByText('Example', { exact: true })).toBeVisible()
    await expect(term.getByRole('button')).toHaveCount(0)
    await expect(term.getByRole('link')).toHaveCount(0)
  })

  test('only in the Home: not in a community feed (GL-01)', async ({ page }) => {
    await page.goto('/en/hub/macro')
    await expect(page.getByRole('article').first()).toBeVisible()
    await expect(terms(page)).toHaveCount(0)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360 px and passes axe in ${theme} (GL-06)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/en')
      await terms(page).first().scrollIntoViewIfNeeded()
      expect(await noOverflow(page)).toBe(true)
      await expectNoA11yViolations(page)
    })
  }
})
