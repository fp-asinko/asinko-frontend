import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CommunityOption, SuggestedAssets } from '../composer.types'
import { TopAssetsRail } from './top-assets-rail'

const BTC: CommunityOption = { id: 'btc', slug: 'BTC', handle: '$BTC', name: 'Bitcoin', own: false }
const NVDA: CommunityOption = {
  id: 'nvda',
  slug: 'NVDA',
  handle: '$NVDA',
  name: 'NVIDIA',
  own: false,
}
const MINE: SuggestedAssets = { basis: 'interests', assets: [BTC, NVDA] }

describe('TopAssetsRail (specs/thesis-form-steps FS-04 to FS-07)', () => {
  it('says whose they are, and shows each asset still, without counts (PO, 2026-11-05)', () => {
    renderWithIntl(<TopAssetsRail suggested={MINE} chosen={null} onChoose={vi.fn()} />)
    expect(screen.getByText('Based on your previous interests')).toBeInTheDocument()
    const rail = screen.getByRole('region', { name: 'Based on your previous interests' })
    const items = within(rail).getAllByRole('button', { pressed: false })
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('$BTC')
    expect(items[1]).toHaveTextContent('$NVDA')
    expect(items[0]).toHaveAccessibleName('$BTC, Bitcoin')
    expect(rail).not.toHaveTextContent(/thes[ie]s/)
  })

  it('says they are the popular ones when the viewer has none of their own', () => {
    renderWithIntl(
      <TopAssetsRail
        suggested={{ basis: 'popular', assets: [BTC] }}
        chosen={null}
        onChoose={vi.fn()}
      />,
    )
    expect(screen.getByRole('region', { name: 'Popular assets' })).toBeInTheDocument()
  })

  it('chooses an asset with a tap, and marks the chosen one with a ✓ (FS-06)', async () => {
    const onChoose = vi.fn()
    const { rerender } = renderWithIntl(
      <TopAssetsRail suggested={MINE} chosen={null} onChoose={onChoose} />,
    )
    await userEvent.click(screen.getByRole('button', { name: '$NVDA, NVIDIA' }))
    expect(onChoose).toHaveBeenCalledWith(NVDA)

    rerender(<TopAssetsRail suggested={MINE} chosen={NVDA} onChoose={onChoose} />)
    const chosen = screen.getByRole('button', { name: '$NVDA, NVIDIA' })
    expect(chosen).toHaveAttribute('aria-pressed', 'true')
    expect(chosen.querySelector('svg')).not.toBeNull()
  })

  it('shows nothing without assets (FS-07)', () => {
    const { container } = renderWithIntl(
      <TopAssetsRail
        suggested={{ basis: 'popular', assets: [] }}
        chosen={null}
        onChoose={vi.fn()}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
