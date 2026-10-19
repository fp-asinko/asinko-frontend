import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/profile-edit and specs/profile-presentation against the production build with
// API_MOCKS=true: the demo viewer edits their own profile; the mock keeps it in memory, so the page
// shows it after saving. What changes the demo's presentation runs on desktop only: both projects
// share the server.

/** A PNG to crop (40x20 pixels, two colors): enough for the canvas to cut and encode. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAACgAAAAUCAIAAABwJOjsAAAAKUlEQVR4nGO4Y2NDNpKzOUE2Yhi1eNTiUYtHLR61eNTiUYtHLR45FgMA6H7YjhVQF48AAAAASUVORK5CYII=',
  'base64',
)

test.describe('Edit profile', () => {
  test('writes a bio and the profile shows it without reloading (PE-01 to PE-03)', async ({
    page,
  }, testInfo) => {
    const bio = `Macro and rates, written in ${testInfo.project.name} ${Date.now()}`
    await page.goto('/en/user/demo')
    await page.getByRole('button', { name: 'Edit profile' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit profile' })
    // The window starts on the name (specs/profile-presentation PP-05).
    await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused()
    const field = dialog.getByRole('textbox', { name: 'About' })
    await field.fill(bio)
    await dialog.getByRole('button', { name: 'Save' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('main').getByText(bio)).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Profile saved.' })).toBeAttached()
  })

  test('is only on your own profile (PE-01)', async ({ page }) => {
    await page.goto('/en/user/maria')
    await expect(page.getByRole('button', { name: 'Edit profile' })).toHaveCount(0)
  })

  test('marks an About over 2000 characters and does not save it (PE-04, specs/profile-showcase PS-04)', async ({
    page,
  }) => {
    await page.goto('/en/user/demo')
    await page.getByRole('button', { name: 'Edit profile' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit profile' })
    await dialog.getByRole('textbox', { name: 'About' }).fill('x'.repeat(2001))
    await expect(dialog.getByText('2001/2000')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Save' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px as the full screen and stays accessible in ${theme} (PE-08)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/en/user/demo')
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      await page.getByRole('button', { name: 'Edit profile' }).click()
      const dialog = page.getByRole('dialog', { name: 'Edit profile' })
      await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused()
      const box = (await dialog.boundingBox())!
      expect(box.width).toBeLessThanOrEqual(360)
      await expectNoA11yViolations(page)

      // A word of 160 characters, saved: it wraps instead of widening the page (PE-07).
      await dialog.getByRole('textbox', { name: 'About' }).fill('x'.repeat(160))
      await dialog.getByRole('button', { name: 'Save' }).click()
      await expect(dialog).toBeHidden()
      await expect(page.getByRole('button', { name: 'Edit profile' })).toBeFocused()
      await expect(page.getByRole('main').getByText('x'.repeat(160))).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
})

test.describe('Profile presentation', () => {
  test("someone's headline, location and links, each with its real host (PP-01, PP-03)", async ({
    page,
  }) => {
    await page.goto('/en/user/maria')
    const header = page.getByRole('main')
    await expect(header.getByText('On-chain analyst | DeFi | LatAm')).toBeVisible()
    await expect(header.getByText('Buenos Aires, Argentina')).toBeVisible()
    const links = header.getByRole('list', { name: 'Links' })
    const substack = links.getByRole('link', { name: /maria\.substack\.com/ })
    await expect(substack).toHaveAttribute('href', 'https://maria.substack.com')
    await expect(substack).toHaveAttribute('rel', 'noopener noreferrer nofollow ugc')
    await expect(links.getByRole('link')).toHaveCount(4)
    // Not on someone else's profile: what is missing is offered only on yours (PP-04).
    await expect(page.getByRole('button', { name: 'Add a headline' })).toHaveCount(0)
  })

  test('"Add a headline" opens the window on it; the rest saved shows at once (PP-04 to PP-08)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Changes the demo's presentation: desktop only")
    await page.goto('/en/user/demo')
    await page.getByRole('button', { name: 'Add a headline' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit profile' })
    const headline = dialog.getByRole('textbox', { name: 'Headline' })
    await expect(headline).toBeFocused()
    await headline.fill('Macro | Rates | LatAm')
    await dialog.getByRole('combobox', { name: 'Country' }).selectOption('AR')
    await dialog.getByRole('textbox', { name: 'City' }).fill('La Plata')
    const links = dialog.getByRole('group', { name: 'Links' })
    // The demo's profile is the server's, shared: whatever links it has, this one goes after them.
    const n = (await links.getByRole('textbox').count()) + 1
    const link = links.getByRole('textbox', { name: `Link ${n}`, exact: true })
    await links.getByRole('button', { name: 'Add link' }).click()
    await expect(link).toBeFocused()
    await link.fill('javascript:alert(1)')
    await expect(
      dialog.getByText('Enter a link that starts with http:// or https://'),
    ).toBeVisible()
    await link.fill('https://www.youtube.com/@demo')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()

    const header = page.getByRole('main')
    await expect(header.getByText('Macro | Rates | LatAm')).toBeVisible()
    await expect(header.getByText('La Plata, Argentina')).toBeVisible()
    await expect(header.getByRole('link', { name: /youtube\.com/ })).toBeVisible()

    // Back as it was, for the next run.
    await page.getByRole('button', { name: 'Edit profile' }).click()
    await dialog.getByRole('textbox', { name: 'Headline' }).fill('')
    await dialog.getByRole('combobox', { name: 'Country' }).selectOption('')
    await dialog.getByRole('textbox', { name: 'City' }).fill('')
    await links.getByRole('button', { name: `Remove link ${n}`, exact: true }).click()
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('button', { name: 'Add a headline' })).toBeVisible()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`the cropper fits 360px and stays accessible in ${theme} (PP-07, PP-10)`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/en/user/demo')
      await page.getByRole('button', { name: 'Edit profile' }).click()
      const dialog = page.getByRole('dialog', { name: 'Edit profile' })
      const chooser = page.waitForEvent('filechooser')
      await dialog.getByRole('button', { name: 'Change banner' }).click()
      await (await chooser).setFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG })
      await expect(dialog.getByRole('heading', { name: 'Crop your banner' })).toBeFocused()
      await expect(dialog.getByRole('button', { name: 'Apply' })).toBeInViewport()
      await expect(dialog.getByRole('button', { name: 'Back' })).toBeInViewport()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
      // Esc is Back: the window stays, the focus on Change banner.
      await page.keyboard.press('Escape')
      await expect(dialog.getByRole('button', { name: 'Change banner' })).toBeFocused()
    })
  }

  test('crops a photo and Save shows it on the profile (PP-07)', async ({ page, isMobile }) => {
    test.skip(isMobile, "Changes the demo's presentation: desktop only")
    await page.goto('/en/user/demo')
    await page.getByRole('button', { name: 'Edit profile' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit profile' })
    const chooser = page.waitForEvent('filechooser')
    await dialog.getByRole('button', { name: 'Change photo' }).click()
    await (await chooser).setFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG })

    await expect(dialog.getByRole('heading', { name: 'Crop your photo' })).toBeVisible()
    await expect(dialog.getByRole('slider', { name: 'Zoom' })).toBeVisible()
    await expectNoA11yViolations(page)
    await dialog.getByRole('button', { name: 'Apply' }).click()
    await expect(dialog.getByRole('button', { name: 'Remove photo' })).toBeVisible()
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()
    // With mocks, the uploaded photo is the mock's fixture.
    // The header's (the card repeats it under lg, specs/profile-aside PA-03).
    await expect(page.getByRole('main').locator('img[src*="avatar-demo"]').first()).toBeVisible()

    await page.getByRole('button', { name: 'Edit profile' }).click()
    await dialog.getByRole('button', { name: 'Remove photo' }).click()
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()
  })
})
