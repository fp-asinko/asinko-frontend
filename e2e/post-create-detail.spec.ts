import { expect, test, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/post-create-detail against the production build with API_MOCKS=true
// (src/mocks/fixtures/posts.ts: post 1 is "Whales accumulated…", post 12 is deleted).

const WHALES = '00000000-0000-4000-8000-000000004001'
const WHALES_PATH = `/post/${WHALES}/whales-accumulated-48-000-btc-in-two-weeks`
const DELETED = '00000000-0000-4000-8000-000000004012'
// The Fed post: a thread five levels deep, folded from level 4.
const FED_PATH =
  '/en/post/00000000-0000-4000-8000-000000004002/the-fed-cuts-25-bps-what-it-means-for-crypto'

const comments = (page: Page) => page.getByRole('region', { name: /comments/i })

test.describe('Post detail', () => {
  test('shows the whole post with its title as the h1, and passes axe (PC-12, PC-13)', async ({
    page,
  }) => {
    await page.goto(`/en${WHALES_PATH}`)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Whales accumulated 48,000 $BTC in two weeks' }),
    ).toBeVisible()
    await expect(
      page.getByRole('article').first().getByRole('button', { name: 'Upvote' }),
    ).toBeVisible()
    await expect(page.getByText('See more')).toHaveCount(0)
    await expectNoA11yViolations(page)
  })

  test('redirects a missing or outdated slug to the canonical URL, 308 (PC-12)', async ({
    request,
  }) => {
    for (const from of [`/es/post/${WHALES}`, `/pt/post/${WHALES}/old-title`]) {
      const response = await request.get(from, { maxRedirects: 0 })
      expect(response.status(), from).toBe(308)
      const locale = from.split('/')[1]
      expect(new URL(response.headers().location!, 'http://x').pathname).toBe(
        `/${locale}${WHALES_PATH}`,
      )
    }
  })

  test('an unknown post or an invalid id is a real 404 (PC-12)', async ({ request }) => {
    expect((await request.get('/en/post/00000000-0000-4000-8000-000000000000/x')).status()).toBe(
      404,
    )
    expect((await request.get('/en/post/not-an-id')).status()).toBe(404)
  })

  test('has its own title, description and canonical; a deleted post is not indexed (PC-12)', async ({
    page,
  }) => {
    await page.goto(`/es${WHALES_PATH}`)
    await expect(page).toHaveTitle(/Whales accumulated 48,000 \$BTC in two weeks/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/es${WHALES_PATH}$`),
    )

    await page.goto(`/en/post/${DELETED}`)
    await expect(page.getByRole('heading', { level: 1, name: '[deleted]' })).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })
})

test.describe('Post detail comments', () => {
  test('comments and replies show at once and stay after the refresh (PC-14, PC-15)', async ({
    page,
  }, testInfo) => {
    // The mock server keeps created comments for every test: unique texts per run and project.
    const mine = `Rates first, then risk (${testInfo.project.name} ${Date.now()})`
    const reply = `Agreed with the dots (${testInfo.project.name} ${Date.now()})`
    await page.goto(FED_PATH)
    const section = comments(page)

    await section.getByRole('textbox', { name: 'Your comment' }).fill(mine)
    await section.getByRole('button', { name: 'Comment' }).click()
    await expect(section.getByText(mine)).toBeVisible()
    await expect(section.getByRole('textbox', { name: 'Your comment' })).toHaveValue('')
    await expect(section.getByText('Sending…')).toHaveCount(0)

    const thread = section.getByRole('listitem').filter({ hasText: mine }).first()
    await thread.getByRole('button', { name: 'Reply' }).click()
    const box = thread.getByRole('textbox', { name: 'Your reply' })
    await expect(box).toBeFocused()
    await box.fill(reply)
    await thread.getByRole('button', { name: 'Send reply' }).click()
    await expect(thread.getByText(reply)).toBeVisible()
    await expect(thread.getByRole('textbox')).toHaveCount(0)

    await page.reload()
    await expect(comments(page).getByText(reply)).toBeVisible()
  })

  test('folds the replies from level 4 and votes a comment (PC-14, PC-16)', async ({ page }) => {
    await page.goto(FED_PATH)
    const section = comments(page)
    await expect(section.getByText('He always does.')).toBeHidden()
    await section.getByRole('button', { name: 'See 2 replies' }).click()
    await expect(section.getByText(/He always does/)).toBeVisible()
    await expect(section.getByText(/Until the next CPI print/)).toBeVisible()

    const first = section.getByRole('listitem').filter({ hasText: 'The dot plot shows' }).first()
    const upvote = first.getByRole('button', { name: 'Upvote' }).first()
    await upvote.click()
    await expect(upvote).toHaveAttribute('aria-pressed', 'true')
    // From the top: scrolled, the sticky top bar covers the post's votes and axe counts them as
    // obscured targets (target-size), which they are not once in view.
    await page.evaluate(() => window.scrollTo(0, 0))
    await expectNoA11yViolations(page)
  })

  test('without a session, commenting asks for an account (PC-15)', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
    await page.goto(FED_PATH)
    const section = comments(page)
    await section.getByRole('textbox', { name: 'Your comment' }).fill('Hello')
    await section.getByRole('button', { name: 'Comment' }).click()
    await expect(page.getByRole('dialog', { name: 'Join Asinko to comment' })).toBeVisible()
  })

  test('fits 360px without horizontal scroll (PC-18)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto(FED_PATH)
    await comments(page).getByRole('button', { name: 'See 2 replies' }).click()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})

test.describe('From the feed', () => {
  test('the title and "See all comments" lead to the post page (PC-17)', async ({ page }) => {
    await page.goto('/en')
    const whales = page.getByRole('article').filter({ hasText: 'Whales accumulated 48,000 $BTC' })
    await whales.getByRole('link', { name: 'Whales accumulated 48,000 $BTC in two weeks' }).click()
    await expect(page).toHaveURL(new RegExp(`/en${WHALES_PATH}$`))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Whales accumulated 48,000 $BTC in two weeks',
    )

    await page.goBack()
    await whales.getByRole('button', { name: /6 comments/ }).click()
    await whales.getByRole('link', { name: 'See all comments' }).click()
    await expect(page).toHaveURL(new RegExp(`/en${WHALES_PATH}$`))
  })
})

/**
 * The open editor: the expanded composer box in desktop, the full screen in mobile (as X,
 * specs/post-create-detail PC-02, PC-03).
 */
function editorOf(page: Page, isMobile: boolean) {
  return isMobile
    ? page.getByRole('dialog', { name: 'Create post' })
    : page.getByRole('region', { name: 'Create post' })
}

/** "+ Create" in the top bar from md; "Create" in the bottom bar in mobile (PC-01, PC-02). */
function createButton(page: Page, isMobile: boolean) {
  const bar = isMobile
    ? page.getByRole('navigation', { name: 'Main navigation' })
    : page.getByRole('banner')
  return bar.getByRole('button', { name: 'Create' })
}

/** "Create" opens a window: the modal in desktop (as X), the full screen in mobile. */
async function openEditor(page: Page, isMobile: boolean) {
  await createButton(page, isMobile).click()
  return page.getByRole('dialog', { name: 'Create post' })
}

test.describe('Create post', () => {
  test('publishes from anywhere, choosing the community, and lands on the post (PC-01 to PC-10)', async ({
    page,
    isMobile,
  }, testInfo) => {
    const title = `Funding rates flipped (${testInfo.project.name} ${Date.now()})`
    await page.goto('/en')
    const editor = await openEditor(page, isMobile)
    await expect(editor).toBeVisible()
    // The focus enters the form, on the first thing to fill (PC-18).
    const community = editor.getByRole('combobox', { name: 'Community' })
    await expect(community).toBeFocused()
    await expect(editor.getByRole('button', { name: 'Publish' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    await community.click()
    await expect(page.getByRole('option').first()).toContainText('Your profile')
    await page.getByRole('option', { name: /#defi/ }).click()
    await expect(community).toHaveText('#defi')
    await editor.getByRole('textbox', { name: 'Title' }).fill(title)
    await editor.getByRole('textbox', { name: 'Body' }).fill('Longs are **paying** again.')
    await editor.getByRole('button', { name: 'Publish' }).click()

    await expect(page).toHaveURL(/\/en\/post\/[0-9a-f-]+\/funding-rates-flipped-/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(page.getByRole('main').getByText('paying')).toHaveCSS('font-weight', '700')
  })

  test("a group's page preselects it and says so in its box (PC-03, PC-06)", async ({
    page,
    isMobile,
  }, testInfo) => {
    const title = `Yields on the move (${testInfo.project.name} ${Date.now()})`
    await page.goto('/en/hub/defi')
    await page.getByRole('button', { name: 'Post in #defi' }).click()
    const editor = editorOf(page, isMobile)
    await expect(editor.getByRole('combobox', { name: 'Community' })).toHaveText('#defi')
    await expect(editor.getByRole('textbox', { name: 'Title' })).toBeFocused()

    await editor.getByRole('tab', { name: 'Link' }).click()
    await editor.getByRole('textbox', { name: 'Link' }).fill('javascript:alert(1)')
    await editor.getByRole('textbox', { name: 'Title' }).fill(title)
    await editor.getByRole('textbox', { name: 'Body' }).fill('Worth a read.')
    // Publish says what is wrong (as X, nothing is flagged while writing).
    await editor.getByRole('button', { name: 'Publish' }).click()
    await expect(
      editor.getByText('Enter a link that starts with http:// or https://'),
    ).toBeVisible()
    await editor.getByRole('textbox', { name: 'Link' }).fill('https://example.com/yields')
    await editor.getByRole('button', { name: 'Publish' }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(page.getByRole('main').getByRole('link', { name: 'example.com' })).toBeVisible()
  })

  test('in desktop "+ Create" opens a window over the page, anywhere, without moving it (PC-01)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Mobile always uses the full screen')
    await page.goto(`/en${WHALES_PATH}`)
    await page.mouse.wheel(0, 600)
    const scrolled = await page.evaluate(() => window.scrollY)
    await createButton(page, false).click()
    await expect(page.getByRole('dialog', { name: 'Create post' })).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/en${WHALES_PATH}$`))
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled)
  })

  test('focusing the top bar from the keyboard never moves the page (WCAG 2.4.11 without the jump)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The top bar has no Create in mobile')
    await page.goto(`/en${WHALES_PATH}`)
    await page.mouse.wheel(0, 600)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    const scrolled = await page.evaluate(() => window.scrollY)
    await createButton(page, false).focus()
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled)
  })

  test('in desktop the box expands in place and folds back when cancelled (PC-03, PC-05)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Mobile always uses the full screen')
    await page.goto('/en')
    const prompt = page.getByRole('button', { name: 'What are you thinking?' })
    await prompt.click()
    const editor = editorOf(page, false)
    await expect(editor).toBeVisible()
    // Inside the feed's box, not over the page: there is no dialog.
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(prompt).toBeHidden()

    await editor.getByRole('button', { name: 'Cancel' }).click()
    await expect(editor).toBeHidden()
    await expect(prompt).toBeVisible()
    await expect(prompt).toBeFocused()
  })

  test('the box never goes blank while the editor arrives, even on a slow network (PC-19)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Mobile opens the full screen once loaded: nothing to keep')
    await page.goto('/en')
    const prompt = page.getByRole('button', { name: 'What are you thinking?' })
    await expect(prompt).toBeVisible()
    // From now on every script arrives late, the editor's included.
    await page.route('**/_next/static/chunks/**', async (route) => {
      await new Promise((done) => setTimeout(done, 800))
      await route.continue()
    })
    await prompt.click()
    // While it downloads, the box keeps its prompt; then the editor takes its place.
    await expect(prompt).toBeVisible()
    await expect(editorOf(page, false)).toBeVisible()
    await expect(prompt).toBeHidden()
  })

  test('your own profile offers the box, and someone else does not (PC-03)', async ({ page }) => {
    await page.goto('/en/user/demo')
    await expect(page.getByRole('button', { name: 'Post in @demo' })).toBeVisible()
    await page.goto('/en/user/federico')
    await expect(page.getByRole('button', { name: /^Post in/ })).toHaveCount(0)
  })

  test('asks before discarding, and gives the focus back (PC-05, PC-18)', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en')
    const editor = await openEditor(page, isMobile)
    await editor.getByRole('textbox', { name: 'Title' }).fill('Half a thought')
    await page.keyboard.press('Escape')
    const confirm = page.getByRole('alertdialog', { name: 'Discard this post?' })
    await confirm.getByRole('button', { name: 'Keep editing' }).click()
    await expect(editor.getByRole('textbox', { name: 'Title' })).toHaveValue('Half a thought')

    await editor.getByRole('button', { name: 'Cancel' }).click()
    await confirm.getByRole('button', { name: 'Discard' }).click()
    await expect(editor).toBeHidden()
    // The focus goes back to the button that opened the window.
    await expect(createButton(page, isMobile)).toBeFocused()
  })

  test('without a session, Create asks for an account (PC-04)', async ({
    page,
    context,
    baseURL,
    isMobile,
  }) => {
    await context.addCookies([{ name: 'asinko-mock-guest', value: '1', url: baseURL! }])
    await page.goto('/en')
    await openEditor(page, isMobile)
    await expect(page.getByRole('dialog', { name: 'Join Asinko to post' })).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Create post' })).toHaveCount(0)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`the editor fits 360px and stays accessible in ${theme} (PC-18)`, async ({
      page,
      isMobile,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      if (isMobile) await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/en')
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      const editor = await openEditor(page, isMobile)
      await editor.getByRole('textbox', { name: 'Title' }).fill('x')
      await editor.getByRole('textbox', { name: 'Title' }).fill('')
      await editor.getByRole('textbox', { name: 'Body' }).click()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      await expectNoA11yViolations(page)
      // The community list too, open (it once showed white on white, without an edge).
      await editor.getByRole('combobox', { name: 'Community' }).click()
      await expect(page.getByRole('option').first()).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }
})
