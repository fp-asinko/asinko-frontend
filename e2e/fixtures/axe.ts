import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

/** WCAG 2.2 AA automated check (design-system.md § Accesibilidad). Manual testing still applies. */
export async function expectNoA11yViolations(page: Page) {
  // Entrances fade in (stagger, consensus): measured mid-fade, text looks low-contrast. Wait for
  // every finite animation to end; infinite ones (the Live pulse) never would.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  )
  // The sticky top bar covers whatever the scroll leaves under it, and axe's target-size counts
  // that link as obscured: a result of where the test scrolled, not of the page (the bar's own
  // scroll padding keeps a focused link out from under it). While measuring, the bar stays where
  // it is in the layout but does not stick, so it covers nothing.
  // Through the DOM, not a <style> tag: the page's CSP only takes styles with its nonce.
  const stuck = (value: string) =>
    page.evaluate((position) => {
      const bar = document.querySelector<HTMLElement>('[data-site-header]')
      if (bar) bar.style.position = position
    }, value)
  await stuck('relative')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  await stuck('')
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`),
  ).toEqual([])
}

/** Collects console errors (CSP violations, hydration mismatches) during a test. */
export function collectConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}
