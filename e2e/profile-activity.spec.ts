import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/backend-adoption against the production build with API_MOCKS=true: a person's posts in any
// community (GET /users/{id}/content) and their replies (GET /users/{id}/comments).

test.describe('Profile activity (specs/backend-adoption)', () => {
  test('Posts lists what the person published in groups too, not only their channel (BK-02)', async ({
    page,
  }) => {
    await page.goto('/en/user/maria')
    const posts = page.getByRole('main').getByRole('article')
    await expect(posts.first()).toBeVisible()
    // In groups: the card's header names a group (#…) rather than the person's channel.
    await expect(posts.getByRole('link', { name: /^#/ }).first()).toBeVisible()
  })

  test('Replies lists their comments, each saying where it is and leading to it (BK-03)', async ({
    page,
  }) => {
    await page.goto('/en/user/maria')
    await page
      .getByRole('navigation', { name: 'Profile sections' })
      .getByRole('link', {
        name: 'Replies',
      })
      .click()
    await expect(page).toHaveURL(/\/en\/user\/maria\?tab=replies$/)
    const replies = page.getByRole('region', { name: 'Replies' }).getByRole('article')
    await expect(replies.first()).toBeVisible()
    await expect(replies.first()).toContainText(/^In /)

    const where = replies.first().getByRole('link').first()
    const href = await where.getAttribute('href')
    expect(href).toMatch(/\/post\/[^/]+\/[^#]+#comment-/)
    await expectNoA11yViolations(page)
    await where.click()
    await expect(page).toHaveURL(/#comment-/)
  })

  test('says so when there are no replies, inviting you on yours (BK-04)', async ({ page }) => {
    await page.goto('/en/user/demo?tab=replies')
    await expect(page.getByText('You have not replied yet.', { exact: false })).toBeVisible()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`the replies fit 360px and stay accessible in ${theme} (BK-08)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })
      await page.goto('/en/user/maria?tab=replies')
      await expect(
        page.getByRole('region', { name: 'Replies' }).getByRole('article').first(),
      ).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
    })
  }
})
