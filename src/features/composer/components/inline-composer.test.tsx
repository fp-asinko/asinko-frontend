import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import type { ComposeSession } from './composer-root'
import { InlineComposer } from './inline-composer'

const actions = vi.hoisted(() => ({ createPost: vi.fn(), searchCommunities: vi.fn() }))
// Mentions have their own tests (specs/mention-autocomplete): out of this component's.
vi.mock('@/lib/mentions/search-mentions.action', () => ({ searchMentions: vi.fn() }))
vi.mock('@/components/molecules/mention-assist', () => ({ MentionField: () => null }))
vi.mock('../actions/create-post.action', () => ({ createPost: actions.createPost }))
// The image's upload has its own tests (specs/post-image): out of here.
vi.mock('../actions/upload-post-image.action', () => ({
  uploadPostImageAction: vi.fn(),
  removePostImageAction: vi.fn(),
}))
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

  it('folds back to the closed box with Esc when nothing is written, then closes', async () => {
    const onClose = vi.fn()
    renderWithIntl(<InlineComposer session={SESSION} onShown={vi.fn()} onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    const editor = screen.getByRole('region', { name: 'Create post' })
    expect(editor.style.height).toBe('2.6875rem')
    expect(editor.style.opacity).toBe('0')
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('folds back to the whole closed box, actions row included, so nothing below jumps', async () => {
    renderWithIntl(
      <div data-compose-box data-closed-height="102">
        <InlineComposer session={SESSION} onShown={vi.fn()} onClose={vi.fn()} />
      </div>,
    )
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('region', { name: 'Create post' }).style.height).toBe('102px')
  })

  it('folds and closes with Cancel too, only once', async () => {
    const onClose = vi.fn()
    renderWithIntl(<InlineComposer session={SESSION} onShown={vi.fn()} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    await new Promise((done) => setTimeout(done, 250))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('asks before discarding what was written', async () => {
    const onClose = vi.fn()
    renderWithIntl(<InlineComposer session={SESSION} onShown={vi.fn()} onClose={onClose} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'Half')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
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
