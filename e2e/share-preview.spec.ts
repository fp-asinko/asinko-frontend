import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

// specs/share-preview against the production build with API_MOCKS=true. What another app reads:
// the <head> tags and the image they point to. Device independent: desktop only.

const FED = '00000000-0000-4000-8000-000000004002'
const FED_PATH = `/en/post/${FED}/the-fed-cuts-25-bps-what-it-means-for-crypto`

const meta = (page: Page, key: string) =>
  page.locator(`meta[property="${key}"], meta[name="${key}"]`).first().getAttribute('content')

/** The image behind a tag: a 1200×630 PNG (its size read from the PNG header). */
async function expectImage(request: APIRequestContext, url: string) {
  const response = await request.get(new URL(url).pathname)
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe('image/png')
  const png = await response.body()
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
}

test.describe('Share preview', () => {
  test.skip(({ isMobile }) => isMobile, 'What other apps read does not depend on the device')

  test('a post names its own image, titled by the post, and the large card on X (SP-01, SP-02, SP-05)', async ({
    page,
    request,
  }) => {
    await page.goto(FED_PATH)
    const image = await meta(page, 'og:image')
    expect(image).toContain(`/en/post/${FED}/opengraph-image/card`)
    expect(await meta(page, 'og:image:alt')).toBe('The Fed cuts 25 bps: what it means for crypto')
    expect(await meta(page, 'og:site_name')).toBe('Asinko')
    expect(await meta(page, 'twitter:card')).toBe('summary_large_image')
    expect(await meta(page, 'twitter:image')).toBe(image)
    await expectImage(request, image!)
  })

  test("other pages carry the brand's image, in their language (SP-04)", async ({
    page,
    request,
  }) => {
    for (const path of ['/en', '/es/hub/defi', '/pt/asset/BTC', '/en/user/maria']) {
      await page.goto(path)
      const image = await meta(page, 'og:image')
      expect(image, path).toContain(`/${path.split('/')[1]}/opengraph-image/brand`)
      await expectImage(request, image!)
    }
    await page.goto('/es/hub/defi')
    expect(await meta(page, 'og:image:alt')).toBe(
      'La red social de finanzas donde la reputación se gana acertando.',
    )
  })

  test("a post that does not exist still answers with the brand's image (SP-06)", async ({
    request,
  }) => {
    await expectImage(
      request,
      'http://localhost/en/post/00000000-0000-4000-8000-000000000999/opengraph-image/card',
    )
  })
})
