import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/submit-page against the production build with API_MOCKS=true (the demo user posts). The
// page to create a post replaces the editor's window and box (specs/post-create-detail § 2).

/** "+ Create" in the top bar from md; "Create" in the bottom bar in phones (SU-02). */
function createLink(page: Page, isMobile: boolean) {
  const bar = isMobile
    ? page.getByRole('navigation', { name: 'Main navigation' })
    : page.getByRole('banner')
  return bar.getByRole('link', { name: 'Create' })
}

const editor = (page: Page) => page.getByRole('main')
const community = (page: Page) =>
  editor(page).getByRole('combobox', { name: 'Community', exact: true })
const title = (page: Page) => editor(page).getByRole('textbox', { name: 'Title' })
const body = (page: Page) => editor(page).getByRole('textbox', { name: 'Body' })

/** Adds a related community or asset with "+" (specs/related-tags). */
async function addRelated(page: Page, search: string, option: RegExp) {
  await editor(page).getByRole('combobox', { name: 'Add a related community or asset' }).click()
  await page.getByRole('combobox', { name: 'Search communities' }).fill(search)
  // The list is the search's answer (only its kind) before choosing: not one being replaced.
  await expect
    .poll(async () => {
      const handles = await page.getByRole('option').allTextContents()
      return handles.length > 0 && handles.every((handle) => handle.startsWith(search[0]!))
    })
    .toBe(true)
  await page.getByRole('option', { name: option }).click()
}

test.describe('Page to create a post', () => {
  test('"Create" goes to the page; choosing the community and publishing lands on the post (SU-01 to SU-04)', async ({
    page,
    isMobile,
  }, testInfo) => {
    const text = `Funding rates flipped (${testInfo.project.name} ${Date.now()})`
    await page.goto('/en')
    await createLink(page, isMobile).click()
    await expect(page).toHaveURL(/\/en\/submit$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Create post' })).toBeVisible()
    await expect(editor(page).getByRole('button', { name: 'Publish' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    await community(page).click()
    await expect(page.getByRole('option').first()).toContainText('Your profile')
    await page.getByRole('option', { name: /#defi/ }).click()
    // The URL follows the community, and so does the card on the right (SU-03, SU-07).
    await expect(page).toHaveURL(/\/en\/submit\?community=defi$/)
    await title(page).fill(text)
    await body(page).fill('Longs are **paying** again.')
    await editor(page).getByRole('button', { name: 'Publish' }).click()

    await expect(page).toHaveURL(/\/en\/post\/[0-9a-f-]+\/funding-rates-flipped-/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(text)
  })

  test("a group's Create post arrives with it chosen; another community keeps what is written (SU-02, SU-03, SU-07)", async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en/hub/defi')
    await page.getByRole('main').getByRole('link', { name: 'Create post' }).click()
    await expect(page).toHaveURL(/\/en\/submit\?community=defi$/)
    await expect(community(page)).toHaveText('#defi')
    // The focus is where to start: the title, the community being chosen (SU-09).
    await expect(title(page)).toBeFocused()
    const card = (handle: string) =>
      page.getByRole('heading', { level: 2, name: handle, exact: true })
    if (!isMobile) await expect(card('#defi')).toBeVisible()

    await title(page).fill('Keep me')
    await community(page).click()
    // Another of the viewer's communities: an asset.
    await page.getByRole('option', { name: /\$BTC/ }).click()
    await expect(page).toHaveURL(/\/en\/submit\?community=BTC$/)
    await expect(title(page)).toHaveValue('Keep me')
    if (!isMobile) await expect(card('$BTC')).toBeVisible()
  })

  test('says what is wrong on Publish, and publishes a link (PC-09)', async ({
    page,
  }, testInfo) => {
    const text = `Yields on the move (${testInfo.project.name} ${Date.now()})`
    await page.goto('/en/submit?community=defi&type=link')
    await expect(editor(page).getByRole('tab', { name: 'Link' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await editor(page).getByRole('textbox', { name: 'Link' }).fill('javascript:alert(1)')
    await title(page).fill(text)
    await body(page).fill('Worth a read.')
    await editor(page).getByRole('button', { name: 'Publish' }).click()
    await expect(
      editor(page).getByText('Enter a link that starts with http:// or https://'),
    ).toBeVisible()
    await editor(page).getByRole('textbox', { name: 'Link' }).fill('https://example.com/yields')
    await editor(page).getByRole('button', { name: 'Publish' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(text)
  })

  test('keeps a draft: offered after a reload, recovered or discarded (SU-12)', async ({
    page,
  }) => {
    await page.goto('/en/submit?community=defi')
    await title(page).fill('A draft that survives')
    await body(page).fill('Half a thought.')
    // Kept a moment after the typing rests.
    await expect
      .poll(() =>
        page.evaluate(() => Object.keys(localStorage).some((key) => key.includes('post-draft'))),
      )
      .toBe(true)

    await page.goto('/en/submit')
    // Announced (the live region holds only its words) and shown, with its buttons beside.
    await expect(editor(page).getByRole('status')).toHaveText(/unpublished draft/)
    await editor(page).getByRole('button', { name: 'Recover' }).click()
    await expect(title(page)).toHaveValue('A draft that survives')
    await expect(title(page)).toBeFocused()
    await expect(community(page)).toHaveText('#defi')

    await page.reload()
    await editor(page).getByRole('button', { name: 'Discard' }).click()
    await page.reload()
    await expect(editor(page).getByText(/unpublished draft/)).toHaveCount(0)
  })

  test('without a community, the right column offers tips to post (SU-07)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'There is no right column in phones')
    await page.goto('/en/submit')
    await expect(page.getByRole('heading', { level: 2, name: 'Tips to post' })).toBeVisible()
    // The community is what to choose first: the focus is on it (SU-09).
    await expect(community(page)).toBeFocused()
  })

  test('the picker filters by kind, with chips or a leading symbol (specs/picker-filters)', async ({
    page,
  }) => {
    await page.goto('/en/submit')
    await community(page).click()
    const options = page.getByRole('option')
    await expect(options.first()).toContainText('Your profile')

    const kinds = page.getByRole('group', { name: 'Filter by type' })
    await kinds.getByRole('button', { name: 'Assets' }).click()
    await expect(options.first()).toContainText('$')
    for (const handle of await options.allTextContents()) expect(handle).toMatch(/^\$/)

    // A leading # asks for groups, and the chip follows (PF-03).
    const search = page.getByRole('combobox', { name: 'Search communities' })
    await search.fill('#d')
    await expect(kinds.getByRole('button', { name: 'Communities' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('option', { name: /#defi/ })).toBeVisible()
    for (const handle of await options.allTextContents()) expect(handle).toMatch(/^#/)
  })

  test('the picker filters are reached with Tab from the search (picker-filters PF-06)', async ({
    page,
  }) => {
    await page.goto('/en/submit')
    await community(page).click()
    const search = page.getByRole('combobox', { name: 'Search communities' })
    await expect(search).toBeFocused()
    const kinds = page.getByRole('group', { name: 'Filter by type' })
    await page.keyboard.press('Tab')
    await expect(kinds.getByRole('button', { name: 'All' })).toBeFocused()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(kinds.getByRole('button', { name: 'Assets' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(kinds.getByRole('button', { name: 'Assets' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('listbox')).toBeVisible()
    await expect(page.getByRole('option').first()).toContainText('$')

    // Closed and opened again, it starts on All (PF-01).
    await page.keyboard.press('Escape')
    await community(page).click()
    await expect(kinds.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('option').first()).toContainText('Your profile')
  })

  test('adds related ones with "+" and publishes them as mentions (specs/related-tags)', async ({
    page,
  }, testInfo) => {
    const text = `Banks and the peso (${testInfo.project.name} ${Date.now()})`
    await page.goto('/en/submit?community=defi')
    await addRelated(page, '$btc', /\$BTC/)
    await addRelated(page, '#mac', /#macro/)
    const related = editor(page).getByRole('list', { name: 'Related' })
    await expect(related).toContainText('$BTC')
    await expect(related).toContainText('#macro')

    // The × says what it removes; the focus goes to the one before (RT-07).
    await editor(page).getByRole('button', { name: 'Remove #macro' }).click()
    await expect(related).not.toContainText('#macro')
    await expect(editor(page).getByRole('button', { name: 'Remove $BTC' })).toBeFocused()

    await title(page).fill(text)
    await body(page).fill('Cheap again.')
    await editor(page).getByRole('button', { name: 'Publish' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(text)
    // With mocks the mention stays text; the backend makes it a link (P-001).
    await expect(page.getByRole('main').getByText('$BTC', { exact: false })).toBeVisible()
  })

  test('asks before discarding what is written (SU-05)', async ({ page }) => {
    await page.goto('/en')
    await page.goto('/en/submit')
    await title(page).fill('Half a thought')
    await editor(page).getByRole('button', { name: 'Cancel' }).click()
    const confirm = page.getByRole('alertdialog', { name: 'Discard this post?' })
    await confirm.getByRole('button', { name: 'Keep editing' }).click()
    await expect(title(page)).toHaveValue('Half a thought')
    await editor(page).getByRole('button', { name: 'Cancel' }).click()
    await confirm.getByRole('button', { name: 'Discard' }).click()
    await expect(page).toHaveURL(/\/en$/)
  })

  test('has its word in each language (SU-01)', async ({ page, request }) => {
    const spanish = await request.get('/es/submit?community=defi', { maxRedirects: 0 })
    expect(spanish.status()).toBe(308)
    expect(spanish.headers().location).toMatch(/\/es\/publicar\?community=defi$/)
    expect((await request.get('/en/publicar')).status()).toBe(404)
    await page.goto('/pt/publicar')
    await expect(page.getByRole('heading', { level: 1, name: 'Criar post' })).toBeVisible()
  })

  test('your own profile offers Create post, and someone else does not (PC-03)', async ({
    page,
  }) => {
    const create = page.getByRole('main').getByRole('link', { name: 'Create post' })
    await page.goto('/en/user/demo')
    await expect(create).toHaveAttribute('href', '/en/submit?community=demo')
    await page.goto('/en/user/federico')
    await expect(create).toHaveCount(0)
  })

  test('without a session, the page says how to get in (SU-06)', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
    await page.goto('/en/submit')
    await expect(page.getByText('Post with an account')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Title' })).toHaveCount(0)
  })

  test('fits 360px in Spanish, the longest buttons (SU-09)', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The phone width')
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/es/publicar?community=defi')
    await expect(page.getByRole('heading', { level: 1, name: 'Crear post' })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    // Cancel and Publish stay inside the editor's row.
    const width = page.viewportSize()!.width
    for (const name of ['Cancelar', 'Publicar']) {
      const box = await editor(page).getByRole('button', { name, exact: true }).boundingBox()
      expect(box!.x + box!.width).toBeLessThanOrEqual(width)
    }
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`fits 360px and stays accessible in ${theme} (SU-09)`, async ({ page, isMobile }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      if (isMobile) await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/en/submit?community=defi')
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      // With related ones, the row is at its widest (specs/related-tags RT-07).
      await addRelated(page, '$btc', /\$BTC/)
      await addRelated(page, '#mac', /#macro/)
      await body(page).click()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
      await community(page).click()
      await expect(page.getByRole('option').first()).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }
})
