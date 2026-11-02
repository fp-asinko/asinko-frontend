import { expect, test } from '@playwright/test'

// specs/local-time against the production build with API_MOCKS=true: a browser in Santiago
// (UTC−3) sees every date in its zone, drawn by the server once the cookie is there.

// Without the cookie every other test starts with (playwright.config.ts): a first visit.
test.use({ timezoneId: 'America/Santiago', storageState: { cookies: [], origins: [] } })

test.describe('Dates in the viewer’s time zone', () => {
  test('the first visit writes the zone, and the server draws the times in it (LT-01, LT-02, LT-04)', async ({
    page,
    context,
    isMobile,
  }) => {
    // The group's calendar lives in the right column, from lg.
    test.skip(isMobile, 'The calendar is in the desktop right column')
    await page.goto('/en/hub/macro')
    await expect
      .poll(async () => (await context.cookies()).find((each) => each.name === 'asinko-tz')?.value)
      .toBe('America%2FSantiago')

    // US CPI at 12:00 UTC: 9:00 AM in Santiago, already in the server's HTML.
    const html = await (await page.request.get('/en/hub/macro')).text()
    expect(html).toMatch(/US CPI \(September\)[\s\S]*?9:00\sAM/)
    const calendar = page.getByRole('region', { name: 'Macro calendar' })
    await expect(calendar.getByRole('listitem').first()).toContainText(/9:00\sAM/)
  })
})
