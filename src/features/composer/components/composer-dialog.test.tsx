import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { ComposerDialog } from './composer-dialog'
import type { ComposeSession } from './composer-root'

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

function Host() {
  const [open, setOpen] = useState(true)
  return (
    <>
      <p>{open ? 'open' : 'closed'}</p>
      <ComposerDialog open={open} onOpenChange={setOpen} session={SESSION} />
    </>
  )
}

const dialog = () => screen.queryByRole('dialog', { name: 'Create post' })

describe('ComposerDialog (specs/post-create-detail PC-05, PC-10)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('puts the focus on the title when the community comes chosen (PC-18)', async () => {
    renderWithIntl(<Host />)
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus())
  })

  it('closes at once when nothing is written', async () => {
    renderWithIntl(<Host />)
    expect(dialog()).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.getByText('closed')).toBeInTheDocument()
  })

  it('asks before discarding what was written, by × or Esc', async () => {
    renderWithIntl(<Host />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'Half a thought')

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Discard this post?' })
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(confirm).not.toBeInTheDocument()
    expect(screen.getByText('open')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Half a thought')

    await userEvent.keyboard('{Escape}')
    await screen.findByRole('alertdialog', { name: 'Discard this post?' })
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }))
    expect(screen.getByText('closed')).toBeInTheDocument()
  })

  it("closes and opens the new post's page once published", async () => {
    actions.createPost.mockResolvedValue({ ok: true, data: { id: 'abc', title: 'Hello world' } })
    renderWithIntl(<Host />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'Hello world')
    await userEvent.type(screen.getByRole('textbox', { name: 'Body' }), 'Body')
    await userEvent.click(screen.getByRole('button', { name: 'Post' }))

    expect(router.push).toHaveBeenCalledWith('/post/abc/hello-world')
    expect(screen.getByText('closed')).toBeInTheDocument()
  })
})
