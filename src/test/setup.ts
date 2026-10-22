import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// Without Vitest globals, Testing Library does not unmount between tests on its own.
afterEach(() => cleanup())

// findBy and waitFor wait up to 8 s (1 s by default): a lazily loaded part (a dialog, a menu, a
// panel) comes in well under a second alone, but in seconds with the whole suite in parallel on a
// loaded machine (the pre-push hook, a dev server running). A check that never passes still fails.
configure({ asyncUtilTimeout: 8000 })

// jsdom does not implement matchMedia (used by next-themes and responsive hooks).
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// Nor ResizeObserver (the mention layer follows its textarea's size with it).
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
