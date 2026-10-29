import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AuthGateProvider, useAuthGate, useGateDialog, type GatedAction } from './auth-gate'

function Upvote({ onVote, action = 'vote-post' }: { onVote: () => void; action?: GatedAction }) {
  const { requireAccount } = useAuthGate()
  return (
    <button type="button" onClick={() => requireAccount(action) && onVote()}>
      Upvote
    </button>
  )
}

/** Stands in for the auth feature's forms: shows which one the modal asks for. */
function Forms() {
  const dialog = useGateDialog()
  return <p>{`form:${dialog?.view}`}</p>
}

function renderGate(signedIn: boolean, action?: GatedAction, needsProfile = false) {
  const onVote = vi.fn()
  renderWithIntl(
    <AuthGateProvider signedIn={signedIn} needsProfile={needsProfile} forms={<Forms />}>
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
  })

  it('opens each form in the same modal, and switches between them (specs/auth AU-01)', async () => {
    renderGate(false)
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Log in' }))
    expect(screen.getByRole('dialog', { name: 'Log in to Asinko' })).toHaveAttribute(
      'data-view',
      'login',
    )
    expect(screen.getByText('form:login')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    expect(screen.getByRole('dialog', { name: 'Join Asinko' })).toBeInTheDocument()
    expect(screen.getByText('form:signup')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getByText('form:login')).toBeInTheDocument()
  })

  it('opens straight on the form for Log in and Sign up', async () => {
    renderGate(false, 'signup')
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    expect(await screen.findByText('form:signup')).toBeInTheDocument()
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

  it('offers Google back to this page, and Reddit as coming soon (specs/auth AU-10, AU-12)', async () => {
    window.history.pushState({}, '', '/en/hub/macro')
    renderGate(false)
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.querySelector('[aria-hidden] [role="img"]')).not.toBeNull()
    expect(within(dialog).getByRole('link', { name: 'Continue with Google' })).toHaveAttribute(
      'href',
      '/auth/google?next=%2Fen%2Fhub%2Fmacro',
    )
    expect(within(dialog).getByRole('button', { name: 'Continue with Reddit' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(within(dialog).queryByRole('button', { name: /Instagram|Continue with X/ })).toBeNull()
  })

  it('shows an account without a username its second step in the modal (specs/auth AU-11)', async () => {
    const onVote = renderGate(false, 'vote-post', true)
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    expect(onVote).not.toHaveBeenCalled()
    expect(await screen.findByRole('dialog', { name: 'Choose your username' })).toHaveAttribute(
      'data-view',
      'profile',
    )
    expect(screen.getByText('form:profile')).toBeInTheDocument()
    // No way to switch, and no other provider: the account exists already.
    expect(screen.queryByRole('link', { name: 'Continue with Google' })).toBeNull()
  })

  it('opens the second step by itself back from Google, and clears the mark (design.md § 12)', async () => {
    window.history.pushState({}, '', '/en/hub/macro?sort=new&welcome=1')
    renderGate(false, 'vote-post', true)
    expect(await screen.findByRole('dialog', { name: 'Choose your username' })).toBeInTheDocument()
    expect(window.location.search).toBe('?sort=new')
  })

  it('shares the viewer avatar only with a session (FC-24)', () => {
    function Name() {
      return <p>{useAuthGate().viewerAvatar ?? 'nobody'}</p>
    }
    const { unmount } = renderWithIntl(
      <AuthGateProvider signedIn viewerAvatar="maria">
        <Name />
      </AuthGateProvider>,
    )
    expect(screen.getByText('maria')).toBeInTheDocument()
    unmount()
    renderWithIntl(
      <AuthGateProvider signedIn={false} viewerAvatar="maria">
        <Name />
      </AuthGateProvider>,
    )
    expect(screen.getByText('nobody')).toBeInTheDocument()
  })
})
