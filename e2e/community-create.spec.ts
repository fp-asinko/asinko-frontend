import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/community-create against the production build with API_MOCKS=true (the demo user creates).
// Mobile and desktop share one server and its memory: each run uses its own handle.

const main = (page: Page) => page.getByRole('main')
const name = (page: Page) => main(page).getByRole('textbox', { name: /Name/ })
const handle = (page: Page) => main(page).getByRole('textbox', { name: /Handle/ })
const create = (page: Page) => main(page).getByRole('button', { name: 'Create group' })
const interests = (page: Page) =>
  page.getByRole('region', { name: 'Your interests' }).filter({ visible: true })

/** A name whose handle no other run has: "E2E Group mobile 1731..." → "e2e-group-mobile-1731...". */
const unique = (project: string) => `E2E Group ${project} ${Date.now().toString(36)}`

test.describe('Create a group', () => {
  test('from the left column, with its handle from the name, lands on the group as its moderator (CG-01, CG-05, CG-09, CG-10)', async ({
    page,
    isMobile,
  }, testInfo) => {
    const groupName = unique(testInfo.project.name)
    const slug = groupName.toLowerCase().replaceAll(' ', '-')
    if (isMobile) {
      await page.goto('/en/create-group')
    } else {
      await page.goto('/en')
      await interests(page).getByRole('link', { name: 'Create group' }).click()
      await expect(page).toHaveURL(/\/en\/create-group$/)
    }
    await expect(page.getByRole('heading', { level: 1, name: 'Create a group' })).toBeVisible()
    if (!isMobile) {
      // Under the preview, in the right column (CG-23).
      await expect(page.getByRole('heading', { name: 'Tips for a good group' })).toBeVisible()
    }
    await expect(create(page)).toHaveAttribute('aria-disabled', 'true')

    await name(page).fill(groupName)
    await expect(handle(page)).toHaveValue(slug)
    await expect(main(page).getByText(`#${slug} is available`)).toBeVisible()
    await main(page)
      .getByRole('textbox', { name: /Description/ })
      .fill('Made by the e2e run.')
    await create(page).click()

    await expect(page).toHaveURL(new RegExp(`/en/hub/${slug}$`))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`#${slug}`)
    if (!isMobile) {
      // In "Groups" of the left column without reloading (CG-10): the list shows what fits, the
      // rest under "more".
      const groups = interests(page).getByRole('region', { name: 'Groups' })
      await groups.getByRole('button', { name: 'more: Groups' }).click()
      await expect(groups.getByRole('link', { name: new RegExp(slug) })).toBeVisible()
    }
  })

  test('says a handle is taken, and a 409 on creating marks it (CG-06, CG-11)', async ({
    page,
  }) => {
    await page.goto('/en/create-group')
    await name(page).fill('Decentralized finance')
    await handle(page).fill('defi')
    await expect(main(page).getByText('Already taken')).toBeVisible()

    await create(page).click()
    await expect(main(page).getByText('Already taken')).toBeVisible()
    await expect(handle(page)).toBeFocused()
    await expect(page).toHaveURL(/\/en\/create-group$/)
  })

  test('without a session, the invitation to get in (CG-01)', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
    await page.goto('/en/create-group')
    await expect(main(page).getByText('Create a group with an account')).toBeVisible()
    await expect(create(page)).toHaveCount(0)
  })
})

for (const theme of ['light', 'dark'] as const) {
  test(`Create a group fits 360px, is not indexed and has no a11y violations in ${theme} (CG-02, CG-13)`, async ({
    page,
  }) => {
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/en/create-group')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(name(page)).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
    await expectNoA11yViolations(page)
  })
}
