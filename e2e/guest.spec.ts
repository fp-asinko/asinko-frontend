import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/guest-experience against the production build with API_MOCKS=true and the demo user
// turned off for this browser (MOCK_GUEST_COOKIE in src/lib/session.ts).

const articles = (page: Page) => page.getByRole('article')
const card = (page: Page, text: string) => articles(page).filter({ hasText: text })

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
})

test.describe('Without a session', () => {
  test('everything public reads freely, without walls (G-01)', async ({ page }) => {
    await page.goto('/en')
    await expect(articles(page).first()).toBeVisible()
    const whales = card(page, 'Whales accumulated 48,000 $BTC')
    await whales.getByRole('button', { name: /6 comments/ }).click()
    await expect(whales.getByRole('button', { name: 'See all comments' })).toBeVisible()
    await page.goto('/en?community=BTC')
    await expect(articles(page).first()).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('the top bar offers Log in, and Sign up from md (G-02)', async ({ page, isMobile }) => {
    await page.goto('/en')
    const banner = page.getByRole('banner')
    await expect(banner.getByRole('button', { name: 'Log in' })).toBeVisible()
    if (isMobile) await expect(banner.getByRole('button', { name: 'Sign up' })).toBeHidden()
    else await expect(banner.getByRole('button', { name: 'Sign up' })).toBeVisible()
    await expect(banner.getByRole('button', { name: 'Profile' })).toHaveCount(0)
  })

  test('the left column starts with the invitation, the right one no longer has it (specs/guest-sidebar GS-01, GS-05)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The columns exist from md; the phone panel has its own test')
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/en')
    const invite = page.getByRole('region', { name: 'New to Asinko?' })
    await expect(invite).toBeVisible()
    await expect(invite.getByRole('button', { name: 'Continue with Reddit' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    // Above the communities.
    const communities = page.getByRole('region', { name: 'Communities' }).filter({ visible: true })
    expect((await invite.boundingBox())!.y).toBeLessThan((await communities.boundingBox())!.y)
    const right = page.getByRole('complementary', { name: 'More from Asinko' })
    await expect(right.getByRole('region', { name: 'New to Asinko?' })).toHaveCount(0)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`the phone panel shows the invitation at 360px, accessible in ${theme} (GS-01, GS-06)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 800 })
      await page.goto('/en')
      await page.getByRole('button', { name: 'Open menu' }).click()
      const panel = page.getByRole('dialog')
      const invite = panel.getByRole('region', { name: 'New to Asinko?' })
      await expect(invite.getByRole('button', { name: 'Continue with email' })).toBeVisible()
      // Every label fits its button, and the page does not scroll sideways.
      for (const button of await invite.getByRole('button', { name: /^Continue with/ }).all()) {
        expect(await button.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(
          0,
        )
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44)
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
    })
  }

  test('voting opens the modal, marks nothing, and Escape gives the focus back (G-04 to G-06)', async ({
    page,
  }) => {
    await page.goto('/en')
    const post = card(page, 'The Fed cuts 25 bps')
    const upvote = post.getByRole('button', { name: 'Upvote' })
    await upvote.click()

    const dialog = page.getByRole('dialog', { name: 'Vote to make your take count' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Create account' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Log in' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(upvote).toBeFocused()
    await expect(upvote).toHaveAttribute('aria-pressed', 'false')
  })

  test('a poll vote and the composer open the modal with their own title (G-04, G-05)', async ({
    page,
  }) => {
    await page.goto('/en?filter=polls')
    await card(page, 'How much of your portfolio is in DeFi?')
      .getByRole('button', { name: '1–10%' })
      .click()
    await expect(page.getByRole('dialog', { name: 'Vote to see where you stand' })).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()

    await page.getByRole('button', { name: 'What are you thinking?' }).click()
    await expect(page.getByRole('dialog', { name: 'Join Asinko to post' })).toBeVisible()
  })

  test('the modal is a bottom panel on phones and centered from md (G-07)', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en')
    await card(page, 'The Fed cuts 25 bps').getByRole('button', { name: 'Upvote' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // Wait for the entry motion to end before measuring.
    await expect.poll(() => dialog.evaluate((el) => el.getAnimations().length)).toBe(0)
    const box = (await dialog.boundingBox())!
    const viewport = page.viewportSize()!
    if (isMobile) {
      expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(viewport.height - 1)
      expect(Math.round(box.width)).toBe(viewport.width)
      // Nothing overflows the page sideways, the top bar included (360px, design-system.md).
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width)
    } else {
      const middle = box.y + box.height / 2
      expect(Math.abs(middle - viewport.height / 2)).toBeLessThan(2)
    }
  })

  test('stays accessible with the modal open (G-08)', async ({ page }) => {
    await page.goto('/en')
    await card(page, 'The Fed cuts 25 bps').getByRole('button', { name: 'Upvote' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoA11yViolations(page)
  })

  test('closes from the backdrop, and the × gives the focus back (G-06)', async ({ page }) => {
    await page.goto('/en')
    const upvote = card(page, 'The Fed cuts 25 bps').getByRole('button', { name: 'Upvote' })
    await upvote.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    // Top-left corner: always backdrop, the panel never reaches it.
    await page.mouse.click(5, 70)
    await expect(page.getByRole('dialog')).toBeHidden()

    await upvote.click()
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(upvote).toBeFocused()
  })

  test('the panel spans the width until md, at 700px too (G-07)', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 900 })
    await page.goto('/en')
    await card(page, 'The Fed cuts 25 bps').getByRole('button', { name: 'Upvote' }).click()
    const dialog = page.getByRole('dialog')
    await expect.poll(() => dialog.evaluate((el) => el.getAnimations().length)).toBe(0)
    expect(Math.round((await dialog.boundingBox())!.width)).toBe(700)
  })

  test('the top bar fits 360px in Spanish, the longest "Log in" (G-02)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/es')
    await expect(
      page.getByRole('banner').getByRole('button', { name: 'Iniciar sesión' }),
    ).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360)
  })

  test.describe('in dark', () => {
    test.use({ colorScheme: 'dark' })

    test('stays accessible with the modal open (G-08)', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
      await page.goto('/en')
      await expect(page.locator('html')).toHaveClass(/dark/)
      await card(page, 'The Fed cuts 25 bps').getByRole('button', { name: 'Upvote' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expectNoA11yViolations(page)
    })
  })

  test('Following keeps its page and offers the ways in (Q2)', async ({ page }) => {
    await page.goto('/en?feed=following')
    await expect(
      page.getByText('You need an account to see the communities you follow.'),
    ).toBeVisible()
    await page.getByRole('main').getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByRole('dialog', { name: 'Join Asinko' })).toBeVisible()
  })
})
