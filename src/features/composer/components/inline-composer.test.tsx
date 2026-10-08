import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import type { ComposeSession } from './composer-root'
import { InlineComposer } from './inline-composer'

const actions = vi.hoisted(() => ({ createPost: vi.fn(), searchCommunities: vi.fn() }))
vi.mock('../actions/create-post.action', () => ({ createPost: actions.createPost }))
vi.mock('../actions/search-communities.action', () => ({
  searchCommunities: actions.searchCommunities,
}))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const SESSION: ComposeSession = {
  key: 1,
  type: 'TEXT',
  community: { id: '00000000-0000-4000-8000-000000001001', handle: '#defi', name: 'DeFi' },
}

describe('InlineComposer (specs/post-create-detail PC-03, PC-05)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is a region with the focus on the first field to fill', async () => {
    renderWithIntl(<InlineComposer session={SESSION} onShown={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('region', { name: 'Create post' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus())
  })

  it('tells once it is drawn, so the box swaps its prompt in the same frame', () => {
    const onShown = vi.fn()
    renderWithIntl(<InlineComposer session={SESSION} onShown={onShown} onClose={vi.fn()} />)
    expect(onShown).toHaveBeenCalledOnce()
  })

  it('closes at once with Esc or Cancel when nothing is written', async () => {
    const onClose = vi.fn()
    renderWithIntl(<InlineComposer session={SESSION} onShown={vi.fn()} onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('asks before discarding what was written', async () => {
    const onClose = vi.fn()
    renderWithIntl(<InlineComposer session={SESSION} onShown={vi.fn()} onClose={onClose} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'Half')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("closes and opens the new post's page once published", async () => {
    actions.createPost.mockResolvedValue({ ok: true, data: { id: 'abc', title: 'Hi' } })
    const onClose = vi.fn()
    renderWithIntl(<InlineComposer session={SESSION} onShown={vi.fn()} onClose={onClose} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'Hi')
    await userEvent.type(screen.getByRole('textbox', { name: 'Body' }), 'Body')
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(router.push).toHaveBeenCalledWith('/post/abc/hi')
  })
})
