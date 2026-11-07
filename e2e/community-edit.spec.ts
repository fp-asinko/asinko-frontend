import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/community-edit against the production build with API_MOCKS=true. Each test creates its
// own group (mobile and desktop share one server): the demo user is its principal moderator.

const main = (page: Page) => page.getByRole('main')
const checklist = (page: Page) => page.getByRole('region', { name: 'Get your group started' })

async function createGroup(page: Page, project: string): Promise<string> {
  const name = `Edit Group ${project} ${Date.now().toString(36)}`
  await page.goto('/en/create-group')
  await main(page).getByRole('textbox', { name: /Name/ }).fill(name)
  await main(page).getByRole('button', { name: 'Create group' }).click()
  await expect(page).toHaveURL(/\/en\/hub\/edit-group-/)
  return name.toLowerCase().replaceAll(' ', '-')
}

test.describe('Edit a group', () => {
  test('its moderator edits the description and rules, and sees them on the page (CE-01 to CE-03)', async ({
    page,
  }, testInfo) => {
    await createGroup(page, testInfo.project.name)
    await page.getByRole('button', { name: 'Edit group' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit group' })
    await dialog.getByRole('textbox', { name: 'Description' }).fill('Edited by the e2e run.')
    await dialog.getByRole('textbox', { name: 'Rules' }).fill('Be kind.')
    await dialog.getByRole('button', { name: 'Save' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByText('Changes saved')).toBeVisible()
    await expect(main(page).getByText('Edited by the e2e run.').first()).toBeVisible()
  })

  test('the new group shows its first steps; one opens the window on its field, and it hides (CE-07, CE-08)', async ({
    page,
  }, testInfo) => {
    await createGroup(page, testInfo.project.name)
    await expect(checklist(page)).toContainText('0 of 4 done')
    await checklist(page).getByRole('button', { name: 'Write its rules' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit group' })
    await expect(dialog.getByRole('textbox', { name: 'Rules' })).toBeFocused()
    await dialog.getByRole('textbox', { name: 'Rules' }).fill('No spam.')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(checklist(page)).toContainText('1 of 4 done')

    await checklist(page).getByRole('button', { name: 'Hide' }).click()
    await expect(checklist(page)).toBeHidden()
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(checklist(page)).toHaveCount(0)
  })

  test('who does not moderate a group sees neither the button nor the card (CE-01)', async ({
    page,
  }) => {
    // The demo user is only a member of #defi.
    await page.goto('/en/hub/defi')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit group' })).toHaveCount(0)
    await expect(checklist(page)).toHaveCount(0)
  })
})

for (const theme of ['light', 'dark'] as const) {
  test(`Edit group has no a11y violations in ${theme}, with its card and its window (CE-09)`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
    await createGroup(page, testInfo.project.name)
    await expect(checklist(page)).toBeVisible()
    await expectNoA11yViolations(page)
    await page.getByRole('button', { name: 'Edit group' }).click()
    await expect(page.getByRole('dialog', { name: 'Edit group' })).toBeVisible()
    await expectNoA11yViolations(page)
  })
}
