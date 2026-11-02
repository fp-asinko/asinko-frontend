import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/thesis-create against the production build with API_MOCKS=true. What publishes does it
// with an account of its own (signUp), and the mocked POST /theses puts the thesis first in its
// theses: @demo keeps none, as e2e/profile-track-record.spec.ts expects. The rest is the demo user.

const main = (page: Page) => page.getByRole('main')

/** A new account with its username (specs/auth, as e2e/auth.spec.ts): the simulated Supabase. */
async function signUp(page: Page, baseURL: string): Promise<string> {
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
async function fill(page: Page, claim: string) {
  await main(page).getByRole('textbox', { name: 'Claim' }).fill(claim)
  await main(page).getByRole('radio', { name: 'Above' }).click()
  await main(page).getByRole('textbox', { name: 'Target price' }).fill('150000')
  const deadline = main(page).getByLabel('Deadline')
  // The first day it offers: tomorrow, in the browser's zone (TC-06).
  await deadline.fill((await deadline.getAttribute('min'))!)
  await main(page).getByRole('radio', { name: 'High' }).click()
  await main(page).getByRole('textbox', { name: 'Reasoning' }).fill('ETF flows keep coming.')
}

test.describe('Create a thesis', () => {
  test('from an asset, confirmed with the disclaimer, lands first in the author’s theses (TC-01 to TC-14)', async ({
    page,
    baseURL,
  }, testInfo) => {
    const username = await signUp(page, baseURL!)
    const claim = `BTC above 150K (${testInfo.project.name} ${Date.now()})`
    await page.goto('/en/submit?community=BTC&type=thesis')
    await expect(main(page).getByRole('tab', { name: 'Thesis' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    // The asset of the URL, and its price next to the target (TC-02, TC-05).
    await expect(main(page).getByRole('combobox', { name: 'Asset' })).toHaveText('$BTC')
    await fill(page, claim)
    await expect(main(page).getByText(/Current price: .* the target is/)).toBeVisible()

    await main(page).getByRole('button', { name: 'Publish' }).click()
    const dialog = page.getByRole('dialog', { name: 'Publish thesis' })
    await expect(dialog).toContainText(claim)
    const send = dialog.getByRole('button', { name: 'Publish thesis' })
    await expect(send).toHaveAttribute('aria-disabled', 'true')
    await dialog
      .getByRole('checkbox', { name: 'I understand this is not financial advice' })
      .click()
    await send.click()

    await expect(page).toHaveURL(`/en/user/${username}?tab=theses`)
    await expect(main(page).getByRole('article').first()).toContainText(claim)
  })

  test('says what is missing, and switching to a post and back keeps both (TC-01, TC-09)', async ({
    page,
  }) => {
    await page.goto('/en/submit?community=defi')
    await main(page).getByRole('textbox', { name: 'Title' }).fill('A post in the making')
    await main(page).getByRole('tab', { name: 'Thesis' }).click()
    await expect(page).toHaveURL(/type=thesis/)

    const publish = main(page).getByRole('button', { name: 'Publish' })
    await expect(publish).toHaveAttribute('aria-disabled', 'true')
    await publish.click({ force: true })
    await expect(main(page).getByText('Choose an asset', { exact: true }).last()).toBeVisible()
    await expect(main(page).getByText('Write the claim')).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await main(page).getByRole('textbox', { name: 'Claim' }).fill('Kept across tabs')

    await main(page).getByRole('tab', { name: 'Text' }).click()
    await expect(main(page).getByRole('textbox', { name: 'Title' })).toHaveValue(
      'A post in the making',
    )
    await main(page).getByRole('tab', { name: 'Thesis' }).click()
    await expect(main(page).getByRole('textbox', { name: 'Claim' })).toHaveValue('Kept across tabs')
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible, the confirmation too, in ${theme} (TC-16, TC-17)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })
      await page.goto('/en/submit?community=BTC&type=thesis')
      await expect(main(page).getByRole('textbox', { name: 'Claim' })).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)

      await fill(page, 'BTC above 150K before the deadline')
      await main(page).getByRole('button', { name: 'Publish' }).click()
      const dialog = page.getByRole('dialog', { name: 'Publish thesis' })
      await expect(dialog).toBeVisible()
      // A panel from the bottom in phones: it touches the bottom edge.
      // Measured once its opening (a short zoom) is over.
      await expect
        .poll(async () => {
          const box = (await dialog.boundingBox())!
          return Math.round(box.y + box.height)
        })
        .toBe(800)
      await expectNoA11yViolations(page)
    })
  }
})

test.describe('A thesis from UTC−3 (specs/local-time LT-05)', () => {
  // Santiago, already told to the server: no first-visit refresh in the middle of the form.
  test.use({
    timezoneId: 'America/Santiago',
    storageState: {
      cookies: [
        {
          name: 'asinko-tz',
          value: 'America%2FSantiago',
          domain: 'localhost',
          path: '/',
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    },
  })

  test('shows its author the day they chose', async ({ page, baseURL }, testInfo) => {
    const username = await signUp(page, baseURL!)
    const claim = `BTC above 150K, from Santiago (${testInfo.project.name} ${Date.now()})`
    await page.goto('/en/submit?community=BTC&type=thesis')
    await fill(page, claim)
    const day = await main(page).getByLabel('Deadline').inputValue()
    await main(page).getByRole('button', { name: 'Publish' }).click()
    const dialog = page.getByRole('dialog', { name: 'Publish thesis' })
    await dialog.getByRole('checkbox').click()
    await dialog.getByRole('button', { name: 'Publish thesis' }).click()

    await expect(page).toHaveURL(`/en/user/${username}?tab=theses`)
    const [year, month, date] = day.split('-').map(Number) as [number, number, number]
    const chosen = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(
      new Date(Date.UTC(year, month - 1, date, 12)),
    )
    await expect(main(page).getByRole('article').first()).toContainText(chosen)
  })
})
