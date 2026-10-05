import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AuthGateProvider, useAuthGate, type GatedAction } from './auth-gate'

function Upvote({ onVote, action = 'vote-post' }: { onVote: () => void; action?: GatedAction }) {
  const { requireAccount } = useAuthGate()
  return (
    <button type="button" onClick={() => requireAccount(action) && onVote()}>
      Upvote
    </button>
  )
}

function renderGate(signedIn: boolean, action?: GatedAction) {
  const onVote = vi.fn()
  renderWithIntl(
    <AuthGateProvider signedIn={signedIn}>
      <Upvote onVote={onVote} action={action} />
    </AuthGateProvider>,
  )
  return onVote
}

describe('AuthGate', () => {
  it('lets the action through with a session, without any modal (G-11)', async () => {
    const onVote = renderGate(true)
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    expect(onVote).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('stops the action and opens the modal that says what it was for (G-04, G-05)', async () => {
    const onVote = renderGate(false)
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    expect(onVote).not.toHaveBeenCalled()
    const dialog = await screen.findByRole('dialog', { name: 'Vote to make your take count' })
    expect(dialog).toHaveAccessibleDescription(
      'Asinko is where calls get a public, verifiable track record.',
    )
    // Until the auth spec, both ways in are coming soon (H-26).
    for (const name of ['Create account', 'Log in']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
  })

  it('names each action in the modal title', async () => {
    renderGate(false, 'join')
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    expect(
      await screen.findByRole('dialog', { name: 'Join Asinko to join communities' }),
    ).toBeInTheDocument()
  })

  it('closes with Escape and gives the focus back to the control that opened it (G-06)', async () => {
    renderGate(false)
    const upvote = screen.getByRole('button', { name: 'Upvote' })
    await userEvent.click(upvote)
    await screen.findByRole('dialog')

    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(upvote).toHaveFocus()
  })

  it('closes with its translated close button', async () => {
    renderGate(false)
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }))
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('keeps the action and the page to come back to after logging in (G-09)', async () => {
    window.history.pushState({}, '', '/en?filter=polls')
    renderGate(false, 'vote-poll')
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('data-action', 'vote-poll')
    expect(dialog).toHaveAttribute('data-next', '/en?filter=polls')
  })

  it('shows the brand on top and the social logins as coming soon (G-13)', async () => {
    renderGate(false)
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.querySelector('[aria-hidden] [role="img"]')).not.toBeNull()
    for (const provider of ['Reddit', 'Instagram', 'X']) {
      expect(screen.getByRole('button', { name: `Continue with ${provider}` })).toHaveAttribute(
        'aria-disabled',
        'true',
      )
    }
  })
})
