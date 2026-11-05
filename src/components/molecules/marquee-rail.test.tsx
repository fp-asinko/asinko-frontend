import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { MarqueeRail } from './marquee-rail'

function Rail() {
  return (
    <MarqueeRail label="Top assets" duration={24}>
      <button type="button">BTC</button>
      <button type="button">ETH</button>
    </MarqueeRail>
  )
}

describe('MarqueeRail (specs/thesis-form-steps FS-05)', () => {
  it('slides its items once for assistive tech: the loop’s copy is hidden and out of the Tab order', () => {
    renderWithIntl(<Rail />)
    const rail = screen.getByRole('region', { name: 'Top assets' })
    expect(screen.getAllByRole('button', { name: 'BTC' })).toHaveLength(1)
    const copy = rail.querySelectorAll('[data-marquee-copy] button')
    expect(copy).toHaveLength(2)
    for (const button of copy) expect(button).toHaveAttribute('tabindex', '-1')
    expect(screen.getByTestId('marquee-track')).toHaveClass('motion-safe:animate-marquee')
    // Paused from its data attribute, not an inline style.
    expect(screen.getByTestId('marquee-track')).toHaveClass(
      'data-stopped:[animation-play-state:paused]',
    )
    expect(screen.getByTestId('marquee-track')).toHaveStyle({ '--marquee-duration': '24s' })
  })

  it('pauses and plays again from its button (WCAG 2.2.2)', async () => {
    renderWithIntl(<Rail />)
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.getByTestId('marquee-track')).toHaveAttribute('data-stopped')
    await userEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(screen.getByTestId('marquee-track')).not.toHaveAttribute('data-stopped')
  })

  it('stops under the mouse, and goes still to the start with the focus inside', async () => {
    renderWithIntl(<Rail />)
    const track = screen.getByTestId('marquee-track')
    await userEvent.hover(screen.getByRole('button', { name: 'BTC' }))
    expect(track).toHaveAttribute('data-stopped')
    await userEvent.unhover(screen.getByRole('button', { name: 'BTC' }))
    expect(track).not.toHaveAttribute('data-stopped')

    act(() => screen.getByRole('button', { name: 'ETH' }).focus())
    expect(track).not.toHaveClass('motion-safe:animate-marquee')
    act(() => screen.getByRole('button', { name: 'ETH' }).blur())
    expect(track).toHaveClass('motion-safe:animate-marquee')
  })

  it('takes clicks on the copy too: half of each turn, it is what shows (PO, 2026-11-05)', async () => {
    const onClick = vi.fn()
    const { container } = renderWithIntl(
      <MarqueeRail label="Top assets" duration={24}>
        <button type="button" onClick={onClick}>
          BTC
        </button>
      </MarqueeRail>,
    )
    await userEvent.click(container.querySelector('[data-marquee-copy] button')!)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('keeps going under a click: the pill stays where it was pressed (PO, 2026-11-05)', async () => {
    const onClick = vi.fn()
    renderWithIntl(
      <MarqueeRail label="Top assets" duration={24}>
        <button type="button" onClick={onClick}>
          BTC
        </button>
      </MarqueeRail>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'BTC' }))
    expect(onClick).toHaveBeenCalledOnce()
    // Not taken back to the start, as the keyboard's focus would.
    expect(screen.getByTestId('marquee-track')).toHaveClass('motion-safe:animate-marquee')
  })
})
