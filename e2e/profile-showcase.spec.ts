import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/profile-showcase against the production build with API_MOCKS=true. The demo user's
// profile and featured live in the server's memory, shared by both projects: what changes the
// demo's profile runs on desktop only, and each project features a post of its own.

const main = (page: Page) => page.getByRole('main')
const checklist = (page: Page) => page.getByRole('region', { name: 'Complete your profile' })
const featured = (page: Page) => page.getByRole('region', { name: 'Featured' })

/** Publishes a post on the demo's own channel and answers its title. */
async function publishOwnPost(page: Page, project: string) {
  const title = `Sizing by volatility (${project} ${Date.now()})`
  await page.goto('/en/submit?community=demo')
  await main(page).getByRole('textbox', { name: 'Title' }).fill(title)
  await main(page).getByRole('textbox', { name: 'Body' }).fill('Each position risks the same.')
  await main(page).getByRole('button', { name: 'Publish' }).click()
  await expect(page).toHaveURL(/\/en\/post\//)
  return title
}

test.describe('The profile as a showcase, as LinkedIn', () => {
  test('"Complete your profile" shows only to you, opens its step and hides (PS-01 to PS-03)', async ({
    page,
  }) => {
    await page.goto('/en/user/maria')
    await expect(checklist(page)).toHaveCount(0)

    await page.goto('/en/user/demo')
    await expect(checklist(page).getByText('Only you see this')).toBeVisible()
    await expect(checklist(page).getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      /^\d of 8$/,
    )
    // The first suggestion's button opens "Edit profile" (or leads to the posts, the last step).
    const step = checklist(page).getByRole('listitem').first()
    const action = step.getByRole('button')
    if (await action.count()) {
      await action.click()
      await expect(page.getByRole('dialog', { name: 'Edit profile' })).toBeVisible()
      await page.keyboard.press('Escape')
    }

    await checklist(page).getByRole('button', { name: 'Hide "Complete your profile"' }).click()
    await expect(checklist(page)).toHaveCount(0)
    // Undo in its place, with the focus, brings it back (PS-13).
    const undo = main(page).getByRole('button', { name: 'Undo' })
    await expect(undo).toBeFocused()
    await undo.click()
    await expect(checklist(page)).toBeVisible()

    // Hidden, "Edit profile" shows it again, without a reload (PS-14).
    await checklist(page).getByRole('button', { name: 'Hide "Complete your profile"' }).click()
    await main(page).getByRole('button', { name: 'Edit profile' }).click()
    await page
      .getByRole('dialog', { name: 'Edit profile' })
      .getByRole('button', { name: 'Show "Complete your profile"' })
      .click()
    await page.keyboard.press('Escape')
    await expect(checklist(page)).toBeVisible()
    await expect(undo).toHaveCount(0)

    await checklist(page).getByRole('button', { name: 'Hide "Complete your profile"' }).click()
    await page.reload()
    await expect(checklist(page)).toHaveCount(0)
    await expect(undo).toHaveCount(0)

    // "Edit profile" offers it again (PS-14).
    await main(page).getByRole('button', { name: 'Edit profile' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit profile' })
    await dialog.getByRole('button', { name: 'Show "Complete your profile"' }).click()
    await expect(dialog.getByText('You will see it again on your profile.')).toBeFocused()
    await expect(checklist(page)).toBeVisible()
  })

  test('features your own post from "⋯" and takes it out from Featured (PS-05 to PS-07)', async ({
    page,
    isMobile,
  }, testInfo) => {
    const title = await publishOwnPost(page, testInfo.project.name)
    await page.goto('/en/user/demo')
    const card = main(page).getByRole('article', { name: title })
    await card.getByRole('button', { name: `Options for the post ${title}` }).click()
    // The demo's featured are shared by both projects and capped at 3: the whole round trip runs
    // on desktop; a phone checks the menu opens with its option.
    if (isMobile) {
      await expect(page.getByRole('menuitem', { name: 'Feature on your profile' })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('menu')).toHaveCount(0)
      return
    }
    await page.getByRole('menuitem', { name: 'Feature on your profile' }).click()
    // The menu closes at once, before the page renders again.
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(
      page.getByRole('status').filter({ hasText: 'Featured on your profile.' }),
    ).toBeAttached()

    const pinned = featured(page).getByRole('article', { name: title })
    await expect(pinned).toBeVisible()
    await expect(pinned.getByRole('link', { name: title })).toHaveAttribute('href', /\/en\/post\//)

    await pinned.getByRole('button', { name: `Options for the post ${title}` }).click()
    await page.getByRole('menuitem', { name: 'Remove from featured' }).click()
    await expect(featured(page).getByRole('article', { name: title })).toHaveCount(0)
  })

  test("someone's featured and what they are open to, without menus (PS-05, PS-10)", async ({
    page,
  }) => {
    await page.goto('/en/user/maria')
    const cards = featured(page).getByRole('article')
    await expect(cards).toHaveCount(2)
    await expect(cards.first().getByText('Correct')).toBeVisible()
    await expect(featured(page).getByRole('button')).toHaveCount(0)
    const openTo = main(page).getByRole('region', { name: 'Open to' })
    await expect(openTo.getByRole('listitem')).toHaveText(['Questions', 'Mentoring'])
  })

  test('saves an About with See more and what you are open to (PS-04, PS-09, PS-10)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Changes the demo's profile: desktop only")
    const about = `How I invest.\n${'Position sizing by volatility, not by conviction. '.repeat(8)}`
    await page.goto('/en/user/demo')
    await page.getByRole('button', { name: 'Edit profile' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit profile' })
    const field = dialog.getByRole('textbox', { name: 'About' })
    const before = await field.inputValue()
    await field.fill(about)
    await dialog.getByRole('group', { name: 'Open to' }).getByText('AMAs').click()
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()

    const openTo = main(page).getByRole('region', { name: 'Open to' })
    await expect(openTo.getByRole('listitem')).toHaveText(['AMAs'])
    const more = main(page).getByText('See more')
    await expect(more).toBeVisible()
    await more.click()
    await expect(main(page).getByText('See less')).toBeVisible()

    // Back as it was, for the next run.
    await openTo.getByRole('button', { name: 'Edit what you are open to' }).click()
    await expect(dialog.getByRole('checkbox', { name: 'Questions' })).toBeFocused()
    await dialog.getByRole('textbox', { name: 'About' }).fill(before)
    await dialog.getByRole('group', { name: 'Open to' }).getByText('AMAs').click()
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(openTo).toHaveCount(0)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible in ${theme} (PS-11)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      for (const path of ['/en/user/maria', '/en/user/demo']) {
        await page.goto(path)
        if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
        await expect(main(page).getByRole('heading', { level: 1 })).toBeVisible()
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow).toBeLessThanOrEqual(0)
        await expectNoA11yViolations(page)
      }
    })
  }
})
