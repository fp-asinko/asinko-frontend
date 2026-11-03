import { expect, type Page } from '@playwright/test'

// What the thesis specs share (specs/thesis-create, specs/thesis-detail): a fresh account of its
// own, and a thesis written with the form. The mocked POST /theses puts it first in its author's
// theses: @demo keeps none, as e2e/profile-track-record.spec.ts expects.

export const main = (page: Page) => page.getByRole('main')

/** A new account with its username (specs/auth, as e2e/auth.spec.ts): the simulated Supabase. */
export async function signUp(page: Page, baseURL: string): Promise<string> {
  const username = `th_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  // Without the demo user: the account's own session.
  await page.context().addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL }])
  await page.goto('/en/login?mode=signup')
  await page.getByLabel('Email').fill(`${username}@asinko.dev`)
  await page.getByLabel('Password', { exact: true }).fill('long-enough')
  await main(page).getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/en\/welcome/)
  await expect(page.getByLabel('Username')).toHaveValue(username)
  await page.getByRole('checkbox', { name: /I’m 18 or older/ }).click()
  await main(page).getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page).toHaveURL(/\/en$/)
  return username
}

/** Fills everything but where it goes and the asset, which come from the URL. */
export async function fillThesis(page: Page, claim: string) {
  await main(page).getByRole('textbox', { name: 'Claim' }).fill(claim)
  // Above BTC's price in the mocks: the direction comes from it (TC-24).
  await main(page).getByRole('textbox', { name: 'Target price' }).fill('150000')
  // "Other date", and the first day it offers: tomorrow, in the browser's zone (TC-06, TC-33).
  await main(page).getByText('Other date', { exact: true }).click()
  const deadline = main(page)
    .getByLabel('Deadline date', { exact: true })
    .and(page.locator('input[type=date]'))
  await deadline.fill((await deadline.getAttribute('min'))!)
  await main(page).getByRole('radio', { name: 'High' }).click()
  await main(page).getByRole('textbox', { name: 'Reasoning' }).fill('ETF flows keep coming.')
}

/** Publishes a thesis on $BTC with the form and lands on its author's theses. */
export async function publishThesis(page: Page, username: string, claim: string) {
  await page.goto('/en/submit?community=BTC&type=thesis')
  await fillThesis(page, claim)
  await main(page).getByRole('button', { name: 'Publish' }).click()
  const dialog = page.getByRole('dialog', { name: 'Publish thesis' })
  await dialog.getByRole('checkbox', { name: 'I understand this is not financial advice' }).click()
  await dialog.getByRole('button', { name: 'Publish thesis' }).click()
  await expect(page).toHaveURL(`/en/user/${username}?tab=theses`)
}
