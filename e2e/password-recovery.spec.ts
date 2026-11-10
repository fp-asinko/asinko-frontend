import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/password-recovery against the production build with API_MOCKS=true: the simulated Supabase
// (src/mocks/auth.ts) never sends an email. Its links are `mock-recovery-demo` (the demo user) and
// `mock-recovery-new` (an account without a username); any other token is expired. The mock keeps
// the old passwords valid, so changing the demo user's does not lock the other tests out.

const DEMO_EMAIL = 'demo@asinko.dev'

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
})

/** What the email's link opens, coming back to `next`. */
function emailLink(token: string, next: string) {
  return `/auth/reset?next=${encodeURIComponent(next)}&token_hash=${token}&type=recovery`
}

/** A password no other test (nor another run) uses. */
function freshPassword() {
  return `pw-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

async function signedIn(page: Page) {
  await expect(page.getByRole('banner').getByRole('button', { name: 'Log in' })).toHaveCount(0)
}

test.describe('Recover the password (specs/password-recovery)', () => {
  test('asks for the email from the modal, with the one written, and says the same for any email (PR-01 to PR-03, PR-12)', async ({
    page,
  }) => {
    await page.goto('/en/hub/defi')
    await page.getByRole('banner').getByRole('button', { name: 'Log in' }).click()
    const login = page.getByRole('dialog', { name: 'Log in to Asinko' })
    await login.getByLabel('Email').fill(DEMO_EMAIL)
    await login.getByRole('button', { name: 'Forgot your password?' }).click()

    const dialog = page.getByRole('dialog', { name: 'Reset your password' })
    await expect(dialog.getByLabel('Email')).toHaveValue(DEMO_EMAIL)
    await expect(dialog.getByRole('link', { name: /Google/ })).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Send link' }).click()
    await expect(dialog.getByRole('status')).toContainText(
      `If there’s an account with ${DEMO_EMAIL}, we sent it a link`,
    )
    await expect(dialog.getByRole('button', { name: /Send it again in \d+ s/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await expect(page).toHaveURL(/\/en\/hub\/defi$/)

    // An email without an account: the very same answer.
    await dialog.getByRole('button', { name: 'Back to log in' }).click()
    await page.getByRole('dialog', { name: 'Log in to Asinko' }).getByLabel('Email').fill('')
    await page.getByRole('button', { name: 'Forgot your password?' }).click()
    await dialog.getByLabel('Email').fill('nobody-here@asinko.dev')
    await dialog.getByRole('button', { name: 'Send link' }).click()
    await expect(dialog.getByRole('status')).toContainText(
      'If there’s an account with nobody-here@asinko.dev, we sent it a link',
    )
  })

  test('asks for the email on the login page, without it in the URL, and says when it is too often (PR-01, PR-04)', async ({
    page,
  }) => {
    await page.goto(`/en/login?next=${encodeURIComponent('/en/hub/defi')}`)
    const main = page.getByRole('main')
    await main.getByLabel('Email').fill('limited@asinko.dev')
    await main.getByRole('button', { name: 'Forgot your password?' }).click()
    await expect(page).toHaveURL(/\/en\/login\?mode=recover&next=%2Fen%2Fhub%2Fdefi$/)
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible()
    await expect(main.getByLabel('Email')).toHaveValue('limited@asinko.dev')

    await main.getByRole('button', { name: 'Send link' }).click()
    await expect(main.getByRole('alert')).toHaveText('Too many tries. Wait a moment and try again')

    await main.getByRole('link', { name: 'Back to log in' }).click()
    await expect(page.getByRole('heading', { name: 'Log in to Asinko' })).toBeVisible()
  })

  test('chooses a new password from the link, comes back with the session, and logs in with it (PR-06, PR-07, PR-13)', async ({
    page,
    context,
    baseURL,
  }) => {
    await page.goto(emailLink('mock-recovery-demo', '/en/hub/defi'))
    // The token stays on the server: the page's address does not have it.
    await expect(page).toHaveURL(/\/en\/reset-password\?next=%2Fen%2Fhub%2Fdefi$/)
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible()

    const password = freshPassword()
    await page.getByLabel('New password').fill(password)
    await page.getByRole('button', { name: 'Save password' }).click()
    await expect(page).toHaveURL(/\/en\/hub\/defi$/)
    await expect(page.getByText('Your password was changed')).toBeVisible()
    await signedIn(page)

    // Logged out, the new password logs in.
    await context.clearCookies()
    await context.addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
    await page.goto('/en/login')
    const main = page.getByRole('main')
    await main.getByLabel('Email').fill(DEMO_EMAIL)
    await main.getByLabel('Password', { exact: true }).fill(password)
    await main.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/en$/)
    await signedIn(page)
  })

  test('refuses the same password and takes another one without a new email (PR-09)', async ({
    page,
  }) => {
    await page.goto(emailLink('mock-recovery-demo', '/en'))
    await page.getByLabel('New password').fill('demo-password')
    await page.getByRole('button', { name: 'Save password' }).click()
    await expect(page.getByText('Choose a password different from your current one')).toBeVisible()

    // A reload keeps the form: the spent link left its session.
    await page.reload()
    await page.getByLabel('New password').fill(freshPassword())
    await page.getByRole('button', { name: 'Save password' }).click()
    await expect(page).toHaveURL(/\/en$/)
    await signedIn(page)
  })

  test('says an expired link at once or when saving, and offers a new one (PR-08)', async ({
    page,
  }) => {
    await page.goto('/es/reset-password?next=%2Fes')
    await expect(page.getByText('Este link venció o ya se usó. Pide uno nuevo.')).toBeVisible()

    await page.goto(emailLink('mock-expired-link', '/es'))
    await page.getByLabel('Contraseña nueva').fill(freshPassword())
    await page.getByRole('button', { name: 'Guardar contraseña' }).click()
    await expect(page.getByText('Este link venció o ya se usó. Pide uno nuevo.')).toBeFocused()
    await page.getByRole('link', { name: 'Pedir un link nuevo' }).click()
    await expect(page).toHaveURL(/\/es\/login\?mode=recover&next=%2Fes$/)
    await expect(page.getByRole('main').getByLabel('Correo')).toHaveValue('')
  })

  test('takes an account without a username to the welcome step (PR-10)', async ({ page }) => {
    await page.goto(emailLink('mock-recovery-new', '/en/hub/defi'))
    await page.getByLabel('New password').fill(freshPassword())
    await page.getByRole('button', { name: 'Save password' }).click()
    await expect(page).toHaveURL(/\/en\/welcome\?next=%2Fen%2Fhub%2Fdefi$/)
    await expect(page.getByLabel('Username')).toBeVisible()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`the recovery forms fit 360px and stay accessible in ${theme} (PR-16)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })

      for (const path of ['/en/login?mode=recover', emailLink('mock-recovery-demo', '/en')]) {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(
          page.getByRole('main').getByRole('button', { name: /Send link|Save password/ }),
        ).toBeVisible()
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow).toBeLessThanOrEqual(0)
        await expectNoA11yViolations(page)
      }

      await page.goto('/en')
      await page.getByRole('banner').getByRole('button', { name: 'Log in' }).click()
      await page.getByRole('button', { name: 'Forgot your password?' }).click()
      await expect(page.getByRole('dialog', { name: 'Reset your password' })).toBeVisible()
      await expect(page.getByLabel('Email')).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }
})
