import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/drafts-tags against the production build with API_MOCKS=true: the demo user's drafts live
// in the server's memory (P-022) and the communities bring their tags (P-023). Both projects share
// that memory: each test writes titles of its own.

const editor = (page: Page) => page.getByRole('main')
const title = (page: Page) => editor(page).getByRole('textbox', { name: 'Title' })
const body = (page: Page) => editor(page).getByRole('textbox', { name: 'Body' })
const drafts = (page: Page) => page.getByRole('dialog', { name: 'Drafts' })

/** A title nobody else writes: the project and the moment. */
const unique = (text: string, project: string) => `${text} (${project} ${Date.now()})`

async function openDrafts(page: Page) {
  await editor(page).getByRole('button', { name: 'Drafts' }).click()
  await expect(drafts(page)).toBeVisible()
  // The list, not the loading line.
  await expect(drafts(page).getByText(/^\d+\/20$/)).toBeVisible()
}

test.describe('Drafts and tags, as Reddit', () => {
  test('saves a draft, finds it in Drafts, opens it and publishing it takes it out (DT-01 to DT-03)', async ({
    page,
  }, testInfo) => {
    const text = unique('Rates are going down', testInfo.project.name)
    await page.goto('/en/submit?community=defi')
    await title(page).fill(text)
    await editor(page).getByRole('button', { name: 'Save draft' }).click()
    await expect(editor(page).getByRole('button', { name: 'Saved' })).toBeVisible()

    // Another visit: the draft is in the account, not in this form.
    await page.goto('/en/submit')
    await openDrafts(page)
    await drafts(page)
      .getByRole('button', { name: new RegExp(`^${escape(text)} #defi`) })
      .click()
    await expect(drafts(page)).toBeHidden()
    await expect(title(page)).toHaveValue(text)
    await expect(editor(page).getByRole('combobox', { name: 'Community', exact: true })).toHaveText(
      '#defi',
    )

    await body(page).fill('The Fed cuts.')
    await editor(page).getByRole('button', { name: 'Publish' }).click()
    await expect(page).toHaveURL(/\/en\/post\//)

    await page.goto('/en/submit')
    await openDrafts(page)
    await expect(drafts(page).getByText(text)).toHaveCount(0)
  })

  test('deletes a draft after asking (DT-04)', async ({ page }, testInfo) => {
    const text = unique('Delete me', testInfo.project.name)
    await page.goto('/en/submit?community=defi')
    await title(page).fill(text)
    await editor(page).getByRole('button', { name: 'Save draft' }).click()
    await expect(editor(page).getByRole('button', { name: 'Saved' })).toBeVisible()

    await openDrafts(page)
    await drafts(page)
      .getByRole('button', { name: `Delete the draft ${text}` })
      .click()
    const ask = page.getByRole('alertdialog', { name: 'Delete this draft?' })
    await ask.getByRole('button', { name: 'Delete' }).click()
    await expect(drafts(page).getByText(text)).toHaveCount(0)
  })

  test("chooses one of the community's tags and the post shows it before the title (DT-07 to DT-10)", async ({
    page,
  }, testInfo) => {
    const text = unique('Stablecoin yields', testInfo.project.name)
    await page.goto('/en/submit?community=defi')
    await editor(page).getByRole('button', { name: 'Add tag' }).click()
    await page.getByRole('menuitem', { name: 'Analysis' }).click()
    await expect(editor(page).getByRole('button', { name: 'Remove tag Analysis' })).toBeFocused()

    await title(page).fill(text)
    await body(page).fill('Lending demand.')
    await editor(page).getByRole('button', { name: 'Publish' }).click()
    await expect(page).toHaveURL(/\/en\/post\//)
    const post = page.getByRole('article', { name: text })
    await expect(post.getByText('Analysis', { exact: true })).toBeVisible()
  })

  test('without tags the button says why, and a new community drops the tag (DT-08)', async ({
    page,
  }) => {
    await page.goto('/en/submit')
    const add = editor(page).getByRole('button', { name: 'Add tag' })
    await expect(add).toHaveAttribute('aria-disabled', 'true')
    await expect(add).toHaveAccessibleDescription('Choose a community first')

    await page.goto('/en/submit?community=defi')
    await add.click()
    await page.getByRole('menuitem', { name: 'News' }).click()
    await editor(page).getByRole('combobox', { name: 'Community', exact: true }).click()
    await page.getByRole('combobox', { name: 'Search communities' }).fill('latam')
    await page.getByRole('option', { name: /#latam/ }).click()
    await expect(editor(page).getByText('News', { exact: true })).toHaveCount(0)
    await expect(add).toHaveAccessibleDescription('This community has no tags')
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`Drafts fits 360px and stays accessible in ${theme} (DT-11)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/en/submit?community=defi')
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      await expect(title(page)).toBeFocused()
      await expectNoA11yViolations(page)

      await openDrafts(page)
      const box = (await drafts(page).boundingBox())!
      expect(box.width).toBeLessThanOrEqual(360)
      await expectNoA11yViolations(page)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)

      await drafts(page).getByRole('button', { name: 'Close' }).click()
      await expect(editor(page).getByRole('button', { name: 'Drafts' })).toBeFocused()
    })
  }

  // The longest words: "Guardar borrador", "Salvar rascunho" (DT-11).
  for (const [locale, publish] of [
    ['es', 'Publicar'],
    ['pt', 'Publicar'],
  ] as const) {
    test(`Cancel, Save draft and Publish fit 360px in ${locale}`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto(`/${locale}/publicar?community=defi`)
      const actions = editor(page).getByRole('button', { name: publish, exact: true }).locator('..')
      const row = (await actions.boundingBox())!
      expect(row.x + row.width).toBeLessThanOrEqual(360)
      for (const button of await actions.getByRole('button').all()) {
        const box = (await button.boundingBox())!
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(360)
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
})

/** A title as a literal inside a RegExp. */
function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
