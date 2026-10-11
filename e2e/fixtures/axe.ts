import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

/** WCAG 2.2 AA automated check (design-system.md § Accesibilidad). Manual testing still applies. */
export async function expectNoA11yViolations(page: Page) {
  // Entrances fade in (stagger, consensus): measured mid-fade, text looks low-contrast. Wait for
  // every finite animation to end; infinite ones (the Live pulse) never would.
  // Until none is left: content that arrives late (a server action, a hydrated column) starts its
  // own entrance after the first wait. Bounded, so a page that keeps animating still gets measured.
  await page.evaluate(async () => {
    const finite = () =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.playState === 'running' &&
            animation.effect?.getComputedTiming().iterations !== Infinity,
        )
    const frame = () => new Promise((done) => requestAnimationFrame(() => done(undefined)))
    for (let round = 0; round < 10; round++) {
      const running = finite()
      if (running.length === 0) {
        // Two quiet frames: nothing started right after the last one ended.
        await frame()
        await frame()
        if (finite().length === 0) return
        continue
      }
      await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)))
    }
  })
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
