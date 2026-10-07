import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { JoinedProvider } from '@/components/organisms/join'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CommunityPage } from '../communities.types'
import { CommunityActions } from './community-actions'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
const actions = vi.hoisted(() => ({
  joinCommunity: vi.fn(),
  leaveCommunity: vi.fn(),
  setFavorite: vi.fn(),
}))
vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: actions.joinCommunity }))
vi.mock('@/lib/communities/leave-community.action', () => ({
  leaveCommunity: actions.leaveCommunity,
}))
vi.mock('@/lib/communities/set-favorite.action', () => ({ setFavorite: actions.setFavorite }))

function renderActions(
  membership: CommunityPage['viewerMembership'],
  { signedIn = true, favorite = false }: { signedIn?: boolean; favorite?: boolean } = {},
) {
  renderWithIntl(
    <AuthGateProvider signedIn={signedIn}>
      <JoinedProvider>
        <CommunityActions
          slug="macro"
          handle="#macro"
          membership={membership}
          favorite={favorite}
        />
      </JoinedProvider>
    </AuthGateProvider>,
  )
}

describe('CommunityActions (specs/community-pages CP-05, CP-06)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('offers to join when not a member, without a favorite star', () => {
    renderActions(null)
    expect(screen.getByRole('button', { name: 'Join #macro' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /favorites/ })).toBeNull()
  })

  it('becomes "Joined" with the star after joining', async () => {
    actions.joinCommunity.mockResolvedValue({ ok: true, data: { memberCount: 1205 } })
    renderActions(null)
    await userEvent.click(screen.getByRole('button', { name: 'Join #macro' }))
    expect(screen.getByRole('button', { name: /Joined/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add #macro to favorites' })).toBeInTheDocument()
    await waitFor(() => expect(router.refresh).toHaveBeenCalled())
  })

  it('asks before leaving and leaves only after confirming (security.md § 7)', async () => {
    actions.leaveCommunity.mockResolvedValue({ ok: true, data: null })
    renderActions('MEMBER')
    await userEvent.click(screen.getByRole('button', { name: /Joined/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Leave #macro?' })
    expect(dialog).toHaveTextContent('You will stop seeing its posts in Following.')
    expect(actions.leaveCommunity).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Leave' }))
    expect(actions.leaveCommunity).toHaveBeenCalledWith('macro')
    expect(await screen.findByRole('button', { name: 'Join #macro' })).toBeInTheDocument()
  })

  it('keeps the membership when leaving is cancelled', async () => {
    renderActions('MEMBER')
    await userEvent.click(screen.getByRole('button', { name: /Joined/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(actions.leaveCommunity).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Joined/ })).toBeInTheDocument()
  })

  it('comes back as a member with a message when leaving fails', async () => {
    actions.leaveCommunity.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderActions('MEMBER')
    await userEvent.click(screen.getByRole('button', { name: /Joined/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Leave' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save. Try again.')
    expect(screen.getByRole('button', { name: /Joined/ })).toBeInTheDocument()
  })

  it('tells a principal moderator why there is no way to leave', () => {
    renderActions('PRINCIPAL_MODERATOR')
    expect(screen.getByText('Moderator')).toBeInTheDocument()
    expect(screen.getByText(/Transfer the role to be able to leave/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Joined/ })).toBeNull()
  })

  it('marks and unmarks the favorite, optimistic, and reverts on failure', async () => {
    actions.setFavorite
      .mockResolvedValueOnce({ ok: true, data: { favorite: true } })
      .mockResolvedValueOnce({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderActions('MEMBER')
    const star = screen.getByRole('button', { name: 'Add #macro to favorites' })
    expect(star).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(star)
    expect(actions.setFavorite).toHaveBeenCalledWith({ slug: 'macro', favorite: true })
    expect(screen.getByRole('button', { name: 'Remove #macro from favorites' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Remove #macro from favorites' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove #macro from favorites' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('opens the account modal to join without a session', async () => {
    renderActions(null, { signedIn: false })
    await userEvent.click(screen.getByRole('button', { name: 'Join #macro' }))
    expect(
      await screen.findByRole('dialog', { name: 'Join Asinko to join communities' }),
    ).toBeInTheDocument()
    expect(actions.joinCommunity).not.toHaveBeenCalled()
  })
})
