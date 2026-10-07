import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectNoA11yViolations } from './fixtures/axe'

// specs/home-motion against the production build with API_MOCKS=true.

const articles = (page: Page) => page.getByRole('article')
const card = (page: Page, text: string) => articles(page).filter({ hasText: text })

/** Longest animation or transition currently set on an element, in ms. */
function longestMotion(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element)
    const ms = (value: string) =>
      Math.max(
        ...value.split(',').map((part) => parseFloat(part) * (part.includes('ms') ? 1 : 1000)),
      )
    return Math.max(ms(style.animationDuration), ms(style.transitionDuration))
  })
}

/** Sum of the layout shifts not caused by input (the CLS definition) since the page loaded. */
async function startCls(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __cls: number }
    w.__cls = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<
        PerformanceEntry & { value: number; hadRecentInput: boolean }
      >) {
        if (!entry.hadRecentInput) w.__cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
  return () => page.evaluate(() => (window as unknown as { __cls: number }).__cls)
}

test.describe('Home motion', () => {
  test('poll bars grow from 0 when a vote reveals the results (M-02)', async ({ page }) => {
    await page.goto('/en?filter=polls')
    const poll = card(page, 'How much of your portfolio is in DeFi?')
    await poll.getByRole('button', { name: '1–10%' }).click()

    const bar = poll.locator('[data-revealed] [data-bar]').first()
    await expect(bar).toBeAttached()
    // The bar is scaled to its share (inline style); mid-animation it is still below it.
    const target = await bar.evaluate((el) => new DOMMatrix((el as HTMLElement).style.transform).a)
    const scale = () => bar.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)
    expect(target).toBeGreaterThan(0)
    expect(await scale()).toBeLessThan(target)
    await expect.poll(scale).toBeCloseTo(target, 3)
  })

  test('sidebar sections animate their height when collapsing (S-01)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The column is in the menu panel on phones')
    await page.goto('/en')
    const section = page.getByRole('region', { name: 'People' })
    const panel = section.locator('[data-slot="collapsible-content"]')
    const full = (await panel.boundingBox())!.height

    // Sample the panel's height on every frame while it closes: some frame must sit in between.
    const heights = await section.evaluate(async (element) => {
      const samples: number[] = []
      element.querySelector('button')!.click()
      const until = performance.now() + 400
      while (performance.now() < until) {
        await new Promise(requestAnimationFrame)
        const content = element.querySelector('[data-slot="collapsible-content"]')
        samples.push(content ? content.getBoundingClientRect().height : 0)
      }
      return samples
    })
    expect(heights.some((height) => height > 1 && height < full - 1)).toBe(true)
    await expect(panel).toHaveCount(0)
  })

  test('marks the community page being shown in the column (S-04, specs/community-pages)', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en/asset/BTC')
    if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click()
    const column = page.getByRole('region', { name: 'Your interests' }).filter({ visible: true })
    await expect(column.getByRole('link', { name: /^Bitcoin \$BTC/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(column.locator('[aria-current="page"]')).toHaveCount(1)
  })

  test('voting, opening comments and loading more do not shift the layout (G-04)', async ({
    page,
  }) => {
    await page.goto('/en')
    const cls = await startCls(page)

    await card(page, 'The Fed cuts 25 bps').getByRole('button', { name: 'Upvote' }).click()
    await card(page, 'Whales accumulated 48,000 $BTC')
      .getByRole('button', { name: /6 comments/ })
      .click()
    await page.getByRole('button', { name: 'Load more' }).scrollIntoViewIfNeeded()
    await expect(articles(page)).toHaveCount(26)

    expect(await cls()).toBeLessThan(0.1)
  })

  test('stays accessible with the new states (G-06)', async ({ page }) => {
    await page.goto('/en?community=BTC')
    await card(page, 'Whales accumulated 48,000 $BTC')
      .getByRole('button', { name: /comments/ })
      .click()
    await expectNoA11yViolations(page)
  })
})

test.describe('Home motion with reduced motion (G-01)', () => {
  test.use({ reducedMotion: 'reduce' })

  test('nothing animates after voting, opening comments or loading more', async ({ page }) => {
    await page.goto('/en')
    const post = card(page, 'The Fed cuts 25 bps')
    await post.getByRole('button', { name: 'Upvote' }).click()
    expect(
      await longestMotion(post.getByRole('button', { name: 'Upvote' }).locator('svg')),
    ).toBeLessThanOrEqual(1)

    const whales = card(page, 'Whales accumulated 48,000 $BTC')
    await whales.getByRole('button', { name: /6 comments/ }).click()
    const panel = whales.locator('[id] > .min-h-0').first()
    expect(await longestMotion(panel.locator('..'))).toBeLessThanOrEqual(1)

    await page.getByRole('button', { name: 'Load more' }).scrollIntoViewIfNeeded()
    await expect(articles(page)).toHaveCount(26)
    expect(await longestMotion(page.locator('.stagger > li').first())).toBeLessThanOrEqual(1)
    expect(
      await longestMotion(
        page
          .getByRole('link', { name: 'Live' })
          .or(page.getByRole('button', { name: 'Live' }))
          .locator('span.absolute'),
      ),
    ).toBeLessThanOrEqual(1)
  })
})
