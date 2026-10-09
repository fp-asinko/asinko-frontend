import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/profile-track-record against the production build with API_MOCKS=true. @maria has 24
// theses (src/mocks/fixtures/theses.ts): a page of 20 and the rest behind "Load more".

const tabs = (page: Page) => page.getByRole('navigation', { name: 'Profile sections' })
const theses = (page: Page) => page.getByRole('region', { name: 'Theses' })

test.describe('Profile track record', () => {
  test('shows the numbers in one line, and the track record over the theses (PT-01, PT-02)', async ({
    page,
  }) => {
    await page.goto('/en/user/maria')
    const header = page.getByRole('main')
    await expect(header.getByText(/12,400\s*followers/)).toBeVisible()
    await expect(header.getByText(/180\s*following/)).toBeVisible()
    await expect(header.getByText(/74%\s*accuracy/)).toBeVisible()
    // The detail lives in the Theses tab (changed with the PO on 2026-10-09).
    await expect(header.getByText(/115\s*correct/)).toHaveCount(0)
    await page.goto('/en/user/maria?tab=theses')
    await expect(theses(page).getByText(/115\s*correct/)).toBeVisible()
    await expect(theses(page).getByText(/41\s*incorrect/)).toBeVisible()
  })

  test('says there is no resolved thesis yet instead of zeros (PT-03)', async ({ page }) => {
    // The demo viewer's own profile: no thesis at all.
    await page.goto('/en/user/demo?tab=theses')
    await expect(theses(page).getByText('No resolved theses yet')).toBeVisible()
  })

  test('switches to Theses in the URL, pages them, and back returns to Posts (PT-04, PT-05)', async ({
    page,
  }) => {
    await page.goto('/en/user/maria')
    await expect(tabs(page).getByRole('link', { name: 'Posts' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await tabs(page).getByRole('link', { name: 'Theses' }).click()
    await expect(page).toHaveURL(/\/en\/user\/maria\?tab=theses$/)
    await expect(tabs(page).getByRole('link', { name: 'Theses' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(theses(page).getByRole('article')).toHaveCount(20)
    const first = theses(page).getByRole('article').first()
    await expect(first).toContainText('BTC will close above $150K before December 2026')
    await expect(first).toContainText('Open')

    await theses(page).getByRole('button', { name: 'Load more' }).click()
    await expect(theses(page).getByRole('article')).toHaveCount(24)
    await expect(theses(page).getByRole('button', { name: 'Load more' })).toHaveCount(0)

    await page.goBack()
    await expect(page).toHaveURL(/\/en\/user\/maria$/)
    await expect(theses(page)).toHaveCount(0)
  })

  test('each state reads in its card, with ✓ and ✗ besides the color (PT-07)', async ({ page }) => {
    await page.goto('/en/user/maria?tab=theses')
    const card = (claim: string) => theses(page).getByRole('article', { name: claim })
    await expect(card('SOL holds above $150 through the October unlocks')).toContainText(
      /Correct.*Resolved at \$182\.47/,
    )
    await expect(card('XRP drops below $2 after the ETF delay')).toContainText(
      /Incorrect.*Below \$2/,
    )
    await expect(card('The Fed cuts twice more before the year ends')).toContainText(
      'Cancelled: Posted twice by mistake.',
    )
  })

  test('someone without theses gets the empty state (PT-06)', async ({ page }) => {
    await page.goto('/en/user/jeppe?tab=theses')
    await expect(theses(page).getByText('@jeppe has not published a thesis yet.')).toBeVisible()
    // On your own profile it speaks to you (creating theses comes later: no button).
    await page.goto('/en/user/demo?tab=theses')
    await expect(theses(page).getByText('You have not published a thesis yet.')).toBeVisible()
    await expect(theses(page).getByRole('button')).toHaveCount(0)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible in ${theme} (PT-09, PT-10)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/en/user/maria?tab=theses')
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      await expect(theses(page).getByRole('article').first()).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
    })
  }
})
