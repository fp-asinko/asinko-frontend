import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
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
  it('slides its items once for assistive tech: the loop’s copy is hidden and inert', () => {
    renderWithIntl(<Rail />)
    const rail = screen.getByRole('region', { name: 'Top assets' })
    expect(screen.getAllByRole('button', { name: 'BTC' })).toHaveLength(1)
    expect(rail.querySelectorAll('[inert] button')).toHaveLength(2)
    expect(screen.getByTestId('marquee-track')).toHaveClass('motion-safe:animate-marquee')
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
})
