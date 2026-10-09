import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { ComposerWindow } from './composer-window'
import type { ComposeSession } from './composer-root'

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

const SESSION: ComposeSession = { key: 1, type: 'LINK', community: null }

describe('ComposerWindow, full screen (specs/post-create-detail PC-02, PC-05)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('takes the screen, titled, on the asked format, with the focus on the community', async () => {
    renderWithIntl(<ComposerWindow layout="sheet" open onClose={vi.fn()} session={SESSION} />)
    expect(screen.getByRole('dialog', { name: 'Create post' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Link' })).toHaveAttribute('aria-selected', 'true')
    // One Cancel, at the top: the footer has only Publish.
    expect(screen.getAllByRole('button', { name: 'Cancel' })).toHaveLength(1)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Community' })).toHaveFocus())
  })

  it('closes with Cancel, asking first if something is written', async () => {
    const onClose = vi.fn()
    renderWithIntl(<ComposerWindow layout="sheet" open onClose={onClose} session={SESSION} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()

    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'Half')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(
      await screen.findByRole('alertdialog', { name: 'Discard this post?' }),
    ).toBeInTheDocument()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("closes and opens the new post's page once published", async () => {
    actions.createPost.mockResolvedValue({ ok: true, data: { id: 'abc', title: 'A link' } })
    const onClose = vi.fn()
    renderWithIntl(
      <ComposerWindow
        layout="sheet"
        open
        onClose={onClose}
        session={{
          ...SESSION,
          community: { id: '00000000-0000-4000-8000-000000001001', handle: '#defi', name: 'DeFi' },
        }}
      />,
    )
    await userEvent.type(screen.getByRole('textbox', { name: 'Link' }), 'https://example.com')
    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'A link')
    await userEvent.type(screen.getByRole('textbox', { name: 'Body' }), 'Body')
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(router.push).toHaveBeenCalledWith('/post/abc/a-link')
  })
})

describe('ComposerWindow, modal (specs/post-create-detail PC-01)', () => {
  it('is a window titled for screen readers, with a × that closes it', async () => {
    const onClose = vi.fn()
    renderWithIntl(<ComposerWindow layout="modal" open onClose={onClose} session={SESSION} />)
    expect(screen.getByRole('dialog', { name: 'Create post' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
