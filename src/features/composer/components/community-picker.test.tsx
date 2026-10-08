import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CommunityOption } from '../composer.types'
import { CommunityPicker } from './community-picker'

const action = vi.hoisted(() => ({ searchCommunities: vi.fn() }))
vi.mock('../actions/search-communities.action', () => action)

const OWN: CommunityOption = { id: 'own', handle: '@demo', name: 'demo', own: true }
const DEFI: CommunityOption = { id: 'defi', handle: '#defi', name: '#DeFi', own: false }
const BTC: CommunityOption = { id: 'btc', handle: '$BTC', name: 'Bitcoin', own: false }

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
    expect(action.searchCommunities).toHaveBeenCalledWith('')
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
    expect(action.searchCommunities).not.toHaveBeenCalledWith('bit')

    await act(async () => vi.advanceTimersByTime(300))
    expect(action.searchCommunities).toHaveBeenCalledWith('bit')
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
