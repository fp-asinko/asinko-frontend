import { expect, test, type Page } from '@playwright/test'
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

/** The camera over an image, then Upload image, then the file (EF-01). */
async function pickImage(page: Page, name: 'Change photo' | 'Change banner') {
  const dialog = page.getByRole('dialog', { name: 'Edit profile' })
  await dialog.getByRole('button', { name }).click()
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('menuitem', { name: 'Upload image' }).click()
  await (await chooser).setFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG })
}

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
    }, testInfo) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/en/user/demo')
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      await page.getByRole('button', { name: 'Edit profile' }).click()
      const dialog = page.getByRole('dialog', { name: 'Edit profile' })
      await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused()
      const box = (await dialog.boundingBox())!
      expect(box.width).toBeLessThanOrEqual(360)
      // The footer stays in view, out of the scroll (specs/profile-edit-flow EF-06).
      await expect(dialog.getByRole('button', { name: 'Save' })).toBeInViewport()
      await expectNoA11yViolations(page)

      // The camera's menu, by keyboard and accessible (EF-01, EF-11).
      const camera = dialog.getByRole('button', { name: 'Change photo' })
      await camera.focus()
      await page.keyboard.press('Enter')
      await expect(page.getByRole('menuitem', { name: 'Upload image' })).toBeFocused()
      await expectNoA11yViolations(page)
      await page.keyboard.press('Escape')
      await expect(camera).toBeFocused()

      // A word of 160 characters, saved: it wraps instead of widening the page (PE-07). Each project,
      // theme and run its own: they share the server, and a bio already there (a retry's) would
      // leave nothing to save, Save waiting (specs/profile-edit-flow EF-07).
      const word = `${testInfo.project.name}-${theme}-${Date.now()}-`.padEnd(160, 'x')
      await dialog.getByRole('textbox', { name: 'About' }).fill(word)
      await dialog.getByRole('button', { name: 'Save' }).click()
      await expect(dialog).toBeHidden()
      await expect(page.getByRole('button', { name: 'Edit profile' })).toBeFocused()
      // Shown once the page is drawn again on the server. The four projects and themes save the demo
      // user's bio at once: the one shown may be another's, as long and as unbroken (PE-07 is that
      // it wraps). Slower on a busy CI runner.
      await expect(
        page.getByRole('main').getByText(/^(mobile|desktop)-(light|dark)-\d+-x{40,}$/),
      ).toBeVisible({
        timeout: 15_000,
      })
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
      await pickImage(page, 'Change banner')
      await expect(dialog.getByRole('heading', { name: 'Crop your banner' })).toBeFocused()
      await expect(dialog.getByRole('button', { name: 'Apply' })).toBeInViewport()
      await expect(dialog.getByRole('button', { name: 'Back' })).toBeInViewport()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
      // Esc is Back: the window stays, the focus on the banner's camera.
      await page.keyboard.press('Escape')
      await expect(dialog.getByRole('button', { name: 'Change banner' })).toBeFocused()
    })
  }

  test('a cropped photo is saved as it is applied, without Save (PP-07, specs/profile-edit-flow EF-02, EF-03)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Changes the demo's presentation: desktop only")
    await page.goto('/en/user/demo')
    await page.getByRole('button', { name: 'Edit profile' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit profile' })
    // The menu of the camera, accessible while open (EF-11).
    await dialog.getByRole('button', { name: 'Change photo' }).click()
    await expect(page.getByRole('menuitem', { name: 'Upload image' })).toBeVisible()
    await expectNoA11yViolations(page)
    await page.keyboard.press('Escape')
    await pickImage(page, 'Change photo')

    await expect(dialog.getByRole('heading', { name: 'Crop your photo' })).toBeVisible()
    await expect(dialog.getByRole('slider', { name: 'Zoom' })).toBeVisible()
    await expectNoA11yViolations(page)
    await dialog.getByRole('button', { name: 'Apply' }).click()
    await expect(dialog.getByText('Photo updated.')).toBeAttached()
    // Already saved: the profile behind shows it, and the window closes without asking.
    // With mocks, the uploaded photo is the mock's fixture; the header's (the card repeats it
    // under lg, specs/profile-aside PA-03).
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('main').locator('img[src*="avatar-demo"]').first()).toBeVisible()

    await page.getByRole('button', { name: 'Edit profile' }).click()
    await dialog.getByRole('button', { name: 'Change photo' }).click()
    await page.getByRole('menuitem', { name: 'Remove' }).click()
    const confirm = page.getByRole('alertdialog', { name: 'Remove your photo?' })
    await confirm.getByRole('button', { name: 'Remove' }).click()
    await expect(dialog.getByText('Photo updated.')).toBeAttached()
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('main').locator('img[src*="avatar-demo"]')).toHaveCount(0)
  })

  test('fits a desktop window without scrolling, in two columns (EF-06, EF-09)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The two columns are from md')
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en/user/demo')
    await page.getByRole('button', { name: 'Edit profile' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit profile' })
    const form = dialog.locator('form')
    await expect(dialog.getByRole('region', { name: 'Links' })).toBeVisible()
    // The page behind is not blurred: it stuttered while the window animated (EF-12).
    const blur = await page
      .locator('[data-slot="dialog-overlay"]')
      .evaluate((node) => getComputedStyle(node).backdropFilter)
    expect(blur).toBe('none')
    const overflow = await form.evaluate((node) => node.scrollHeight - node.clientHeight)
    expect(overflow).toBeLessThanOrEqual(0)
    const profile = await dialog.getByRole('region', { name: 'Profile' }).boundingBox()
    const about = await dialog.getByRole('region', { name: 'About you' }).boundingBox()
    expect(about!.x).toBeGreaterThan(profile!.x + profile!.width)
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeInViewport()
  })
})
