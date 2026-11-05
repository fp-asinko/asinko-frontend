import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ScrollRail } from './scroll-rail'

/** jsdom lays nothing out: the track's sizes and scroll are set by hand. */
function size(track: HTMLElement, { client, scroll, left }: Record<string, number>) {
  Object.defineProperty(track, 'clientWidth', { configurable: true, value: client })
  Object.defineProperty(track, 'scrollWidth', { configurable: true, value: scroll })
  track.scrollLeft = left ?? 0
  act(() => {
    track.dispatchEvent(new Event('scroll'))
  })
}

function renderRail() {
  renderWithIntl(
    <ScrollRail label="Top assets">
      <button type="button">BTC</button>
      <button type="button">NVDA</button>
    </ScrollRail>,
  )
  return screen.getByRole('region', { name: 'Top assets' }).firstElementChild as HTMLElement
}

describe('ScrollRail (specs/thesis-form-steps FS-05)', () => {
  it('is a named region with its items, without arrows when all fit', () => {
    const track = renderRail()
    size(track, { client: 300, scroll: 300 })
    expect(screen.getByRole('button', { name: 'BTC' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next|previous/ })).not.toBeInTheDocument()
  })

  it('shows › when there is more after, and ‹ once scrolled', async () => {
    const track = renderRail()
    track.scrollBy = vi.fn()
    size(track, { client: 300, scroll: 900 })
    expect(screen.queryByRole('button', { name: 'Top assets: previous' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Top assets: next' }))
    expect(track.scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' })

    size(track, { client: 300, scroll: 900, left: 600 })
    expect(screen.getByRole('button', { name: 'Top assets: previous' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Top assets: next' })).not.toBeInTheDocument()
  })
})
