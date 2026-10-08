import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { RecentlyViewedSlot } from './recently-viewed-slot'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

function screenWidth(wide: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: wide,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('RecentlyViewedSlot (specs/recently-viewed RV-08)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('brings the list once the page is idle, where the column exists', async () => {
    screenWidth(true)
    renderWithIntl(<RecentlyViewedSlot />)
    expect(
      await screen.findByRole('region', { name: 'Recently viewed' }, { timeout: 3000 }),
    ).toBeInTheDocument()
  })

  it('downloads nothing below 1024px, where there is no column', async () => {
    screenWidth(false)
    const { container } = renderWithIntl(<RecentlyViewedSlot />)
    await new Promise((done) => setTimeout(done, 400))
    expect(container).toBeEmptyDOMElement()
  })
})
