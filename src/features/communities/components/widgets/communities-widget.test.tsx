import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { JoinedProvider } from '@/components/organisms/join'
import { CommunitiesWidgetBody } from './communities-widget'
import { COMMUNITIES } from './widgets.fixture'
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))

describe('CommunitiesWidgetBody (specs/community-widgets CW-06)', () => {
  it('lists each with its members, and Join only where the viewer is not a member', () => {
    renderWithIntl(
      <AuthGateProvider signedIn>
        <JoinedProvider>
          <CommunitiesWidgetBody widget={COMMUNITIES} />
        </JoinedProvider>
      </AuthGateProvider>,
    )
    expect(screen.getByRole('link', { name: '#defi 12,880 members' })).toHaveAttribute(
      'href',
      '/hub/defi',
    )
    expect(screen.getAllByRole('button', { name: /Join/ })).toHaveLength(1)
  })
})
