import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/card-comment against the production build with API_MOCKS=true (the demo user's session).

const card = (page: Page, text: string) =>
  page.getByRole('main').getByRole('article').filter({ hasText: text }).first()
const commentsButton = (article: Locator) =>
  article.getByRole('button', { name: /\d+ comments?/ }).first()
/** The count, from the sentence screen readers get ("7 comments"). */
const countOf = async (article: Locator) =>
  Number(
    (
      await commentsButton(article)
        .getByText(/^\d+ comments?$/)
        .textContent()
    )?.replace(/\D/g, ''),
  )

async function commentOn(article: Locator, text: string) {
  await commentsButton(article).click()
  const box = article.getByRole('textbox', { name: 'Join the conversation' })
  await box.click()
  await box.fill(text)
  await article.getByRole('button', { name: 'Comment', exact: true }).click()
  return box
}

test.describe('Comment from the card', () => {
  test('comments a post from the Home: first in its preview, the count up, the feed still (CC-01 to CC-03)', async ({
    page,
  }, testInfo) => {
    const text = `Rates first (${testInfo.project.name} ${Date.now()})`
    await page.goto('/en')
    const article = card(page, 'Whales accumulated')
    const before = await countOf(article)
    const firstTitle = () =>
      page.getByRole('main').getByRole('article').first().getByRole('heading').first().innerText()
    const titleBefore = await firstTitle()

    const box = await commentOn(article, text)
    const mine = article.getByText(text)
    await expect(mine).toBeVisible()
    await expect(box).toHaveValue('')
    await expect.poll(() => countOf(article)).toBe(before + 1)
    // First in the preview: before the comments the server sent.
    const panelTexts = await article.locator('[data-card-own-click] li').allInnerTexts()
    expect(panelTexts[0]).toContain(text)
    // Still on the Home, the feed in the same order (no refresh, no new ranking).
    await expect(page).toHaveURL(/\/en$/)
    expect(await firstTitle()).toBe(titleBefore)
  })

  test('comments a poll from its card too (CC-01)', async ({ page }, testInfo) => {
    const text = `Middle one (${testInfo.project.name} ${Date.now()})`
    await page.goto('/en?filter=polls')
    const article = page.getByRole('main').getByRole('article').first()
    await commentOn(article, text)
    await expect(article.getByText(text)).toBeVisible()
  })

  test('asks for an account without a session (CC-04)', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
    await page.goto('/en')
    const article = card(page, 'Whales accumulated')
    await commentsButton(article).click()
    const box = article.getByRole('textbox', { name: 'Join the conversation' })
    await box.click()
    await box.fill('Hello')
    await article.getByRole('button', { name: 'Comment', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Join Asinko to comment' })).toBeVisible()
    // Nothing was sent: no comment of "You" in the preview.
    await expect(article.getByText('You', { exact: true })).toHaveCount(0)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px with the box open and stays accessible in ${theme} (CC-06)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })
      await page.goto('/en')
      const article = card(page, 'Whales accumulated')
      await commentsButton(article).click()
      const box = article.getByRole('textbox', { name: 'Join the conversation' })
      // With the keyboard: the box takes the focus and opens.
      await box.focus()
      await page.keyboard.type('Typing here')
      await expect(article.getByRole('button', { name: 'Comment', exact: true })).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
    })
  }
})
