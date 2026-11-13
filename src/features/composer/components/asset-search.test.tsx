import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CommunityOption } from '../composer.types'
import { AssetSearch } from './asset-search'

const action = vi.hoisted(() => ({ searchCommunities: vi.fn() }))
vi.mock('../actions/search-communities.action', () => action)

const BTC: CommunityOption = { id: 'btc', slug: 'BTC', handle: '$BTC', name: 'Bitcoin', own: false }
const ETH: CommunityOption = {
  id: 'eth',
  slug: 'ETH',
  handle: '$ETH',
  name: 'Ethereum',
  own: false,
}

function Search({ onChange = vi.fn() }: { onChange?: (value: CommunityOption | null) => void }) {
  const [value, setValue] = useState<CommunityOption | null>(null)
  return (
    <>
      <label id="asset-label" htmlFor="asset">
        Asset
      </label>
      <AssetSearch
        id="asset"
        labelledBy="asset-label"
        value={value}
        onChange={(next) => {
          setValue(next)
          onChange(next)
        }}
        renderValue={(asset) => <span>{asset.name}</span>}
      />
    </>
  )
}

const field = () => screen.getByRole('combobox', { name: 'Asset' })

describe('AssetSearch (specs/thesis-form-steps FS-01 to FS-03)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists nothing until something is typed, then the assets that match', async () => {
    action.searchCommunities.mockResolvedValue({ ok: true, data: [BTC, ETH] })
    renderWithIntl(<Search />)
    expect(field()).toHaveAttribute('placeholder', 'Search an asset…')
    await userEvent.click(field())
    expect(screen.queryByRole('option')).toBeNull()

    // Pasted, one input event: typed key by key, a pause longer than the debounce between two keys
    // (a loaded machine) searches for a half-written word. The debounce is checked below.
    await userEvent.paste('bit')
    expect(await screen.findByRole('option', { name: /\$BTC/ })).toBeVisible()
    // Said, not only seen (WCAG 4.1.3).
    await vi.waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('2 assets'))
    // Only assets, and once typing rests (FS-01).
    expect(action.searchCommunities).toHaveBeenCalledTimes(1)
    expect(action.searchCommunities).toHaveBeenCalledWith('bit', 'assets')
  })

  it('waits for typing to rest before searching, whatever the pace of the keys (FS-01)', () => {
    vi.useFakeTimers()
    try {
      action.searchCommunities.mockResolvedValue({ ok: true, data: [BTC] })
      renderWithIntl(<Search />)
      // A fake clock, so the pace between keys is exact and not the machine's.
      for (const text of ['b', 'bi', 'bit']) {
        fireEvent.change(field(), { target: { value: text } })
        act(() => void vi.advanceTimersByTime(150))
      }
      expect(action.searchCommunities).not.toHaveBeenCalled()
      act(() => void vi.advanceTimersByTime(60))
      expect(action.searchCommunities).toHaveBeenCalledTimes(1)
      expect(action.searchCommunities).toHaveBeenCalledWith('bit', 'assets')
    } finally {
      vi.useRealTimers()
    }
  })

  it('chooses one, shows it as its card, and × brings the search back focused (FS-02)', async () => {
    action.searchCommunities.mockResolvedValue({ ok: true, data: [BTC, ETH] })
    const onChange = vi.fn()
    renderWithIntl(<Search onChange={onChange} />)
    await userEvent.type(field(), 'eth')
    await userEvent.click(await screen.findByRole('option', { name: /\$ETH/ }))

    expect(onChange).toHaveBeenLastCalledWith(ETH)
    expect(screen.getByRole('group', { name: 'Asset' })).toHaveTextContent('Ethereum')

    await userEvent.click(screen.getByRole('button', { name: 'Change $ETH' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(field()).toHaveFocus()
    expect(field()).toHaveValue('')
  })

  it('says when nothing matches, and when the search failed (FS-03)', async () => {
    action.searchCommunities.mockResolvedValue({ ok: true, data: [] })
    renderWithIntl(<Search />)
    const input = field()
    await userEvent.type(input, 'zzz')
    // Said from the status, which is always there (WCAG 4.1.3).
    await vi.waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('No assets with that name'),
    )

    action.searchCommunities.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    await userEvent.type(input, 'z')
    await vi.waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Could not search. Try again.'),
    )
  })
})
