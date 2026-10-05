import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { AuthGateProvider } from '../auth-gate'
import { JoinButton } from './join-button'
import { HideWhenJoined, JoinedProvider } from './joined'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

function renderTwo(action: (slug: string) => Promise<unknown>, signedIn = true) {
  renderWithIntl(
    <AuthGateProvider signedIn={signedIn}>
      <JoinedProvider>
        <h2 id="title" tabIndex={-1}>
          A post
        </h2>
        <JoinButton slug="defi" handle="#defi" action={action as never} focusFallbackId="title" />
        <JoinButton slug="defi" handle="#defi" action={action as never} variant="compact" />
        <HideWhenJoined slug="defi">
          <p>Suggested #defi</p>
        </HideWhenJoined>
        <JoinButton slug="macro" handle="#macro" action={action as never} />
      </JoinedProvider>
    </AuthGateProvider>,
  )
}

describe('JoinButton (specs/community-first)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('names the community for screen readers (CF-14)', () => {
    renderTwo(vi.fn())
    expect(screen.getAllByRole('button', { name: 'Join #defi' })).toHaveLength(2)
  })

  it('opens the account modal without a session, without calling the action (CF-06)', async () => {
    const action = vi.fn()
    renderTwo(action, false)
    await userEvent.click(screen.getAllByRole('button', { name: 'Join #defi' })[0]!)
    expect(
      await screen.findByRole('dialog', { name: 'Join Asinko to join communities' }),
    ).toBeInTheDocument()
    expect(action).not.toHaveBeenCalled()
  })

  it('hides every button of the community at once and refreshes after joining (CF-07)', async () => {
    const action = vi.fn(async () => ({ ok: true, data: { memberCount: 3 } }))
    renderTwo(action)
    const [first] = screen.getAllByRole('button', { name: 'Join #defi' })
    first!.focus()
    await userEvent.click(first!)

    expect(screen.queryByRole('button', { name: 'Join #defi' })).toBeNull()
    expect(screen.queryByText('Suggested #defi')).toBeNull()
    // Another community keeps its button.
    expect(screen.getByRole('button', { name: 'Join #macro' })).toBeInTheDocument()
    // The focus does not get lost: it moves to the post title.
    expect(screen.getByRole('heading', { name: 'A post' })).toHaveFocus()
    expect(action).toHaveBeenCalledWith('defi')
    await waitFor(() => expect(router.refresh).toHaveBeenCalled())
  })

  it('comes back with a message when joining fails (CF-08)', async () => {
    const action = vi.fn(async () => ({ ok: false, error: 'api.errors.UNAVAILABLE' }))
    renderTwo(action)
    await userEvent.click(screen.getAllByRole('button', { name: 'Join #defi' })[0]!)

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not join the community')
    expect(screen.getAllByRole('button', { name: 'Join #defi' })).toHaveLength(2)
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('opens the account modal when the session ended meanwhile (CF-08)', async () => {
    const action = vi.fn(async () => ({ ok: false, error: 'api.errors.UNAUTHENTICATED' }))
    renderTwo(action)
    await userEvent.click(screen.getAllByRole('button', { name: 'Join #defi' })[0]!)
    expect(
      await screen.findByRole('dialog', { name: 'Join Asinko to join communities' }),
    ).toBeInTheDocument()
  })

  it('does not run twice while saving (CF-09)', async () => {
    let finish: (value: unknown) => void = () => {}
    const action = vi.fn(() => new Promise((resolve) => (finish = resolve)))
    renderTwo(action)
    const macro = screen.getByRole('button', { name: 'Join #macro' })
    await userEvent.click(macro)
    // Hidden at once: it cannot be clicked again.
    expect(screen.queryByRole('button', { name: 'Join #macro' })).toBeNull()
    expect(action).toHaveBeenCalledTimes(1)
    finish({ ok: true, data: { memberCount: 1 } })
  })
})
