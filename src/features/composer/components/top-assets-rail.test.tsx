import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CommunityOption, TopAsset } from '../composer.types'
import { TopAssetsRail } from './top-assets-rail'

const BTC: CommunityOption = { id: 'btc', slug: 'BTC', handle: '$BTC', name: 'Bitcoin', own: false }
const NVDA: CommunityOption = {
  id: 'nvda',
  slug: 'NVDA',
  handle: '$NVDA',
  name: 'NVIDIA',
  own: false,
}
const TOP: TopAsset[] = [
  { option: BTC, thesisCount: 12 },
  { option: NVDA, thesisCount: 1 },
]

describe('TopAssetsRail (specs/thesis-form-steps FS-04 to FS-07)', () => {
  it('shows the assets with the most theses, in order, with how many', () => {
    renderWithIntl(<TopAssetsRail assets={TOP} chosen={null} onChoose={vi.fn()} />)
    const rail = screen.getByRole('region', { name: 'Assets with the most theses' })
    const items = rail.querySelectorAll('button[aria-pressed]')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveAccessibleName('Bitcoin, 12 theses')
    expect(items[1]).toHaveAccessibleName('NVIDIA, 1 thesis')
    expect(items[0]).toHaveTextContent('$BTC')
  })

  it('chooses an asset with a tap, and marks the chosen one (FS-06)', async () => {
    const onChoose = vi.fn()
    const { rerender } = renderWithIntl(
      <TopAssetsRail assets={TOP} chosen={null} onChoose={onChoose} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'NVIDIA, 1 thesis' }))
    expect(onChoose).toHaveBeenCalledWith(NVDA)

    rerender(<TopAssetsRail assets={TOP} chosen={NVDA} onChoose={onChoose} />)
    expect(screen.getByRole('button', { name: 'NVIDIA, 1 thesis' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Bitcoin, 12 theses' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('shows nothing without assets (FS-07)', () => {
    const { container } = renderWithIntl(
      <TopAssetsRail assets={[]} chosen={null} onChoose={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
