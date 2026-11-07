import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'
import { main, signUp } from './fixtures/theses'

// specs/thesis-agree against the production build with API_MOCKS=true. The answers live in the
// server's memory: each test answers with an account of its own, so the mobile and desktop runs
// never take back each other's answer. Counts are not asserted: other runs add to them.

const MARIA_OPEN = 'BTC will close above $150K before December 2026'
const MARIA_PAGE = '/en/thesis/00000000-0000-4000-8000-000000009001'
const RESULT = /^\d+% yes · \d+% no · \d+ votes?$/

test.describe('"Will it happen?" on a thesis', () => {
  test('answers No, sees the result and bets the other way (AG-01, AG-04, AG-10, AG-11)', async ({
    page,
    baseURL,
  }) => {
    await signUp(page, baseURL!)
    await page.goto(MARIA_PAGE)
    const question = main(page).getByRole('group', { name: 'Will it happen?' })
    await expect(question).toBeVisible()
    // Before answering, no shares (Q3).
    await expect(main(page).getByText(RESULT)).toHaveCount(0)

    await question.getByRole('button', { name: 'No' }).click()
    await expect(question.getByRole('button', { name: 'No', pressed: true })).toBeVisible()
    await expect(main(page).getByText(RESULT)).toBeVisible()
    await expectNoA11yViolations(page)

    await main(page).getByRole('link', { name: 'Create thesis' }).click()
    await expect(page).toHaveURL(
      /\/en\/submit\?community=BTC&type=thesis&counter=00000000-0000-4000-8000-000000009001$/,
    )
    const note = main(page).getByRole('complementary', { name: 'Answering maria' })
    await expect(note).toContainText('Above $150,000')
    await expect(note).toContainText('set your target below it')
  })

  test('takes the answer back with the same button (AG-05)', async ({ page, baseURL }) => {
    await signUp(page, baseURL!)
    await page.goto(MARIA_PAGE)
    const question = main(page).getByRole('group', { name: 'Will it happen?' })
    await question.getByRole('button', { name: 'Yes' }).click()
    await expect(question.getByRole('button', { name: 'Yes', pressed: true })).toBeVisible()
    await question.getByRole('button', { name: 'Yes' }).click()
    await expect(question.getByRole('button', { name: 'Yes', pressed: false })).toBeVisible()
    // Back after a reload too: the server took it back.
    await page.reload()
    await expect(
      main(page)
        .getByRole('group', { name: 'Will it happen?' })
        .getByRole('button', { name: 'Yes', pressed: false }),
    ).toBeVisible()
  })

  test('shows a guest the result, and asks for an account to answer (AG-08)', async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
    await page.goto('/en/asset/BTC')
    const card = main(page).getByRole('article', { name: MARIA_OPEN })
    // Its result before answering (Q3): without votes in the mocks, unless another run answered.
    await expect(card.getByText(/^(\d+% yes · \d+% no · \d+ votes?|No votes yet)$/)).toBeVisible()
    await card.getByRole('button', { name: 'Yes' }).click()
    await expect(page.getByRole('dialog', { name: 'Vote to see where you stand' })).toBeVisible()
  })
})
