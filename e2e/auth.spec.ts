import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'
import { settings } from './fixtures/settings'

// specs/auth against the production build with API_MOCKS=true: a simulated Supabase answers
// (src/mocks/auth.ts), demo@asinko.dev / demo-password is the demo user, `taken@asinko.dev` and the
// username `taken` are always someone's. The guest cookie turns the demo user off.

const DEMO = { email: 'demo@asinko.dev', password: 'demo-password' }

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
})

/** A username no other test (nor another run) has: 3 to 30 letters, numbers or _. */
function freshUsername(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

async function openLogIn(page: Page) {
  await page.getByRole('banner').getByRole('button', { name: 'Log in' }).click()
  return page.getByRole('dialog', { name: 'Log in to Asinko' })
}

async function signedIn(page: Page) {
  await expect(page.getByRole('banner').getByRole('button', { name: 'Log in' })).toHaveCount(0)
}

test.describe('Log in and sign up (specs/auth)', () => {
  test('creates an account with email and password, chooses the suggested username, and comes back (AU-01, AU-05, AU-07, AU-11)', async ({
    page,
  }) => {
    await page.goto('/en/hub/defi')
    const dialog = await openLogIn(page)
    await dialog.getByRole('button', { name: 'Create an account' }).click()
    await expect(page.getByRole('dialog', { name: 'Join Asinko' })).toBeVisible()
    await expect(page.getByLabel('Username')).toHaveCount(0)

    const username = freshUsername('e2e')
    await page.getByLabel('Email').fill(`${username}@asinko.dev`)
    await page.getByLabel('Password', { exact: true }).fill('long-enough')
    await page.getByRole('button', { name: 'Create account' }).click()

    // Step 2 in the same modal, with the username suggested from the email.
    const second = page.getByRole('dialog', { name: 'Choose your username' })
    await expect(second.getByLabel('Username')).toHaveValue(username)
    await expect(page).toHaveURL(/\/en\/hub\/defi$/)
    const go = second.getByRole('button', { name: 'Continue', exact: true })
    await expect(go).toBeDisabled()
    await second.getByRole('checkbox', { name: /I’m 18 or older/ }).click()
    await go.click()

    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page).toHaveURL(/\/en\/hub\/defi$/)
    await signedIn(page)
  })

  test('adds a photo in the welcome screen, framed by hand and shown round (AU-21)', async ({
    page,
  }) => {
    await page.goto('/en/login?mode=signup')
    const username = freshUsername('pic')
    await page.getByLabel('Email').fill(`${username}@asinko.dev`)
    await page.getByLabel('Password', { exact: true }).fill('long-enough')
    await page.getByRole('main').getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/en\/welcome/)

    // A real 1×1 PNG (as e2e/post-image.spec.ts): the browser decodes it and cuts the frame.
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    )
    await page.locator('input[type=file]').setInputFiles({
      name: 'me.png',
      mimeType: 'image/png',
      buffer: png,
    })
    // Framing, only the cropper: Continue waits for it.
    await expect(page.getByRole('heading', { name: 'Frame your photo' })).toBeFocused()
    const main = page.getByRole('main')
    await expect(main.getByRole('button', { name: 'Continue', exact: true })).toBeHidden()
    await expect(page.getByLabel('Username')).toBeHidden()
    // Zoomed out under the frame: the rest is white.
    await page.getByRole('slider', { name: 'Zoom' }).fill('0.5')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible()
    await expect(page.getByLabel('Username')).toBeVisible()
    await page.getByRole('checkbox', { name: /I’m 18 or older/ }).click()
    await page.getByRole('main').getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page).toHaveURL(/\/en$/)
    await signedIn(page)
    // Your own photo right away, not the initials (design.md § 14).
    await expect(
      page.getByRole('main').getByTestId('user-avatar').first().locator('img'),
    ).toBeVisible()
  })

  test('logs in with email and password, and logs out from "⋯" (AU-02, AU-14)', async ({
    page,
  }) => {
    await page.goto('/en')
    await openLogIn(page)
    await page.getByLabel('Email').fill(DEMO.email)
    await page.getByLabel('Password', { exact: true }).fill(DEMO.password)
    await page.getByRole('button', { name: 'Log in', exact: true }).last().click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await signedIn(page)

    const menu = await settings(page)
    await menu.getByRole('menuitem', { name: 'Log out' }).click()
    await expect(page.getByRole('banner').getByRole('button', { name: 'Log in' })).toBeVisible()
  })

  test('says wrong credentials without saying which one (AU-04)', async ({ page }) => {
    await page.goto('/en')
    await openLogIn(page)
    await page.getByLabel('Email').fill(DEMO.email)
    await page.getByLabel('Password', { exact: true }).fill('not-the-password')
    await page.getByRole('button', { name: 'Log in', exact: true }).last().click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Wrong email or password' }),
    ).toBeVisible()
  })

  test('says a taken email when creating the account, and a taken username in the welcome screen (AU-08, AU-09)', async ({
    page,
  }) => {
    await page.goto(`/en/login?mode=signup&next=${encodeURIComponent('/en/hub/defi')}`)
    await page.getByLabel('Email').fill('taken@asinko.dev')
    await page.getByLabel('Password', { exact: true }).fill('long-enough')
    const create = page.getByRole('main').getByRole('button', { name: 'Create account' })
    await create.click()
    await expect(page.getByLabel('Email')).toHaveAccessibleDescription(
      'There’s already an account with this email',
    )

    const username = freshUsername('e2e')
    await page.getByLabel('Email').fill(`${username}@asinko.dev`)
    await create.click()
    await expect(page).toHaveURL(/\/en\/welcome/)
    // Someone's: the backend says so, next to the field, and the account is not stuck.
    await page.getByLabel('Username').fill('maria')
    await page.getByRole('checkbox', { name: /I’m 18 or older/ }).click()
    const go = page.getByRole('main').getByRole('button', { name: 'Continue', exact: true })
    await go.click()
    await expect(page.getByLabel('Username')).toHaveAccessibleDescription('That username is taken')
    await page.getByLabel('Username').fill(username)
    await go.click()
    await expect(page).toHaveURL(/\/en\/hub\/defi$/)
  })

  test('the login page comes back to next, and never leaves the site (AU-03)', async ({ page }) => {
    await page.goto(`/en/login?next=${encodeURIComponent('/en/hub/defi')}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Log in to Asinko' })).toBeVisible()
    await page.getByLabel('Email').fill(DEMO.email)
    await page.getByLabel('Password', { exact: true }).fill(DEMO.password)
    await page.getByRole('main').getByRole('button', { name: 'Log in', exact: true }).click()
    await expect(page).toHaveURL(/\/en\/hub\/defi$/)

    // Signed in, /login goes straight to next; one out of the site is the Home.
    await page.goto(`/en/login?next=${encodeURIComponent('//evil.example')}`)
    await expect(page).toHaveURL(/\/en$/)
  })

  test('Google for the first time comes back to the page with step 2 in the modal (AU-10, AU-11)', async ({
    page,
  }) => {
    // The simulated Google comes back as the demo user: this one is a new account.
    await page.route(/\/auth\/google\?/, async (route) => {
      const response = await route.fetch({ maxRedirects: 0 })
      const headers = response.headers()
      headers.location = (headers.location ?? '').replace('mock-google-demo', 'mock-google-new')
      await route.fulfill({ response, headers })
    })
    await page.goto('/en/hub/defi')
    const dialog = await openLogIn(page)
    await dialog.getByRole('link', { name: 'Continue with Google' }).click()

    // Back on the same page, with step 2 open by itself and the mark gone from the address.
    const second = page.getByRole('dialog', { name: 'Choose your username' })
    await expect(second).toBeVisible()
    await expect(page).toHaveURL(/\/en\/hub\/defi$/)
    await expect(second.getByLabel('Username')).toHaveValue('new_trader')
    // The Google name and photo, already there (AU-22, AU-23).
    await expect(second.getByLabel('Name (optional)')).toHaveValue('New Trader')
    await expect(second.getByRole('button', { name: 'Remove' })).toBeVisible()

    // Closed, the bar offers only that, and it opens the step again.
    await page.keyboard.press('Escape')
    await page.getByRole('banner').getByRole('button', { name: 'Choose username' }).click()
    await expect(second.getByRole('button', { name: 'Remove' })).toBeVisible()
    await second.getByLabel('Username').fill(freshUsername('g'))
    await second.getByRole('checkbox', { name: /I’m 18 or older/ }).click()
    await second.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await signedIn(page)
    // Uploaded with the profile: your own photo in the composer, not the initials.
    await page.goto('/en')
    await expect(
      page.getByRole('main').getByTestId('user-avatar').first().locator('img'),
    ).toBeVisible()
  })

  test('Reddit is coming soon, and Instagram and X are gone (AU-12)', async ({ page }) => {
    await page.goto('/en')
    const dialog = await openLogIn(page)
    await expect(dialog.getByRole('button', { name: 'Continue with Reddit' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await expect(dialog.getByRole('button', { name: /Instagram|Continue with X/ })).toHaveCount(0)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`the login page and the modal fit 360px and stay accessible in ${theme} (AU-18)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })
      await page.goto('/en/login?mode=signup')
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)

      await page.goto('/en')
      await openLogIn(page)
      await expect(page.getByLabel('Email')).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }

  test('speaks Spanish', async ({ page }) => {
    await page.goto('/es/login')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByLabel('Correo')).toBeVisible()
    await expect(
      page.getByRole('main').getByRole('button', { name: 'Iniciar sesión' }),
    ).toBeVisible()
  })
})
