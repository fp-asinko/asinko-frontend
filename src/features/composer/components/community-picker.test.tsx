import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CommunityOption } from '../composer.types'
import { CommunityPicker } from './community-picker'

const action = vi.hoisted(() => ({ searchCommunities: vi.fn() }))
vi.mock('../actions/search-communities.action', () => action)

const OWN: CommunityOption = { id: 'own', slug: 'demo', handle: '@demo', name: 'demo', own: true }
const DEFI: CommunityOption = {
  id: 'defi',
  slug: 'defi',
  handle: '#defi',
  name: '#DeFi',
  own: false,
}
const BTC: CommunityOption = { id: 'btc', slug: 'BTC', handle: '$BTC', name: 'Bitcoin', own: false }

function Picker({ onChange }: { onChange: (value: CommunityOption | null) => void }) {
  const [value, setValue] = useState<CommunityOption | null>(null)
  return (
    <CommunityPicker
      id="community"
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
      invalid={false}
    />
  )
}

const chip = () => screen.getAllByRole('combobox')[0]!

/** Opens the list from the keyboard (jsdom does not run Base UI's pointer opening). */
async function open() {
  chip().focus()
  await userEvent.keyboard('{ArrowDown}')
}

describe('CommunityPicker (specs/post-create-detail PC-06)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is a chip that says to choose, and becomes the chosen community', async () => {
    action.searchCommunities.mockResolvedValue({ ok: true, data: [OWN, DEFI, BTC] })
    const onChange = vi.fn()
    renderWithIntl(<Picker onChange={onChange} />)
    expect(chip()).toHaveTextContent('Choose a community')

    await open()
    expect(action.searchCommunities).toHaveBeenCalledWith('', 'all')
    const options = await screen.findAllByRole('option')
    // Your profile first; a name only when it says more than the handle.
    expect(options.map((option) => option.textContent)).toEqual([
      'Your profile@demo',
      '#defi',
      '$BTCBitcoin',
    ])

    await userEvent.click(options[1]!)
    expect(onChange).toHaveBeenCalledWith(DEFI)
    expect(chip()).toHaveTextContent('#defi')
  })

  it('searches on the server after a pause while typing, once', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    action.searchCommunities.mockResolvedValue({ ok: true, data: [BTC] })
    renderWithIntl(<Picker onChange={vi.fn()} />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await open()
    await user.type(screen.getByRole('combobox', { name: 'Search communities' }), 'bit')
    expect(action.searchCommunities).not.toHaveBeenCalledWith('bit', 'all')

    await act(async () => vi.advanceTimersByTime(300))
    expect(action.searchCommunities).toHaveBeenCalledWith('bit', 'all')
    expect(action.searchCommunities).toHaveBeenCalledTimes(2) // '' on open, then 'bit'
    expect(await screen.findByRole('option', { name: /\$BTC/ })).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('says when nothing is found', async () => {
    action.searchCommunities.mockResolvedValue({ ok: true, data: [] })
    renderWithIntl(<Picker onChange={vi.fn()} />)
    await open()
    expect(await screen.findByText('No communities found')).toBeInTheDocument()
  })

  it('says when the search fails', async () => {
    action.searchCommunities.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderWithIntl(<Picker onChange={vi.fn()} />)
    await open()
    expect(
      await screen.findByText('Could not load the communities. Type to try again.'),
    ).toBeInTheDocument()
  })
})

describe('CommunityPicker filters (specs/picker-filters)', () => {
  beforeEach(() => vi.clearAllMocks())

  const kind = (name: string) => screen.getByRole('button', { name })
  const search = () => screen.getByRole('combobox', { name: 'Search communities' })

  it('offers All, Communities and Assets, one pressed at a time (PF-01, PF-02, PF-06)', async () => {
    action.searchCommunities.mockResolvedValue({ ok: true, data: [BTC] })
    renderWithIntl(<Picker onChange={vi.fn()} />)
    await open()
    expect(screen.getByRole('group', { name: 'Filter by type' })).toBeInTheDocument()
    expect(kind('All')).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(kind('Assets'))
    expect(action.searchCommunities).toHaveBeenLastCalledWith('', 'assets')
    expect(kind('Assets')).toHaveAttribute('aria-pressed', 'true')
    expect(kind('All')).toHaveAttribute('aria-pressed', 'false')
    // The search keeps the focus: typing goes on (PF-06).
    expect(search()).toHaveFocus()

    await userEvent.click(kind('Communities'))
    expect(action.searchCommunities).toHaveBeenLastCalledWith('', 'groups')
  })

  it('reads $ and # in the search, and erasing them goes back to All (PF-03)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    action.searchCommunities.mockResolvedValue({ ok: true, data: [BTC] })
    renderWithIntl(<Picker onChange={vi.fn()} />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await open()

    await user.type(search(), '$bt')
    await act(async () => vi.advanceTimersByTime(300))
    expect(kind('Assets')).toHaveAttribute('aria-pressed', 'true')
    expect(action.searchCommunities).toHaveBeenLastCalledWith('bt', 'assets')

    await user.clear(search())
    await user.type(search(), 'bt')
    await act(async () => vi.advanceTimersByTime(300))
    expect(kind('All')).toHaveAttribute('aria-pressed', 'true')
    expect(action.searchCommunities).toHaveBeenLastCalledWith('bt', 'all')

    await user.clear(search())
    await user.type(search(), '#ma')
    await act(async () => vi.advanceTimersByTime(300))
    expect(kind('Communities')).toHaveAttribute('aria-pressed', 'true')
    expect(action.searchCommunities).toHaveBeenLastCalledWith('ma', 'groups')
    vi.useRealTimers()
  })

  it('a chip chosen by hand takes the symbol out of the search (PF-03)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    action.searchCommunities.mockResolvedValue({ ok: true, data: [BTC] })
    renderWithIntl(<Picker onChange={vi.fn()} />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await open()
    await user.type(search(), '$bt')
    await user.click(kind('Communities'))
    expect(search()).toHaveValue('bt')
    expect(action.searchCommunities).toHaveBeenLastCalledWith('bt', 'groups')

    // A chip chosen by hand stays while typing without a symbol.
    await user.type(search(), 'c')
    await act(async () => vi.advanceTimersByTime(300))
    expect(kind('Communities')).toHaveAttribute('aria-pressed', 'true')
    expect(action.searchCommunities).toHaveBeenLastCalledWith('btc', 'groups')
    vi.useRealTimers()
  })

  it('a chip answers at once, before the server, and a known one asks nothing again', async () => {
    action.searchCommunities.mockResolvedValueOnce({ ok: true, data: [OWN, DEFI, BTC] })
    renderWithIntl(<Picker onChange={vi.fn()} />)
    await open()
    await screen.findByRole('option', { name: /#defi/ })

    // The server has not answered Assets yet: the list is already filtered from All.
    let answer: (value: unknown) => void = () => {}
    action.searchCommunities.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)))
    await userEvent.click(kind('Assets'))
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      '$BTCBitcoin',
    ])

    await userEvent.click(kind('All'))
    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(action.searchCommunities).toHaveBeenCalledTimes(2) // All on open, then Assets
    await act(async () => answer({ ok: true, data: [BTC] }))
  })

  it('says what was missing (PF-05)', async () => {
    action.searchCommunities.mockResolvedValue({ ok: true, data: [] })
    renderWithIntl(<Picker onChange={vi.fn()} />)
    await open()
    await userEvent.click(kind('Assets'))
    expect(await screen.findByText('No assets found')).toBeInTheDocument()
    await userEvent.click(kind('Communities'))
    expect(await screen.findByText('No communities found')).toBeInTheDocument()
  })
})
