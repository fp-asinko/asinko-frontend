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
const DEFI: CommunityOption = { id: 'defi', handle: '#defi', name: 'DeFi', own: false }
const MACRO: CommunityOption = { id: 'macro', handle: '#macro', name: 'Macro', own: false }

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

describe('CommunityPicker (specs/post-create-detail PC-06)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists your communities on open, with your profile first, and chooses one', async () => {
    action.searchCommunities.mockResolvedValue({ ok: true, data: [OWN, DEFI] })
    const onChange = vi.fn()
    renderWithIntl(<Picker onChange={onChange} />)
    await userEvent.click(screen.getByRole('combobox'))

    expect(action.searchCommunities).toHaveBeenCalledWith('')
    const options = await screen.findAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['Your profile@demo', '#defiDeFi'])

    await userEvent.click(options[1]!)
    expect(onChange).toHaveBeenCalledWith(DEFI)
    expect(screen.getByRole('combobox')).toHaveValue('#defi')
  })

  it('searches on the server after a pause while typing, once', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    action.searchCommunities.mockResolvedValue({ ok: true, data: [MACRO] })
    renderWithIntl(<Picker onChange={vi.fn()} />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.type(screen.getByRole('combobox'), 'mac')
    expect(action.searchCommunities).not.toHaveBeenCalledWith('mac')

    await act(async () => vi.advanceTimersByTime(300))
    expect(action.searchCommunities).toHaveBeenCalledWith('mac')
    expect(action.searchCommunities).toHaveBeenCalledTimes(2) // '' on open, then 'mac'
    expect(await screen.findByRole('option', { name: /#macro/ })).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('says when nothing is found', async () => {
    action.searchCommunities.mockResolvedValue({ ok: true, data: [] })
    renderWithIntl(<Picker onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('combobox'))
    expect(await screen.findByText('No communities found')).toBeInTheDocument()
  })

  it('says when the search fails', async () => {
    action.searchCommunities.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderWithIntl(<Picker onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('combobox'))
    expect(
      await screen.findByText('Could not load the communities. Type to try again.'),
    ).toBeInTheDocument()
  })
})
