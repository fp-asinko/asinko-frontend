import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { Interests } from '../interests.types'
import { InterestsSections } from './interests-sections'

vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const interests: Interests = {
  signedIn: true,
  assets: {
    ok: true,
    data: [
      {
        handle: '$BTC',
        symbol: 'BTC',
        name: 'Bitcoin',
        changePct: 2.4,
        price: 64000,
        stale: false,
        communitySlug: 'BTC',
        path: '/asset/BTC',
      },
      {
        handle: '$AVAX',
        symbol: 'AVAX',
        name: 'Avalanche',
        changePct: -1.2,
        price: 30,
        stale: true,
        communitySlug: 'avax',
        path: '/asset/AVAX',
      },
    ],
  },
  people: {
    ok: true,
    data: [
      {
        handle: '@maria',
        path: '/user/maria',
        id: '1',
        username: 'maria',
        avatarUrl: null,
        accuracyRate: 0.74,
      },
    ],
  },
  groups: {
    ok: true,
    data: [
      {
        handle: '#trading',
        slug: 'trading',
        path: '/hub/trading',
        name: 'Trading',
        description: 'On-chain',
        topPostTitle: null,
        memberCount: 3,
        avatarUrl: null,
        isModerator: true,
      },
    ],
  },
  suggested: {
    ok: true,
    data: [
      {
        handle: '#nft',
        slug: 'nft',
        path: '/hub/nft',
        name: 'NFT',
        memberCount: 1200,
        description: null,
        topPostTitle: null,
        avatarUrl: null,
      },
    ],
  },
}

describe('InterestsSections', () => {
  it('renders the four collapsible sections, open by default', () => {
    renderWithIntl(<InterestsSections interests={interests} />)
    const region = screen.getByRole('region', { name: 'Your interests' })

    // Groups, people, then assets (PO, 2026-10-21, specs/sidebar-fill SF-01).
    expect(
      within(region)
        .getAllByRole('heading')
        .map((heading) => heading.textContent),
    ).toEqual(['Groups', 'People', 'Assets', 'Suggested'])
    for (const name of ['Groups', 'Assets', 'People', 'Suggested']) {
      const heading = within(region).getByRole('heading', { name })
      expect(within(heading.closest('section')!).getByRole('button', { name })).toHaveAttribute(
        'aria-expanded',
        'true',
      )
    }
  })

  it('links assets and groups to their pages (specs/community-pages CP-14)', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    expect(screen.getByRole('link', { name: /^Bitcoin \$BTC/ })).toHaveAttribute(
      'href',
      '/asset/BTC',
    )
    expect(screen.getByRole('link', { name: /^#trading MOD On-chain/ })).toHaveAttribute(
      'href',
      '/hub/trading',
    )
  })

  it('shows every entity with its mention symbol (H-07)', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    for (const handle of ['$BTC', '$AVAX', '@maria', '#trading', '#nft']) {
      expect(screen.getByText(handle)).toBeInTheDocument()
    }
  })

  it('announces the change direction, stale prices and accuracy', () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    expect(screen.getByText('Outdated price')).toBeInTheDocument()
    expect(screen.getByText('74% accuracy')).toBeInTheDocument()
    expect(screen.getByText('MOD')).toBeInTheDocument()
    expect(screen.getByText('1,200 members')).toBeInTheDocument()
  })

  it('gives the lists of groups, people and assets an id for their "more" (specs/sidebar-more)', () => {
    renderWithIntl(<InterestsSections interests={interests} />)
    for (const name of ['Groups', 'People', 'Assets']) {
      const list = screen.getByRole('region', { name }).querySelector('ul')
      expect(list?.id).toMatch(/.+/)
    }
    // Nothing is hidden without the column's height (jsdom): no "more" yet.
    expect(screen.queryByRole('button', { name: /^more:/ })).toBeNull()
  })

  it('joins for real, while create group stays coming soon (specs/community-first CF-10)', async () => {
    renderWithIntl(<InterestsSections interests={interests} />)

    expect(screen.getByRole('button', { name: 'Join #nft' })).not.toHaveAttribute('aria-disabled')
    const create = screen.getByRole('button', { name: 'Create group' })
    expect(create).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(create)
    expect(screen.getAllByRole('status').some((s) => s.textContent)).toBe(true)
  })

  it('shows an error per failed section without hiding the others (H-19)', () => {
    renderWithIntl(<InterestsSections interests={{ ...interests, people: { ok: false } }} />)

    expect(screen.getAllByText('Could not load this section.')).toHaveLength(1)
    expect(screen.getByRole('link', { name: /^Bitcoin \$BTC/ })).toBeInTheDocument()
  })

  it('shows the empty message of each section', () => {
    renderWithIntl(
      <InterestsSections
        interests={{
          signedIn: true,
          assets: { ok: true, data: [] },
          people: { ok: true, data: [] },
          groups: { ok: true, data: [] },
          suggested: { ok: true, data: [] },
        }}
      />,
    )

    expect(screen.getByText('Join an asset community to see it here.')).toBeInTheDocument()
    expect(screen.getByText('You do not follow anyone yet.')).toBeInTheDocument()
    expect(screen.getByText('You are not in any group yet.')).toBeInTheDocument()
  })

  describe('without a session (decided 2026-10-03)', () => {
    const guest: Interests = { ...interests, signedIn: false }

    it('shows only communities: no assets, people, groups or create group', () => {
      renderWithIntl(<InterestsSections interests={guest} />)
      expect(screen.getByRole('region', { name: 'Communities' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /#nft/ })).toBeInTheDocument()
      for (const name of ['Assets', 'People', 'Groups']) {
        expect(screen.queryByRole('heading', { name })).toBeNull()
      }
      expect(screen.queryByRole('button', { name: 'Create group' })).toBeNull()
    })

    it('starts with the invitation to join, above the communities (specs/guest-sidebar GS-01)', () => {
      renderWithIntl(<InterestsSections interests={guest} />)
      const join = screen.getByRole('region', { name: 'New to Asinko?' })
      const communities = screen.getByRole('region', { name: 'Communities' })
      expect(
        join.compareDocumentPosition(communities) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    it('has no invitation with a session', () => {
      renderWithIntl(<InterestsSections interests={interests} />)
      expect(screen.queryByRole('region', { name: 'New to Asinko?' })).toBeNull()
    })

    it('says when the communities could not be loaded', () => {
      renderWithIntl(<InterestsSections interests={{ ...guest, suggested: { ok: false } }} />)
      expect(screen.getByText('Could not load this section.')).toBeInTheDocument()
    })
  })
})
