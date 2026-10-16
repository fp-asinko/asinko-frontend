import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CommunityOption } from '../composer.types'
import { RelatedPicker } from './related-picker'

const action = vi.hoisted(() => ({ searchCommunities: vi.fn() }))
vi.mock('../actions/search-communities.action', () => action)

const option = (handle: string): CommunityOption => ({
  id: handle,
  slug: handle.slice(1),
  handle,
  name: handle,
  own: false,
})

function Related({ initial = [] }: { initial?: string[] }) {
  const [value, setValue] = useState(initial)
  return <RelatedPicker main="#argentina" value={value} onChange={setValue} />
}

const add = () => screen.queryByRole('combobox', { name: 'Add a related community or asset' })

describe('RelatedPicker (specs/related-tags)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    action.searchCommunities.mockResolvedValue({
      ok: true,
      data: ['#argentina', '$GGAL', '#macro', '$YPF'].map(option),
    })
  })

  it('adds with "+", without offering the main one or those added (RT-01, RT-03)', async () => {
    renderWithIntl(<Related initial={['$GGAL']} />)
    add()!.focus()
    await userEvent.keyboard('{ArrowDown}')
    const options = await screen.findAllByRole('option')
    expect(options.map((each) => each.textContent)).toEqual(['#macro', '$YPF'])

    await userEvent.click(options[0]!)
    expect(screen.getByRole('list', { name: 'Related' })).toHaveTextContent('$GGAL#macro')
  })

  it('hides "+" at three, and the focus goes to the last × (RT-02, RT-07)', async () => {
    renderWithIntl(<Related initial={['$GGAL', '#macro']} />)
    add()!.focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(await screen.findByRole('option', { name: '$YPF' }))
    expect(add()).toBeNull()
    expect(screen.getByRole('button', { name: 'Remove $YPF' })).toHaveFocus()
  })

  it('takes one out, leaving the focus on the one before or on "+" (RT-02, RT-07)', async () => {
    renderWithIntl(<Related initial={['$GGAL', '#macro', '$YPF']} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove #macro' }))
    expect(screen.getByRole('list', { name: 'Related' })).toHaveTextContent('$GGAL$YPF')
    expect(screen.getByRole('button', { name: 'Remove $GGAL' })).toHaveFocus()

    await userEvent.click(screen.getByRole('button', { name: 'Remove $GGAL' }))
    expect(add()).toHaveFocus()
  })
})
