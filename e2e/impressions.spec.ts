import { expect, test, type Page, type Request } from '@playwright/test'

// specs/explore-v1 (impressions) against the production build with API_MOCKS=true: the browser's
// beacon goes to /api/impressions, which answers 204 and sends it on to the mocked backend.

type Event = { contentId: string; type: string; dwellMs?: number }
type Batch = { requestId: string; events: Event[] }

const toImpressions = (request: Request) =>
  request.url().endsWith('/api/impressions') && request.method() === 'POST'

/** Every batch the page sends, as it sends them. */
function batches(page: Page): Batch[] {
  const sent: Batch[] = []
  page.on('request', (request) => {
    if (toImpressions(request)) sent.push(JSON.parse(request.postData() ?? '{}') as Batch)
  })
  return sent
}

/** As switching tabs: the page hides, sending what was seen, and shows again. */
const switchTabs = (page: Page) =>
  page.evaluate(() => {
    for (const value of ['hidden', 'visible']) {
      Object.defineProperty(document, 'visibilityState', { value, configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    }
  })

test.describe('Feed impressions', () => {
  test('reports a card seen for a second when the tab is left, then the post opened (EX-05 to EX-07)', async ({
    page,
  }) => {
    const sent = batches(page)
    await page.goto('/en')
    const card = page.getByRole('main').locator('article[data-content-path]').first()
    await expect(card).toBeVisible()
    const id = await card.getAttribute('data-content-id')

    // Leaving the tab sends what was on screen for a second or more; before that, nothing.
    await expect(async () => {
      await switchTabs(page)
      const seen = sent.flatMap((each) => each.events).find((each) => each.type === 'SEEN')
      expect(seen?.contentId).toBe(id)
      expect(seen?.dwellMs).toBeGreaterThanOrEqual(1000)
    }).toPass({ intervals: [1_100, 1_500, 2_000] })
    expect(sent[0]!.requestId).toMatch(/^[0-9a-f-]{36}$/)

    // Opening the post from its title goes as the page is left. The browser never learns how
    // it went: 204, nothing on screen.
    const answered = page.waitForResponse(
      (response) =>
        toImpressions(response.request()) && response.request().postData()!.includes('"OPEN"'),
    )
    await card.getByRole('heading').getByRole('link').click()
    await expect(page).toHaveURL(/\/en\/post\//)
    const opened = await answered
    expect(opened.status()).toBe(204)
    expect(JSON.parse(opened.request().postData()!).events).toContainEqual({
      contentId: id,
      type: 'OPEN',
    })
  })

  test('the route refuses another site and a body that is not the contract (EX-08)', async ({
    request,
    baseURL,
  }) => {
    const body = JSON.stringify({ requestId: 'nope', events: [] })
    const foreign = await request.post('/api/impressions', {
      data: body,
      headers: { origin: 'https://evil.example', 'content-type': 'text/plain' },
    })
    expect(foreign.status()).toBe(403)
    const malformed = await request.post('/api/impressions', {
      data: body,
      headers: { origin: baseURL!, 'content-type': 'text/plain' },
    })
    expect(malformed.status()).toBe(400)
  })
})
